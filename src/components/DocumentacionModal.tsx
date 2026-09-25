'use client';

import React, { useState } from 'react';
import { BookOpen, Sprout, Sparkles, Clock, X, Scale } from 'lucide-react';

interface DocumentacionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentacionModal({ isOpen, onClose }: DocumentacionModalProps) {
  const [seccion, setSeccion] = useState<'cilantro' | 'musaceas' | 'abonos'>('cilantro');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">Guía Agronómica & Huerto</h3>
              <p className="text-[11px] text-slate-500">Manejo de Cultivos a 2.200 msnm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Pestañas de sección */}
        <div className="grid grid-cols-3 gap-1.5 my-3 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setSeccion('cilantro')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              seccion === 'cilantro' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Cilantro (8 kg)
          </button>
          <button
            onClick={() => setSeccion('musaceas')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              seccion === 'musaceas' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Plátano & Banano
          </button>
          <button
            onClick={() => setSeccion('abonos')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              seccion === 'abonos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Abonos $0
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs text-slate-700">
          {seccion === 'cilantro' && (
            <div className="space-y-3">
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60">
                <h4 className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <ScissorsIcon className="w-4 h-4 text-emerald-600" /> Cosecha Inmediata (Tus 8 kg)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  El cilantro en clima frío tiene un aroma y grosor excepcional. Los 8 kilos que están listos deben cortarse temprano en la mañana o al atardecer para evitar deshidratación.<br />
                  • <strong>Venta:</strong> Ofrecer en legumbrerías, restaurantes y tiendas de barrio a \$5.000 - \$7.000 COP/kg.<br />
                  • <strong>Rotación:</strong> Una vez cortada la era, airear la tierra, aplicar gallinaza madura y resembrar de inmediato para tener cosecha continua cada 40 días.
                </p>
              </div>
            </div>
          )}

          {seccion === 'musaceas' && (
            <div className="space-y-3">
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60">
                <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> Ciclo a 2.200 msnm (Tus 20 colinos)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  En clima templado-cálido el plátano demora 10-11 meses; a <strong>2.200 msnm</strong> el metabolismo se ralentiza y el ciclo toma de <strong>14 a 18 meses</strong>.<br />
                  • Realizar plateo manual limpio alrededor de cada colino.<br />
                  • Deshijar dejando el colino madre y un seguidor.<br />
                  • Abonar en corona a 40 cm del pseudotallo con compost/gallinaza.
                </p>
              </div>
            </div>
          )}

          {seccion === 'abonos' && (
            <div className="space-y-3">
              <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/60">
                <h4 className="font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" /> Sinergia Gallinaza + Frass BSF (Costo $0)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  • <strong>Gallinaza madurada:</strong> Aporta nitrógeno y fósforo clave para hortalizas y crecimiento foliar.<br />
                  • <strong>Frass de mosca soldado:</strong> Contiene quitina que activa las defensas biológicas de las plantas contra hongos de la raíz.<br />
                  Al no comprar fertilizantes sintéticos, el margen de utilidad en tus ventas supera el <strong>70%</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-2xl text-xs"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

function ScissorsIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" strokeWidth="2" />
      <circle cx="6" cy="18" r="3" strokeWidth="2" />
      <path strokeWidth="2" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>
  );
}
