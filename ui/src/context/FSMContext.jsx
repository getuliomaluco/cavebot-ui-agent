import React, { createContext, useContext, useEffect, useState } from "react";
import { useTimeline } from "./TimelineContext.jsx";

const FSMContext = createContext(null);

export function FSMProvider({ children }) {
  const [state, setState] = useState("IDLE");
  const { log } = useTimeline();

  useEffect(() => {
    const id = setInterval(() => {
      log({ kind: "FSM_TICK", state });
    }, 2000);
    return () => clearInterval(id);
  }, [state]);

  return (
    <FSMContext.Provider value={{ state, setState }}>
      {children}
    </FSMContext.Provider>
  );
}

export function useFSM() {
  const ctx = useContext(FSMContext);
  if (!ctx) throw new Error("useFSM outside provider");
  return ctx;
}
