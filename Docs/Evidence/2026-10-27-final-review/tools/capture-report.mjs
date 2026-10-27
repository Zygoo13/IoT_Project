import fs from 'node:fs';
import net from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
const root='Docs/Evidence/2026-10-27-final-review/data';
const stopFile='tmp/runtime-review/final-review-capture.stop';
if(fs.existsSync(stopFile))fs.unlinkSync(stopFile);
function env(path){return Object.fromEntries(fs.readFileSync(path,'utf8').split(/\r?\n/).filter(l=>l.indexOf('=')>0&&!l.trimStart().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));}
const settings={...env('Backend/.env'),...env('Backend/.env.bth4')};
const base='http://localhost:8088';
const auth=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:settings.IOT_SEED_USERNAME,password:settings.IOT_SEED_PASSWORD})});
if(!auth.ok)throw new Error('Local evidence login failed');
const {token}=await auth.json();
const events=[],errors=[]; const start=performance.now(); const startedAt=new Date().toISOString();
const stamp=()=>({receivedAt:new Date().toISOString(),observerMs:Math.round((performance.now()-start)*1000)/1000});
const save=(name,value)=>fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(value,null,2));
const get=async path=>{const response=await fetch(base+'/api'+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('GET '+path+' '+response.status);return response.json();};
save('dashboard-before',await get('/dashboard'));
save('sensor-data-before',await get('/sensor-data?size=20&sortBy=TIME&order=DESC'));
const historyBefore=await get('/action-history?size=20&sortBy=ID&order=DESC');save('history-before',historyBefore);
const baselineId=Math.max(0,...historyBefore.content.map(row=>row.id));
const observedRequests=new Set();
async function captureConfirmation(id){
  if(id<=baselineId||observedRequests.has(id))return;
  observedRequests.add(id);
  for(let attempt=0;attempt<4;attempt++){
    await delay(250+attempt*400);
    try{
      const page=await get('/action-history?searchField=ID&search='+id+'&size=1');
      const row=page.content.find(row=>row.id===id);
      save('command-request-'+id,{capturedAt:new Date().toISOString(),history:row??null,dashboard:await get('/dashboard')});
      if(row?.confirmedAt)return;
    }catch{errors.push('Could not fetch confirmation '+id);}
  }
}
const utf=value=>{const bytes=Buffer.from(String(value));const size=Buffer.alloc(2);size.writeUInt16BE(bytes.length);return Buffer.concat([size,bytes]);};
const packet=(type,body=Buffer.alloc(0))=>{let n=body.length;const size=[];do{let b=n%128;n=Math.floor(n/128);if(n)b|=128;size.push(b);}while(n);return Buffer.concat([Buffer.from([type,...size]),body]);};
let mqttConnected=false,stompConnected=false,mqttBuffer=Buffer.alloc(0),mqttMessages=0,stompMessages=0;
const mqtt=net.connect(1325,'127.0.0.1',()=>{
  let flags=2;const payload=[utf('report-'+Date.now())];
  if(settings.IOT_MQTT_USER){flags|=192;payload.push(utf(settings.IOT_MQTT_USER),utf(settings.IOT_MQTT_PASSWORD));}
  mqtt.write(packet(0x10,Buffer.concat([utf('MQTT'),Buffer.from([4,flags,0,30]),...payload])));
});
mqtt.on('error',()=>errors.push('MQTT observer connection error'));
mqtt.on('data',chunk=>{
  mqttBuffer=Buffer.concat([mqttBuffer,chunk]);
  while(mqttBuffer.length>=2){
    let size=0,multiplier=1,offset=1,byte;
    do{if(offset>=mqttBuffer.length)return;byte=mqttBuffer[offset++];size+=(byte&127)*multiplier;multiplier*=128;}while(byte&128);
    if(mqttBuffer.length<offset+size)return;
    const type=mqttBuffer[0],body=mqttBuffer.subarray(offset,offset+size);mqttBuffer=mqttBuffer.subarray(offset+size);
    if((type>>4)===2){
      if(body[1]!==0){errors.push('MQTT authentication not accepted');return;}
      mqttConnected=true;
      const subscriptions=['iot/sensor/data','iot/device/command','iot/device/status'].flatMap(topic=>[utf(topic),Buffer.from([0])]);
      mqtt.write(packet(0x82,Buffer.concat([Buffer.from([0,1]),...subscriptions])));
      console.log('MQTT observer connected; no publish');
    }
    if((type>>4)===3){
      const topicLength=body.readUInt16BE(0),topic=body.subarray(2,2+topicLength).toString();
      const payloadOffset=2+topicLength+(((type>>1)&3)?2:0);
      try{const payload=JSON.parse(body.subarray(payloadOffset).toString());mqttMessages++;events.push({channel:'MQTT',topic,...stamp(),payload,retained:Boolean(type&1)});if(topic==='iot/device/status')void captureConfirmation(payload.requestId);}catch{errors.push('Non-JSON MQTT payload');}
    }
  }
});
const ping=setInterval(()=>{if(mqttConnected&&!mqtt.destroyed)mqtt.write(packet(0xc0));},10000);
const ws=new WebSocket('ws://localhost:8088/ws',{headers:{Origin:base}});
const frame=(command,headers)=>command+'\n'+Object.entries(headers).map(([k,v])=>k+':'+v).join('\n')+'\n\n\0';
let buffer='';
ws.addEventListener('open',()=>ws.send(frame('CONNECT',{'accept-version':'1.2',host:'localhost',Authorization:'Bearer '+token,'heart-beat':'0,0'})));
ws.addEventListener('error',()=>errors.push('STOMP observer connection error'));
ws.addEventListener('message',message=>{
  buffer+=String(message.data);let end;
  while((end=buffer.indexOf('\0'))>=0){
    const raw=buffer.slice(0,end).replace(/^\n+/,'');buffer=buffer.slice(end+1);
    if(raw.startsWith('CONNECTED')){stompConnected=true;for(const topic of ['sensors','devices','hardware','notifications'])ws.send(frame('SUBSCRIBE',{id:'report-'+topic,destination:'/topic/'+topic,ack:'auto'}));console.log('STOMP observer connected');}
    if(raw.startsWith('MESSAGE')){
      const separator=raw.indexOf('\n\n'),headers=raw.slice(0,separator).split('\n');const topic=headers.find(line=>line.startsWith('destination:'))?.slice(12);
      try{const payload=JSON.parse(raw.slice(separator+2));stompMessages++;events.push({channel:'STOMP',topic,...stamp(),payload});if(topic==='/topic/devices')void captureConfirmation(payload.requestId);}catch{errors.push('Invalid STOMP JSON');}
    }
  }
});
save('capture-start',{startedAt,baselineHistoryId:baselineId,topics:['iot/sensor/data','iot/device/command','iot/device/status'],credentialValuesSaved:false});
const autosave=setInterval(()=>{save('mqtt-stomp-events',events);save('capture-progress',{startedAt,at:new Date().toISOString(),mqttConnected,stompConnected,mqttMessages,stompMessages,errors});},2000);
try{
  console.log('Report observation running. Credentials remain in memory only.');
  for(let second=0;second<1800&&!fs.existsSync(stopFile);second++)await delay(1000);
  save('dashboard-after',await get('/dashboard'));
  save('sensor-data-after',await get('/sensor-data?size=20&sortBy=TIME&order=DESC'));
  save('history-after',await get('/action-history?size=20&sortBy=ID&order=DESC'));
  const during=(await get('/action-history?size=20&sortBy=ID&order=DESC')).content.filter(row=>row.id>baselineId);save('commands-this-session',during);
  const sensors={};
  for(const code of ['DHT11_TEMP','DHT11_HUM','LDR_LIGHT']){
    const mqttEvents=events.filter(e=>e.channel==='MQTT'&&e.topic==='iot/sensor/data'&&e.payload.sensorCode===code);
    const stompEvents=events.filter(e=>e.channel==='STOMP'&&e.topic==='/topic/sensors'&&e.payload.sensorCode===code);
    const gaps=mqttEvents.slice(1).map((e,i)=>e.observerMs-mqttEvents[i].observerMs);
    const last=stompEvents.at(-1);const row=last?(await get('/sensor-data?searchField=ID&search='+last.payload.id+'&size=1')).content[0]:null;
    sensors[code]={mqttReadings:mqttEvents.length,stompEvents:stompEvents.length,minMqttGapMs:gaps.length?Math.min(...gaps):null,maxMqttGapMs:gaps.length?Math.max(...gaps):null,lastEvent:last?.payload??null,lastEventMatchesRest:!!row&&row.id===last.payload.id&&row.recordedAt===last.payload.recordedAt&&Number(row.value)===Number(last.payload.value)};
  }
  save('capture-summary',{startedAt,endedAt:new Date().toISOString(),mqttConnected,stompConnected,mqttMessages,stompMessages,sensors,commandRequestIds:during.map(row=>row.id),errors,note:'MQTT data observed from broker; hardware source/physical LED illumination require user photo/Serial confirmation. No simulated MQTT messages sent.'});
  console.log('Saved report evidence:',JSON.stringify({mqttMessages,stompMessages,commandRequestIds:during.map(row=>row.id),sensorCodes:Object.keys(sensors),errors}));
}finally{clearInterval(ping);clearInterval(autosave);save('mqtt-stomp-events',events);ws.close();mqtt.end(packet(0xe0));}
