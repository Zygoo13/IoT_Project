import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root='Docs/Evidence/2026-10-21/data';
const env=Object.fromEntries(fs.readFileSync('Backend/.env','utf8').split(/\r?\n/).filter(l=>l.indexOf('=')>0&&!l.trimStart().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const base='http://localhost:8088';
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:env.IOT_SEED_USERNAME,password:env.IOT_SEED_PASSWORD})});
if(!login.ok)throw new Error('Evidence login failed');
const {token}=await login.json();
const get=async path=>{const response=await fetch(base+'/api'+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('GET failed '+path);return response.json();};
const save=(name,value)=>fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(value,null,2));
const state=await get('/dashboard');save('dashboard-light-response',state);
for(const [code,type] of [['DHT11_TEMP','TEMPERATURE'],['DHT11_HUM','HUMIDITY'],['LDR_LIGHT','LIGHT']])save('readings-'+code,await get('/sensor-data?sensorType='+type+'&size=20&sortBy=TIME&order=DESC'));
function command(program,args){const result=spawnSync(program,args,{encoding:'utf8',windowsHide:true,timeout:20000});if(result.status!==0)throw new Error('Read-only evidence command failed: '+program);return result.stdout;}
const database='iot_backend_mysql_20261005';
function query(name,sql){
  const script='MYSQL_PWD="$MYSQL_PASSWORD" mysql --user="$MYSQL_USER" "$MYSQL_DATABASE" --batch --raw -e '+"'"+sql.replaceAll("'","'\\''")+"'";
  const output=command('docker',['exec',database,'sh','-c',script]);fs.writeFileSync(root+'/'+name+'.tsv',output);return output;
}
query('db-recent-sensor-data','SELECT sd.id,s.code AS sensorCode,s.type,sd.value,s.unit,sd.recordedAt FROM SensorData sd JOIN Sensor s ON s.id=sd.sensorId ORDER BY sd.id DESC LIMIT 45;');
query('db-recent-action-history','SELECT h.id,d.code AS deviceCode,h.action,h.status,h.createdAt,h.confirmedAt FROM ActionHistory h JOIN Device d ON d.id=h.deviceId ORDER BY h.id DESC LIMIT 20;');
query('db-devices-sensors','SELECT id,code,name,type,status,active FROM Device; SELECT id,code,name,type,unit,active FROM Sensor;');
query('db-table-counts','SELECT \'User\' AS tableName,COUNT(*) AS rowCount FROM `User` UNION ALL SELECT \'Sensor\',COUNT(*) FROM Sensor UNION ALL SELECT \'SensorData\',COUNT(*) FROM SensorData UNION ALL SELECT \'Device\',COUNT(*) FROM Device UNION ALL SELECT \'ActionHistory\',COUNT(*) FROM ActionHistory;');
query('db-columns','SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION;');
query('db-foreign-keys','SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL;');
query('db-version','SELECT VERSION() AS mysqlVersion,UTC_TIMESTAMP(6) AS databaseUtc;');
const runtime=command('docker',['ps','--format','{{json .}}']).trim().split(/\r?\n/).map(line=>JSON.parse(line)).map(({Names,Image,Status,Ports})=>({name:Names,image:Image,status:Status,ports:Ports}));
const packages={};for(const pkg of ['react','react-dom','react-router-dom','vite'])packages[pkg]=JSON.parse(fs.readFileSync('Frontend/node_modules/'+pkg+'/package.json','utf8')).version;
const snapshot={capturedAt:new Date().toISOString(),localTime:new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'full',timeStyle:'long'}).format(new Date()),nodeObserver:process.version,frontend:packages,containers:runtime,backendPom:fs.readFileSync('Backend/pom.xml','utf8').match(/<parent>[\s\S]*?<version>(.*?)<\/version>/)?.[1],ledDemo:state.ledDemo,gitHead:command('git',['-c','safe.directory=D:/Knowledge/University/2026-Y4-S1/HK7/3_IOT/3_Work/IoT_Project','rev-parse','HEAD']).trim(),uncommittedSource:true};save('environment',snapshot);
const publicSpec=await (await fetch(base+'/v3/api-docs')).json();
function withoutExamples(value){if(Array.isArray(value))return value.map(withoutExamples);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!['example','examples'].includes(key)).map(([key,v])=>[key,withoutExamples(v)]));return value;}
save('openapi-no-examples',withoutExamples(publicSpec));
save('api-evidence-index',{capturedAt:new Date().toISOString(),operations:Object.entries(publicSpec.paths).flatMap(([path,item])=>Object.entries(item).filter(([method])=>['get','post','put','delete'].includes(method)).map(([method,operation])=>({method:method.toUpperCase(),path,summary:operation.summary}))),note:'No token, password, username values or User row export. OpenAPI examples removed.'});
console.log('Saved read-only DB, REST, schema, environment and OpenAPI evidence; credential values excluded.');
