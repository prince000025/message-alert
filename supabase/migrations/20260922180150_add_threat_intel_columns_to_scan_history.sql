/*
# Add threat intelligence and AI feature columns to scan_history

1. Modified Tables
- `scan_history`
  - `features` (jsonb, array of feature vector objects from the ML-style analysis)
  - `threat_intel` (jsonb, threat intelligence result from the edge function lookup)
  - `confidence` (double precision, 0-1 confidence score for the verdict)

2. Security
- No changes to existing RLS policies. The new columns are accessible under the same
  anon/authenticated CRUD policies already in place.

3. Notes
- These columns store the enhanced analysis output from the upgraded analyzer.
- `features` contains a normalized feature vector for the "AI Analysis" visualization panel.
- `threat_intel` stores the result of the external threat intelligence lookup (URLhaus, DNS, RDAP).
- `confidence` is a 0-1 score representing how confident the system is in its verdict.
- All columns are nullable so existing rows are not affected.
*/

ALTER TABLE scan_history
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS threat_intel jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confidence double precision DEFAULT 0.5;
