import { CrmTimeline, type TimelineItem } from '@/components/crm/timeline';

export function ContactTimeline({ items }: { items: TimelineItem[] }) {
  return <CrmTimeline items={items} emptyLabel="Aucune activité liée à ce contact." />;
}
