CREATE TABLE IF NOT EXISTS menus (
  type        text        PRIMARY KEY,
  config      jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Insert default rows so the app always has something to read
INSERT INTO menus (type, config) VALUES
  ('mega_menu', '{"columns":[],"plainNav":[]}'),
  ('footer',    '{"columns":[]}')
ON CONFLICT (type) DO NOTHING;
