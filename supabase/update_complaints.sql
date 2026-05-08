-- Update complaints table to support multi-tier escalation
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_to_role text DEFAULT 'coordinator' CHECK (assigned_to_role IN ('coordinator', 'platform_owner'));
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS escalated boolean DEFAULT false;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS escalated_at timestamp with time zone;

-- Policy Update: Coordinators can view complaints assigned to their organization
CREATE POLICY "Coordinators can view their organization's complaints"
ON public.complaints FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coordinators
    WHERE profile_id = auth.uid() AND organization_id = public.complaints.organization_id
  )
);

-- Policy Update: Coordinators can update their organization's complaints (resolve them)
CREATE POLICY "Coordinators can update their organization's complaints"
ON public.complaints FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.coordinators
    WHERE profile_id = auth.uid() AND organization_id = public.complaints.organization_id
  )
);
