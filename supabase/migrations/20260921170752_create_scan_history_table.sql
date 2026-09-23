/*
# Create scan_history table (single-tenant, no auth)

1. New Tables
- `scan_history`
  - `id` (uuid, primary key)
  - `input_text` (text, the URL or message that was analyzed, truncated to 2000 chars)
  - `input_type` (text, either 'url' or 'message')
  - `risk_score` (integer, 0-100)
  - `risk_level` (text, one of: 'safe', 'caution', 'suspicious', 'dangerous')
  - `findings` (jsonb, array of finding objects from the analyzer)
  - `summary` (text, human-readable summary of the analysis)
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on `scan_history`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in screen in this app).
- Four separate policies: select, insert, update, delete.

3. Notes
- This is a single-tenant app with no authentication. All scan history is publicly viewable.
- The `findings` column stores the full analysis result as JSON so the history view can re-render findings without re-analyzing.
*/

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text text NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('url', 'message')),
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('safe', 'caution', 'suspicious', 'dangerous')),
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scan_history" ON scan_history;
CREATE POLICY "anon_select_scan_history" ON scan_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scan_history" ON scan_history;
CREATE POLICY "anon_insert_scan_history" ON scan_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scan_history" ON scan_history;
CREATE POLICY "anon_update_scan_history" ON scan_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scan_history" ON scan_history;
CREATE POLICY "anon_delete_scan_history" ON scan_history FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_risk_level ON scan_history (risk_level);
