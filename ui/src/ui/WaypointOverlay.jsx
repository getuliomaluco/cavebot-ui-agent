import React, { useMemo } from "react";
import { useROIs } from "../context/ROIContext.jsx";
import { useWaypoints } from "../context/WaypointContext.jsx";

const CENTER = { x: 0.5, y: 0.5 };
const THRESHOLD = 0.03;

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function computeReached(wp) {
  const d = dist({ x: wp.rx, y: wp.ry }, CENTER);
  return { reached: d < THRESHOLD, distance: d };
}

export default function WaypointOverlay() {
  const { rois } = useROIs();
  const {
    waypoints,
    setWaypoints,
    selectedId,
    setSelectedId,
    activeId
  } = useWaypoints();

  const minimap = rois.find(r => r.type === "minimap");

  const enriched = useMemo(() => {
    return waypoints.map(w => {
      const { reached, distance } = computeReached(w);
      return { ...w, reached, distance: Number(distance.toFixed(4)) };
    });
  }, [waypoints]);

  function onClick(e) {
    if (!minimap) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;

    const wp = {
      id: crypto.randomUUID(),
      type: "walk",
      roiId: minimap.id,
      rx: Number(rx.toFixed(4)),
      ry: Number(ry.toFixed(4)),
      params: {},
      locked: false
    };

    setWaypoints([...waypoints, wp]);
    setSelectedId(wp.id);
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: 600,
        height: 400,
        background: "#111",
        border: "2px dashed #555",
        cursor: "crosshair",
        userSelect: "none"
      }}
    >
      {!minimap && (
        <div style={{ color: "#f55", padding: 8 }}>
          No minimap ROI defined (Perception → create ROI type = minimap)
        </div>
      )}

      {/* Player (mock) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#fff",
          transform: "translate(-50%, -50%)"
        }}
        title="Player position (center)"
      />

      {/* Waypoints */}
      {minimap &&
        enriched
          .filter(w => w.roiId === minimap.id)
          .map(w => {
            const isSelected = w.id === selectedId;
            const isActive = w.id === activeId;

            // Color priority: reached > active > selected > pending
            let bg = "#888";
            if (w.reached) bg = "#0f0";
            else if (isActive) bg = "#00f";
            else if (isSelected) bg = "#3b82f6";

            return (
              <div
                key={w.id}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedId(w.id);
                }}
                style={{
                  position: "absolute",
                  left: `${w.rx * 100}%`,
                  top: `${w.ry * 100}%`,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: bg,
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  outline: isActive ? "2px solid rgba(255,255,255,0.7)" : "none"
                }}
                title={`${w.type} dist=${w.distance} ${w.reached ? "(reached)" : ""}`}
              />
            );
          })}

      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          color: "#888",
          fontSize: 12
        }}
      >
        Click to add waypoint
      </div>
    </div>
  );
}
