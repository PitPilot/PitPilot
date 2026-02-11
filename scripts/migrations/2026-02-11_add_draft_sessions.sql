-- Draft sessions for alliance selection (org-scoped, realtime)

CREATE TABLE IF NOT EXISTS public.draft_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS draft_sessions_event_org_idx
ON public.draft_sessions (event_id, org_id);

ALTER TABLE public.draft_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view draft sessions"
ON public.draft_sessions
FOR SELECT
USING (org_id = get_user_org_id());

CREATE POLICY "org members can insert draft sessions"
ON public.draft_sessions
FOR INSERT
WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "org members can update draft sessions"
ON public.draft_sessions
FOR UPDATE
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());
