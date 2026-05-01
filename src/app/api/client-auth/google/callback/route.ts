import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, UserRole } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  clearGoogleOauthNextCookie,
  clearGoogleOauthStateCookie,
  CLIENT_GOOGLE_NEXT_COOKIE_NAME,
  CLIENT_GOOGLE_STATE_COOKIE_NAME,
  getGoogleCallbackUrl,
  readCookieValue,
  sanitizeGoogleNextPath,
} from '@/features/client-portal/auth/google';
import { createClientPortalSessionCookie, signClientPortalSession } from '@/features/client-portal/auth/session';
import { isClientProfileIncomplete } from '@/features/client-portal/profile';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function isMissingOauthTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

function buildErrorRedirect(request: NextRequest, code: string, nextPath: string) {
  const url = new URL('/connexion', request.url);
  url.searchParams.set('error', code);
  if (nextPath && nextPath !== '/client/dashboard') {
    url.searchParams.set('next', nextPath);
  }
  return url;
}

function redirectWithGoogleCleanup(request: NextRequest, code: string, nextPath: string) {
  const response = NextResponse.redirect(buildErrorRedirect(request, code, nextPath), {
    headers: { 'Cache-Control': 'no-store' },
  });
  response.headers.append('Set-Cookie', clearGoogleOauthStateCookie());
  response.headers.append('Set-Cookie', clearGoogleOauthNextCookie());
  return response;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const cookieHeader = request.headers.get('cookie');
  const stateCookie = readCookieValue(cookieHeader, CLIENT_GOOGLE_STATE_COOKIE_NAME);
  const nextCookieValue = readCookieValue(cookieHeader, CLIENT_GOOGLE_NEXT_COOKIE_NAME);
  let nextPath = '/client/dashboard';
  try {
    nextPath = sanitizeGoogleNextPath(nextCookieValue ? decodeURIComponent(nextCookieValue) : '/client/dashboard');
  } catch {
    nextPath = '/client/dashboard';
  }

  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const providerError = request.nextUrl.searchParams.get('error');

  if (providerError) {
    return redirectWithGoogleCleanup(request, providerError === 'access_denied' ? 'google-access-denied' : 'google-provider-error', nextPath);
  }

  if (!clientId || !clientSecret) {
    return redirectWithGoogleCleanup(request, 'google-unavailable', nextPath);
  }

  if (!state || !stateCookie || state !== stateCookie || !code) {
    return redirectWithGoogleCleanup(request, 'google-state-invalid', nextPath);
  }

  try {
    const callbackUrl = getGoogleCallbackUrl(request.nextUrl.origin);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || tokenData.error) {
      return redirectWithGoogleCleanup(request, 'google-token-exchange-failed', nextPath);
    }

    if (!tokenData.access_token) {
      return redirectWithGoogleCleanup(request, 'google-token-missing', nextPath);
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: 'no-store',
    });

    if (!profileResponse.ok) {
      return redirectWithGoogleCleanup(request, 'google-profile-fetch-failed', nextPath);
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;
    const email = profile.email?.trim().toLowerCase();
    const providerAccountId = profile.sub?.trim();
    const fullName = profile.name?.trim() || (email ? email.split('@')[0] : 'Client Nowis');

    if (!email || !providerAccountId || profile.email_verified !== true) {
      return redirectWithGoogleCleanup(request, 'google-email-invalid', nextPath);
    }

    // Probe the OAuth table BEFORE starting a transaction.
    // Inside a Postgres transaction, any thrown error puts the transaction in
    // "aborted" state — subsequent queries fail even if the error was caught in JS.
    let oauthTableMissing = false;
    let linkedAccount: {
      id: string;
      user: {
        id: string;
        role: UserRole;
        isActive: boolean;
        contact: {
          id: string;
          fullName: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          profileMeta: unknown;
          tags: string[];
          source: string | null;
        } | null;
      };
    } | null = null;

    try {
      linkedAccount = await prisma.clientOAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId,
          },
        },
        include: {
          user: {
            include: {
              contact: true,
            },
          },
        },
      });
    } catch (error) {
      if (isMissingOauthTableError(error)) {
        oauthTableMissing = true;
      } else {
        throw error;
      }
    }

    const result = await prisma.$transaction(async (tx) => {

      if (linkedAccount) {
        const linkedUser = linkedAccount.user;

        if (linkedUser.role !== UserRole.PORTAL_USER || !linkedUser.isActive) {
          throw new Error('GOOGLE_ROLE_MISMATCH');
        }

        let contact = linkedUser.contact;
        if (!contact) {
          const existingContact = await tx.contact.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
          });

          contact = existingContact
            ? await tx.contact.update({
                where: { id: existingContact.id },
                data: {
                  fullName,
                  type: 'CLIENT',
                  source: existingContact.source || 'website-google',
                  tags: Array.from(new Set([...(existingContact.tags || []), 'portal-client', 'google-auth'])),
                },
              })
            : await tx.contact.create({
                data: {
                  type: 'CLIENT',
                  fullName,
                  email,
                  source: 'website-google',
                  tags: ['portal-client', 'google-auth'],
                },
              });

          await tx.user.update({
            where: { id: linkedUser.id },
            data: {
              contactId: contact.id,
              fullName,
              email,
            },
          });
        } else {
          contact = await tx.contact.update({
            where: { id: contact.id },
            data: {
              fullName,
              email,
              tags: Array.from(new Set([...(contact.tags || []), 'google-auth'])),
            },
          });

          await tx.user.update({
            where: { id: linkedUser.id },
            data: { fullName, email },
          });
        }

        if (!oauthTableMissing) {
          await tx.clientOAuthAccount.update({
            where: { id: linkedAccount.id },
            data: {
              email,
              name: fullName,
              image: profile.picture || null,
            },
          });
        }

        return {
          contact,
          email,
          fullName,
          createdNewUser: false,
          profileIncomplete: isClientProfileIncomplete({ phone: contact.phone, notes: contact.notes, profileMeta: contact.profileMeta }),
        };
      }

      const existingUser = await tx.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { contact: true },
      });

      if (existingUser && existingUser.role !== UserRole.PORTAL_USER) {
        throw new Error('GOOGLE_ROLE_MISMATCH');
      }

      if (existingUser && !existingUser.isActive) {
        throw new Error('GOOGLE_ACCOUNT_DISABLED');
      }

      let user = existingUser;
      let contact = existingUser?.contact || null;

      if (!user) {
        const existingContact = await tx.contact.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });

        contact = existingContact
          ? await tx.contact.update({
              where: { id: existingContact.id },
              data: {
                fullName,
                type: 'CLIENT',
                source: existingContact.source || 'website-google',
                tags: Array.from(new Set([...(existingContact.tags || []), 'portal-client', 'google-auth'])),
              },
            })
          : await tx.contact.create({
              data: {
                type: 'CLIENT',
                fullName,
                email,
                source: 'website-google',
                tags: ['portal-client', 'google-auth'],
              },
            });

        const generatedPassword = await hashPassword(`google-${randomUUID()}`);

        user = await tx.user.create({
          data: {
            email,
            fullName,
            passwordHash: generatedPassword,
            role: UserRole.PORTAL_USER,
            isActive: true,
            contactId: contact.id,
          },
          include: { contact: true },
        });

        try {
          await tx.activity.create({
            data: {
              type: 'FORM',
              title: 'Client inscrit via Google',
              description: `Inscription gratuite via Google: ${fullName} (${email}).`,
              contactId: contact.id,
              userId: user.id,
            },
          });
        } catch {
          // Non-critical: skip activity logging if table is missing or fails
        }

        try {
          await tx.task.create({
            data: {
              title: 'Nouveau client Google: completer la fiche contact',
              description: `Inscription Google: ${fullName} (${email}). Verifier telephone, adresse de facturation et adresse postale de la demande (atelier/chanson).`,
              type: 'FOLLOW_UP',
              status: 'TODO',
              priority: 'MEDIUM',
              linkedType: 'CONTACT',
              linkedId: contact.id,
            },
          });
        } catch {
          // Non-critical: do not block login if task table is unavailable
        }
      } else {
        if (!contact) {
          const existingContact = await tx.contact.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
          });

          contact = existingContact
            ? await tx.contact.update({
                where: { id: existingContact.id },
                data: {
                  fullName,
                  type: 'CLIENT',
                  source: existingContact.source || 'website-google',
                  tags: Array.from(new Set([...(existingContact.tags || []), 'portal-client', 'google-auth'])),
                },
              })
            : await tx.contact.create({
                data: {
                  type: 'CLIENT',
                  fullName,
                  email,
                  source: 'website-google',
                  tags: ['portal-client', 'google-auth'],
                },
              });
        } else {
          contact = await tx.contact.update({
            where: { id: contact.id },
            data: {
              fullName,
              email,
              tags: Array.from(new Set([...(contact.tags || []), 'google-auth'])),
            },
          });
        }

        user = await tx.user.update({
          where: { id: user.id },
          data: {
            fullName,
            email,
            contactId: contact.id,
          },
          include: { contact: true },
        });
      }

      if (!oauthTableMissing) {
        await tx.clientOAuthAccount.upsert({
          where: {
            userId_provider: {
              userId: user.id,
              provider: 'google',
            },
          },
          update: {
            providerAccountId,
            email,
            name: fullName,
            image: profile.picture || null,
          },
          create: {
            userId: user.id,
            provider: 'google',
            providerAccountId,
            email,
            name: fullName,
            image: profile.picture || null,
          },
        });
      }

      return {
        contact: contact!,
        email,
        fullName,
        createdNewUser: !existingUser,
        profileIncomplete: isClientProfileIncomplete({ phone: contact?.phone, notes: contact?.notes, profileMeta: contact?.profileMeta }),
      };
    });

    const sessionToken = signClientPortalSession({
      contactId: result.contact.id,
      tenantId: null,
      email: result.email,
      fullName: result.fullName,
    });

    const targetPath = result.profileIncomplete ? '/client/profil' : nextPath;

    const response = NextResponse.redirect(new URL(targetPath, request.url), {
      headers: { 'Cache-Control': 'no-store' },
    });
    response.headers.append('Set-Cookie', clearGoogleOauthStateCookie());
    response.headers.append('Set-Cookie', clearGoogleOauthNextCookie());
    response.headers.append('Set-Cookie', createClientPortalSessionCookie(sessionToken));
    return response;
  } catch (error) {
    const code =
      error instanceof Error && error.message === 'GOOGLE_ROLE_MISMATCH'
        ? 'google-role-mismatch'
        : error instanceof Error && error.message === 'GOOGLE_ACCOUNT_DISABLED'
          ? 'google-account-disabled'
          : error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
            ? 'google-account-conflict'
            : 'google-auth-failed';

    return redirectWithGoogleCleanup(request, code, nextPath);
  }
}
