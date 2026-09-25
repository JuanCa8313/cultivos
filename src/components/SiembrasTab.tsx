'use client';

import React, { useState, useEffect } from 'react';
import { dbCultivos, emitCultivosUpdated, type ParcelaCultivo } from '../lib/db';
import { Sprout, Calendar, Clock, Plus } from 'lucide-react';

export function SiembrasTab() {
  const [parcelas, setParcelas] = useState<ParcelaCultivo[]>([]);

  const cargar = async () => {
    setParcelas(await dbCultivos.parcelas.toArray());
  };

  useEffect(() => {
    cargar();
    const l = () => cargar();
    window.addEventListener('granja-cultivos-db-updated', l);
    return () => window.removeEventListener('granja-cultivos-db-updated', l);
  }, []);

  const calcularDias = (fechaStr: string) => {
    const inicio = new Date(fechaStr).getTime();
    const hoy = new Date().getTime();
    return Math.max(0, Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Parcelas & Siembra</h2>
          <p className="text-xs text-slate-500">Ciclos de huerto y frutales a 2.200 msnm</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {parcelas.map((p) => {
          const diasDesdeSiembra = calcularDias(p.fechaSiembra);
          const progresoPct = Math.min(100, Math.round((diasDesdeSiembra / p.diasCicloEstimado) * 100));

          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{p.nombre}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Día {diasDesdeSiembra} de {p.diasCicloEstimado}
                    </span>
                    {p.cantidadPlantas && (
                      <>
                        <span>•</span>
                        <span>{p.cantidadPlantas} matas</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  p.estado === 'listo_cosecha' ? 'bg-amber-100 text-amber-800 font-black' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {p.estado === 'listo_cosecha' ? '¡Listo para coger!' : p.estado.replace('_', ' ')}
                </span>
              </div>

              {/* Barra de maduración */}
              <div className="my-2.5">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                  <span>Maduración</span>
                  <span>{progresoPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.estado === 'listo_cosecha' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
              </div>

              {p.notas && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                  {p.notas}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
