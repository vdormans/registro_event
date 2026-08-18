import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import type { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    accessToken: localStorage.getItem('accessToken'),
    loading: true,
  });

  // Al montar, restaura sesión si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('usuario');
    if (token && stored) {
      try {
        const usuario = JSON.parse(stored) as Usuario;
        setState({ usuario, accessToken: token, loading: false });
      } catch {
        localStorage.clear();
        setState({ usuario: null, accessToken: null, loading: false });
      }
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback(async (correo: string, password: string) => {
    const { data } = await authApi.login(correo, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setState({ usuario: data.usuario, accessToken: data.accessToken, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setState({ usuario: null, accessToken: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
