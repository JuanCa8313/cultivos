'use client';

import React, { useState, useEffect } from 'react';
import { dbCultivos, type ParcelaCultivo, type VentaCosecha, type GastoCultivo, type RegistroCosecha } from '../lib/db';
import { formatCOP } from '../lib/utils';
import { DollarSign, Sprout, TrendingUp, Scissors, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function CultivosTableroTab() {
  const { isAdmin } = useAuth();
  const [parcelas, setParcelas] = useState<ParcelaCultivo[]>([]);
  const [ventas, setVentas] = useState<VentaCosecha[]>([]);
  const [gastos, setGastos] = useState<GastoCultivo[]>([]);
  const [cosechas, setCosechas] = useState<RegistroCosecha[]>([]);

  const cargarDatos = async () => {
    setParcelas(await dbCultivos.parcelas.toArray());
    setVentas(await dbCultivos.ventas.toArray());
    setGastos(await dbCultivos.gastos.toArray());
    setCosechas(await dbCultivos.cosechas.toArray());
  };

  useEffect(() => {
    cargarDatos();
    const l = () => cargarDatos();
    window.addEventListener('granja-cultivos-db-updated', l);
    return () => window.removeEventListener('granja-cultivos-db-updated', l);
  }, []);

  const totalVentas = ventas.reduce((acc, v) => acc + v.totalCop, 0);
  const totalKgVendidos = ventas.reduce((acc, v) => acc + v.cantidadKg, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.montoCop, 0);
  const margenNeto = totalVentas - totalGastos;
  const totalKgCosechados = cosechas.reduce((acc, c) => acc + c.cantidadKg, 0);

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Finanzas de Cultivos</h2>
        <p className="text-xs text-slate-500">Rentabilidad de huerto y frutales</p>
      </div>

      {/* Utilidad Neta Huerto (Exclusivo Administrador) */}
      {isAdmin ? (
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-5 shadow-xl mb-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
              Utilidad Neta Agrícola
            </span>
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">
              {totalVentas > 0 ? `${((margenNeto / totalVentas) * 100).toFixed(0)}% margen` : '0%'}
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight mb-4">
            {formatCOP(margenNeto)}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-800/60 text-xs">
            <div>
              <span className="text-emerald-300 block mb-0.5">Ventas Totales</span>
              <span className="font-bold text-white text-sm">{formatCOP(totalVentas)}</span>
            </div>
            <div>
              <span className="text-emerald-300 block mb-0.5">Gastos Insumos</span>
              <span className="font-bold text-rose-300 text-sm">{formatCOP(totalGastos)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 mb-4 text-center">
          <ShieldAlert className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-800 mb-1">Módulo Financiero Reservado</h4>
          <p className="text-xs text-slate-500">
            Las métricas de rentabilidad y gastos de insumos están reservadas para el <strong>Administrador / Dueño</strong> de la finca.
          </p>
        </div>
      )}

      {/* Métricas físicas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Scissors className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold">Kg Cosechados</span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {totalKgCosechados} <span className="text-xs text-slate-400 font-normal">kg</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Sprout className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold">Parcelas Activas</span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {parcelas.filter((p) => p.activo).length}
          </div>
        </div>
      </div>
    </div>
  );
}
