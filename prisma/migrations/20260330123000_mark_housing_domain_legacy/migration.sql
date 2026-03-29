-- Safe deprecation markers for the retired housing domain.
-- This migration is intentionally non-destructive: no DROP TABLE, DROP COLUMN, or DELETE.

DO $$
BEGIN
	IF to_regclass('public.properties') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "properties" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
	IF to_regclass('public.units') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "units" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
	IF to_regclass('public.tenants') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "tenants" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
	IF to_regclass('public.leases') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "leases" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
	IF to_regclass('public.payments') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "payments" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
	IF to_regclass('public.maintenance_tickets') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "maintenance_tickets" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
	IF to_regclass('public.maintenance_updates') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TABLE "maintenance_updates" IS ''LEGACY housing domain table retained temporarily for archival and staged removal.''';
	END IF;
END $$;

DO $$
BEGIN
	IF to_regtype('"PropertyType"') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TYPE "PropertyType" IS ''LEGACY enum: retired with the housing domain.''';
	END IF;
	IF to_regtype('"UnitStatus"') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TYPE "UnitStatus" IS ''LEGACY enum: retired with the housing domain.''';
	END IF;
	IF to_regtype('"LeaseStatus"') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TYPE "LeaseStatus" IS ''LEGACY enum: retired with the housing domain.''';
	END IF;
	IF to_regtype('"PaymentStatus"') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TYPE "PaymentStatus" IS ''LEGACY enum: retired with the housing domain.''';
	END IF;
	IF to_regtype('"MaintenancePriority"') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TYPE "MaintenancePriority" IS ''LEGACY enum: retired with the housing domain.''';
	END IF;
	IF to_regtype('"MaintenanceStatus"') IS NOT NULL THEN
		EXECUTE 'COMMENT ON TYPE "MaintenanceStatus" IS ''LEGACY enum: retired with the housing domain.''';
	END IF;
END $$;

COMMENT ON COLUMN "users"."role" IS 'Contains legacy TENANT values. Keep only for backward compatibility until final cleanup.';
COMMENT ON COLUMN "contacts"."type" IS 'Contains legacy housing contact variants kept temporarily for archival.';
COMMENT ON COLUMN "cases"."type" IS 'Contains legacy LOCATION and MAINTENANCE case types kept temporarily for archival.';
COMMENT ON COLUMN "documents"."linkedType" IS 'Contains legacy housing linked types kept temporarily for archival.';
COMMENT ON COLUMN "tasks"."linkedType" IS 'Contains legacy housing linked types kept temporarily for archival.';
COMMENT ON COLUMN "communications"."linkedType" IS 'Contains legacy housing linked types kept temporarily for archival.';

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'communications' AND column_name = 'tenantId'
	) THEN
		EXECUTE 'COMMENT ON COLUMN "communications"."tenantId" IS ''Legacy housing foreign key kept temporarily for archival.''';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'propertyId'
	) THEN
		EXECUTE 'COMMENT ON COLUMN "appointments"."propertyId" IS ''Legacy housing foreign key kept temporarily for archival.''';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'propertyId'
	) THEN
		EXECUTE 'COMMENT ON COLUMN "activities"."propertyId" IS ''Legacy housing foreign key kept temporarily for archival.''';
	END IF;
END $$;