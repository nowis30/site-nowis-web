import { Prisma, type Message } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export function isMissingMessagesTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

export async function safeListMessages(contactId: string) {
  try {
    return await prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return [] as Message[];
    }
    throw error;
  }
}

export async function safeCountUnreadAdminMessages(contactId: string) {
  try {
    return await prisma.message.count({
      where: {
        contactId,
        senderType: 'ADMIN',
        isRead: false,
      },
    });
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return 0;
    }
    throw error;
  }
}

export async function safeCountUnreadClientMessages(contactId: string) {
  try {
    return await prisma.message.count({
      where: {
        contactId,
        senderType: 'CLIENT',
        isRead: false,
      },
    });
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return 0;
    }
    throw error;
  }
}

export async function safeMarkAdminMessagesRead(contactId: string) {
  try {
    await prisma.message.updateMany({
      where: { contactId, senderType: 'ADMIN', isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    if (!isMissingMessagesTableError(error)) {
      throw error;
    }
  }
}

export async function safeMarkClientMessagesRead(contactId: string) {
  try {
    await prisma.message.updateMany({
      where: { contactId, senderType: 'CLIENT', isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    if (!isMissingMessagesTableError(error)) {
      throw error;
    }
  }
}