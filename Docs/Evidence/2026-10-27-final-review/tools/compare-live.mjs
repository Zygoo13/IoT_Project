import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root='Docs/Evidence/2026-10-27-final-review/data';
const events=JSON.parse(fs.readFileSync(root+'/live-session-02/mqtt-stomp-events.json','utf8'));
const sensors=events.filter(e=>e.channel==='STOMP'&&e.topic==='/topic/sensors');
function sql(name,query){
  const r=spawnSync('docker',['exec','-i','iot_backend_mysql_20261005','sh','-c',
    'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --user="$MYSQL_USER" "$MYSQL_DATABASE" --default-character-set=utf8mb4 --batch --raw'],
    {input:query,encoding:'utf8',windowsHide:true,timeout:20000});
  if(r.status!==0)throw new Error('Read-only SQL export failed');
  fs.writeFileSync(root+'/'+name+'.tsv',r.stdout);
  const lines=r.stdout.trimEnd().split(/\r?\n/);const keys=lines.shift().split('\t');
  return lines.filter(Boolean).map(line=>Object.fromEntries(line.split('\t').map((v,i)=>[keys[i],v])));
}
const ids=[...new Set(sensors.map(e=>Number(e.payload.id)))];
const rows=ids.length?sql('db-observed-readings',`SELECT sd.id,s.code AS sensorCode,sd.value,s.unit,sd.recordedAt FROM SensorData sd JOIN Sensor s ON s.id=sd.sensorId WHERE sd.id IN (${ids.join(',')}) ORDER BY sd.id;`):[];
const byId=new Map(rows.map(r=>[Number(r.id),r]));
const normalize=value=>{const [date,fraction='']=value.replace(' ','T').replace(/Z$/,'').split('.');return date+'.'+fraction.padEnd(6,'0')+'Z';};
const mismatches=[];
for(const e of sensors){const row=byId.get(e.payload.id);if(!row||row.sensorCode!==e.payload.sensorCode||Number(row.value)!==Number(e.payload.value)||row.unit!==e.payload.unit||normalize(row.recordedAt)!==normalize(e.payload.recordedAt))mismatches.push({id:e.payload.id});}
const perSensor={};
for(const code of ['DHT11_TEMP','DHT11_HUM','LDR_LIGHT']){
  const mqtt=events.filter(e=>e.channel==='MQTT'&&e.topic==='iot/sensor/data'&&e.payload.sensorCode===code);
  const stomp=sensors.filter(e=>e.payload.sensorCode===code);
  const gaps=mqtt.slice(1).map((e,i)=>e.observerMs-mqtt[i].observerMs);
  const values=mqtt.map(e=>Number(e.payload.value));
  perSensor[code]={mqtt:mqtt.length,stomp:stomp.length,
    valuesEqualInOrder:mqtt.length===stomp.length&&mqtt.every((e,i)=>Number(e.payload.value)===Number(stomp[i].payload.value)),
    minimum:values.length?Math.min(...values):null,maximum:values.length?Math.max(...values):null,
    minimumMqttGapMs:gaps.length?Math.min(...gaps):null,maximumMqttGapMs:gaps.length?Math.max(...gaps):null,
    lastReading:stomp.at(-1)?.payload??null};
}
const history=sql('db-new-history',`SELECT h.id,u.username,d.code AS deviceCode,h.action,h.status,h.createdAt,h.confirmedAt FROM ActionHistory h JOIN Device d ON d.id=h.deviceId JOIN \`User\` u ON u.id=h.userId WHERE h.id > 594 ORDER BY h.id;`);
sql('db-schema-columns','SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION;');
sql('db-table-counts',"SELECT 'User' AS tableName,COUNT(*) AS rowCount FROM `User` UNION ALL SELECT 'Sensor',COUNT(*) FROM Sensor UNION ALL SELECT 'SensorData',COUNT(*) FROM SensorData UNION ALL SELECT 'Device',COUNT(*) FROM Device UNION ALL SELECT 'ActionHistory',COUNT(*) FROM ActionHistory;");
sql('db-device-state','SELECT id,code,status,updatedAt FROM Device ORDER BY id;');
const commandCases=history.map(row=>{
 const id=Number(row.id);
 const command=events.find(e=>e.channel==='MQTT'&&e.topic==='iot/device/command'&&e.payload.requestId===id);
 const status=events.find(e=>e.channel==='MQTT'&&e.topic==='iot/device/status'&&e.payload.requestId===id);
 const confirmation=events.find(e=>e.channel==='STOMP'&&e.topic==='/topic/devices'&&e.payload.requestId===id);
 const timeout=events.find(e=>e.channel==='STOMP'&&e.topic==='/topic/notifications'&&e.payload.requestId===id);
 return {database:row,mqttCommand:command??null,mqttStatus:status??null,stompConfirmation:confirmation??null,stompTimeout:timeout??null,
   sameObserverCommandToStatusMs:command&&status?Math.round((status.observerMs-command.observerMs)*1000)/1000:null,
   source:'Observed request; only assign to agent-planned test when listed in api-review.json or UI action log.'};
});
const summary={capturedThrough:events.at(-1)?.receivedAt??null,sensorEvents:sensors.length,sqlRows:rows.length,mismatches,perSensor,
  hardwareEvents:events.filter(e=>e.channel==='STOMP'&&e.topic==='/topic/hardware'),
  limits:['No sampleId or device measurement timestamp; matching by observed order does not prove a shared sampling cycle.',
          'Physical LED illumination requires user confirmation/photo; GPIO acknowledgment is software evidence.',
          'The observer session preceding this one was interrupted by runtime restart and is stored separately.']};
fs.writeFileSync(root+'/telemetry-comparison.json',JSON.stringify(summary,null,2));
fs.writeFileSync(root+'/command-comparison.json',JSON.stringify(commandCases,null,2));
console.log(JSON.stringify({sensorEvents:sensors.length,sqlRows:rows.length,mismatches:mismatches.length,perSensor:Object.fromEntries(Object.entries(perSensor).map(([code,r])=>[code,{mqtt:r.mqtt,stomp:r.stomp,equal:r.valuesEqualInOrder,min:r.minimum,max:r.maximum}])),observedRequestIds:history.map(r=>Number(r.id)),hardwareTransitions:summary.hardwareEvents.map(e=>({at:e.receivedAt,status:e.payload.status}))}));
