import React from "react";
import { useROIs } from "../context/ROIContext.jsx";
import ROIOverlay from "../ui/ROIOverlay.jsx";

function clamp(v, min = 0) {
  return Math.max(min, Number(v) || 0);
}

export default function PerceptionPage() {
  const { rois, setRois, selectedId, setSelectedId } = useROIs();
  const selected = rois.find(r => r.id === selectedId);

  function updateSelected(patch) {
    setRois(
      rois.map(r =>
        r.id === selectedId ? { ...r, ...patch } : r
      )
    );
  }

  function updateRect(patch) {
    if (!selected || selected.locked) return;
    updateSelected({
      rect: { ...selected.rect, ...patch }
    });
  }

  function addRoi() {
    const id = `roi_${crypto.randomUUID().slice(0, 6)}`;
    const roi = {
      id,
      name: "New ROI",
      type: "custom",
      rect: { x: 50, y: 50, w: 200, h: 120 },
      enabled: true,
      critical: false,
      locked: false
    };
    setRois([...rois, roi]);
    setSelectedId(id);
  }

  function remove() {
    setRois(rois.filter(r => r.id !== selectedId));
    setSelectedId(null);
  }

  return (
    <div
      style={{
        padding: 16,
        display: "grid",
        gridTemplateColumns: "420px 1fr",
        gap: 16
      }}
    >
      {/* LEFT: ROI list + editor */}
      <div>
        <button onClick={addRoi}>Add ROI</button>

        <ul>
          {rois.map(r => (
            <li
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              style={{
                cursor: "pointer",
                fontWeight: r.id === selectedId ? "bold" : "normal"
              }}
            >
              {r.name} {r.locked ? "🔒" : ""}
            </li>
          ))}
        </ul>

        {selected && (
          <div>
            <h3>{selected.name}</h3>

            <div>
              Name{" "}
              <input
                value={selected.name}
                onChange={e =>
                  updateSelected({ name: e.target.value })
                }
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={selected.locked}
                  onChange={e =>
                    updateSelected({ locked: e.target.checked })
                  }
                />{" "}
                Locked (prevent moving / resizing)
              </label>
            </div>

            <div>
              X{" "}
              <input
                type="number"
                disabled={selected.locked}
                value={selected.rect.x}
                onChange={e =>
                  updateRect({ x: clamp(e.target.value) })
                }
              />
            </div>

            <div>
              Y{" "}
              <input
                type="number"
                disabled={selected.locked}
                value={selected.rect.y}
                onChange={e =>
                  updateRect({ y: clamp(e.target.value) })
                }
              />
            </div>

            <div>
              W{" "}
              <input
                type="number"
                disabled={selected.locked}
                value={selected.rect.w}
                onChange={e =>
                  updateRect({ w: clamp(e.target.value, 1) })
                }
              />
            </div>

            <div>
              H{" "}
              <input
                type="number"
                disabled={selected.locked}
                value={selected.rect.h}
                onChange={e =>
                  updateRect({ h: clamp(e.target.value, 1) })
                }
              />
            </div>

            <button onClick={remove}>Delete</button>
          </div>
        )}
      </div>

      {/* RIGHT: Game preview + visual ROI overlay */}
      <div>
        <ROIOverlay />
      </div>
    </div>
  );
}
