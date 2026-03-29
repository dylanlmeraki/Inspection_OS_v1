/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { localDb } from "@/lib/localDb";

const DEFAULT_USER_ID = "user_pm_001";

const SessionContext = createContext(null);

export function MockSessionProvider({ children }) {
  const users = localDb.listUsers();
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const currentUser = users.find((user) => user.id === userId) || users[0] || null;

  const value = useMemo(
    () => ({
      users,
      currentUser,
      setCurrentUserId: setUserId,
    }),
    [users, currentUser]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useMockSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useMockSession must be used inside MockSessionProvider");
  }
  return value;
}
