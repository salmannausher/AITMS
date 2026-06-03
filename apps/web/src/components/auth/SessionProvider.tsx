'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from '@aitms/shared';

type SessionContextValue = {
  user: SessionUser | null;
};

const SessionContext = createContext<SessionContextValue>({ user: null });

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={{ user }}>{children}</SessionContext.Provider>;
}

/** Hook for Client Components to read the session user. */
export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
