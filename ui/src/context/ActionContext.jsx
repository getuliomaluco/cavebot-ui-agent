import React, { createContext, useContext, useState } from "react";

const ActionContext = createContext(null);

export function ActionProvider({ children }) {
  const [actions, setActions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <ActionContext.Provider
      value={{ actions, setActions, selectedId, setSelectedId }}
    >
      {children}
    </ActionContext.Provider>
  );
}

export function useActions() {
  const ctx = useContext(ActionContext);
  if (!ctx) throw new Error("useActions outside provider");
  return ctx;
}
