import { createContext, useContext, useState, useCallback } from 'react';

interface RefreshCtx { key: number; refresh: () => void }

export const RefreshContext = createContext<RefreshCtx>({ key: 0, refresh: () => {} });

export function useRefresh() {
  return useContext(RefreshContext);
}

export function useRefreshState(): RefreshCtx {
  const [key, setKey] = useState(0);
  const refresh = useCallback(() => setKey(k => k + 1), []);
  return { key, refresh };
}
