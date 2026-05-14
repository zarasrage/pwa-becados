-- ── BECADOS ──────────────────────────────────────────────────────────────────
create table if not exists becados (
  id          serial primary key,
  nombre      text not null unique,
  universidad text not null check (universidad in ('UNAB','UANDES','IST')),
  anio        int  not null check (anio in (1,2,3))
);

-- ── ROTACIONES ───────────────────────────────────────────────────────────────
-- Un rango por período continuo de la misma rotación
create table if not exists rotaciones (
  id           serial primary key,
  becado_id    int  not null references becados(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin    date not null,
  codigo       text not null default '',
  check (fecha_fin >= fecha_inicio),
  unique (becado_id, fecha_inicio, codigo)
);

-- ── TURNOS ───────────────────────────────────────────────────────────────────
-- Reemplaza hojas Dia + Noche + Artroscopia
-- tipo: D=Día, P=Poli Tarde, p=Poli Mañana, N=Noche, A=Artroscopía
create table if not exists turnos (
  id         serial primary key,
  becado_id  int  not null references becados(id) on delete cascade,
  fecha      date not null,
  tipo       text not null check (tipo in ('D','P','p','N','A')),
  unique (becado_id, fecha, tipo)
);

-- ── SEMINARIOS ───────────────────────────────────────────────────────────────
create table if not exists seminarios (
  id            serial primary key,
  fecha         date not null,
  presentador_id int references becados(id) on delete set null,
  titulo        text not null default '',
  tag           text not null default '',  -- 'Seminario Hombro', etc.
  hora          text not null default '07:30',
  unique (fecha, tag)
);

-- ── HORARIO ITEMS ─────────────────────────────────────────────────────────────
-- Reemplaza hojas Horario Hombro/Mano/Cadera/etc.
-- dia_semana: Lunes, Martes, Miercoles, Jueves, Viernes
create table if not exists horario_items (
  id              serial primary key,
  rotacion_codigo text not null,
  dia_semana      text not null check (dia_semana in ('Lunes','Martes','Miercoles','Jueves','Viernes')),
  hora            text not null,
  actividad       text not null,
  unique (rotacion_codigo, dia_semana, hora)
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────
create index if not exists idx_rotaciones_becado    on rotaciones(becado_id);
create index if not exists idx_rotaciones_inicio    on rotaciones(fecha_inicio);
create index if not exists idx_rotaciones_fin       on rotaciones(fecha_fin);
create index if not exists idx_turnos_fecha         on turnos(fecha);
create index if not exists idx_turnos_becado        on turnos(becado_id);
create index if not exists idx_seminarios_fecha     on seminarios(fecha);

-- ── RLS (Row Level Security) ──────────────────────────────────────────────────
-- Por ahora: lectura pública, escritura solo autenticada
alter table becados       enable row level security;
alter table rotaciones    enable row level security;
alter table turnos        enable row level security;
alter table seminarios    enable row level security;
alter table horario_items enable row level security;

-- Lectura pública (anon key puede leer)
create policy "lectura publica becados"       on becados       for select using (true);
create policy "lectura publica rotaciones"    on rotaciones    for select using (true);
create policy "lectura publica turnos"        on turnos        for select using (true);
create policy "lectura publica seminarios"    on seminarios    for select using (true);
create policy "lectura publica horario_items" on horario_items for select using (true);
