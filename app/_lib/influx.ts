import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUX_URL!;
const token = process.env.INFLUX_TOKEN!;
const org = process.env.INFLUX_ORG!;
const bucket = process.env.INFLUX_BUCKET!;

export const MEASUREMENT = 'temperature';
export const SENSOR_TAG = 'sensor1';

let _client: InfluxDB | null = null;

function getClient() {
  if (!_client) {
    if (!url || !token) {
      throw new Error('Missing INFLUX_URL or INFLUX_TOKEN env var');
    }
    _client = new InfluxDB({ url, token });
  }
  return _client;
}


export async function writeReading(temperatureC: number, sensorId = SENSOR_TAG) {
  const writeApi = getClient().getWriteApi(org, bucket, 'ms');

  const point = new Point(MEASUREMENT)
    .tag('sensor', sensorId)
    .floatField('value', temperatureC)
    .timestamp(new Date());

  writeApi.writePoint(point);
  await writeApi.close();
}


export interface SensorReading {
  id: number;
  timestamp: string;
  temperature: number;
}

export async function queryRecentReadings(
  durationMinutes: number = 30,
  sensorId = SENSOR_TAG,
): Promise<SensorReading[]> {
  const queryApi = getClient().getQueryApi(org);

  const flux = `
from(bucket: "${bucket}")
  |> range(start: -${durationMinutes}m)
  |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
  |> filter(fn: (r) => r._field == "value")
  |> filter(fn: (r) => r.sensor == "${sensorId}")
  |> sort(columns: ["_time"])
`;

  const rows: SensorReading[] = [];

  for await (const { values, tableMeta } of queryApi.iterateRows(flux)) {
    const o = tableMeta.toObject(values) as { _time: string; _value: number };
    rows.push({
      id: new Date(o._time).getTime(),
      timestamp: o._time,
      temperature: Number(o._value.toFixed(2)),
    });
  }

  return rows;
}

export async function queryLatestReading(
  sensorId = SENSOR_TAG,
): Promise<SensorReading | null> {
  const queryApi = getClient().getQueryApi(org);

  const flux = `
from(bucket: "${bucket}")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
  |> filter(fn: (r) => r._field == "value")
  |> filter(fn: (r) => r.sensor == "${sensorId}")
  |> last()
`;

  for await (const { values, tableMeta } of queryApi.iterateRows(flux)) {
    const o = tableMeta.toObject(values) as { _time: string; _value: number };
    return {
      id: new Date(o._time).getTime(),
      timestamp: o._time,
      temperature: Number(o._value.toFixed(2)),
    };
  }

  return null;
}
