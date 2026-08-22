export const sensors = [
  {
    id: 1,
    code: "DHT11_TEMP",
    name: "DHT11 - Temperature",
    type: "TEMPERATURE",
    field: "temperature",
    unit: "°C",
  },
  {
    id: 2,
    code: "DHT11_HUM",
    name: "DHT11 - Humidity",
    type: "HUMIDITY",
    field: "humidity",
    unit: "%RH",
  },
  {
    id: 3,
    code: "LDR_LIGHT",
    name: "LDR LM393 - Light",
    type: "LIGHT",
    field: "light",
    unit: "lux",
  },
];

export const devices = [
  { id: 1, code: "LED1", name: "LED 1", status: "OFF" },
  { id: 2, code: "LED2", name: "LED 2", status: "OFF" },
];

// Grouped chart points are presentation data only, not a persisted entity.
export const dashboardPoints = [
  { id: 1001, temperature: 27.8, humidity: 69, light: 410, recordedAt: "18:20:00" },
  { id: 1002, temperature: 28.1, humidity: 70, light: 425, recordedAt: "18:20:02" },
  { id: 1003, temperature: 28.3, humidity: 71, light: 430, recordedAt: "18:20:04" },
  { id: 1004, temperature: 28.4, humidity: 70, light: 438, recordedAt: "18:20:06" },
  { id: 1005, temperature: 28.2, humidity: 69, light: 445, recordedAt: "18:20:08" },
  { id: 1006, temperature: 28.5, humidity: 71, light: 452, recordedAt: "18:20:10" },
  { id: 1007, temperature: 28.7, humidity: 72, light: 460, recordedAt: "18:20:12" },
  { id: 1008, temperature: 28.6, humidity: 71, light: 468, recordedAt: "18:20:14" },
  { id: 1009, temperature: 28.8, humidity: 72, light: 475, recordedAt: "18:20:16" },
  { id: 1010, temperature: 28.9, humidity: 73, light: 482, recordedAt: "18:20:18" },
  { id: 1011, temperature: 29.0, humidity: 72, light: 490, recordedAt: "18:20:20" },
  { id: 1012, temperature: 28.8, humidity: 71, light: 498, recordedAt: "18:20:22" },
  { id: 1013, temperature: 28.6, humidity: 70, light: 505, recordedAt: "18:20:24" },
  { id: 1014, temperature: 28.5, humidity: 71, light: 512, recordedAt: "18:20:26" },
  { id: 1015, temperature: 28.7, humidity: 71, light: 520, recordedAt: "18:20:28" },
];

const sensorDataStartTime = new Date("2026-08-16T08:00:00");

export const mockSensorData = Array.from({ length: 150 }, (_, index) => {
  const sensor = sensors[index % sensors.length];
  const cycleIndex = Math.floor(index / sensors.length);
  const recordedAt = new Date(sensorDataStartTime.getTime() + cycleIndex * 2 * 1000);
  const values = {
    TEMPERATURE: Number((25 + ((cycleIndex * 7) % 100) / 10).toFixed(1)),
    HUMIDITY: 50 + ((cycleIndex * 13) % 41),
    LIGHT: 200 + ((cycleIndex * 37) % 601),
  };

  return {
    id: 1001 + index,
    sensorId: sensor.id,
    sensorCode: sensor.code,
    sensorName: sensor.name,
    sensorType: sensor.type,
    value: values[sensor.type],
    unit: sensor.unit,
    recordedAt: recordedAt.toISOString(),
  };
});

const actionHistoryStartTime = new Date("2026-08-16T09:00:00");

export const mockActionHistory = Array.from({ length: 80 }, (_, index) => {
  const createdAt = new Date(actionHistoryStartTime);
  createdAt.setMinutes(createdAt.getMinutes() + index * 3);

  const actionAndStatus = [
    { action: "ON", status: "ON", confirmed: true },
    { action: "OFF", status: "OFF", confirmed: true },
    { action: "ON", status: "OFF", confirmed: false },
    { action: "OFF", status: "ON", confirmed: false },
  ][index % 4];

  return {
    id: index + 1,
    userId: 1,
    deviceId: index % 4 < 2 ? 1 : 2,
    device: index % 4 < 2 ? "LED1" : "LED2",
    action: actionAndStatus.action,
    status: actionAndStatus.status,
    createdAt: createdAt.toISOString(),
    confirmedAt: actionAndStatus.confirmed
      ? new Date(createdAt.getTime() + 1000).toISOString()
      : null,
  };
});

export const mockUser = {
  id: 1,
  username: "admin",
  password: "admin123",
  fullName: "Your Name",
  studentCode: "Your Student Code",
  email: "your-email@example.com",
};

export const profile = {
  fullName: mockUser.fullName,
  studentCode: mockUser.studentCode,
  email: mockUser.email,
  githubUrl: "https://github.com/Zygoo13/IoT_Project",
  figmaUrl: "https://www.figma.com/",
  apiDocsUrl: "",
  reportUrl: "",
  avatarUrl: "",
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};
