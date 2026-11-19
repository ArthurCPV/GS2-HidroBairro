import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { apiRequest } from '@/services/apiClient';
import { authStorage } from '@/services/authStorage';

export type UserRole = 'CIDADAO' | 'GESTOR';

export type AuthUser = {
  email: string;
  role: UserRole;
};

export type AuthSession =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; token: string; user: AuthUser };

type AuthContextValue = {
  session: AuthSession;
  storageError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type JwtClaims = {
  sub: string;
  role: UserRole;
  exp: number;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeClaims(token: string): JwtClaims {
  const payload = token.split('.')[1];
  if (!payload) {
    throw new Error('A API Java retornou um token inválido.');
  }

  let value: unknown;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    value = JSON.parse(globalThis.atob(padded));
  } catch (error) {
    console.error('Não foi possível interpretar as informações do token.', error);
    throw new Error('Não foi possível validar a sessão recebida da API Java.');
  }

  if (
    !isRecord(value) ||
    typeof value.sub !== 'string' ||
    (value.role !== 'CIDADAO' && value.role !== 'GESTOR') ||
    typeof value.exp !== 'number' ||
    value.exp * 1000 <= Date.now()
  ) {
    throw new Error('O token recebido está incompleto ou expirado.');
  }

  return {
    sub: value.sub,
    role: value.role,
    exp: value.exp,
  };
}

function readLoginToken(value: unknown): string {
  if (!isRecord(value) || typeof value.token !== 'string' || !value.token) {
    throw new Error('A resposta de login da API Java não contém um token.');
  }
  return value.token;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>({ status: 'loading' });
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const token = await authStorage.getToken();
        if (!token) {
          if (isMounted) {
            setSession({ status: 'anonymous' });
          }
          return;
        }

        const claims = decodeClaims(token);
        if (isMounted) {
          setSession({
            status: 'authenticated',
            token,
            user: { email: claims.sub, role: claims.role },
          });
        }
      } catch (error) {
        console.error('Não foi possível restaurar a sessão salva.', error);
        let tokenRemovalFailed = false;
        try {
          await authStorage.removeToken();
        } catch (removeError) {
          tokenRemovalFailed = true;
          console.error('Não foi possível remover o token inválido.', removeError);
        }
        if (isMounted) {
          setStorageError(
            tokenRemovalFailed
              ? 'Não foi possível limpar a sessão salva. Feche e reabra o aplicativo antes de continuar.'
              : 'A sessão salva expirou ou não pôde ser validada. Entre novamente.',
          );
          setSession({ status: 'anonymous' });
        }
      }
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiRequest('java', '/api/auth/login', {
      method: 'POST',
      body: { email: email.trim(), senha: password },
    });
    const token = readLoginToken(response);
    const claims = decodeClaims(token);

    await authStorage.setToken(token);
    setStorageError(null);
    setSession({
      status: 'authenticated',
      token,
      user: { email: claims.sub, role: claims.role },
    });
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      await apiRequest('java', '/api/usuarios', {
        method: 'POST',
        body: {
          nome: name.trim(),
          email: email.trim(),
          senha: password,
          papel: 'CIDADAO',
        },
      });
      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await authStorage.removeToken();
    setStorageError(null);
    setSession({ status: 'anonymous' });
  }, []);

  const value = useMemo(
    () => ({
      session,
      storageError,
      signIn,
      signUp,
      signOut,
    }),
    [session, signIn, signOut, signUp, storageError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
