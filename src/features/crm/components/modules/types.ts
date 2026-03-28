import { DataColumn } from '@/features/crm/components/shared/DataTable';

type GenericRecord = Record<string, unknown>;

export interface ModulePageConfig {
  title: string;
  description: string;
  endpoint: string;
  defaultValues: Record<string, unknown>;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    sourceKey?: 'contacts' | 'properties' | 'units' | 'tenants' | 'organizations' | 'organizationContacts';
    sourceMapper?: {
      value: (item: GenericRecord) => string;
      label: (item: GenericRecord) => string;
    };
  }>;
  columns: DataColumn<GenericRecord>[];
}
