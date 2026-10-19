import Link from 'next/link';
import { requireCrmSession } from '@/features/crm/auth/session';
import { can } from '@/features/crm/auth/permissions';
import { prisma } from '@/lib/prisma';
import { NewContactForm } from '@/features/crm/components/contacts/NewContactForm';

export default async function NewContactPage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'contacts', 'create')) {
    return <section><p>Votre rôle ne permet pas de créer un contact.</p><Link href="/crm/contacts">Retour aux contacts</Link></section>;
  }
  const organizations = can(session.role, 'organizations', 'read') && can(session.role, 'organizations', 'update')
    ? await prisma.organization.findMany({
      where: { crmStatus: { not: 'DELETED' } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    : [];
  return <NewContactForm organizations={organizations} />;
}
