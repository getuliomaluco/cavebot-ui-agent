import React, { useState } from "react";
import { useROIs } from "../context/ROIContext.jsx";

export default function ROIOverlay({ width = 800, height = 450 }) {
  const { rois, selectedId, setSelectedId, setRois } = useROIs();
  const [drag, setDrag] = useState(null);

  function startDrag(e, roi, mode) {
    // 🔒 lock blocks only geometry changes
    if (roi.locked && (mode === "move" || mode === "resize")) return;

    e.stopPropagation();

    setDrag({
      id: roi.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      rect: { ...roi.rect }
    });
  }

  function onMouseMove(e) {
    if (!drag) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    setRois(rois =>
      rois.map(r => {
        if (r.id !== drag.id) return r;
        if (r.locked) return r;

        let rect = { ...r.rect };

        if (drag.mode === "move") {
          rect.x = Math.max(0, drag.rect.x + dx);
          rect.y = Math.max(0, drag.rect.y + dy);
        }

        if (drag.mode === "resize") {
          rect.w = Math.max(10, drag.rect.w + dx);
          rect.h = Math.max(10, drag.rect.h + dy);
        }

        return { ...r, rect };
      })
    );
  }

  function onMouseUp() {
    setDrag(null);
  }

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: "relative",
        width,
        height,
        background: "#111",
        border: "1px dashed #666",
        userSelect: "none"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777",
          fontSize: 14,
          pointerEvents: "none"
        }}
      >
        Game Preview (mock)
      </div>

      {rois.map(roi => {
        const selected = roi.id === selectedId;
        const locked = roi.locked;

        return (
          <div
            key={roi.id}
            onMouseDown={e => {
              setSelectedId(roi.id);
              startDrag(e, roi, "move");
            }}
            style={{
              position: "absolute",
              left: roi.rect.x,
              top: roi.rect.y,
              width: roi.rect.w,
              height: roi.rect.h,
              border: locked
                ? "2px dashed #999"
                : selected
                ? "2px solid #3b82f6"
                : "1px solid #22c55e",
              background: locked
                ? "rgba(160,160,160,0.08)"
                : "rgba(34,197,94,0.08)",
              cursor: locked ? "default" : "move",
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -18,
                left: 0,
                color: "white",
                fontSize: 11,
                background: "rgba(0,0,0,0.6)",
                padding: "2px 6px",
                pointerEvents: "none"
              }}
            >
              {roi.name} {locked ? "🔒" : ""}
            </div>

            {/* Resize handle — hidden when locked */}
            {!locked && (
              <div
                onMouseDown={e => startDrag(e, roi, "resize")}
                style={{
                  position: "absolute",
                  right: -6,
                  bottom: -6,
                  width: 12,
                  height: 12,
                  background: selected ? "#3b82f6" : "#22c55e",
                  cursor: "nwse-resize"
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
