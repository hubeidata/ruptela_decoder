import React, { useEffect, useRef, useState } from "react";

export default function WebSocketMirror() {
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const evtSource = new EventSource("/events");
    evtSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };
    return () => evtSource.close();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{
      background: "#222",
      color: "#0f0",
      fontFamily: "monospace",
      padding: "1em",
      height: "100vh",
      overflowY: "auto"
    }} ref={logRef}>
      <h2>Datos WebSocket (espejo consola)</h2>
      {logs.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
    </div>
  );
}