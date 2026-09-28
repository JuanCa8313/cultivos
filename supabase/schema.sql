-- Esquema de tablas para Cultivos & Huerta en Supabase
-- Ejecutar en SQL Editor de https://kwvknzlhgwmvgdzqhoxn.supabase.co

CREATE TABLE IF NOT EXISTS cultivos_parcelas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo_cultivo TEXT NOT NULL,
    fecha_siembra DATE NOT NULL,
    cantidad_plantas INTEGER,
    area_metros2 NUMERIC(8, 2),
    dias_ciclo_estimado INTEGER NOT NULL DEFAULT 45,
    estado TEXT NOT NULL DEFAULT 'en_crecimiento',
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivos_cosechas (
    id TEXT PRIMARY KEY,
    parcela_id TEXT NOT NULL REFERENCES cultivos_parcelas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cantidad_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    calidad TEXT DEFAULT 'primera',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivos_ventas (
    id TEXT PRIMARY KEY,
    parcela_id TEXT NOT NULL,
    fecha DATE NOT NULL,
    cantidad_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    precio_por_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    cliente_nombre TEXT NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivos_abonos (
    id TEXT PRIMARY KEY,
    parcela_id TEXT NOT NULL REFERENCES cultivos_parcelas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo_abono TEXT NOT NULL,
    cantidad_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    costo_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivos_gastos (
    id TEXT PRIMARY KEY,
    parcela_id TEXT,
    fecha DATE NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cultivos_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos_cosechas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos_abonos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos_gastos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir todo cultivos_parcelas" ON cultivos_parcelas;
    CREATE POLICY "Permitir todo cultivos_parcelas" ON cultivos_parcelas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo cultivos_cosechas" ON cultivos_cosechas;
    CREATE POLICY "Permitir todo cultivos_cosechas" ON cultivos_cosechas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo cultivos_ventas" ON cultivos_ventas;
    CREATE POLICY "Permitir todo cultivos_ventas" ON cultivos_ventas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo cultivos_abonos" ON cultivos_abonos;
    CREATE POLICY "Permitir todo cultivos_abonos" ON cultivos_abonos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir todo cultivos_gastos" ON cultivos_gastos;
    CREATE POLICY "Permitir todo cultivos_gastos" ON cultivos_gastos FOR ALL USING (true) WITH CHECK (true);
END $$;
