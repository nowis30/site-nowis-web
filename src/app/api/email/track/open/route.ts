import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs=',
  'base64',
);

function pixelResponse() {
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token) return pixelResponse();

  try {
    const outbound = await prisma.outboundEmail.findUnique({
      where: { trackingToken: token },
      select: {
        id: true,
        openedAt: true,
        subject: true,
        contactId: true,
      },
    });

    if (!outbound) return pixelResponse();

    if (!outbound.openedAt) {
      const openedAt = new Date();
      await prisma.outboundEmail.update({
        where: { id: outbound.id },
        data: { openedAt },
      });

      await prisma.activity.create({
        data: {
          type: 'EMAIL',
          title: `Email ouvert : ${outbound.subject}`,
          description: `Ouverture détectée le ${openedAt.toLocaleString('fr-CA')}.`,
          contactId: outbound.contactId,
        },
      });
    }
  } catch (error) {
    console.error('[EMAIL_TRACK_OPEN]', error);
  }

  return pixelResponse();
}
