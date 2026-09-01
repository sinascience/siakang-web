// Dummy data for the Monitoring dashboard. Numbers are illustrative only.

// 24h timeline, sampled every 2 hours.
export const HOURS = [
  '00:00',
  '02:00',
  '04:00',
  '06:00',
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
];

export type Kpi = { value: number; delta: number; spark: number[] };

export const monitoringKpis: Record<'uptime' | 'response' | 'requests' | 'errors', Kpi> = {
  uptime: { value: 99.95, delta: 0.02, spark: [99.9, 99.8, 99.95, 99.97, 99.9, 99.95, 99.99, 99.95] },
  response: { value: 182, delta: -5.4, spark: [210, 198, 205, 190, 188, 192, 185, 182] },
  requests: { value: 14_200, delta: 9.1, spark: [9, 11, 10, 13, 12, 14, 13, 14] },
  errors: { value: 0.42, delta: 0.08, spark: [0.3, 0.35, 0.32, 0.4, 0.38, 0.45, 0.41, 0.42] },
};

// Requests per minute over 24h (in thousands).
export const requestVolume = [6.2, 4.1, 3.4, 5.8, 9.6, 12.4, 14.8, 15.2, 14.1, 13.6, 11.2, 8.4];

// Latency in ms.
export const latencyP50 = [120, 118, 122, 130, 142, 158, 172, 168, 160, 151, 138, 128];
export const latencyP95 = [210, 205, 215, 228, 252, 288, 320, 312, 295, 274, 248, 226];

export type Gauge = { label: string; value: number };

export const resourceGauges: Gauge[] = [
  { label: 'CPU', value: 62 },
  { label: 'Memory', value: 74 },
  { label: 'Disk', value: 48 },
];

export type ServiceStatus = 'operational' | 'degraded' | 'down';
export type Service = {
  name: string;
  status: ServiceStatus;
  latency: number;
  uptime: number;
};

export const services: Service[] = [
  { name: 'API Gateway', status: 'operational', latency: 142, uptime: 99.99 },
  { name: 'Auth Service', status: 'operational', latency: 88, uptime: 99.98 },
  { name: 'Payments', status: 'degraded', latency: 412, uptime: 99.42 },
  { name: 'Notifications', status: 'operational', latency: 124, uptime: 99.95 },
  { name: 'Reporting', status: 'down', latency: 0, uptime: 97.1 },
  { name: 'Storage', status: 'operational', latency: 96, uptime: 99.97 },
];

export const serviceStatusColor: Record<ServiceStatus, 'success' | 'warning' | 'error'> = {
  operational: 'success',
  degraded: 'warning',
  down: 'error',
};

export type HttpBucket = { code: string; count: number };

export const httpStatusCodes: HttpBucket[] = [
  { code: '2xx', count: 184_200 },
  { code: '3xx', count: 22_400 },
  { code: '4xx', count: 8_600 },
  { code: '5xx', count: 1_240 },
];
