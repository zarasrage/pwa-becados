-- Taller de aplicación práctica de inteligencia artificial
-- 4 sesiones de 1 hora, 5 al 8 de octubre 2026, Auditorio 1.
-- Público: solo los 15 becados UNAB.
--
-- OJO: la hora del flyer no se alcanza a leer en la imagen (se ve un "...15").
-- Está puesta como 08:15 abajo: cámbiala en las 4 filas si corresponde.

insert into actividades (fecha, hora, titulo, color, becados) values
  ('2026-10-05', '08:15', 'Taller IA 1/4 — Fundamentos y panorama',            '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-10-06', '08:15', 'Taller IA 2/4 — Prompts para la práctica clínica',  '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-10-07', '08:15', 'Taller IA 3/4 — IA anclada en la evidencia',        '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-10-08', '08:15', 'Taller IA 4/4 — Flujos de trabajo y cierre',        '#8B73FF',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']);

-- Invalidar caché de todos los clientes
update config set value = extract(epoch from now())::text where key = 'data_version';
