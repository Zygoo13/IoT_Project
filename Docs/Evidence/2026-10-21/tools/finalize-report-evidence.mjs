import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root='Docs/Evidence/2026-10-21',data=root+'/data';
const read=name=>JSON.parse(fs.readFileSync(data+'/'+name+'.json','utf8'));
const save=(name,value)=>fs.writeFileSync(data+'/'+name+'.json',JSON.stringify(value,null,2));
const events=read('mqtt-stomp-events'),summary=read('capture-summary');
function query(name,sql){
  const script='MYSQL_PWD="$MYSQL_PASSWORD" mysql --user="$MYSQL_USER" "$MYSQL_DATABASE" --batch --raw -e '+"'"+sql.replaceAll("'","'\\''")+"'";
  const result=spawnSync('docker',['exec','iot_backend_mysql_20261005','sh','-c',script],{encoding:'utf8',windowsHide:true,timeout:20000});
  if(result.status!==0)throw new Error('Read-only SQL export failed');
  fs.writeFileSync(data+'/'+name+'.tsv',result.stdout);
  const [header,...rows]=result.stdout.trim().split(/\r?\n/).map(line=>line.split('\t'));
  return rows.map(row=>Object.fromEntries(header.map((key,index)=>[key,row[index]])));
}
const sensors=events.filter(event=>event.channel==='STOMP'&&event.topic==='/topic/sensors');
const ids=sensors.map(event=>event.payload.id);
const db=query('db-observed-sensor-data','SELECT sd.id,s.code AS sensorCode,sd.value,s.unit,sd.recordedAt FROM SensorData sd JOIN Sensor s ON s.id=sd.sensorId WHERE sd.id BETWEEN '+Math.min(...ids)+' AND '+Math.max(...ids)+' ORDER BY sd.id;');
const normalizeTime=value=>{const match=value.replace(' ','T').match(/^(.*?)(?:\.(\d+))?Z?$/);return match[1].replace(/Z$/,'')+'.'+(match[2]||'').padEnd(6,'0').slice(0,6);};
const mismatches=sensors.filter(event=>{const row=db.find(row=>Number(row.id)===event.payload.id);return !row||row.sensorCode!==event.payload.sensorCode||Number(row.value)!==Number(event.payload.value)||normalizeTime(row.recordedAt)!==normalizeTime(event.payload.recordedAt);});
const perSensor={};
for(const code of ['DHT11_TEMP','DHT11_HUM','LDR_LIGHT']){
  const mqtt=events.filter(e=>e.channel==='MQTT'&&e.topic==='iot/sensor/data'&&e.payload.sensorCode===code);
  const stomp=sensors.filter(e=>e.payload.sensorCode===code);
  const values=mqtt.map(e=>Number(e.payload.value));
  const paired=mqtt.length===stomp.length&&mqtt.every((e,index)=>Number(e.payload.value)===Number(stomp[index].payload.value));
  perSensor[code]={mqtt:mqtt.length,stomp:stomp.length,valuesEqualInObservedOrder:paired,minimum:Math.min(...values),maximum:Math.max(...values),firstEvent:stomp[0]?.payload,lastEvent:stomp.at(-1)?.payload,lastRestMatches:summary.sensors[code].lastEventMatchesRest};
}
save('F23-telemetry-comparison',{startedAt:summary.startedAt,endedAt:summary.endedAt,totalSensorEvents:sensors.length,sqlRows:db.length,allStompEventsMatchDatabase:mismatches.length===0,mismatches,perSensor,note:'MQTT has no sample ID/time; comparison by sensor value order is observational. STOMP ↔ SQL comparison uses exact ID, sensor, value and microsecond timestamp. No hardware measurement cycle inferred.'});
const histories=query('db-report-action-history','SELECT h.id,d.code AS deviceCode,h.action,h.status,h.createdAt,h.confirmedAt FROM ActionHistory h JOIN Device d ON d.id=h.deviceId WHERE h.id BETWEEN 564 AND 572 ORDER BY h.id;');
query('db-final-device-state','SELECT id,code,status,updatedAt FROM Device ORDER BY id;');
const commandCases=[];
for(const id of [564,565,566,567,568,569]){
  const command=events.find(e=>e.channel==='MQTT'&&e.topic==='iot/device/command'&&e.payload.requestId===id);
  const status=events.find(e=>e.channel==='MQTT'&&e.topic==='iot/device/status'&&e.payload.requestId===id);
  const ws=events.find(e=>e.channel==='STOMP'&&e.topic==='/topic/devices'&&e.payload.requestId===id);
  const timeout=events.find(e=>e.channel==='STOMP'&&e.topic==='/topic/notifications'&&e.payload.requestId===id);
  const history=histories.find(row=>Number(row.id)===id);
  commandCases.push({requestId:id,deviceCode:history?.deviceCode,action:history?.action,command:command??null,mqttStatus:status??null,stompConfirmation:ws??null,stompTimeout:timeout??null,database:history??null,commandToMqttStatusObserverMs:command&&status?Math.round((status.observerMs-command.observerMs)*1000)/1000:null,result:id<568?(!!command&&!!status&&!!ws&&status.payload.status===history?.action&&history?.confirmedAt!=='NULL'?'CONFIRMED':'NOT_VERIFIED'):(!!command&&!status&&!ws&&history?.confirmedAt==='NULL'&&!!timeout?'TIMEOUT_VERIFIED':'NOT_VERIFIED')});
}
const extra=histories.filter(row=>![564,565,566,567,568,569].includes(Number(row.id)));
save('F24-command-comparison',{cases:commandCases,additionalObservedRequests:extra,note:'IDs 564–569 are the explicitly conducted Web UI cases. Other new requests were observed but their UI trigger is not attributed; do not count as planned test PASS. GPIO acknowledgment is not independent proof that a physical lamp illuminated.'});
const hardware=events.filter(e=>e.channel==='STOMP'&&e.topic==='/topic/hardware');save('hardware-state-events',hardware);
const firstOffline=hardware.find(e=>e.payload.status==='OFFLINE');
save('offline-test',{reportedUnpluggedByUser:true,lastSensorEvent:sensors.at(-1),firstOfflineEvent:firstOffline??null,finalDashboard:read('dashboard-after'),plannedTimeoutRequests:[568,569],extraObservedRequestIds:extra.map(row=>Number(row.id)),note:'No broker stop, firmware changes or simulated acknowledgments. Physical plug removal time not independently instrumented.'});
const tsv=['test\tresult\tevidence\tlimitation',
  `T01 Three sensors MQTT-STOMP-SQL\t${mismatches.length===0?'PASS':'FAIL'}\tF23-telemetry-comparison.json; db-observed-sensor-data.tsv\t${sensors.length} observations, not a long-term load test`,
  `T02 Physical light change\t${perSensor.LDR_LIGHT.maximum>perSensor.LDR_LIGHT.minimum?'PASS':'NOT_VERIFIED'}\tMQTT/STOMP trace and Dashboard images\tUser changed illumination; lux is uncalibrated estimate`,
  ...commandCases.map(c=>`T${c.requestId} ${c.deviceCode} ${c.action}\t${c.result}\tF24-command-comparison.json; db-report-action-history.tsv\t${c.requestId<568?'Physical LED photo/Serial still required for visual proof':'Device remained last-confirmed OFF; no status acknowledgment'}`),
  `T09 Hardware Offline\t${firstOffline?'PASS':'NOT_VERIFIED'}\thardware-state-events.json; F10f-dashboard-hardware-offline.png\tUser unplugged; exact removal time not measured`,
  'T10 Processing filter with live pending row\tNOT_CAPTURED\tF18a-history-processing.png\tScreenshot shows empty results after timeout; do not use as proof of a pending row',
  'T11 Firmware binary and physical wiring\tUSER_CONFIRMATION_REQUIRED\thardware-photos/\tSource on disk does not prove flashed firmware or physical resistor values',
  'T12 MQTT/Wi-Fi fault and late/duplicate ACK\tNOT_TESTED\tNo simulated packets injected\tDo not cite old BTH3 simulation as real-hardware evidence'];
fs.writeFileSync(data+'/test-results.tsv',tsv.join('\n')+'\n');
console.log(JSON.stringify({sensorEvents:sensors.length,sqlRows:db.length,mismatches:mismatches.length,perSensor:Object.fromEntries(Object.entries(perSensor).map(([code,value])=>[code,{mqtt:value.mqtt,stomp:value.stomp,equal:value.valuesEqualInObservedOrder,min:value.minimum,max:value.maximum}])),commands:commandCases.map(c=>({id:c.requestId,result:c.result,mqttAckMs:c.commandToMqttStatusObserverMs})),extraObservedRequestIds:extra.map(row=>Number(row.id)),offline:!!firstOffline},null,2));
