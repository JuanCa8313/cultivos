'use client';

import React from 'react';
import { Zap, LayoutDashboard, Sprout, ShoppingCart } from 'lucide-react';

export type CultivoTabType = 'botonera' | 'tablero' | 'siembras';

interface BottomNavCultivosProps {
  currentTab: CultivoTabType;
  onTabChange: (tab: CultivoTabType) => void;
}

export function BottomNavCultivos({ currentTab, onTabChange }: BottomNavCultivosProps) {
  const tabs = [
    { id: 'botonera', label: 'Botonera', icon: Zap },
    { id: 'tablero', label: 'Finanzas', icon: LayoutDashboard },
    { id: 'siembras', label: 'Parcelas', icon: Sprout },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as CultivoTabType)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 bg-emerald-50 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
