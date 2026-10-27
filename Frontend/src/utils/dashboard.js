const SENSOR_FIELDS = {
  DHT11_TEMP: "temperature",
  DHT11_HUM: "humidity",
  LDR_LIGHT: "light",
};

export function capNhatCamBienRealtime(dashboard, sensorEvent) {
  if (!dashboard || !SENSOR_FIELDS[sensorEvent.sensorCode]) {
    return dashboard;
  }

  const previous = dashboard.latest[sensorEvent.sensorCode];
  const points = dashboard.chart[sensorEvent.sensorCode] || [];
  const duplicate = points.some(point => point.recordedAt === sensorEvent.recordedAt
    && Number(point.value) === Number(sensorEvent.value));
  if (duplicate) return dashboard;
  const nextPoints = [...points, {
    value: sensorEvent.value,
    recordedAt: sensorEvent.recordedAt,
  }].sort((first, second) => new Date(first.recordedAt) - new Date(second.recordedAt)).slice(-15);
  const lastSeenAt = dashboard.hardware?.lastSeenAt;

  return {
    ...dashboard,
    latest: {
      ...dashboard.latest,
      [sensorEvent.sensorCode]: previous && new Date(previous.recordedAt) > new Date(sensorEvent.recordedAt)
        ? previous : { ...sensorEvent, stale: false },
    },
    chart: { ...dashboard.chart, [sensorEvent.sensorCode]: nextPoints },
    hardware: {
      status: "ONLINE",
      lastSeenAt: lastSeenAt && new Date(lastSeenAt) > new Date(sensorEvent.recordedAt)
        ? lastSeenAt : sensorEvent.recordedAt,
    },
  };
}

export function capNhatDashboardRealtime(dashboard, topic, event) {
  if (!dashboard) return dashboard;
  if (topic === "sensors") return capNhatCamBienRealtime(dashboard, event);
  if (topic === "hardware") return { ...dashboard, hardware: event };
  if (topic === "devices") {
    return {
      ...dashboard,
      devices: dashboard.devices.map(device => device.code === event.deviceCode
        ? { ...device, status: event.status } : device),
    };
  }
  return dashboard;
}
