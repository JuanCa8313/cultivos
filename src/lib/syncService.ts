import {
  dbCultivos,
  ParcelaCultivo,
  RegistroCosecha,
  VentaCosecha,
  AplicacionAbono,
  GastoCultivo,
  emitCultivosUpdated,
} from './db';
import { getSupabaseClient } from './supabase';

export interface SyncStatusCultivos {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

let syncStatus: SyncStatusCultivos = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
};

export function getCultivosSyncStatus(): SyncStatusCultivos {
  return { ...syncStatus };
}

function notifySyncState() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('granja-cultivos-sync-status', {
        detail: { ...syncStatus },
      })
    );
  }
}

/**
 * PUSH: Envía todos los registros locales de Dexie hacia Supabase (tablas cultivos_*)
 */
export async function sincronizarCultivosPush(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // 1. Parcelas
    const parcelas = await dbCultivos.parcelas.toArray();
    if (parcelas.length > 0) {
      const payloadParcelas = parcelas.map((p: ParcelaCultivo) => ({
        id: p.id,
        nombre: p.nombre,
        tipo_cultivo: p.tipoCultivo,
        fecha_siembra: p.fechaSiembra,
        cantidad_plantas: p.cantidadPlantas ? Number(p.cantidadPlantas) : null,
        area_metros2: p.areaMetros2 ? Number(p.areaMetros2) : null,
        dias_ciclo_estimado: Number(p.diasCicloEstimado) || 45,
        estado: p.estado || 'en_crecimiento',
        notas: p.notas || null,
        activo: Boolean(p.activo),
        created_at: p.createdAt || new Date().toISOString(),
      }));
      const { error: errP } = await supabase.from('cultivos_parcelas').upsert(payloadParcelas, { onConflict: 'id' });
      if (errP) throw new Error(`Error en cultivos_parcelas: ${errP.message}`);
    }

    // 2. Cosechas
    const cosechas = await dbCultivos.cosechas.toArray();
    if (cosechas.length > 0) {
      const payloadCosechas = cosechas.map((c: RegistroCosecha) => ({
        id: c.id,
        parcela_id: c.parcelaId,
        fecha: c.fecha,
        cantidad_kg: Number(c.cantidadKg) || 0,
        calidad: c.calidad || 'primera',
        notas: c.notas || null,
        created_at: c.createdAt || new Date().toISOString(),
      }));
      const { error: errC } = await supabase.from('cultivos_cosechas').upsert(payloadCosechas, { onConflict: 'id' });
      if (errC) throw new Error(`Error en cultivos_cosechas: ${errC.message}`);
    }

    // 3. Ventas
    const ventas = await dbCultivos.ventas.toArray();
    if (ventas.length > 0) {
      const payloadVentas = ventas.map((v: VentaCosecha) => ({
        id: v.id,
        parcela_id: v.parcelaId,
        fecha: v.fecha,
        cantidad_kg: Number(v.cantidadKg) || 0,
        precio_por_kg: Number(v.precioPorKg) || 0,
        total_cop: Number(v.totalCop) || 0,
        metodo_pago: v.metodoPago || 'efectivo',
        cliente_nombre: v.clienteNombre || 'Consumidor',
        notas: v.notas || null,
        created_at: v.createdAt || new Date().toISOString(),
      }));
      const { error: errV } = await supabase.from('cultivos_ventas').upsert(payloadVentas, { onConflict: 'id' });
      if (errV) throw new Error(`Error en cultivos_ventas: ${errV.message}`);
    }

    // 4. Abonos
    const abonos = await dbCultivos.abonos.toArray();
    if (abonos.length > 0) {
      const payloadAbonos = abonos.map((a: AplicacionAbono) => ({
        id: a.id,
        parcela_id: a.parcelaId,
        fecha: a.fecha,
        tipo_abono: a.tipoAbono,
        cantidad_kg: Number(a.cantidadKg) || 0,
        costo_cop: Number(a.costoCop) || 0,
        notas: a.notas || null,
        created_at: a.createdAt || new Date().toISOString(),
      }));
      const { error: errA } = await supabase.from('cultivos_abonos').upsert(payloadAbonos, { onConflict: 'id' });
      if (errA) throw new Error(`Error en cultivos_abonos: ${errA.message}`);
    }

    // 5. Gastos
    const gastos = await dbCultivos.gastos.toArray();
    if (gastos.length > 0) {
      const payloadGastos = gastos.map((g: GastoCultivo) => ({
        id: g.id,
        parcela_id: g.parcelaId || null,
        fecha: g.fecha,
        categoria: g.categoria,
        descripcion: g.descripcion,
        monto_cop: Number(g.montoCop) || 0,
        metodo_pago: g.metodoPago || 'efectivo',
        created_at: g.createdAt || new Date().toISOString(),
      }));
      const { error: errG } = await supabase.from('cultivos_gastos').upsert(payloadGastos, { onConflict: 'id' });
      if (errG) throw new Error(`Error en cultivos_gastos: ${errG.message}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en sincronizarCultivosPush:', err);
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

/**
 * PULL: Descarga datos remotos desde Supabase y los sincroniza en la base local Dexie
 */
export async function sincronizarCultivosPull(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // 1. Parcelas
    const { data: remoteParcelas, error: errP } = await supabase.from('cultivos_parcelas').select('*');
    if (errP) throw errP;
    if (remoteParcelas && remoteParcelas.length > 0) {
      const mappedParcelas: ParcelaCultivo[] = remoteParcelas.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        tipoCultivo: row.tipo_cultivo,
        fechaSiembra: row.fecha_siembra,
        cantidadPlantas: row.cantidad_plantas ? Number(row.cantidad_plantas) : undefined,
        areaMetros2: row.area_metros2 ? Number(row.area_metros2) : undefined,
        diasCicloEstimado: Number(row.dias_ciclo_estimado),
        estado: row.estado,
        notas: row.notas || undefined,
        activo: Boolean(row.activo),
        createdAt: row.created_at,
      }));
      await dbCultivos.parcelas.bulkPut(mappedParcelas);
    }

    // 2. Cosechas
    const { data: remoteCosechas, error: errC } = await supabase.from('cultivos_cosechas').select('*');
    if (errC) throw errC;
    if (remoteCosechas && remoteCosechas.length > 0) {
      const mappedCosechas: RegistroCosecha[] = remoteCosechas.map((row: any) => ({
        id: row.id,
        parcelaId: row.parcela_id,
        fecha: row.fecha,
        cantidadKg: Number(row.cantidad_kg),
        calidad: row.calidad || undefined,
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbCultivos.cosechas.bulkPut(mappedCosechas);
    }

    // 3. Ventas
    const { data: remoteVentas, error: errV } = await supabase.from('cultivos_ventas').select('*');
    if (errV) throw errV;
    if (remoteVentas && remoteVentas.length > 0) {
      const mappedVentas: VentaCosecha[] = remoteVentas.map((row: any) => ({
        id: row.id,
        parcelaId: row.parcela_id,
        fecha: row.fecha,
        cantidadKg: Number(row.cantidad_kg),
        precioPorKg: Number(row.precio_por_kg),
        totalCop: Number(row.total_cop),
        metodoPago: row.metodo_pago,
        clienteNombre: row.cliente_nombre,
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbCultivos.ventas.bulkPut(mappedVentas);
    }

    // 4. Abonos
    const { data: remoteAbonos, error: errA } = await supabase.from('cultivos_abonos').select('*');
    if (errA) throw errA;
    if (remoteAbonos && remoteAbonos.length > 0) {
      const mappedAbonos: AplicacionAbono[] = remoteAbonos.map((row: any) => ({
        id: row.id,
        parcelaId: row.parcela_id,
        fecha: row.fecha,
        tipoAbono: row.tipo_abono,
        cantidadKg: Number(row.cantidad_kg),
        costoCop: Number(row.costo_cop),
        notas: row.notas || undefined,
        createdAt: row.created_at,
      }));
      await dbCultivos.abonos.bulkPut(mappedAbonos);
    }

    // 5. Gastos
    const { data: remoteGastos, error: errG } = await supabase.from('cultivos_gastos').select('*');
    if (errG) throw errG;
    if (remoteGastos && remoteGastos.length > 0) {
      const mappedGastos: GastoCultivo[] = remoteGastos.map((row: any) => ({
        id: row.id,
        parcelaId: row.parcela_id || undefined,
        fecha: row.fecha,
        categoria: row.categoria,
        descripcion: row.descripcion,
        montoCop: Number(row.monto_cop),
        metodoPago: row.metodo_pago,
        createdAt: row.created_at,
      }));
      await dbCultivos.gastos.bulkPut(mappedGastos);
    }

    emitCultivosUpdated();
    return { success: true };
  } catch (err: any) {
    console.error('Error en sincronizarCultivosPull:', err);
    return { success: false, error: err.message || 'Error desconocido' };
  }
}

/**
 * SINCRONIZACIÓN HÍBRIDA BIDIRECCIONAL CULTIVOS
 */
export async function sincronizarCultivos(): Promise<SyncStatusCultivos> {
  if (syncStatus.isSyncing) return syncStatus;

  syncStatus.isSyncing = true;
  syncStatus.error = null;
  notifySyncState();

  try {
    const pushRes = await sincronizarCultivosPush();
    if (!pushRes.success) {
      throw new Error(pushRes.error || 'Error al enviar a Supabase');
    }

    const pullRes = await sincronizarCultivosPull();
    if (!pullRes.success) {
      throw new Error(pullRes.error || 'Error al descargar de Supabase');
    }

    syncStatus.lastSyncedAt = new Date();
    syncStatus.error = null;
  } catch (err: any) {
    syncStatus.error = err.message || 'Error en sincronización';
  } finally {
    syncStatus.isSyncing = false;
    notifySyncState();
  }

  return syncStatus;
}
