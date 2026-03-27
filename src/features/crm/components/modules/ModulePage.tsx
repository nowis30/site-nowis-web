"use client";

import { can } from '@/features/crm/auth/permissions';
import { CrmModuleKey } from '@/features/crm/auth/permissions';
import { CrmRole } from '@/features/crm/auth/session';
import { EntityCrudPage } from '@/features/crm/components/modules/EntityCrudPage';
import {
  casesConfig,
  contactsConfig,
  maintenanceConfig,
  propertiesConfig,
  tenantsConfig,
  unitsConfig,
} from '@/features/crm/config/module-config';

const moduleConfigs = {
  contacts: contactsConfig,
  cases: casesConfig,
  properties: propertiesConfig,
  units: unitsConfig,
  tenants: tenantsConfig,
  maintenance: maintenanceConfig,
};

const detailBasePaths: Record<string, string> = {
  contacts: '/crm/contacts',
  cases: '/crm/cases',
  properties: '/crm/properties',
  units: '/crm/units',
  tenants: '/crm/tenants',
  maintenance: '/crm/maintenance',
};

interface ModulePageProps {
  role: CrmRole;
  moduleKey: Extract<CrmModuleKey, 'contacts' | 'cases' | 'properties' | 'units' | 'tenants' | 'maintenance'>;
}

export function ModulePage({ role, moduleKey }: ModulePageProps) {
  const config = moduleConfigs[moduleKey];

  return (
    <EntityCrudPage
      title={config.title}
      description={config.description}
      endpoint={config.endpoint}
      fields={config.fields}
      columns={config.columns}
      defaultValues={config.defaultValues}
      createPermission={can(role, moduleKey, 'create')}
      updatePermission={can(role, moduleKey, 'update')}
      deletePermission={can(role, moduleKey, 'delete')}
      detailBasePath={detailBasePaths[moduleKey]}
    />
  );
}
