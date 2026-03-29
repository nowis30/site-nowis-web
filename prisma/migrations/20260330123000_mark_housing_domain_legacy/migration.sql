-- Safe deprecation markers for the retired housing domain.
-- This migration is intentionally non-destructive: no DROP TABLE, DROP COLUMN, or DELETE.

COMMENT ON TABLE "properties" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';
COMMENT ON TABLE "units" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';
COMMENT ON TABLE "tenants" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';
COMMENT ON TABLE "leases" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';
COMMENT ON TABLE "payments" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';
COMMENT ON TABLE "maintenance_tickets" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';
COMMENT ON TABLE "maintenance_updates" IS 'LEGACY housing domain table retained temporarily for archival and staged removal.';

COMMENT ON TYPE "PropertyType" IS 'LEGACY enum: retired with the housing domain.';
COMMENT ON TYPE "UnitStatus" IS 'LEGACY enum: retired with the housing domain.';
COMMENT ON TYPE "LeaseStatus" IS 'LEGACY enum: retired with the housing domain.';
COMMENT ON TYPE "PaymentStatus" IS 'LEGACY enum: retired with the housing domain.';
COMMENT ON TYPE "MaintenancePriority" IS 'LEGACY enum: retired with the housing domain.';
COMMENT ON TYPE "MaintenanceStatus" IS 'LEGACY enum: retired with the housing domain.';

COMMENT ON COLUMN "users"."role" IS 'Contains legacy TENANT values. Keep only for backward compatibility until final cleanup.';
COMMENT ON COLUMN "contacts"."type" IS 'Contains legacy housing contact variants kept temporarily for archival.';
COMMENT ON COLUMN "cases"."type" IS 'Contains legacy LOCATION and MAINTENANCE case types kept temporarily for archival.';
COMMENT ON COLUMN "documents"."linkedType" IS 'Contains legacy housing linked types kept temporarily for archival.';
COMMENT ON COLUMN "tasks"."linkedType" IS 'Contains legacy housing linked types kept temporarily for archival.';
COMMENT ON COLUMN "communications"."tenantId" IS 'Legacy housing foreign key kept temporarily for archival.';
COMMENT ON COLUMN "communications"."linkedType" IS 'Contains legacy housing linked types kept temporarily for archival.';
COMMENT ON COLUMN "appointments"."propertyId" IS 'Legacy housing foreign key kept temporarily for archival.';
COMMENT ON COLUMN "activities"."propertyId" IS 'Legacy housing foreign key kept temporarily for archival.';