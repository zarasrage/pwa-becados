-- Taller de aplicación práctica de inteligencia artificial
-- 4 sesiones, 5 al 8 de octubre 2026, 16:15 - 17:15, Auditorio 1 · Jofré 73.
-- Público: solo los 15 becados UNAB.

insert into actividades (fecha, hora, titulo, color, becados) values
  ('2026-10-05', '16:15', 'Taller IA 1/4 — Fundamentos y panorama',            '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-10-06', '16:15', 'Taller IA 2/4 — Prompts para la práctica clínica',  '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-10-07', '16:15', 'Taller IA 3/4 — IA anclada en la evidencia',        '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-10-08', '16:15', 'Taller IA 4/4 — Flujos de trabajo y cierre',        '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']);

-- Invalidar caché de todos los clientes
update config set value = extract(epoch from now())::text where key = 'data_version';
