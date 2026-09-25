'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppRoleCultivos = 'administrador' | 'operador_campo';

export interface AuthUserCultivos {
  id: string;
  email: string;
  name: string;
  roles: AppRoleCultivos[];
  fincaNombre?: string;
}

interface AuthContextType {
  user: AuthUserCultivos | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  loginRapido: (rol: AppRoleCultivos) => void;
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
    } else {
      const defaultAdmin: AuthUserCultivos = {
        id: 'usr-admin-cultivos',
        email: 'admin@finca.com',
        name: 'Administrador Agrícola',
        roles: ['administrador'],
        fincaNombre: 'Finca 2.200 msnm',
      };
      setUser(defaultAdmin);
      localStorage.setItem('cultivos_auth_user', JSON.stringify(defaultAdmin));
    }
    setIsLoading(false);
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

  const logout = () => {
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
