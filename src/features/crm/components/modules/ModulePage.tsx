"use client";

import { can } from '@/features/crm/auth/permissions';
import { CrmModuleKey } from '@/features/crm/auth/permissions';
import { CrmRole } from '@/features/crm/auth/session';
import { EntityCrudPage } from '@/features/crm/components/modules/EntityCrudPage';
import {
  casesConfig,
  contactsConfig,
  organizationsConfig,
  workshopRequestsConfig,
} from '@/features/crm/config/module-config';

const moduleConfigs = {
  contacts: contactsConfig,
  cases: casesConfig,
  organizations: organizationsConfig,
  workshopRequests: workshopRequestsConfig,
};

const detailBasePaths: Record<string, string> = {
  contacts: '/crm/contacts',
  cases: '/crm/cases',
  organizations: '/crm/organizations',
  workshopRequests: '/crm/workshop-requests',
};

interface ModulePageProps {
  role: CrmRole;
  moduleKey: Extract<CrmModuleKey, 'contacts' | 'cases' | 'organizations' | 'workshopRequests'>;
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
