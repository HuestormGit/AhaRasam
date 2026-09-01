import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authRequest, customerRequest, AUTH_TOKEN_KEY } from "../utils/Api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  const saveSession = useCallback((data) => {
    localStorage.setItem(AUTH_TOKEN_KEY, data.jwt);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authRequest("post", "/api/auth/local", {
        identifier: email.trim(),
        password,
      });
      return saveSession(data);
    },
    [saveSession]
  );

  const register = useCallback(
    async (email, password) => {
      const { data } = await authRequest("post", "/api/auth/local/register", {
        email: email.trim(),
        password,
      });
      return saveSession(data);
    },
    [saveSession]
  );

  const forgotPassword = useCallback(
    (email) =>
      authRequest("post", "/api/auth/forgot-password", { email: email.trim() }),
    []
  );

  const resetPassword = useCallback(
    (code, password, passwordConfirmation) =>
      authRequest("post", "/api/auth/reset-password", {
        code,
        password,
        passwordConfirmation,
      }),
    []
  );

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return undefined;
    }

    customerRequest("get", "/api/users/me", token)
      .then(({ data }) => active && setUser(data))
      .catch((error) => {
        if (active && [401, 403].includes(error.response?.status)) clearSession();
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout: clearSession,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      loading,
      login,
      register,
      clearSession,
      forgotPassword,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-route-loading" role="status">
        Loading…
      </main>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
};
