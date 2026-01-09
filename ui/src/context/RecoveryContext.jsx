import React, { createContext, useContext, useState } from "react";

const RecoveryContext = createContext(null);

export function RecoveryProvider({ children }) {
  const [rules, setRules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <RecoveryContext.Provider
      value={{ rules, setRules, selectedId, setSelectedId }}
    >
      {children}
    </RecoveryContext.Provider>
  );
}

export function useRecovery() {
  const ctx = useContext(RecoveryContext);
  if (!ctx) throw new Error("useRecovery outside provider");
  return ctx;
}
