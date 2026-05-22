-- Allowlist: run once in Supabase SQL Editor after 001_initial.sql

INSERT INTO allowed_discord_ids (discord_id, role) VALUES
  ('893880068047269898', 'player'),
  ('1109813716490387486', 'player'),
  ('872604223643193405', 'player'),
  ('362415507158204417', 'player'),
  ('235212930474442753', 'player'),
  ('201740051321847809', 'player'),
  ('181957483361730560', 'gm')
ON CONFLICT (discord_id) DO UPDATE SET role = EXCLUDED.role;
