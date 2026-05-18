CREATE TABLE IF NOT EXISTS public.media_assets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url         text NOT NULL,
  key         text NOT NULL UNIQUE,
  name        text NOT NULL,
  size        integer,
  mime_type   text,
  folder      text NOT NULL DEFAULT 'general',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON public.media_assets(folder);
CREATE INDEX IF NOT EXISTS media_assets_created_at_idx ON public.media_assets(created_at DESC);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_admin_all"
  ON public.media_assets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
