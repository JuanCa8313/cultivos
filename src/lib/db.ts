import Dexie, { type Table } from 'dexie';

export interface ParcelaCultivo {
  id: string;
  nombre: string;
  tipoCultivo: 'cilantro' | 'frijol' | 'platano' | 'banano' | 'limon_frutales' | 'otro';
  fechaSiembra: string;
  cantidadPlantas?: number;
  areaMetros2?: number;
  diasCicloEstimado: number;
  estado: 'en_crecimiento' | 'listo_cosecha' | 'en_cosecha' | 'finalizado';
  notas?: string;
  activo: boolean;
  createdAt: string;
}

export interface RegistroCosecha {
  id: string;
  parcelaId: string;
  fecha: string;
  cantidadKg: number;
  calidad?: 'primera' | 'segunda';
  notas?: string;
  createdAt: string;
}

export interface VentaCosecha {
  id: string;
  parcelaId: string;
  fecha: string;
  cantidadKg: number;
  precioPorKg: number;
  totalCop: number;
  metodoPago: 'efectivo' | 'transferencia' | 'fiado';
  clienteNombre: string;
  notas?: string;
  createdAt: string;
}

export interface AplicacionAbono {
  id: string;
  parcelaId: string;
  fecha: string;
  tipoAbono: 'gallinaza_propia' | 'frass_bsf' | 'compost_finca' | 'quimico';
  cantidadKg: number;
  costoCop: number; // 0 si proviene de las gallinas o mosca soldado
  notas?: string;
  createdAt: string;
}

export interface GastoCultivo {
  id: string;
  parcelaId?: string;
  fecha: string;
  categoria: 'jornal' | 'riego_mangueras' | 'semillas' | 'herramientas' | 'flete' | 'otro';
  descripcion: string;
  montoCop: number;
  metodoPago: 'efectivo' | 'transferencia';
  createdAt: string;
}

export class CultivosDatabase extends Dexie {
  parcelas!: Table<ParcelaCultivo, string>;
  cosechas!: Table<RegistroCosecha, string>;
  ventas!: Table<VentaCosecha, string>;
  abonos!: Table<AplicacionAbono, string>;
  gastos!: Table<GastoCultivo, string>;

  constructor() {
    super('CultivosGranjaDB');
    this.version(1).stores({
      parcelas: 'id, nombre, tipoCultivo, estado, activo',
      cosechas: 'id, parcelaId, fecha',
      ventas: 'id, parcelaId, fecha, metodoPago',
      abonos: 'id, parcelaId, fecha, tipoAbono',
      gastos: 'id, parcelaId, fecha, categoria',
    });
  }
}

export const dbCultivos = new CultivosDatabase();

export function emitCultivosUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('granja-cultivos-db-updated'));
  }
}

// Inicialización con los cultivos reales reportados por el usuario
export async function seedInitialCultivosData() {
  const count = await dbCultivos.parcelas.count();
  if (count === 0) {
    const hoy = new Date();
    // Cilantro sembrado hace aprox 40 días (listo para coger hoy)
    const fechaCilantro = new Date(hoy.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // Plátano y banano sembrados el domingo
    const fechaDomingo = new Date(hoy.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await dbCultivos.parcelas.bulkAdd([
      {
        id: 'par-cilantro',
        nombre: 'Era 1 - Cilantro (Listo 8 kg)',
        tipoCultivo: 'cilantro',
        fechaSiembra: fechaCilantro,
        diasCicloEstimado: 45,
        estado: 'listo_cosecha',
        notas: '8 kilos listos para recolectar y vender en tiendas y legumbrerías del pueblo.',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'par-platano-banano',
        nombre: 'Lote Musáceas (20 Plátanos + 20 Bananos)',
        tipoCultivo: 'platano',
        fechaSiembra: fechaDomingo,
        cantidadPlantas: 40,
        diasCicloEstimado: 450, // 14-15 meses a 2.200 msnm
        estado: 'en_crecimiento',
        notas: 'Sembrado el domingo: 20 colinos de plátano y 20 de banano. Abonar con gallinaza madura.',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'par-frijol',
        nombre: 'Parcela Fríjol Andino',
        tipoCultivo: 'frijol',
        fechaSiembra: fechaDomingo,
        diasCicloEstimado: 110,
        estado: 'en_crecimiento',
        notas: 'Frijol trepador / arbustivo para cosecha en verde o grano seco.',
        activo: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'par-limones',
        nombre: 'Frutales - Limones',
        tipoCultivo: 'limon_frutales',
        fechaSiembra: fechaDomingo,
        diasCicloEstimado: 540,
        estado: 'en_crecimiento',
        notas: 'Árboles frutales de limón con manejo orgánico.',
        activo: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}
