# Cold Chain Monitoring (frilunch)

ระบบมอนิเตอร์ตู้แช่วัตถุดิบ real-time 24/7
**Stack:** ESP32 (Wokwi) + DS18B20 → HiveMQ MQTT → InfluxDB Cloud → Next.js Dashboard

---

## 🆕 What's new

- 🔔 **กระดิ่งแจ้งเตือนมุมขวาบน** — มี badge นับจำนวน alert ที่ยังไม่อ่าน (เหมือน IG/Messenger)
- 💬 **Toast popup** — เด้งทันทีที่อุณหภูมิหลุดเกณฑ์ พร้อมรายละเอียด
- 📋 **ตารางประวัติทั้งหมด** — เปลี่ยนจาก "เฉพาะหลุดเกณฑ์" เป็น "ทุกค่า" — ค่า alert ยังไฮไลท์แดง
- 🖥️ **Wokwi support** — ตอนนี้ใช้ Wokwi simulator ได้เต็มรูปแบบ ผ่าน MQTT บน HiveMQ Cloud

---

## 📂 โครงสร้างโปรเจกต์

```
frilunch/
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── next.config.mjs
├── .env.local                     # credentials (ห้าม commit!)
│
├── app/
│   ├── globals.css                # + slide-in/badge-pulse animations
│   ├── layout.tsx
│   ├── page.tsx                   # / → /dashboard
│   │
│   ├── api/sensor/
│   │   ├── route.ts               # POST (HTTP fallback)
│   │   └── history/route.ts       # GET — dashboard polls
│   │
│   ├── dashboard/
│   │   └── page.tsx               # ⭐ มี bell + toast แล้ว
│   │
│   ├── _lib/
│   │   ├── influx.ts              # InfluxDB read/write
│   │   └── sensor.ts              # Polling hook + helpers
│   │
│   └── _components/
│       ├── realtime-chart.tsx
│       ├── history-table.tsx      # ⭐ ใหม่ (แทน event-log-table)
│       ├── notification-bell.tsx  # ⭐ ใหม่ — กระดิ่ง + dropdown
│       ├── alert-toast.tsx        # ⭐ ใหม่ — popup
│       └── stats-summary.tsx
│
├── scripts/
│   └── mqtt-bridge.mjs            # MQTT subscriber → InfluxDB writer
│
└── wokwi/                         # ⭐ ใหม่ — simulator files
    ├── sketch.ino                 # มี credentials ฝังให้แล้ว
    ├── diagram.json               # circuit
    └── libraries.txt              # PubSubClient + OneWire + ...
```

---

## 🚀 Setup ทั้งระบบ (3 phase)

### Phase 1 — Cloud Setup (ครั้งเดียวจบ)

ทำตาม README เก่า (HiveMQ + InfluxDB Cloud) — ตอนนี้น่าจะเสร็จแล้ว

### Phase 2 — Frontend & Bridge (ในเครื่อง)

```powershell
cd frilunch
npm install
```

ตรวจ `.env.local` มีค่าครบ (จาก message ก่อนหน้า)

**Terminal 1 — Next.js:**
```powershell
npm run dev
```

**Terminal 2 — MQTT Bridge:**
```powershell
npm run mqtt-bridge
```

ดู dashboard ที่ http://localhost:3000/dashboard

### Phase 3 — Wokwi Simulator

1. ไปที่ **https://wokwi.com** → New Project → ESP32
2. คัดลอก 3 ไฟล์จาก `wokwi/` ไปวาง:
   - `sketch.ino` (credentials ฝังไว้แล้ว ไม่ต้องแก้)
   - `diagram.json`
   - `libraries.txt`
3. กด ▶ **Start simulation**
4. ดู Serial Monitor — ควรเห็น:
   ```
   WiFi connected. IP: 10.x.x.x
   Connecting to HiveMQ... connected!
   Ready to publish.
   Temperature: 28.50 C
   OK Published 28.50 C [HIGH ALERT]
   ```

5. ไปที่ Dashboard → **เห็น toast popup เด้งขึ้นทันที** + กระดิ่งมีบาดจ์ขึ้น 🔔

### ทดสอบ alert flow

ใน Wokwi คลิกที่ **DS18B20 sensor** → จะมี slider โผล่ เลื่อนเปลี่ยนอุณหภูมิ:
- เลื่อนไปเกิน **8°C** → Toast เด้งขึ้น "อุณหภูมิสูงเกินเกณฑ์" + กระดิ่งบาดจ์เพิ่ม
- เลื่อนไปต่ำกว่า **2°C** → Toast เด้งขึ้น "อุณหภูมิต่ำกว่าเกณฑ์" + กระดิ่งบาดจ์เพิ่ม
- เลื่อนกลับ 4-6°C → ปกติ ไม่มี toast แต่ตารางยังเก็บประวัติไว้

**คลิกกระดิ่ง** → dropdown เปิด → เห็นรายการทั้งหมด → ปิด dropdown → บาดจ์หายไป

---

## 🌐 Deploy ขึ้น Cloud (Production)

### Vercel — Dashboard

```powershell
vercel --prod
```

ตั้ง Environment Variables ใน Vercel Dashboard (เฉพาะ INFLUX_*):
| Name | Value |
|------|-------|
| `INFLUX_URL` | `https://us-east-1-1.aws.cloud2.influxdata.com` |
| `INFLUX_TOKEN` | (token ของคุณ) |
| `INFLUX_ORG` | `kanvara.bonh@bumail.net` |
| `INFLUX_BUCKET` | `coldchain` |

### Railway — MQTT Bridge

1. Push ขึ้น GitHub (ตรวจ `.gitignore` มี `.env.local`)
2. railway.app → New Project → Deploy from GitHub
3. Settings → Custom Start Command: `node scripts/mqtt-bridge.mjs`
4. Variables: ใส่ทั้ง MQTT_* และ INFLUX_* ครบ

---

## 🎯 ฟีเจอร์ Notification

### Bell + Badge (เหมือน IG/Messenger)

- **Badge สีแดง** ขึ้นที่กระดิ่งเมื่อมี alert ใหม่ที่ยังไม่อ่าน
- **คลิกกระดิ่ง** → dropdown แสดงรายการ alert ทั้งหมด
- **เปิด dropdown** = mark all as read → badge หายไป
- **Persistence:** ใช้ `localStorage` จำว่าเคยอ่านอันไหนแล้ว — refresh page บาดจ์ไม่กลับมาขึ้น

### Toast Popup

- เด้งจากมุมขวาบน เมื่อมี alert ใหม่เข้ามา
- Auto-dismiss หลัง 8 วินาที หรือกด X ปิด
- **ครั้งแรกที่เปิด page ไม่เด้ง** — เด้งเฉพาะ alert ที่มาใหม่ใน session นี้

### Reset notification state (debug)

เปิด DevTools (F12) → Application → Local Storage → ลบ `frilunch:seenAlertIds:v1`
→ refresh → บาดจ์จะกลับมาขึ้นอีกที

---


**Layer mapping ตาม CS423 rubric:**
| Layer | สิ่งที่ใช้ |
|-------|----------|
| Device | ESP32 (Wokwi) + DS18B20 + 4.7kΩ pull-up |
| Communication | MQTT over TLS port 8883 |
| Backend / Broker | HiveMQ Cloud + Node.js Bridge + Next.js API |
| Database | InfluxDB Cloud Serverless (time-series) |
| Frontend | Next.js 15 + React 19 + Tailwind v4 + Recharts + lucide-react |
| AI Agent | Claude (code generation, debugging, architecture) |

---

## ⚠️ Troubleshooting

**Wokwi: "Connection refused" / rc=-2**
→ ตรวจ Wokwi-GUEST WiFi ขึ้น "WiFi connected" ก่อน → ถ้าไม่ขึ้นรอ 30 วิ → restart

**Wokwi: "rc=-4" (NOT_AUTHORIZED)**
→ MQTT_USER/PASS ผิด ตรวจที่ HiveMQ Console

**Toast ไม่เด้ง**
→ ครั้งแรกโหลด ไม่เด้งเป็นปกติ — ลองเลื่อน slider ใน Wokwi ให้หลุดเกณฑ์ใหม่

**Badge ไม่ขึ้น แม้มี alert**
→ DevTools → ลบ `frilunch:seenAlertIds:v1` ใน localStorage

---

