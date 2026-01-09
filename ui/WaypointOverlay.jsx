import React, { useMemo } from "react";
import { useROIs } from "../context/ROIContext.jsx";
import { useWaypoints } from "../context/WaypointContext.jsx";

const CENTER = { x: 0.5, y: 0.5 };
const THRESHOLD = 0.03;

function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
  );
}

export default function WaypointOverlay() {
  const { rois } = useROIs();
  const { waypoints, setWaypoints, selectedId, setSelectedId } = useWaypoints();

  const minimap = rois.find(r => r.type === "minimap");

  const enriched = useMemo(() => {
    return waypoints.map(w => {
      const d = distance({ x: w.rx, y: w.ry }, CENTER);
      return {
        ...w,
        reached: d < THRESHOLD,
        distance: Number(d.toFixed(4))
      };
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
        cursor: "crosshair"
      }}
    >
      {/* Centro do minimapa (personagem) */}
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
          .map(w => (
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
                background: w.reached
                  ? "#0f0"
                  : w.id === selectedId
                  ? "#00f"
                  : "#888",
                transform: "translate(-50%, -50%)",
                cursor: "pointer"
              }}
              title={`dist=${w.distance}`}
            />
          ))}

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
