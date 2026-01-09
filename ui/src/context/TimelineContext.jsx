import React, { createContext, useContext, useState } from "react";

const TimelineContext = createContext(null);

export function TimelineProvider({ children }) {
  const [events, setEvents] = useState([]);

  function log(evt) {
    setEvents(e => [
      { id: crypto.randomUUID(), ts: new Date().toISOString(), ...evt },
      ...e
    ]);
  }

  return (
    <TimelineContext.Provider value={{ events, log }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline outside provider");
  return ctx;
}
