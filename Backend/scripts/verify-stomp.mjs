import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const env = { ...process.env };
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const split = line.indexOf('=');
  if (split > 0) env[line.slice(0, split)] = line.slice(split + 1);
}

const mosquitto = 'C:\\Program Files\\Mosquitto';
const base = 'http://127.0.0.1:8080';
const origin = env.IOT_FRONTEND_ORIGIN || 'http://localhost:5173';
const wsUrl = 'ws://127.0.0.1:8080/ws';
const clients = new Set();
const createdReadings = [];
const createdHistories = [];
let broker;
let baseline;

function expect(ok, message) { if (!ok) throw new Error(message); }
function sql(query) {
  const result = spawnSync('docker', ['exec', '-i', '-e', `MYSQL_PWD=${env.MYSQL_PASSWORD}`,
    'iot_backend_mysql_20261005', 'mysql', `--user=${env.MYSQL_USER}`,
    `--database=${env.MYSQL_DATABASE}`, '-N', '-B'],
  { input: query, encoding: 'utf8', windowsHide: true, timeout: 10000 });
  if (result.status !== 0) throw new Error('MySQL query failed');
  return result.stdout.trim();
}
function mqtt(topic, payload) {
  const result = spawnSync(`${mosquitto}\\mosquitto_pub.exe`,
    ['-h', '127.0.0.1', '-p', '1883', '-u', env.IOT_MQTT_USER,
      '-P', env.IOT_MQTT_PASSWORD, '-q', '0', '-t', topic, '-m', payload],
    { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  if (result.status !== 0) throw new Error('MQTT publish failed');
}
async function startBroker() {
  broker = spawn(`${mosquitto}\\mosquitto.exe`, ['-c', '.mosquitto-test.conf'],
    { cwd: new URL('..', import.meta.url).pathname.slice(1), stdio: 'ignore', windowsHide: true });
  for (let i = 0; i < 20; i++) {
    if (broker.exitCode !== null) throw new Error('Test broker exited early');
    try { mqtt('iot/test/ready', 'ready'); return; } catch { await delay(500); }
  }
  throw new Error('Test broker did not start');
}
async function api(path, token, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const body = await response.json();
  return { status: response.status, body };
}
function frame(command, headers = {}, body = '') {
  return command + '\n' + Object.entries(headers).map(([key, value]) => `${key}:${value}`).join('\n')
    + '\n\n' + body + '\0';
}
class StompClient {
  constructor(socket) {
    this.socket = socket;
    this.frames = [];
    this.waiters = [];
    this.closed = false;
    socket.addEventListener('message', (event) => {
      for (const raw of String(event.data).split('\0')) {
        if (!raw.trim()) continue;
        const clean = raw.replace(/^\n+/, '');
        const boundary = clean.indexOf('\n\n');
        const head = (boundary < 0 ? clean : clean.slice(0, boundary)).split('\n');
        const headers = Object.fromEntries(head.slice(1).map(line => {
          const at = line.indexOf(':'); return [line.slice(0, at), line.slice(at + 1)];
        }));
        const item = { command: head[0], headers, body: boundary < 0 ? '' : clean.slice(boundary + 2) };
        this.frames.push(item);
        this.flush();
      }
    });
    socket.addEventListener('close', () => { this.closed = true; this.flush(); });
  }
  send(command, headers = {}, body = '') { this.socket.send(frame(command, headers, body)); }
  flush() {
    for (const waiter of [...this.waiters]) {
      const index = this.frames.findIndex(waiter.match);
      if (index >= 0) {
        this.waiters.splice(this.waiters.indexOf(waiter), 1);
        waiter.resolve(this.frames.splice(index, 1)[0]);
      } else if (this.closed && waiter.allowClose) {
        this.waiters.splice(this.waiters.indexOf(waiter), 1);
        waiter.resolve({ command: 'CLOSED' });
      }
    }
  }
  wait(match, timeout = 5000, allowClose = false) {
    return new Promise((resolve, reject) => {
      const waiter = { match, allowClose, resolve: value => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(waiter), 1);
        reject(new Error('Timed out waiting for STOMP frame'));
      }, timeout);
      this.waiters.push(waiter);
      this.flush();
    });
  }
  close() { if (this.socket.readyState === WebSocket.OPEN) this.socket.close(); }
}
function openSocket(requestOrigin = origin) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl, { headers: { Origin: requestOrigin } });
    const timer = setTimeout(() => reject(new Error('WebSocket handshake timed out')), 5000);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(socket); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('WebSocket handshake rejected')); }, { once: true });
  });
}
async function connect(token) {
  const client = new StompClient(await openSocket());
  clients.add(client);
  client.send('CONNECT', { 'accept-version': '1.2', host: 'localhost',
    ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }) });
  return client;
}
async function subscribe(client, destination, id) {
  client.send('SUBSCRIBE', { id, destination, ack: 'auto' });
}
async function event(client, destination, timeout = 5000) {
  const found = await client.wait(f => f.command === 'MESSAGE' && f.headers.destination === destination, timeout);
  return JSON.parse(found.body);
}
async function command(token, deviceId, action) {
  const response = await api(`/api/devices/${deviceId}/actions`, token,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
  expect(response.status === 202, `Command returned HTTP ${response.status}`);
  createdHistories.push(response.body.requestId);
  return response.body.requestId;
}
async function waitHistory(token, id, state) {
  for (let i = 0; i < 30; i++) {
    const response = await api(`/api/action-history?searchField=ID&search=${id}`, token);
    const row = response.body.content?.[0];
    if (row?.deliveryState === state) return row;
    await delay(250);
  }
  throw new Error(`History ${id} did not become ${state}`);
}
function utcSqlNow() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }

async function run() {
  const device = sql("SELECT id,status,DATE_FORMAT(updatedAt,'%Y-%m-%d %H:%i:%s.%f') FROM Device WHERE code='LED1';").split('\t');
  const sensor = sql('SELECT COUNT(*),COALESCE(MAX(id),0) FROM SensorData;').split('\t');
  const history = sql('SELECT COUNT(*),COALESCE(MAX(id),0) FROM ActionHistory;').split('\t');
  baseline = { deviceId: Number(device[0]), status: device[1], updatedAt: device[2],
    sensorCount: Number(sensor[0]), sensorMax: Number(sensor[1]),
    historyCount: Number(history[0]), historyMax: Number(history[1]), started: utcSqlNow() };
  expect(baseline.status === 'OFF', 'LED1 must initially be OFF for this isolated test');
  await startBroker();
  await delay(7000);

  let rejected = false;
  try { const bad = await openSocket('http://not-allowed.invalid'); bad.close(); }
  catch { rejected = true; }
  expect(rejected, 'Unapproved WebSocket Origin was accepted');
  for (const badToken of [undefined, 'invalid.jwt.token']) {
    const client = await connect(badToken);
    const result = await client.wait(f => f.command === 'ERROR' || f.command === 'CONNECTED', 5000, true);
    expect(result.command !== 'CONNECTED', 'Missing or invalid JWT connected to STOMP');
    client.close();
  }
  console.log('origin_restricted_missing_and_bad_JWT_rejected');

  const login = await api('/api/auth/login', null,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: env.IOT_SEED_USERNAME, password: env.IOT_SEED_PASSWORD }) });
  expect(login.status === 200, 'Login failed');
  console.log('login_HTTP_200');
  const token = login.body.token;
  const denied = await connect(token);
  console.log('valid_STOMP_CONNECT_sent');
  expect((await denied.wait(f => f.command === 'CONNECTED')).command === 'CONNECTED', 'Valid JWT did not connect');
  denied.send('SUBSCRIBE', { id: 'invalid', destination: '/topic/not-allowed' });
  expect((await denied.wait(f => f.command === 'ERROR' || f.command === 'CLOSED', 5000, true)).command !== 'RECEIPT',
    'Unauthorized subscription was accepted');
  denied.close();

  const client = await connect(token);
  expect((await client.wait(f => f.command === 'CONNECTED')).command === 'CONNECTED', 'Valid JWT did not connect');
  for (const [i, topic] of ['/topic/sensors', '/topic/hardware', '/topic/devices', '/topic/notifications'].entries()) {
    await subscribe(client, topic, `s${i}`);
  }
  await delay(600);
  const sender = await connect(token);
  expect((await sender.wait(f => f.command === 'CONNECTED')).command === 'CONNECTED', 'Sender did not connect');
  sender.send('SEND', { destination: '/topic/sensors', 'content-type': 'application/json' },
    '{"sensorCode":"DHT11_TEMP","value":999}');
  const sendResult = await sender.wait(f => f.command === 'ERROR' || f.command === 'CLOSED', 5000, true);
  expect(sendResult.command === 'ERROR' || sendResult.command === 'CLOSED', 'Client SEND was accepted');
  sender.close();
  expect(Number(sql('SELECT COUNT(*) FROM SensorData;')) === baseline.sensorCount,
    'Client SEND created a sensor reading');
  console.log('valid_JWT_subscribed_four_topics_invalid_subscription_and_SEND_rejected');

  for (const payload of [
    { sensorCode: 'DHT11_TEMP', value: 28.1234 },
    { sensorCode: 'DHT11_HUM', value: 57.2345 },
    { sensorCode: 'LDR_LIGHT', value: 111.3456 }
  ]) mqtt('iot/sensor/data', JSON.stringify(payload));
  const sensors = [];
  for (let i = 0; i < 3; i++) sensors.push(await event(client, '/topic/sensors'));
  for (const row of sensors) createdReadings.push(row.id);
  const online = await event(client, '/topic/hardware');
  expect(online.status === 'ONLINE', 'Hardware did not transition ONLINE');
  expect(new Set(sensors.map(row => row.sensorCode)).size === 3, 'Missing sensor event');
  const restDashboard = await api('/api/dashboard', token);
  const restTable = await api('/api/sensor-data?size=20', token);
  expect(restDashboard.body.hardware.status === 'ONLINE' &&
    restTable.body.totalElements === baseline.sensorCount + 3, 'REST did not read committed telemetry');
  expect(Number(sql('SELECT COUNT(*) FROM SensorData;')) === baseline.sensorCount + 3,
    'Three readings did not create exactly three rows');
  console.log('three_sensor_events_after_DB_commit_REST_matches_hardware_ONLINE');

  const offline = await event(client, '/topic/hardware', 35000);
  expect(offline.status === 'OFFLINE' && offline.lastSeenAt === restDashboard.body.hardware.lastSeenAt,
    'Hardware OFFLINE transition wrong');
  await delay(2200);
  expect(!client.frames.some(f => f.headers.destination === '/topic/hardware'), 'Duplicate OFFLINE event');
  expect(restDashboard.body.devices.find(d => d.code === 'LED1').status === 'OFF', 'LED changed on offline');
  mqtt('iot/sensor/data', JSON.stringify({ sensorCode: 'DHT11_TEMP', value: 28.2345 }));
  const newerSensor = await event(client, '/topic/sensors');
  createdReadings.push(newerSensor.id);
  const backOnline = await event(client, '/topic/hardware');
  expect(backOnline.status === 'ONLINE', 'Hardware did not return ONLINE');
  console.log('OFFLINE_once_after_30s_new_reading_ONLINE_LED_unchanged');

  const one = await command(token, baseline.deviceId, 'ON');
  const pending = await waitHistory(token, one, 'PENDING');
  expect(pending.action === 'ON' && pending.status === 'OFF' && pending.confirmedAt === null,
    'Command pending values wrong');
  mqtt('iot/device/status', JSON.stringify({ requestId: 999999999, deviceCode: 'LED1', status: 'ON' }));
  mqtt('iot/device/status', JSON.stringify({ requestId: one, deviceCode: 'LED2', status: 'ON' }));
  mqtt('iot/device/status', JSON.stringify({ requestId: one, deviceCode: 'LED1', status: 'BROKEN' }));
  await delay(800);
  expect(!client.frames.some(f => f.headers.destination === '/topic/devices'), 'Invalid status emitted device event');
  mqtt('iot/device/status', JSON.stringify({ requestId: one, deviceCode: 'LED1', status: 'ON' }));
  const confirmed = await event(client, '/topic/devices');
  expect(confirmed.requestId === one && confirmed.deviceCode === 'LED1' && confirmed.status === 'ON'
    && confirmed.historyStatus === 'ON' && confirmed.deliveryState === 'CONFIRMED'
    && confirmed.confirmedAt?.endsWith('Z'), 'Device event wrong');
  const saved = await waitHistory(token, one, 'CONFIRMED');
  expect(saved.status === 'ON' && saved.confirmedAt === confirmed.confirmedAt,
    'Device event was not after DB commit');
  mqtt('iot/device/status', JSON.stringify({ requestId: one, deviceCode: 'LED1', status: 'OFF' }));
  await delay(800);
  expect(!client.frames.some(f => f.headers.destination === '/topic/devices'), 'Duplicate status emitted device event');
  console.log('valid_status_device_event_after_commit_invalid_and_duplicate_silent');

  const two = await command(token, baseline.deviceId, 'OFF');
  const notice = await event(client, '/topic/notifications', 14000);
  expect(notice.type === 'DEVICE_TIMEOUT' && notice.requestId === two && notice.deviceCode === 'LED1'
    && notice.occurredAt?.endsWith('Z'), 'Timeout notification wrong');
  const timedOut = await waitHistory(token, two, 'TIMEOUT');
  const beforeLate = await api('/api/dashboard', token);
  expect(timedOut.confirmedAt === null && beforeLate.body.devices.find(d => d.code === 'LED1').status === 'ON',
    'Timeout changed confirmed status');
  await delay(2200);
  expect(!client.frames.some(f => f.headers.destination === '/topic/notifications'), 'Duplicate timeout notification');
  mqtt('iot/device/status', JSON.stringify({ requestId: two, deviceCode: 'LED1', status: 'OFF' }));
  const late = await event(client, '/topic/devices');
  expect(late.requestId === two && late.status === 'OFF' && late.deliveryState === 'CONFIRMED',
    'Late confirmation event wrong');
  expect((await waitHistory(token, two, 'CONFIRMED')).confirmedAt !== null,
    'Late confirmation was not saved');
  console.log('timeout_notification_once_LED_kept_late_status_confirmed');

  client.close();
  await delay(300);
  mqtt('iot/sensor/data', JSON.stringify({ sensorCode: 'DHT11_TEMP', value: 28.3456 }));
  await delay(500);
  const reconnect = await connect(token);
  expect((await reconnect.wait(f => f.command === 'CONNECTED')).command === 'CONNECTED', 'Reconnect failed');
  await subscribe(reconnect, '/topic/sensors', 'after-reconnect');
  const reloadedDashboard = await api('/api/dashboard', token);
  const reloadedTable = await api('/api/sensor-data?size=20', token);
  const reloadedHistory = await api(`/api/action-history?searchField=ID&search=${two}`, token);
  const missed = reloadedTable.body.content.find(row => Number(row.value) === 28.3456);
  expect(reloadedDashboard.body.latest.DHT11_TEMP.value === 28.3456 && missed
    && reloadedHistory.body.content[0].deliveryState === 'CONFIRMED', 'REST reload after reconnect lost state');
  createdReadings.push(missed.id);
  console.log('WebSocket_reconnect_and_REST_reload_recovers_latest_state');
}

try { await run(); }
catch (error) { console.error('FAILED:', error.message); process.exitCode = 1; }
finally {
  for (const client of clients) client.close();
  if (broker && broker.exitCode === null) broker.kill();
  if (baseline) {
    try {
      if (createdHistories.length) {
        const ids = createdHistories.map(Number).join(',');
        sql(`DELETE FROM ActionHistory WHERE id IN (${ids}) AND id > ${baseline.historyMax}
          AND deviceId=${baseline.deviceId} AND createdAt >= '${baseline.started}';`);
      }
      if (createdReadings.length) {
        const ids = createdReadings.map(Number).join(',');
        sql(`DELETE FROM SensorData WHERE id IN (${ids}) AND id > ${baseline.sensorMax}
          AND recordedAt >= '${baseline.started}';`);
      }
      sql(`UPDATE Device SET status='${baseline.status}', updatedAt='${baseline.updatedAt}'
        WHERE id=${baseline.deviceId};`);
      const counts = sql('SELECT (SELECT COUNT(*) FROM SensorData),(SELECT COUNT(*) FROM ActionHistory);').split('\t');
      expect(Number(counts[0]) === baseline.sensorCount && Number(counts[1]) === baseline.historyCount,
        'Fixture cleanup did not restore baseline row counts');
      console.log(`test_rows_removed_sensor=${createdReadings.length}_history=${createdHistories.length}_remaining=${counts.join('/')}`);
    } catch (error) {
      console.error('CLEANUP FAILED:', error.message);
      process.exitCode = 1;
    }
  }
}
