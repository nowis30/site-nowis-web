import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type SequentialDocumentType = 'quote' | 'invoice';

const DEFAULT_SEQUENCE_PADDING = 3;
const DEFAULT_MAX_RETRIES = 5;

type QuoteNumberRow = { quoteNumber: string };
type InvoiceNumberRow = { number: string };

type NumberLookupClient = {
  commercialQuote: {
    findMany: (args: {
      where: { quoteNumber: { startsWith: string } };
      select: { quoteNumber: true };
    }) => Promise<QuoteNumberRow[]>;
  };
  invoice: {
    findMany: (args: {
      where: { number: { startsWith: string } };
      select: { number: true };
    }) => Promise<InvoiceNumberRow[]>;
  };
};

function formatDateStamp(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function buildDocumentPrefix(type: SequentialDocumentType, date: Date) {
  const dateStamp = formatDateStamp(date);
  return type === 'quote' ? `DEV-${dateStamp}` : `FAC-${dateStamp}`;
}

function parseSuffixNumber(value: string, prefix: string) {
  const marker = `${prefix}-`;
  if (!value.startsWith(marker)) return null;
  const suffix = value.slice(marker.length);
  if (!/^\d+$/.test(suffix)) return null;
  return Number.parseInt(suffix, 10);
}

async function listExistingNumbers(type: SequentialDocumentType, prefix: string, db: NumberLookupClient) {
  if (type === 'quote') {
    const rows = await db.commercialQuote.findMany({
      where: { quoteNumber: { startsWith: prefix } },
      select: { quoteNumber: true },
    });
    return rows.map((row) => row.quoteNumber);
  }

  const rows = await db.invoice.findMany({
    where: { number: { startsWith: prefix } },
    select: { number: true },
  });
  return rows.map((row) => row.number);
}

function extractMaxSuffix(numbers: string[], prefix: string) {
  let maxSuffix = 0;
  for (const value of numbers) {
    const suffixNumber = parseSuffixNumber(value, prefix);
    if (suffixNumber !== null) {
      maxSuffix = Math.max(maxSuffix, suffixNumber);
    }
  }
  return maxSuffix;
}

export async function nextSequentialDocumentNumber(
  type: SequentialDocumentType,
  date: Date = new Date(),
  db: NumberLookupClient = prisma,
) {
  const prefix = buildDocumentPrefix(type, date);
  const existingNumbers = await listExistingNumbers(type, prefix, db);
  const maxSuffix = extractMaxSuffix(existingNumbers, prefix);
  const nextSuffix = String(maxSuffix + 1).padStart(DEFAULT_SEQUENCE_PADDING, '0');
  return `${prefix}-${nextSuffix}`;
}

export async function nextCommercialQuoteNumber(date: Date = new Date(), db: NumberLookupClient = prisma) {
  return nextSequentialDocumentNumber('quote', date, db);
}

export async function nextInvoiceNumber(date: Date = new Date(), db: NumberLookupClient = prisma) {
  return nextSequentialDocumentNumber('invoice', date, db);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getMetaTargets(error: unknown) {
  if (!isObject(error)) return [] as string[];
  const meta = error.meta;
  if (!isObject(meta)) return [] as string[];
  const rawTarget = meta.target;

  if (Array.isArray(rawTarget)) {
    return rawTarget.filter((item): item is string => typeof item === 'string');
  }
  if (typeof rawTarget === 'string') {
    return [rawTarget];
  }
  return [] as string[];
}

function isUniqueConstraintError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002';
  }
  if (isObject(error) && typeof error.code === 'string') {
    return error.code === 'P2002';
  }
  return false;
}

function shouldRetryForType(error: unknown, type: SequentialDocumentType) {
  if (!isUniqueConstraintError(error)) return false;
  const targets = getMetaTargets(error);
  if (targets.length === 0) return true;

  const expectedField = type === 'quote' ? 'quoteNumber' : 'number';
  return targets.includes(expectedField);
}

export async function createWithSequentialDocumentNumber<T>(params: {
  type: SequentialDocumentType;
  date?: Date;
  maxRetries?: number;
  db?: NumberLookupClient;
  create: (number: string) => Promise<T>;
}) {
  const maxRetries = params.maxRetries ?? DEFAULT_MAX_RETRIES;
  const db = params.db ?? prisma;
  const date = params.date ?? new Date();

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const number = await nextSequentialDocumentNumber(params.type, date, db);
    try {
      return await params.create(number);
    } catch (error) {
      if (attempt < maxRetries - 1 && shouldRetryForType(error, params.type)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Impossible de générer un numéro ${params.type} unique après ${maxRetries} tentatives.`);
}