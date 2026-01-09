import React, { useEffect, useMemo } from "react";
import { useWaypoints } from "../context/WaypointContext.jsx";
import WaypointOverlay, { computeReached } from "../ui/WaypointOverlay.jsx";

function nextId(waypoints, currentId) {
  const idx = waypoints.findIndex(w => w.id === currentId);
  if (idx < 0) return waypoints[0]?.id ?? null;
  return waypoints[idx + 1]?.id ?? null;
}

export default function WaypointsPage() {
  const {
    waypoints,
    setWaypoints,
    selectedId,
    setSelectedId,
    activeId,
    setActiveId,
    fsmRunning,
    setFsmRunning
  } = useWaypoints();

  const selected = waypoints.find(w => w.id === selectedId);
  const active = waypoints.find(w => w.id === activeId);

  const enriched = useMemo(() => {
    return waypoints.map(w => {
      const { reached, distance } = computeReached(w);
      return { ...w, reached, distance: Number(distance.toFixed(4)) };
    });
  }, [waypoints]);

  const activeEnriched = enriched.find(w => w.id === activeId);

  function remove() {
    setWaypoints(waypoints.filter(w => w.id !== selectedId));
    if (activeId === selectedId) setActiveId(null);
    setSelectedId(null);
  }

  function start() {
    if (waypoints.length === 0) return;
    // Prefer starting from selected, otherwise from first
    const startId = selectedId || waypoints[0].id;
    setActiveId(startId);
    setFsmRunning(true);
  }

  function stop() {
    setFsmRunning(false);
  }

  function step() {
    if (waypoints.length === 0) return;
    const cur = activeId || selectedId || waypoints[0].id;
    const nxt = nextId(waypoints, cur);
    setActiveId(nxt);
    if (nxt) setSelectedId(nxt);
  }

  // FSM loop: auto-advance when reached
  useEffect(() => {
    if (!fsmRunning) return;
    if (!activeId) return;

    const t = setInterval(() => {
      // recompute using current state snapshot via enriched (memo)
      const cur = enriched.find(w => w.id === activeId);
      if (!cur) return;

      if (cur.reached) {
        const nxt = nextId(waypoints, activeId);
        if (!nxt) {
          setFsmRunning(false);
          return;
        }
        setActiveId(nxt);
        setSelectedId(nxt);
      }
    }, 250);

    return () => clearInterval(t);
  }, [fsmRunning, activeId, enriched, waypoints, setActiveId, setSelectedId, setFsmRunning]);

  return (
    <div
      style={{
        padding: 16,
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: 16
      }}
    >
      {/* LEFT */}
      <div>
        <h3>Waypoints</h3>

        <div style={{ marginBottom: 10 }}>
          <button onClick={start} disabled={waypoints.length === 0 || fsmRunning}>
            Start
          </button>{" "}
          <button onClick={stop} disabled={!fsmRunning}>
            Stop
          </button>{" "}
          <button onClick={step} disabled={waypoints.length === 0}>
            Step
          </button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <b>FSM:</b> {fsmRunning ? "RUNNING" : "STOPPED"} <br />
          <b>Active:</b> {activeId ? activeId.slice(0, 8) : "(none)"}{" "}
          {activeEnriched ? ` | reached=${activeEnriched.reached} dist=${activeEnriched.distance}` : ""}
        </div>

        <ul>
          {enriched.map((w, i) => (
            <li
              key={w.id}
              onClick={() => {
                setSelectedId(w.id);
                // não muda active automaticamente; mas você pode clicar e depois Start
              }}
              style={{
                cursor: "pointer",
                fontWeight: w.id === selectedId ? "bold" : "normal"
              }}
            >
              #{i + 1} {w.type}{" "}
              {w.id === activeId ? "▶" : ""}
              {w.reached ? "✅" : ""}{" "}
              {w.locked ? "🔒" : ""}{" "}
              <span style={{ color: "#666" }}>dist={w.distance}</span>
            </li>
          ))}
        </ul>

        {selected && (
          <div style={{ marginTop: 12 }}>
            <h4>Selected</h4>
            <div>id: {selected.id}</div>
            <div>type: {selected.type}</div>
            <div>roiId: {selected.roiId}</div>
            <div>rx: {selected.rx}</div>
            <div>ry: {selected.ry}</div>

            <label>
              <input
                type="checkbox"
                checked={!!selected.locked}
                onChange={e =>
                  setWaypoints(
                    waypoints.map(w =>
                      w.id === selectedId ? { ...w, locked: e.target.checked } : w
                    )
                  )
                }
              />{" "}
              Locked
            </label>

            <br />
            <button onClick={() => setActiveId(selectedId)} disabled={!selectedId}>
              Set Active = Selected
            </button>{" "}
            <button onClick={remove}>Delete</button>
          </div>
        )}
      </div>

      {/* RIGHT */}
      <WaypointOverlay />
    </div>
  );
}
