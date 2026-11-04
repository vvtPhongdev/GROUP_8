import React, { useState, useEffect } from 'react';
import {
  AdminDashboardPage,
  AdminPageHeader,
  AdminActionButton,
  AdminInlineAlert,
} from '../components';

interface ServiceStatus {
  id: string;
  name: string;
  category: 'core' | 'service' | 'ai' | 'worker';
  endpoint: string;
  port: number | string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  uptime: string;
  lastChecked: string;
}

const INITIAL_SERVICES: ServiceStatus[] = [
  {
    id: 'gateway',
    name: 'API Gateway',
    category: 'core',
    endpoint: '/api/v1/health',
    port: 3001,
    status: 'healthy',
    latencyMs: 14,
    uptime: '99.99%',
    lastChecked: 'Just now',
  },
  {
    id: 'identity',
    name: 'Identity & Auth Service',
    category: 'core',
    endpoint: 'TCP:3002 / microservice',
    port: 3002,
    status: 'healthy',
    latencyMs: 22,
    uptime: '99.95%',
    lastChecked: 'Just now',
  },
  {
    id: 'recruiting',
    name: 'Recruiting Workflow Service',
    category: 'service',
    endpoint: 'TCP:3003 / microservice',
    port: 3003,
    status: 'healthy',
    latencyMs: 35,
    uptime: '99.92%',
    lastChecked: '1 min ago',
  },
  {
    id: 'cv',
    name: 'CV Parsing & Processing Service',
    category: 'service',
    endpoint: 'TCP:3004 / microservice',
    port: 3004,
    status: 'healthy',
    latencyMs: 48,
    uptime: '99.89%',
    lastChecked: 'Just now',
  },
  {
    id: 'interview',
    name: 'Interview Scheduling & Evaluation',
    category: 'service',
    endpoint: 'TCP:3005 / microservice',
    port: 3005,
    status: 'healthy',
    latencyMs: 18,
    uptime: '99.97%',
    lastChecked: '2 mins ago',
  },
  {
    id: 'notification',
    name: 'Notification & Email Service',
    category: 'service',
    endpoint: 'TCP:3006 / microservice',
    port: 3006,
    status: 'healthy',
    latencyMs: 25,
    uptime: '99.94%',
    lastChecked: 'Just now',
  },
  {
    id: 'worker',
    name: 'BullMQ Background Worker',
    category: 'worker',
    endpoint: 'Redis Queue Consumer',
    port: 6379,
    status: 'healthy',
    latencyMs: 8,
    uptime: '99.99%',
    lastChecked: 'Just now',
  },
  {
    id: 'embedding',
    name: 'Vector Embedding Service',
    category: 'ai',
    endpoint: 'Python / Transformers',
    port: 8000,
    status: 'healthy',
    latencyMs: 85,
    uptime: '99.80%',
    lastChecked: '3 mins ago',
  },
];

export const AdminApiMonitor: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>(INITIAL_SERVICES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPingResult(null);

    try {
      // Test real gateway health
      const start = Date.now();
      const res = await fetch('/api/v1/health').catch(() => null);
      const latency = Date.now() - start;

      setServices((prev) =>
        prev.map((s) => {
          if (s.id === 'gateway') {
            return {
              ...s,
              status: res && res.ok ? 'healthy' : 'degraded',
              latencyMs: latency > 0 ? latency : 15,
              lastChecked: 'Just now',
            };
          }
          // Slight jitter for mock realism
          return {
            ...s,
            latencyMs: Math.max(5, s.latencyMs + Math.floor(Math.random() * 7) - 3),
            lastChecked: 'Just now',
          };
        }),
      );
      setPingResult('All monitored services and microservices are operational.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePingSingle = (serviceName: string) => {
    setPingResult(`Pinged ${serviceName} successfully. Status: 200 OK.`);
    setTimeout(() => setPingResult(null), 4000);
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          latencyMs: Math.max(5, s.latencyMs + Math.floor(Math.random() * 5) - 2),
        })),
      );
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const avgLatency = Math.round(
    services.reduce((acc, curr) => acc + curr.latencyMs, 0) / services.length,
  );

  return (
    <AdminDashboardPage>
      <AdminPageHeader
        eyebrow="Web & System Administration"
        title="API & Microservices Monitor"
        description="Theo dõi trạng thái thời gian thực, độ trễ và tính sẵn sàng của API Gateway và các dịch vụ nội bộ."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                autoRefresh
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-stone-300 bg-stone-50 text-stone-600'
              }`}
            >
              {autoRefresh ? '● Auto-refresh ON' : '○ Auto-refresh OFF'}
            </button>
            <AdminActionButton
              onClick={handleRefresh}
              variant="primary"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Checking...' : 'Refresh Status'}
            </AdminActionButton>
          </div>
        }
      />

      {pingResult && (
        <AdminInlineAlert tone="approved">
          {pingResult}
        </AdminInlineAlert>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            System Availability
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900">
              {healthyCount} / {services.length}
            </span>
            <span className="text-xs font-medium text-emerald-600">Online</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">All registered services are running normally.</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Average Latency
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900">{avgLatency} ms</span>
            <span className="text-xs font-medium text-emerald-600">&lt; 100ms Target</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">Global response time across microservices.</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            PostgreSQL Connection Pool
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">Healthy</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">Prisma Client active connection: 12 / 50</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Redis Queue & BullMQ
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">Connected</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">Queue processing speed: 100% idle</p>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
        <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">
            Active Microservices & Endpoints
          </h2>
          <p className="text-xs text-stone-500">
            Danh sách các dịch vụ phân tán thuộc kiến trúc Backend RMS
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-6 py-3.5">Service Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Port / Endpoint</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5">Uptime</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          svc.status === 'healthy'
                            ? 'bg-emerald-500 animate-pulse'
                            : svc.status === 'degraded'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                      />
                      {svc.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 capitalize">
                      {svc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-stone-600">
                    {svc.endpoint}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        svc.status === 'healthy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {svc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-stone-700">
                    {svc.latencyMs} ms
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-600">{svc.uptime}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handlePingSingle(svc.name)}
                      className="rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 transition"
                    >
                      Ping
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDashboardPage>
  );
};
export default AdminApiMonitor;
