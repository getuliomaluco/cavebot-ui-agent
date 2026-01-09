import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const wsRef = useRef(null);
  const [status, setStatus] = useState("disconnected");

  useEffect(() => {
    // 🔴 TROQUE PELO IP REAL DO LINUX
    const ws = new WebSocket("ws://192.168.0.104:8765");
    wsRef.current = ws;

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");

    ws.onmessage = e => {
      console.log("ACK from agent:", e.data);
    };

    return () => ws.close();
  }, []);

  function send(cmd) {
    wsRef.current?.send(JSON.stringify(cmd));
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Agent WebSocket Test</h3>
      <div>Status: {status}</div>

      <button onClick={() => send({ cmd: "key", value: "a" })}>
        Send key "a"
      </button>

      <button onClick={() => send({ cmd: "click" })}>
        Mouse click
      </button>

      <button onClick={() => send({ cmd: "screenshot" })}>
        Screenshot
      </button>
    </div>
  );
}
