import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const env = {};
for (const line of readFileSync('Backend/.env','utf8').split(/\r?\n/)) {
  const at=line.indexOf('='); if(at>0) env[line.slice(0,at)]=line.slice(at+1);
}
const base='http://localhost:8088';
function sql(query) {
 const result=spawnSync('docker',['exec','-i','-e',`MYSQL_PWD=${env.MYSQL_PASSWORD}`,'iot_backend_mysql_20261005','mysql',`--user=${env.MYSQL_USER}`,`--database=${env.MYSQL_DATABASE}`,'-N','-B'],{input:query,encoding:'utf8',windowsHide:true});
 if(result.status!==0) throw new Error('MySQL query failed'); return result.stdout.trim();
}
function mqtt(topic,payload) {
 const result=spawnSync('C:\\Program Files\\Mosquitto\\mosquitto_pub.exe',['-h','127.0.0.1','-p','1883','-u',env.IOT_MQTT_USER,'-P',env.IOT_MQTT_PASSWORD,'-t',topic,'-m',JSON.stringify(payload)],{encoding:'utf8',windowsHide:true});
 if(result.status!==0) throw new Error('MQTT publish failed');
}
let token, socket, historyId;
const readingIds=[];
const readings=[{sensorCode:'DHT11_TEMP',value:29.4},{sensorCode:'DHT11_HUM',value:65.2},{sensorCode:'LDR_LIGHT',value:115.8}];
const baseline=sql('SELECT COUNT(*),COALESCE(MAX(id),0) FROM SensorData; SELECT COUNT(*) FROM ActionHistory; SELECT id,status,DATE_FORMAT(updatedAt,"%Y-%m-%d %H:%i:%s.%f") FROM Device WHERE code="LED2";').split('\n');
const sensorMax=Number(baseline[0].split('\t')[1]);
const device=baseline[2].split('\t');
const frames=[];
function send(command,headers={}) { socket.send(command+'\n'+Object.entries(headers).map(([key,value])=>`${key}:${value}`).join('\n')+'\n\n\0'); }
async function waitFrame(predicate) {
 for(let attempt=0;attempt<50;attempt++) {
  const index=frames.findIndex(predicate); if(index>=0) return frames.splice(index,1)[0]; await delay(100);
 }
 throw new Error('Expected STOMP frame not received');
}
async function api(path, options={}) {
 const response=await fetch(base+'/api'+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}});
 return {status:response.status,body:await response.json()};
}
try {
 for(const route of ['/login','/dashboard','/data-sensor','/action-history','/profile']) {
  const response=await fetch(base+route); assert.equal(response.status,200); assert.ok((await response.text()).includes('id="root"'));
 }
 console.log('PASS: static React and SPA deep links (5 routes).');
 assert.equal((await api('/profile')).status,401);
 assert.equal((await api('/auth/login',{method:'POST',body:JSON.stringify({username:'invalid-docker-user',password:'invalid-docker-password'})})).status,401);
 const login=await api('/auth/login',{method:'POST',body:JSON.stringify({username:env.IOT_SEED_USERNAME,password:env.IOT_SEED_PASSWORD})}); assert.equal(login.status,200); token=login.body.token;
 const profile=await api('/profile'); assert.equal(profile.status,200); assert.ok(!('passwordHash' in profile.body));
 console.log('PASS: login 200/401, protected API 401, safe Profile 200 through Nginx.');
 socket=new WebSocket('ws://localhost:8088/ws',{headers:{Origin:base}});
 let buffer='';
 socket.addEventListener('message',event=>{
  buffer+=String(event.data);
  let end;
  while((end=buffer.indexOf('\0'))>=0){
   const raw=buffer.slice(0,end).replace(/^\n+/,'');buffer=buffer.slice(end+1);if(!raw)continue;
   const split=raw.indexOf('\n\n'); const [command,...lines]=raw.slice(0,split).split('\n');
   const headers=Object.fromEntries(lines.map(line=>{const at=line.indexOf(':');return [line.slice(0,at),line.slice(at+1)];}));
   frames.push({command,headers,body:raw.slice(split+2)});
  }
 });
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',()=>reject(new Error('WS proxy connection failed')),{once:true});});
 send('CONNECT',{'accept-version':'1.2',host:'localhost',Authorization:`Bearer ${token}`});
 await waitFrame(frame=>frame.command==='CONNECTED');
 for(const [index,topic] of ['sensors','hardware','devices','notifications'].entries()) send('SUBSCRIBE',{id:String(index),destination:'/topic/'+topic,ack:'auto'});
 await delay(200);
 for(const reading of readings) {
  mqtt('iot/sensor/data',reading);
  const frame=await waitFrame(frame=>frame.command==='MESSAGE'&&frame.headers.destination==='/topic/sensors');
  const event=JSON.parse(frame.body);assert.equal(event.sensorCode,reading.sensorCode);assert.equal(Number(event.value),reading.value);readingIds.push(event.id);
 }
 const dashboard=await api('/dashboard');assert.equal(dashboard.status,200);assert.equal(dashboard.body.hardware.status,'ONLINE');
 for(const reading of readings) assert.equal(Number(dashboard.body.latest[reading.sensorCode].value),reading.value);
 const sensorPage=await api('/sensor-data?sortBy=ID&order=DESC&size=20');assert.equal(sensorPage.status,200);
 for(const id of readingIds) assert.ok(sensorPage.body.content.some(row=>row.id===id));
 assert.equal(Number(sql(`SELECT COUNT(*) FROM SensorData WHERE id>${sensorMax};`)),3);
 console.log('PASS: native STOMP JWT CONNECT and 4 subscriptions; 3 MQTT messages => exactly 3 DB rows, sensor events and REST readings.');
 const action=await api(`/devices/${device[0]}/actions`,{method:'POST',body:JSON.stringify({action:device[1]})});assert.equal(action.status,202);historyId=action.body.requestId;
 mqtt('iot/device/status',{requestId:historyId,deviceCode:'LED2',status:device[1]});
 const event=JSON.parse((await waitFrame(frame=>frame.command==='MESSAGE'&&frame.headers.destination==='/topic/devices')).body);
 assert.equal(event.requestId,historyId);assert.equal(event.status,device[1]);
 const history=await api(`/action-history?searchField=ID&search=${historyId}&size=1`);assert.equal(history.body.content[0].deliveryState,'CONFIRMED');
 console.log('PASS: command HTTP 202 => MQTT status => STOMP device confirmation and REST CONFIRMED.');
} finally {
 socket?.close();
 for(const reading of readings){
  const ids=sql(`SELECT sd.id FROM SensorData sd JOIN Sensor s ON s.id=sd.sensorId WHERE sd.id>${sensorMax} AND s.code='${reading.sensorCode}' AND sd.value=${reading.value};`);
  if(ids) for(const id of ids.split('\n')) if(!readingIds.includes(Number(id)))readingIds.push(Number(id));
 }
 if(readingIds.length) sql(`DELETE FROM SensorData WHERE id IN (${readingIds.join(',')});`);
 if(historyId) sql(`DELETE FROM ActionHistory WHERE id=${historyId} AND deviceId=${device[0]}; UPDATE Device SET status='${device[1]}',updatedAt='${device[2]}' WHERE id=${device[0]};`);
 assert.equal(sql('SELECT COUNT(*) FROM SensorData;'),baseline[0].split('\t')[0]);
 assert.equal(sql('SELECT COUNT(*) FROM ActionHistory;'),baseline[1]);
 console.log('PASS: only identified test rows removed; initial SensorData/ActionHistory counts restored.');
}
