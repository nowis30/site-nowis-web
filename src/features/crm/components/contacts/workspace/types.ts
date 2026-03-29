import type { TimelineItem } from '@/components/crm/timeline';

export type ContactWorkspaceContact = {
  id: string;
  fullName: string;
  type: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  source: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  communications: Array<{ id: string; subject: string | null; body: string; channel: string; direction: string; sentAt: string }>;
  messages: Array<{ id: string; senderType: 'ADMIN' | 'CLIENT'; content: string; createdAt: string; isRead: boolean }>;
  outboundEmails: Array<{ id: string; recipientEmail: string; subject: string; messagePreview: string; sentAt: string; openedAt: string | null }>;
  songRequests: Array<{
    id: string;
    title: string;
    songType: string;
    language: string | null;
    eventType: string | null;
    theme: string | null;
    status: string;
    createdAt: string;
    budget: string | null;
  }>;
};

export type ContactTaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  href: string | null;
};

export type ContactAppointmentItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: string;
  status: string;
  property: { id: string; name: string } | null;
};

export type ContactInvoiceItem = {
  id: string;
  number: string;
  amount: string | number;
  status: string;
  issueDate: string;
  dueDate: string;
  description: string | null;
};

export type ContactFileItem = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  createdAt: string;
  mimeType: string;
  category: string;
  visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
};

export type ContactWorkspaceProps = {
  contact: ContactWorkspaceContact;
  tasks: ContactTaskItem[];
  appointments: ContactAppointmentItem[];
  invoices: ContactInvoiceItem[];
  files: ContactFileItem[];
  timeline: TimelineItem[];
  unreadClientMessages: number;
  canImpersonate: boolean;
};
