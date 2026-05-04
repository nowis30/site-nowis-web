import { prisma } from '@/lib/prisma';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';

export async function getCommercialQuoteEditorOptions() {
  const [contacts, organizations, workshops, songs, appointments] = await Promise.all([
    prisma.contact.findMany({
      where: { crmStatus: { not: 'DELETED' } },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
      take: 500,
    }),
    prisma.organization.findMany({
      where: { crmStatus: { not: 'DELETED' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 500,
    }),
    prisma.workshopRequest.findMany({
      where: { status: { not: 'DELETED' } },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.songRequest.findMany({
      where: { status: { not: 'DELETED' } },
      select: { id: true, title: true, fullName: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.appointment.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { id: true, title: true, startAt: true },
      orderBy: { startAt: 'desc' },
      take: 300,
    }),
  ]);

  return {
    contactOptions: contacts.map((item) => ({ id: item.id, label: item.fullName })),
    organizationOptions: organizations.map((item) => ({ id: item.id, label: item.name })),
    workshopOptions: workshops.map((item) => ({ id: item.id, label: item.title })),
    songOptions: songs.map((item) => ({ id: item.id, label: item.title || `Demande chanson · ${item.fullName}` })),
    appointmentOptions: appointments.map((item) => ({
      id: item.id,
      label: `${item.title} · ${new Intl.DateTimeFormat('fr-CA', { dateStyle: 'short', timeStyle: 'short' }).format(item.startAt)}`,
    })),
  };
}

export async function getCommercialQuoteTaxRates() {
  const issuer = await getBillingIssuerSnapshot();
  const gst = Number(issuer.taxRateGst ?? 0.05);
  const qst = Number(issuer.taxRateQst ?? 0.09975);
  return {
    taxesEnabled: issuer.taxesEnabled,
    gst: Number.isFinite(gst) && gst >= 0 ? gst : 0.05,
    qst: Number.isFinite(qst) && qst >= 0 ? qst : 0.09975,
  };
}
