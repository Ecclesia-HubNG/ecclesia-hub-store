CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text        NOT NULL,
  entity_type  text        NOT NULL,
  entity_id    text,
  actor_id     uuid,
  actor_email  text,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs; nobody can insert/update/delete from client
CREATE POLICY "audit_logs_admin_read"
  ON public.audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

CREATE INDEX IF NOT EXISTS audit_logs_action_idx     ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx     ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx      ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
