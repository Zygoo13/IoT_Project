import { getAccessToken } from "./api";

const TOPICS = ["sensors", "hardware", "devices", "notifications"];
const RECONNECT_DELAY = 5000;
const listeners = new Set();
let currentSocket;
let reconnectTimer;
let isActive = false;

function notifyListeners(topic, data) {
  for (const listener of listeners) listener(topic, data);
}

// Tạo frame STOMP để gửi CONNECT và SUBSCRIBE.
function createStompFrame(command, headers = {}) {
  const headerLines = Object.entries(headers).map(([name, value]) => `${name}:${value}`);
  return `${command}\n${headerLines.join("\n")}\n\n\0`;
}

// Tách lệnh, header và nội dung từ frame STOMP nhận được.
function parseStompFrame(rawFrame) {
  const bodyStart = rawFrame.indexOf("\n\n");
  const headerText = bodyStart < 0 ? rawFrame : rawFrame.slice(0, bodyStart);
  const [command, ...headerLines] = headerText.split("\n");
  const headers = {};
  for (const line of headerLines) {
    const separator = line.indexOf(":");
    headers[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return { command, headers, body: rawFrame.slice(bodyStart + 2) };
}

// Đăng ký topic sau CONNECTED và chuyển MESSAGE đến các trang đang nghe.
function handleStompFrame(socket, rawFrame) {
  const { command, headers, body } = parseStompFrame(rawFrame);
  if (command === "CONNECTED") {
    TOPICS.forEach((topic, index) => {
      socket.send(createStompFrame("SUBSCRIBE", {
        id: `topic-${index}`,
        destination: `/topic/${topic}`,
        ack: "auto",
      }));
    });
    notifyListeners("connected", null);
  } else if (command === "MESSAGE") {
    const topic = headers.destination?.replace("/topic/", "");
    if (!TOPICS.includes(topic)) return;
    try {
      notifyListeners(topic, JSON.parse(body));
    } catch {
      // Bỏ qua event sai JSON.
    }
  } else if (command === "ERROR") {
    socket.close();
  }
}

// Mở WebSocket, xác thực bằng JWT và lên lịch nối lại khi bị ngắt.
function connectWebSocket() {
  const token = getAccessToken();
  if (!isActive || !token) return;

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${location.host}/ws`);
  currentSocket = socket;
  let receivedBuffer = "";

  socket.addEventListener("open", () => {
    socket.send(createStompFrame("CONNECT", {
      "accept-version": "1.2",
      host: location.hostname,
      "heart-beat": "0,0",
      Authorization: `Bearer ${token}`,
    }));
  });

  socket.addEventListener("message", (message) => {
    receivedBuffer += String(message.data);
    // Một lần nhận có thể chứa nhiều frame hoặc một phần frame STOMP.
    let frameEnd = receivedBuffer.indexOf("\0");
    while (frameEnd !== -1) {
      const rawFrame = receivedBuffer.slice(0, frameEnd).replace(/^\n+/, "");
      receivedBuffer = receivedBuffer.slice(frameEnd + 1);
      if (rawFrame) handleStompFrame(socket, rawFrame);
      frameEnd = receivedBuffer.indexOf("\0");
    }
  });

  socket.addEventListener("close", () => {
    if (currentSocket !== socket) return;
    notifyListeners("disconnected", null);
    if (isActive && getAccessToken()) {
      reconnectTimer = setTimeout(connectWebSocket, RECONNECT_DELAY);
    }
  });
  socket.addEventListener("error", () => socket.close());
}

// Đăng ký hàm nhận sự kiện; trả về hàm hủy đăng ký khi rời trang.
export function onRealtime(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startRealtime() {
  if (isActive) return;
  isActive = true;
  connectWebSocket();
}

// Đóng kết nối và hủy lịch reconnect khi kết thúc phiên.
export function stopRealtime() {
  isActive = false;
  clearTimeout(reconnectTimer);
  currentSocket?.close();
  currentSocket = undefined;
}
