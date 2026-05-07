import 'dotenv/config';
import mqtt from 'mqtt';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_PORT = process.env.MQTT_PORT || '8883';
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'coldchain/sensor1/temperature';

const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'coldchain';

if (!MQTT_HOST || !MQTT_USERNAME || !MQTT_PASSWORD) {
  console.error(' ขาด MQTT env vars. ดูที่ .env.local');
  process.exit(1);
}
if (!INFLUX_URL || !INFLUX_TOKEN || !INFLUX_ORG) {
  console.error(' ขาด INFLUX env vars. ดูที่ .env.local');
  process.exit(1);
}

const influx = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = influx.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms');


const url = `mqtts://${MQTT_HOST}:${MQTT_PORT}`;
console.log(`🔗 Connecting to ${url} ...`);

const client = mqtt.connect(url, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  protocol: 'mqtts',
  rejectUnauthorized: true,
  reconnectPeriod: 5000,
});

client.on('connect', () => {
  console.log('✅ Connected to HiveMQ');
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ Subscribe failed:', err.message);
      process.exit(1);
    }
    console.log(`📡 Subscribed to "${MQTT_TOPIC}"`);
    console.log('⏳ Waiting for sensor data...\n');
  });
});

client.on('error', (err) => {
  console.error('❌ MQTT error:', err.message);
});

client.on('reconnect', () => {
  console.log('🔄 Reconnecting...');
});

client.on('message', (topic, payload) => {
  try {
    const text = payload.toString();
    let temp;

    // รองรับทั้ง JSON และตัวเลขเปล่า
    try {
      const parsed = JSON.parse(text);
      temp = typeof parsed === 'number' ? parsed : parsed.temperature;
    } catch {
      temp = parseFloat(text);
    }

    if (typeof temp !== 'number' || !isFinite(temp)) {
      console.warn('⚠️ Invalid payload:', text);
      return;
    }

    if (temp < -50 || temp > 100) {
      console.warn('⚠️ Temperature out of range:', temp);
      return;
    }

    const point = new Point('temperature')
      .tag('sensor', 'sensor1')
      .floatField('value', temp)
      .timestamp(new Date());

    writeApi.writePoint(point);

    const alert = temp > 8 || temp < 2 ? ' 🚨 ALERT' : '';
    console.log(`📥 ${topic} → ${temp.toFixed(2)}°C${alert}`);
  } catch (err) {
    console.error('Failed to handle message:', err);
  }
});

// ---------- Flush เป็นระยะ ----------
setInterval(async () => {
  try {
    await writeApi.flush();
  } catch (err) {
    console.error('Flush failed:', err);
  }
}, 5000);

// ---------- Graceful shutdown ----------
const shutdown = async () => {
  console.log('\nShutting down...');
  try {
    await writeApi.close();
    client.end();
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
