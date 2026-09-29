'use client';

import React, { useState, useEffect } from 'react';
import { dbCultivos, emitCultivosUpdated, type ParcelaCultivo } from '../lib/db';
import { getSupabaseClient } from '../lib/supabase';
import { Scissors, ShoppingBag, Sprout, Receipt, Check, X, Sparkles, MessageCircle, Trash2 } from 'lucide-react';
import { formatCOP } from '../lib/utils';
import type { VentaCosecha } from '../lib/db';

export function BotoneraCultivosTab() {
  const [parcelas, setParcelas] = useState<ParcelaCultivo[]>([]);
  const [selectedParcelaId, setSelectedParcelaId] = useState<string>('par-cilantro');
  const [modalType, setModalType] = useState<'cosecha' | 'venta' | 'abono' | 'gasto' | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [ventasRecientes, setVentasRecientes] = useState<VentaCosecha[]>([]);
  const [ultimaVenta, setUltimaVenta] = useState<VentaCosecha | null>(null);

  // Cosecha
  const [kgCosecha, setKgCosecha] = useState<number>(8); // Por defecto 8 kg listos de cilantro
  // Venta
  const [kgVenta, setKgVenta] = useState<number>(8);
  const [precioKgVenta, setPrecioKgVenta] = useState<number>(6000); // COP/kg promedio pueblo cilantro
  const [metodoPagoVenta, setMetodoPagoVenta] = useState<'efectivo' | 'transferencia' | 'fiado'>('efectivo');
  const [clienteVenta, setClienteVenta] = useState<string>('Legumbrería Central');

  // Abono Orgánico
  const [tipoAbono, setTipoAbono] = useState<'gallinaza_propia' | 'frass_bsf' | 'compost_finca'>('gallinaza_propia');
  const [cantidadAbonoKg, setCantidadAbonoKg] = useState<number>(25);

  // Gasto
  const [montoGasto, setMontoGasto] = useState<number>(20000);
  const [descripcionGasto, setDescripcionGasto] = useState<string>('Jornal deshierbe');

  const cargarParcelas = async () => {
    const todasParcelas = await dbCultivos.parcelas.toArray();
    const list = todasParcelas.filter((p) => Boolean(p.activo));
    setParcelas(list);
    if (list.length > 0 && (!selectedParcelaId || !list.some((p) => p.id === selectedParcelaId))) {
      setSelectedParcelaId(list[0].id);
    }
    const listVentas = await dbCultivos.ventas.reverse().limit(5).toArray();
    setVentasRecientes(listVentas);
  };

  useEffect(() => {
    cargarParcelas();
    const listener = () => cargarParcelas();
    window.addEventListener('granja-cultivos-db-updated', listener);
    return () => window.removeEventListener('granja-cultivos-db-updated', listener);
  }, []);

  const notificar = (msg: string) => {
    setMensajeExito(msg);
    emitCultivosUpdated();
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const handleGuardarCosecha = async () => {
    if (!selectedParcelaId) return;
    await dbCultivos.cosechas.add({
      id: 'cos-' + Date.now(),
      parcelaId: selectedParcelaId,
      fecha: new Date().toISOString().split('T')[0],
      cantidadKg: Number(kgCosecha),
      calidad: 'primera',
      createdAt: new Date().toISOString(),
    });
    await cargarParcelas();
    setModalType(null);
    notificar(`¡Cosecha registrada! ${kgCosecha} kg recolectados con éxito.`);
  };

  const handleGuardarVenta = async () => {
    if (!selectedParcelaId) return;
    const total = Math.round(kgVenta * precioKgVenta);
    const nuevaVenta: VentaCosecha = {
      id: 'vencos-' + Date.now(),
      parcelaId: selectedParcelaId,
      fecha: new Date().toISOString().split('T')[0],
      cantidadKg: Number(kgVenta),
      precioPorKg: Number(precioKgVenta),
      totalCop: total,
      metodoPago: metodoPagoVenta,
      clienteNombre: clienteVenta,
      createdAt: new Date().toISOString(),
    };
    await dbCultivos.ventas.add(nuevaVenta);
    setUltimaVenta(nuevaVenta);
    await cargarParcelas();
    setModalType(null);
    notificar(`¡Venta registrada! ${kgVenta} kg por ${formatCOP(total)} a ${clienteVenta}`);
  };

  const handleEliminarVenta = async (venta: VentaCosecha) => {
    if (!confirm(`¿Deseas anular la venta de ${venta.cantidadKg} kg a ${venta.clienteNombre}?`)) return;
    await dbCultivos.ventas.delete(venta.id);
    try {
      const supabase = getSupabaseClient();
      if (supabase && navigator.onLine) {
        await supabase.from('cultivos_ventas').delete().eq('id', venta.id);
      }
    } catch (e) {
      console.warn('Error eliminando venta en Supabase:', e);
    }
    if (ultimaVenta?.id === venta.id) {
      setUltimaVenta(null);
    }
    await cargarParcelas();
    notificar('Venta de cosecha anulada con éxito.');
  };

  const compartirReciboWhatsApp = (venta: VentaCosecha) => {
    const texto = `🌱 *Comprobante de Entrega Agrícola - Granja SomosGranja*\n\n` +
      `🏪 Cliente: *${venta.clienteNombre}*\n` +
      `📅 Fecha: ${venta.fecha}\n` +
      `🌿 Producto: Cosecha Fresca de Huerta (Cilantro / Hortaliza)\n` +
      `⚖️ Peso: *${venta.cantidadKg} kg*\n` +
      `💵 Precio/kg: ${formatCOP(venta.precioPorKg)}\n` +
      `💰 Total: *${formatCOP(venta.totalCop)}*\n` +
      `💳 Pago: *${venta.metodoPago.toUpperCase()}*\n\n` +
      `¡Cosechado fresco a 2.200 msnm con manejo orgánico! Gracias por apoyar el campo local. 🌾`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handleGuardarAbono = async () => {
    if (!selectedParcelaId) return;
    await dbCultivos.abonos.add({
      id: 'abo-' + Date.now(),
      parcelaId: selectedParcelaId,
      fecha: new Date().toISOString().split('T')[0],
      tipoAbono: tipoAbono,
      cantidadKg: Number(cantidadAbonoKg),
      costoCop: 0, // Costo $0 por economía circular
      createdAt: new Date().toISOString(),
    });
    setModalType(null);
    notificar(`¡Fertilización Orgánica $0! ${cantidadAbonoKg} kg de ${tipoAbono.replace('_', ' ')}`);
  };

  const handleGuardarGasto = async () => {
    await dbCultivos.gastos.add({
      id: 'gas-' + Date.now(),
      parcelaId: selectedParcelaId || undefined,
      fecha: new Date().toISOString().split('T')[0],
      categoria: 'jornal',
      descripcion: descripcionGasto,
      montoCop: Number(montoGasto),
      metodoPago: 'efectivo',
      createdAt: new Date().toISOString(),
    });
    setModalType(null);
    notificar(`Gasto agrícola registrado: ${formatCOP(montoGasto)}`);
  };

  const parcelaActiva = parcelas.find((p) => p.id === selectedParcelaId);

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      {mensajeExito && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-emerald-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Selector de Parcela */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
          Cultivo Seleccionado
        </label>
        <select
          value={selectedParcelaId}
          onChange={(e) => setSelectedParcelaId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800"
        >
          {parcelas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {parcelaActiva && (
          <div className="mt-2 text-xs text-slate-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/60 flex items-center justify-between">
            <span>Tipo: <strong className="capitalize">{parcelaActiva.tipoCultivo.replace('_', ' ')}</strong></span>
            <span className="font-bold text-emerald-800 capitalize">
              {parcelaActiva.estado === 'listo_cosecha' ? '🌱 ¡Listo para coger!' : parcelaActiva.estado.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 gap-3.5 mb-6">
        {/* Cosechar */}
        <button
          onClick={() => setModalType('cosecha')}
          className="bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Scissors className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Cosechar</span>
          <span className="text-[11px] text-emerald-100">Kilos recolectados</span>
        </button>

        {/* Vender Cosecha */}
        <button
          onClick={() => setModalType('venta')}
          className="bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Vender Cosecha</span>
          <span className="text-[11px] text-amber-100">Tiendas / Vereda</span>
        </button>

        {/* Abono Orgánico Gratis */}
        <button
          onClick={() => setModalType('abono')}
          className="bg-gradient-to-br from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[125px]"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base leading-tight">Abono Orgánico</span>
          <span className="text-[11px] text-teal-100">Gallinaza / BSF ($0)</span>
        </button>

        {/* Gasto Huerto */}
        <button
          onClick={() => setModalType('gasto')}
          className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 p-4 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[110px]"
        >
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
            <Receipt className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm leading-tight">Gasto Huerto</span>
          <span className="text-[10px] text-slate-500">Jornales, semillas</span>
        </button>
      </div>

      {/* Recibo Rápido de Última Venta de Cosecha */}
      {ultimaVenta && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 mb-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              ✅ Cosecha Entregada a {ultimaVenta.clienteNombre}
            </span>
            <span className="text-sm font-black text-slate-800 block">
              {ultimaVenta.cantidadKg} kg de cilantro • {formatCOP(ultimaVenta.totalCop)}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">Pago: {ultimaVenta.metodoPago}</span>
          </div>

          <button
            onClick={() => compartirReciboWhatsApp(ultimaVenta)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl shadow-md text-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Recibo WA</span>
          </button>
        </div>
      )}

      {/* Historial de Ventas Recientes de la Huerta */}
      {ventasRecientes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ventas de Huerta Recientes
            </span>
            <span className="text-[10px] text-slate-400">Entregas locales</span>
          </div>

          <div className="space-y-2">
            {ventasRecientes.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{v.clienteNombre}</span>
                  <span className="text-[11px] text-slate-500">
                    {v.cantidadKg} kg • <strong className="text-slate-700">{formatCOP(v.totalCop)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => compartirReciboWhatsApp(v)}
                    className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all"
                    title="Enviar comprobante por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEliminarVenta(v)}
                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"
                    title="Anular venta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL COSECHA */}
      {modalType === 'cosecha' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-emerald-600" />
                Registrar Cosecha
              </h3>
              <button onClick={() => setModalType(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Kilos Cosechados</label>
                <input
                  type="number"
                  step="0.5"
                  value={kgCosecha}
                  onChange={(e) => setKgCosecha(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>
              <button
                onClick={handleGuardarCosecha}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl shadow-md text-sm"
              >
                Guardar Cosecha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENTA */}
      {modalType === 'venta' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                Venta de Cosecha
              </h3>
              <button onClick={() => setModalType(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kilos a Vender</label>
                  <input
                    type="number"
                    step="0.5"
                    value={kgVenta}
                    onChange={(e) => setKgVenta(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Precio / Kilo</label>
                  <input
                    type="number"
                    step="500"
                    value={precioKgVenta}
                    onChange={(e) => setPrecioKgVenta(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-amber-900">Total Venta:</span>
                <span className="font-black text-base text-amber-700">
                  {formatCOP(Math.round(kgVenta * precioKgVenta))}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Cliente / Tienda</label>
                <input
                  type="text"
                  value={clienteVenta}
                  onChange={(e) => setClienteVenta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <button
                onClick={handleGuardarVenta}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-2xl shadow-md text-sm"
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONO */}
      {modalType === 'abono' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                Fertilización Orgánica ($0)
              </h3>
              <button onClick={() => setModalType(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Origen del Abono</label>
                <select
                  value={tipoAbono}
                  onChange={(e) => setTipoAbono(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="gallinaza_propia">Gallinaza madura de ponedoras (Costo $0)</option>
                  <option value="frass_bsf">Frass de mosca soldado negra (Costo $0)</option>
                  <option value="compost_finca">Compost orgánico de la finca (Costo $0)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Kilos Aplicados</label>
                <input
                  type="number"
                  value={cantidadAbonoKg}
                  onChange={(e) => setCantidadAbonoKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                />
              </div>
              <button
                onClick={handleGuardarAbono}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-3 rounded-2xl shadow-md text-sm"
              >
                Aplicar Abono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GASTO */}
      {modalType === 'gasto' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-700" />
                Registrar Gasto Huerto
              </h3>
              <button onClick={() => setModalType(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Descripción</label>
                <input
                  type="text"
                  value={descripcionGasto}
                  onChange={(e) => setDescripcionGasto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Monto (COP)</label>
                <input
                  type="number"
                  step="5000"
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs"
                />
              </div>
              <button
                onClick={handleGuardarGasto}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl shadow-md text-sm"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
