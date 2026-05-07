import { prisma } from '@/lib/prisma';

type DbClient = typeof prisma;

export function isOwnedByContact(ownerContactId: string | null | undefined, sessionContactId: string) {
  return Boolean(ownerContactId) && ownerContactId === sessionContactId;
}

export async function canClientAccessSongRequest(params: {
  songRequestId: string;
  sessionContactId: string;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const request = await db.songRequest.findFirst({
    where: { id: params.songRequestId, contactId: params.sessionContactId },
    select: { id: true },
  });
  return Boolean(request);
}

export async function canClientAccessWorkshopRequest(params: {
  workshopRequestId: string;
  sessionContactId: string;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const request = await db.workshopRequest.findFirst({
    where: {
      id: params.workshopRequestId,
      OR: [
        { contactId: params.sessionContactId },
        { clientId: params.sessionContactId },
      ],
    },
    select: { id: true },
  });
  return Boolean(request);
}
