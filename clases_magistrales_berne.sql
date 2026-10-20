-- Clases magistrales del Dr. Juan Enrique Berne — telemáticas, obligatorias.
-- Martes 3 y martes 24 de noviembre 2026, 19:00.
-- Público: solo los 15 becados UNAB.
--
-- El tema va primero en el título para que se siga reconociendo en las vistas
-- de semana y mes, donde el texto se corta.

insert into actividades (fecha, hora, titulo, color, becados) values
  ('2026-11-03', '19:00',
   'Implementación modelo ortoplástico — Clase magistral Dr. Berne (telemática, obligatoria)',
   '#FB923C',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']),
  ('2026-11-24', '19:00',
   'Manejo fractura expuesta — Clase magistral Dr. Berne (telemática, obligatoria)',
   '#FB923C',
   array['Gonzalez','Beulieau','Valencia','Albert','Miño','Diaz','Uribe','Teuber','Rojas','Miranda','Chahin','Navia','Carcamo','Alvarez','Marre']);

-- Invalidar caché de todos los clientes
update config set value = extract(epoch from now())::text where key = 'data_version';
