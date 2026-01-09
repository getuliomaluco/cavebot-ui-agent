import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const PORT = 8123;
const PROTOCOL_VERSION = "1.0";

const wss = new WebSocketServer({ port: PORT });

/**
 * Minimal state for simulating a "run".
 */
const state = {
  connectedClients: 0,
  fsmGlobal: "STOPPED", // STOPPED | RUNNING | PAUSED
  routeState: "IDLE",   // IDLE | EXECUTING_WAYPOINT
  routeId: null,
  waypointIndex: 0,
  retry: 0,
  lastError: null,
  // perception
  drunk: false,
  hungry: false,
  poisoned: false,
  monsters: 0,
  players: 0,
  stamina: 100
};

function nowMs() {
  return Date.now();
}

function envelope(type, name, payload, id = `srv-${randomUUID()}`) {
  return {
    v: PROTOCOL_VERSION,
    id,
    type,
    name,
    payload,
    ts: nowMs()
  };
}

function safeSend(ws, msgObj) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msgObj));
  }
}

function broadcast(msgObj) {
  const msg = JSON.stringify(msgObj);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}

function timeline(category, level, title, summary, context = {}) {
  broadcast(envelope("STREAM", "TIMELINE_EVENT", {
    category,
    level,
    title,
    summary,
    context
  }));
}

function emitFSM() {
  broadcast(envelope("EVENT", "FSM_STATE_CHANGED", {
    global: state.fsmGlobal,
    route: state.routeState
  }));
}

function emitSnapshot() {
  broadcast(envelope("STREAM", "PERCEPTION_SNAPSHOT", {
    timestamp: nowMs(),
    status: {
      drunk: state.drunk,
      hungry: state.hungry,
      poisoned: state.poisoned
    },
    battlelist: {
      monsters: state.monsters,
      players: state.players
    },
    stamina: { percent: Math.max(0, Math.min(100, state.stamina)) },
    console: { contains: state.lastError ? ["error"] : [] }
  }));
}

function raiseError(code, severity, context = {}) {
  state.lastError = code;
  broadcast(envelope("EVENT", "ERROR_RAISED", {
    code,
    severity,
    context
  }));
  timeline("ERROR", severity === "FATAL" ? "ERROR" : "WARN", `Error ${code}`, "An error was raised", context);
}

function applyRecovery(errorCode, strategy, attempt) {
  broadcast(envelope("EVENT", "RECOVERY_APPLIED", {
    error_code: errorCode,
    strategy,
    attempt
  }));
  timeline("RECOVERY", "INFO", "Recovery applied", `${strategy} (${attempt})`, { error_code: errorCode, strategy, attempt });
}

function startRoute(routeId) {
  state.routeId = routeId;
  state.fsmGlobal = "RUNNING";
  state.routeState = "EXECUTING_WAYPOINT";
  state.waypointIndex = 1;
  state.retry = 0;
  state.lastError = null;

  emitFSM();
  broadcast(envelope("EVENT", "ROUTE_STARTED", { route_id: routeId }));
  timeline("ROUTE", "INFO", "Route started", routeId, { route_id: routeId });

  broadcast(envelope("EVENT", "WAYPOINT_STARTED", {
    route_id: routeId,
    index: state.waypointIndex,
    type: "walk"
  }));
  timeline("ROUTE", "INFO", "Waypoint started", "walk", { index: state.waypointIndex, type: "walk" });
}

function pause() {
  if (state.fsmGlobal === "RUNNING") {
    state.fsmGlobal = "PAUSED";
    emitFSM();
    timeline("SYSTEM", "INFO", "Paused", "Execution paused");
  }
}

function stop() {
  state.fsmGlobal = "STOPPED";
  state.routeState = "IDLE";
  state.routeId = null;
  state.waypointIndex = 0;
  state.retry = 0;
  state.lastError = null;
  emitFSM();
  timeline("SYSTEM", "INFO", "Stopped", "Execution stopped");
}

function stepOnce() {
  // Step means: if stopped/paused, do one waypoint tick
  timeline("SYSTEM", "INFO", "Step", "Executing one step");
  advanceWaypoint();
}

function advanceWaypoint() {
  if (!state.routeId) return;

  // Simulate “work”: change perception a bit
  state.stamina -= 0.3;
  state.monsters = Math.max(0, Math.min(6, Math.round(3 + Math.sin(state.waypointIndex / 2))));
  state.players = (state.waypointIndex % 17 === 0) ? 1 : 0;
  state.drunk = (state.waypointIndex % 13 === 0);
  state.hungry = state.stamina < 40;
  state.poisoned = (state.waypointIndex % 19 === 0);

  // Simulate an error sometimes
  if (state.waypointIndex % 9 === 0 && state.retry === 0) {
    raiseError("RT-WP-006", "ERROR", { route: state.routeId, waypoint: "hur_down", index: state.waypointIndex });
    state.retry = 1;
    applyRecovery("RT-WP-006", "retry_waypoint", state.retry);
    return;
  }

  // After a recovery attempt, “succeed”
  if (state.retry > 0) {
    timeline("ROUTE", "INFO", "Waypoint completed", "Recovered and completed", { index: state.waypointIndex });
    state.retry = 0;
    state.lastError = null;
  } else {
    timeline("ROUTE", "INFO", "Waypoint completed", "Normal completion", { index: state.waypointIndex });
  }

  state.waypointIndex += 1;

  // End route after some steps
  if (state.waypointIndex > 30) {
    timeline("ROUTE", "INFO", "Route completed", state.routeId, { route_id: state.routeId });
    stop();
    return;
  }

  broadcast(envelope("EVENT", "WAYPOINT_STARTED", {
    route_id: state.routeId,
    index: state.waypointIndex,
    type: (state.waypointIndex % 5 === 0) ? "hur_down" : "walk"
  }));
  timeline("ROUTE", "INFO", "Waypoint started", (state.waypointIndex % 5 === 0) ? "hur_down" : "walk", { index: state.waypointIndex });
}

wss.on("connection", (ws) => {
  state.connectedClients += 1;
  console.log(`[mock-agent] client connected (${state.connectedClients})`);

  // greet by sending current fsm state
  safeSend(ws, envelope("EVENT", "FSM_STATE_CHANGED", {
    global: state.fsmGlobal,
    route: state.routeState
  }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      safeSend(ws, envelope("ERROR", "INVALID_JSON", { message: "Could not parse JSON" }));
      return;
    }

    if (!msg?.type || !msg?.name) {
      safeSend(ws, envelope("ERROR", "INVALID_MESSAGE", { message: "Missing type/name" }, msg?.id));
      return;
    }

    const cmd = msg.name;

    if (cmd === "HELLO") {
      safeSend(ws, envelope("ACK", "HELLO_OK", {
        agent_version: "mock-0.1.0",
        capabilities: ["PERCEPTION", "TIMELINE", "ROUTES", "RECOVERY"]
      }, msg.id));
      timeline("SYSTEM", "INFO", "Handshake", "UI connected", { ui_version: msg.payload?.ui_version });
      return;
    }

    // Accept configs but do nothing with them yet (just ACK)
    if (cmd.startsWith("SET_")) {
      safeSend(ws, envelope("ACK", "OK", { for: cmd }, msg.id));
      timeline("SYSTEM", "INFO", "Config updated", cmd);
      return;
    }

    if (cmd === "START_ROUTE") {
      const routeId = msg.payload?.route_id ?? "demo_route";
      startRoute(routeId);
      safeSend(ws, envelope("ACK", "OK", { for: cmd }, msg.id));
      return;
    }

    if (cmd === "PAUSE") {
      pause();
      safeSend(ws, envelope("ACK", "OK", { for: cmd }, msg.id));
      return;
    }

    if (cmd === "STOP") {
      stop();
      safeSend(ws, envelope("ACK", "OK", { for: cmd }, msg.id));
      return;
    }

    if (cmd === "STEP") {
      stepOnce();
      safeSend(ws, envelope("ACK", "OK", { for: cmd }, msg.id));
      return;
    }

    safeSend(ws, envelope("ERROR", "UNKNOWN_COMMAND", { command: cmd }, msg.id));
  });

  ws.on("close", () => {
    state.connectedClients -= 1;
    console.log(`[mock-agent] client disconnected (${state.connectedClients})`);
  });
});

// periodic streams
setInterval(() => {
  // only stream snapshots when there is at least one client
  if (wss.clients.size > 0) emitSnapshot();

  // advance automatically when running
  if (state.fsmGlobal === "RUNNING") {
    advanceWaypoint();
  }
}, 500);

console.log(`[mock-agent] listening on ws://localhost:${PORT}`);
