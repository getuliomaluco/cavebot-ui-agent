import React, { createContext, useContext, useMemo, useState } from "react";

const WaypointContext = createContext(null);

export function WaypointProvider({ children }) {
  const [waypoints, setWaypoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // FSM minimal state (UI-side only)
  const [activeId, setActiveId] = useState(null);
  const [fsmRunning, setFsmRunning] = useState(false);

  const value = useMemo(
    () => ({
      waypoints,
      setWaypoints,
      selectedId,
      setSelectedId,

      activeId,
      setActiveId,
      fsmRunning,
      setFsmRunning
    }),
    [waypoints, selectedId, activeId, fsmRunning]
  );

  return <WaypointContext.Provider value={value}>{children}</WaypointContext.Provider>;
}

export function useWaypoints() {
  const ctx = useContext(WaypointContext);
  if (!ctx) throw new Error("useWaypoints must be used inside WaypointProvider");
  return ctx;
}
