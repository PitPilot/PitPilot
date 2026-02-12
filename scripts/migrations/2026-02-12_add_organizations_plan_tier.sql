ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'free';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_plan_tier_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_plan_tier_check
      CHECK (plan_tier IN ('free', 'supporter'));
  END IF;
END $$;
