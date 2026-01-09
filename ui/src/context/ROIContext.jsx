import React, { createContext, useContext, useState } from "react";

const ROIContext = createContext(null);

export function ROIProvider({ children }) {
  const [rois, setRois] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <ROIContext.Provider
      value={{
        rois,
        setRois,
        selectedId,
        setSelectedId
      }}
    >
      {children}
    </ROIContext.Provider>
  );
}

export function useROIs() {
  const ctx = useContext(ROIContext);
  if (!ctx) {
    throw new Error("useROIs must be used inside ROIProvider");
  }
  return ctx;
}
