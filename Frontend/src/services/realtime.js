import { getAccessToken } from "./api";

const TOPICS = ["sensors", "hardware", "devices", "notifications"];
const RECONNECT_DELAY = 5000;

const danhSachLangNghe = new Set();

let socketHienTai;
let timerKetNoiLai;
let dangHoatDong = false;

function thongBaoNguoiNghe(topic, data) {
  for (const listener of danhSachLangNghe) {
    listener(topic, data);
  }
}

// Tạo STOMP frame
function taoStompFrame(command, headers = {}) {
  const cacHeader = Object.entries(headers).map(
    ([name, value]) => `${name}:${value}`,
  );

  return `${command}\n${cacHeader.join("\n")}\n\n\0`;
}

// Tách dữ liệu từ STOMP frame
function tachStompFrame(rawFrame) {
  const viTriBody = rawFrame.indexOf("\n\n");
  const phanHeader = viTriBody < 0 ? rawFrame : rawFrame.slice(0, viTriBody);

  const [command, ...cacDongHeader] = phanHeader.split("\n");
  const headers = {};

  for (const line of cacDongHeader) {
    const viTriDauHaiCham = line.indexOf(":");
    headers[line.slice(0, viTriDauHaiCham)] = line.slice(viTriDauHaiCham + 1);
  }

  return {
    command,
    headers,
    body: rawFrame.slice(viTriBody + 2),
  };
}

// Xử lý STOMP frame từ Backend
function xuLyStompFrame(socket, rawFrame) {
  const { command, headers, body } = tachStompFrame(rawFrame);

  if (command === "CONNECTED") {
    TOPICS.forEach((topic, index) => {
      socket.send(
        taoStompFrame("SUBSCRIBE", {
          id: `topic-${index}`,
          destination: `/topic/${topic}`,
          ack: "auto",
        }),
      );
    });

    thongBaoNguoiNghe("connected", null);
    return;
  }

  if (command === "MESSAGE") {
    const topic = headers.destination?.replace("/topic/", "");

    if (!TOPICS.includes(topic)) {
      return;
    }

    try {
      thongBaoNguoiNghe(topic, JSON.parse(body));
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
function ketNoiWebSocket() {
  const token = getAccessToken();

  if (!dangHoatDong || !token) {
    return;
  }

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${location.host}/ws`);

  socketHienTai = socket;

  let boDemNhanDuoc = "";

  socket.addEventListener("open", () => {
    socket.send(
      taoStompFrame("CONNECT", {
        "accept-version": "1.2",
        host: location.hostname,
        "heart-beat": "0,0",
        Authorization: `Bearer ${token}`,
      }),
    );
  });

  socket.addEventListener("message", (message) => {
    boDemNhanDuoc += String(message.data);

    // Một lần nhận có thể chứa nhiều STOMP frame
    let viTriKetThuc = boDemNhanDuoc.indexOf("\0");

    while (viTriKetThuc !== -1) {
      const rawFrame = boDemNhanDuoc
        .slice(0, viTriKetThuc)
        .replace(/^\n+/, "");

      boDemNhanDuoc = boDemNhanDuoc.slice(viTriKetThuc + 1);

      if (rawFrame) {
        xuLyStompFrame(socket, rawFrame);
      }

      viTriKetThuc = boDemNhanDuoc.indexOf("\0");
    }
  });

  socket.addEventListener("close", () => {
    if (socketHienTai !== socket) {
      return;
    }

    thongBaoNguoiNghe("disconnected", null);

    if (dangHoatDong && getAccessToken()) {
      timerKetNoiLai = setTimeout(ketNoiWebSocket, RECONNECT_DELAY);
    }
  });

  socket.addEventListener("error", () => {
    socket.close();
  });
}

// Đăng ký nhận sự kiện realtime
export function onRealtime(listener) {
  danhSachLangNghe.add(listener);

  return () => {
    danhSachLangNghe.delete(listener);
  };
}

export function startRealtime() {
  if (dangHoatDong) {
    return;
  }

  dangHoatDong = true;
  ketNoiWebSocket();
}

// Dừng realtime và hủy reconnect
export function stopRealtime() {
  dangHoatDong = false;

  clearTimeout(timerKetNoiLai);

  socketHienTai?.close();
  socketHienTai = undefined;
}