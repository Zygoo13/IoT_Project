from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math, textwrap

OUT=Path(__file__).parent/'figures';OUT.mkdir(exist_ok=True)
FONT='C:/Windows/Fonts/arial.ttf';BOLD='C:/Windows/Fonts/arialbd.ttf'
def font(s=30,b=False):return ImageFont.truetype(BOLD if b else FONT,s)
def canvas(w,h):
 im=Image.new('RGB',(w,h),'white');return im,ImageDraw.Draw(im)
def text(d,xy,s,size=30,b=False,anchor='mm',fill='#111827'):
 d.multiline_text(xy,s,font=font(size,b),fill=fill,anchor=anchor,align='center',spacing=8)
def arrow(d,a,b,color='#374151',dash=False,width=3):
 if dash:
  length=math.dist(a,b)
  for n in range(0,int(length),18):
   k=n/max(length,1);q=min((n+10)/max(length,1),1)
   d.line((a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q),fill=color,width=width)
 else:d.line((a,b),fill=color,width=width)
 angle=math.atan2(b[1]-a[1],b[0]-a[0]);size=14
 d.polygon([b,(b[0]-size*math.cos(angle-.45),b[1]-size*math.sin(angle-.45)),(b[0]-size*math.cos(angle+.45),b[1]-size*math.sin(angle+.45))],fill=color)
def box(d,rect,label,fill='#f3f4f6',size=31):
 d.rounded_rectangle(rect,radius=10,fill=fill,outline='#475569',width=3)
 text(d,((rect[0]+rect[2])/2,(rect[1]+rect[3])/2),label,size,True)
def seq(name,people,steps):
 w=1600;h=140+len(steps)*72;im,d=canvas(w,h)
 xs=[110+i*(1380/(len(people)-1)) for i in range(len(people))]
 for x,p in zip(xs,people):
  box(d,(x-100,14,x+100,88),p,size=27)
  for y in range(90,h-10,20):d.line((x,y,x,y+11),fill='#9ca3af',width=2)
 for i,(a,b,label,*opt) in enumerate(steps):
  y=132+i*72; xa,xb=xs[a],xs[b];dash=bool(opt and opt[0])
  if a==b:
   right=min(w-15,xa+80);d.line((xa,y,right,y,right,y+26,xa,y+26),fill='#374151',width=3);arrow(d,(right,y+26),(xa,y+26));
   text(d,(xa-8,y-19),f'{i+1}  {label}',24,anchor='rm')
  else:
   arrow(d,(xa,y),(xb,y),dash=dash)
   maxchars=max(16,int(abs(xa-xb)/14)); wrapped='\n'.join(textwrap.wrap(f'{i+1}  {label}',width=maxchars))
   label_font=font(26)
   bounds=d.multiline_textbbox((0,0),wrapped,font=label_font,spacing=8,align='center')
   label_w=bounds[2]-bounds[0];label_h=bounds[3]-bounds[1]
   d.multiline_text(((xa+xb)/2-label_w/2-bounds[0],y-10-label_h-bounds[1]),wrapped,font=label_font,fill='#111827',spacing=8,align='center')
 im.save(OUT/(name+'.png'))

seq('login',['User','React','Backend','MySQL'],[(0,1,'Nhập tài khoản'),(1,2,'POST login'),(2,3,'Tìm username'),(3,2,'User và hash',True),(2,2,'Kiểm tra BCrypt'),(2,1,'200 và JWT hoặc 401',True),(1,0,'Mở Dashboard hoặc báo lỗi',True)])
seq('telemetry',['ESP32','Broker','Backend','MySQL','React'],[(4,2,'GET dashboard và CONNECT STOMP'),(2,3,'Đọc snapshot'),(2,4,'latest, chart, devices, hardware',True),(0,1,'Publish reading'),(1,2,'sensorCode và value'),(2,3,'Lưu SensorData'),(3,2,'Commit',True),(2,4,'STOMP sensors sau commit'),(4,4,'Cập nhật card và 15 điểm')])
seq('led',['User','React','Backend','MySQL','Broker','ESP32'],[(0,1,'Bấm ON hoặc OFF'),(1,2,'POST action'),(2,3,'Lưu history + userId'),(3,2,'Commit; lấy requestId',True),(2,4,'Publish command'),(2,1,'202 ACCEPTED',True),(4,5,'requestId + action'),(5,4,'Đổi GPIO; gửi status',True),(4,2,'Status cùng requestId',True),(2,3,'Xác nhận history, Device'),(2,1,'STOMP devices sau commit'),(1,0,'Hiển thị trạng thái xác nhận',True)])
seq('sensor-search',['User','React','Backend','MySQL'],[(0,1,'Chọn trường và nhập từ khóa'),(0,1,'Bấm Tìm kiếm'),(1,2,'GET sensor-data + query'),(2,2,'Kiểm tra tham số'),(2,3,'Filter → sort → page'),(3,2,'Dữ liệu và tổng số',True),(2,1,'200 + metadata trang',True),(1,0,'Bảng kết quả',True)])
seq('history',['User','React','Backend','MySQL'],[(0,1,'Chọn bộ lọc hoặc trang'),(1,2,'GET action-history'),(2,3,'JOIN User, Device; filter/page'),(3,2,'History và username',True),(2,2,'Suy ra deliveryState'),(2,1,'200 + metadata trang',True),(1,0,'Bảng sáu cột',True)])
seq('profile',['User','React','Backend','MySQL'],[(1,2,'GET profile + JWT'),(2,3,'Đọc User theo JWT subject'),(2,1,'Hồ sơ của tài khoản',True),(0,1,'Sửa và bấm Lưu'),(1,2,'PUT tám trường'),(2,2,'Kiểm tra hợp lệ và duy nhất'),(2,3,'Cập nhật đúng User'),(2,1,'200 hoặc lỗi 400/409',True)])

im,d=canvas(1600,700)
box(d,(200,20,1430,670),'',fill='white');text(d,(815,57),'Hệ thống giám sát môi trường',31,True)
def actor(x,y,label):
 d.ellipse((x-25,y-65,x+25,y-15),outline='#111827',width=4);d.line((x,y-15,x,y+70),fill='#111827',width=4);d.line((x-43,y+15,x+43,y+15),fill='#111827',width=4);d.line((x,y+70,x-40,y+120),fill='#111827',width=4);d.line((x,y+70,x+40,y+120),fill='#111827',width=4);text(d,(x,y+155),label,29,True)
actor(93,270,'User');actor(1510,270,'ESP32')
ucs=['UC01 Đăng nhập','UC02 Giám sát Dashboard','UC03 Điều khiển LED','UC04 Tra cứu cảm biến','UC05 Tra cứu lịch sử','UC06 Quản lý hồ sơ']
for i,s in enumerate(ucs):
 y=140+i*85;d.ellipse((400,y-33,1210,y+33),fill='#f8fafc',outline='#475569',width=3);text(d,(805,y),s,30);d.line((140,285,400,y),fill='#6b7280',width=2)
for y in (225,310):d.line((1210,y,1460,285),fill='#6b7280',width=2)
im.save(OUT/'usecase.png')

im,d=canvas(1600,660)
box(d,(30,230,335,395),'ESP32\nDHT11 LDR LED')
box(d,(565,230,870,395),'Mosquitto\nMQTT broker')
box(d,(1090,230,1560,395),'Spring Boot\nXử lý nghiệp vụ')
box(d,(1090,20,1560,155),'React và Nginx\nGiao diện Web')
box(d,(1090,505,1560,640),'MySQL\nLưu trữ dữ liệu')
arrow(d,(335,268),(565,268));text(d,(450,235),'data / status',26)
arrow(d,(565,355),(335,355));text(d,(450,388),'command',26)
arrow(d,(870,268),(1090,268));text(d,(980,235),'data / status',26)
arrow(d,(1090,355),(870,355));text(d,(980,388),'command',26)
arrow(d,(1220,155),(1220,230));text(d,(1137,192),'REST',25)
arrow(d,(1435,230),(1435,155));text(d,(1512,192),'STOMP',25)
arrow(d,(1250,395),(1250,505));arrow(d,(1420,505),(1420,395));text(d,(1335,450),'SQL',27)
im.save(OUT/'architecture.png')

im,d=canvas(1600,610)
box(d,(560,55,1020,520),'',size=34)
text(d,(790,98),'ESP32',34,True)
parts=[('DHT11 DATA',155,'GPIO4'),('LDR AO',260,'GPIO34'),('LED1 qua điện trở',365,'GPIO18'),('LED2 qua điện trở',470,'GPIO19')]
for i,(label,y,_) in enumerate(parts):
 side=i%2
 text(d,(790,y),parts[i][2],32,True)
 if side==0:
  box(d,(20,y-45,455,y+45),label,size=29)
  arrow(d,(455,y),(560,y)) if i==0 else arrow(d,(560,y),(455,y))
 else:
  box(d,(1125,y-45,1580,y+45),label,size=29)
  arrow(d,(1125,y),(1020,y)) if i==1 else arrow(d,(1020,y),(1125,y))
text(d,(800,570),'Các module dùng chung GND; nguồn và chân nối phải đối chiếu mạch thực tế',27)
im.save(OUT/'wiring.png')

im,d=canvas(1600,1080)
def entity(x,y,w,title,rows):
 h=64+len(rows)*44;d.rectangle((x,y,x+w,y+h),fill='white',outline='#475569',width=3);d.rectangle((x,y,x+w,y+58),fill='#e5e7eb',outline='#475569',width=3);text(d,(x+w/2,y+29),title,34,True)
 for i,s in enumerate(rows):text(d,(x+18,y+84+i*44),s,28,anchor='lm')
 return h
entity(30,30,465,'User',['id PK','username UNIQUE','passwordHash','fullName studentCode email','Các URL và timestamps'])
entity(30,600,465,'Device',['id PK','code UNIQUE','name type status active','createdAt updatedAt'])
entity(665,200,550,'ActionHistory',['id PK = requestId','userId FK → User.id','deviceId FK → Device.id','action status','createdAt confirmedAt'])
entity(1130,650,440,'Sensor',['id PK','code UNIQUE','name type unit active','createdAt updatedAt'])
entity(560,780,485,'SensorData',['id PK','sensorId FK → Sensor.id','value DECIMAL(12,4)','recordedAt DATETIME(6)'])
arrow(d,(495,160),(665,300));text(d,(568,200),'1       N',30)
arrow(d,(495,710),(665,430));text(d,(550,565),'1       N',30)
arrow(d,(1130,845),(1045,900));text(d,(1085,825),'N   1',30)
im.save(OUT/'erd.png')
print('Diagrams generated:',len(list(OUT.glob('*.png'))))
