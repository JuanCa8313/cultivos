'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../lib/supabase';

export type AppRoleCultivos = 'administrador' | 'operador_campo';

export interface AuthUserCultivos {
  id: string;
  email: string;
  name: string;
  roles: AppRoleCultivos[];
  fincaNombre?: string;
}

export const AUTHORIZED_EMAILS = [
  'juanca.arcilav@gmail.com',
  'alex@alexzapata.com',
  'admin@finca.com',
  'admin@granja.com',
];

interface AuthContextType {
  user: AuthUserCultivos | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  loginRapido: (rol: AppRoleCultivos) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserCultivos | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('cultivos_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parseando usuario guardado', e);
      }
    }
    setIsLoading(false);

    // Supabase Auth listener
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = AUTHORIZED_EMAILS.includes(email) || email.includes('juanca') || email.includes('alex');
          const newUser: AuthUserCultivos = {
            id: session.user.id,
            email,
            name,
            roles: isOwner ? ['administrador'] : ['operador_campo'],
            fincaNombre: 'Finca 2.200 msnm',
          };
          setUser(newUser);
          localStorage.setItem('cultivos_auth_user', JSON.stringify(newUser));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('cultivos_auth_user');
        } else if (session?.user) {
          const email = (session.user.email || '').toLowerCase().trim();
          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';
          const isOwner = AUTHORIZED_EMAILS.includes(email) || email.includes('juanca') || email.includes('alex');
          const newUser: AuthUserCultivos = {
            id: session.user.id,
            email,
            name,
            roles: isOwner ? ['administrador'] : ['operador_campo'],
            fincaNombre: 'Finca 2.200 msnm',
          };
          setUser(newUser);
          localStorage.setItem('cultivos_auth_user', JSON.stringify(newUser));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loginRapido = (rol: AppRoleCultivos) => {
    const rolesMap: Record<AppRoleCultivos, { name: string; email: string }> = {
      administrador: { name: 'Juan Carlos (Dueño)', email: 'admin@finca.com' },
      operador_campo: { name: 'Operador de Campo / Huerto', email: 'campo@finca.com' },
    };

    const newUser: AuthUserCultivos = {
      id: 'usr-' + rol,
      email: rolesMap[rol].email,
      name: rolesMap[rol].name,
      roles: [rol],
      fincaNombre: 'Finca 2.200 msnm',
    };

    setUser(newUser);
    localStorage.setItem('cultivos_auth_user', JSON.stringify(newUser));
  };

  const loginWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('cultivos_auth_user');
  };

  const isAdmin = !!user?.roles.includes('administrador');
  const isOperador = !!user?.roles.includes('operador_campo');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isOperador,
        loginRapido,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
