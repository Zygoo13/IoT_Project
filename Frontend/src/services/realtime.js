import { getToken } from "./api";

const listeners = new Set();
const topics = ["sensors", "hardware", "devices", "notifications"];
let socket;
let retryTimer;
let active = false;

function emit(topic, data) {
  listeners.forEach((listener) => listener(topic, data));
}

function frame(command, headers = {}) {
  return `${command}\n${Object.entries(headers).map(([key, value]) => `${key}:${value}`).join("\n")}\n\n\0`;
}

function connect() {
  const token = getToken();
  if (!active || !token) return;
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  const ws = new WebSocket(url);
  socket = ws;
  let buffer = "";
  ws.addEventListener("open", () => {
    ws.send(frame("CONNECT", {
      "accept-version": "1.2", host: location.hostname,
      "heart-beat": "0,0", Authorization: `Bearer ${token}`,
    }));
  });
  ws.addEventListener("message", (message) => {
    buffer += String(message.data);
    let end;
    while ((end = buffer.indexOf("\0")) !== -1) {
      const raw = buffer.slice(0, end).replace(/^\n+/, "");
      buffer = buffer.slice(end + 1);
      if (!raw) continue;
      const boundary = raw.indexOf("\n\n");
      const lines = (boundary < 0 ? raw : raw.slice(0, boundary)).split("\n");
      const headers = Object.fromEntries(lines.slice(1).map((line) => {
        const colon = line.indexOf(":");
        return [line.slice(0, colon), line.slice(colon + 1)];
      }));
      if (lines[0] === "CONNECTED") {
        topics.forEach((topic, index) => ws.send(frame("SUBSCRIBE", {
          id: `topic-${index}`, destination: `/topic/${topic}`, ack: "auto",
        })));
        emit("connected", null);
      } else if (lines[0] === "MESSAGE") {
        const topic = headers.destination?.replace("/topic/", "");
        if (!topics.includes(topic)) continue;
        try { emit(topic, JSON.parse(raw.slice(boundary + 2))); } catch { /* Bỏ qua event sai JSON. */ }
      } else if (lines[0] === "ERROR") {
        ws.close();
      }
    }
  });
  ws.addEventListener("close", () => {
    if (socket !== ws) return;
    emit("disconnected", null);
    if (active && getToken()) retryTimer = setTimeout(connect, 5000);
  });
  ws.addEventListener("error", () => ws.close());
}

export function onRealtime(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startRealtime() {
  if (active) return;
  active = true;
  connect();
}

export function stopRealtime() {
  active = false;
  clearTimeout(retryTimer);
  socket?.close();
  socket = undefined;
}
