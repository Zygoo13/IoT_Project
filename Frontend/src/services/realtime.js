import { getAccessToken } from "./api";

const TOPICS = ["sensors", "hardware", "devices", "notifications"];
const RECONNECT_DELAY = 5000;

const listeners = new Set();

let currentSocket;
let reconnectTimer;
let isActive = false;

// Gửi sự kiện đến các trang đang lắng nghe
function notifyListeners(topic, data) {
  for (const listener of listeners) {
    listener(topic, data);
  }
}

// Tạo STOMP frame
function createStompFrame(command, headers = {}) {
  const headerLines = Object.entries(headers).map(
    ([name, value]) => `${name}:${value}`,
  );

  return `${command}\n${headerLines.join("\n")}\n\n\0`;
}

// Tách dữ liệu từ STOMP frame
function parseStompFrame(rawFrame) {
  const bodyStart = rawFrame.indexOf("\n\n");

  const headerText =
    bodyStart < 0
      ? rawFrame
      : rawFrame.slice(0, bodyStart);

  const [command, ...headerLines] = headerText.split("\n");
  const headers = {};

  for (const line of headerLines) {
    const separator = line.indexOf(":");

    headers[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return {
    command,
    headers,
    body: rawFrame.slice(bodyStart + 2),
  };
}

// Xử lý STOMP frame nhận từ Backend
function handleStompFrame(socket, rawFrame) {
  const { command, headers, body } = parseStompFrame(rawFrame);

  if (command === "CONNECTED") {
    TOPICS.forEach((topic, index) => {
      socket.send(
        createStompFrame("SUBSCRIBE", {
          id: `topic-${index}`,
          destination: `/topic/${topic}`,
          ack: "auto",
        }),
      );
    });

    notifyListeners("connected", null);
    return;
  }

  if (command === "MESSAGE") {
    const topic = headers.destination?.replace("/topic/", "");

    if (!TOPICS.includes(topic)) {
      return;
    }

    try {
      notifyListeners(topic, JSON.parse(body));
    } catch {
      // Bỏ qua dữ liệu JSON không hợp lệ
    }

    return;
  }

  if (command === "ERROR") {
    socket.close();
  }
}

// Kết nối WebSocket và STOMP
function connectWebSocket() {
  const token = getAccessToken();

  if (!isActive || !token) {
    return;
  }

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${protocol}://${location.host}/ws`,
  );

  currentSocket = socket;

  let receivedBuffer = "";

  socket.addEventListener("open", () => {
    socket.send(
      createStompFrame("CONNECT", {
        "accept-version": "1.2",
        host: location.hostname,
        "heart-beat": "0,0",
        Authorization: `Bearer ${token}`,
      }),
    );
  });

  socket.addEventListener("message", (message) => {
    receivedBuffer += String(message.data);

    // Một lần nhận có thể chứa nhiều STOMP frame
    let frameEnd = receivedBuffer.indexOf("\0");

    while (frameEnd !== -1) {
      const rawFrame = receivedBuffer
        .slice(0, frameEnd)
        .replace(/^\n+/, "");

      receivedBuffer = receivedBuffer.slice(frameEnd + 1);

      if (rawFrame) {
        handleStompFrame(socket, rawFrame);
      }

      frameEnd = receivedBuffer.indexOf("\0");
    }
  });

  socket.addEventListener("close", () => {
    if (currentSocket !== socket) {
      return;
    }

    notifyListeners("disconnected", null);

    if (isActive && getAccessToken()) {
      reconnectTimer = setTimeout(
        connectWebSocket,
        RECONNECT_DELAY,
      );
    }
  });

  socket.addEventListener("error", () => {
    socket.close();
  });
}

// Đăng ký nhận sự kiện realtime
export function onRealtime(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function startRealtime() {
  if (isActive) {
    return;
  }

  isActive = true;
  connectWebSocket();
}

// Dừng realtime và hủy reconnect
export function stopRealtime() {
  isActive = false;

  clearTimeout(reconnectTimer);

  currentSocket?.close();
  currentSocket = undefined;
}