import React, { useState } from 'react';
import {
  AdminDashboardPage,
  AdminPageHeader,
  AdminActionButton,
  AdminInlineAlert,
} from '../components';

interface MaintenanceLog {
  id: string;
  action: string;
  triggeredBy: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING';
}

export const AdminMaintenance: React.FC = () => {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Hệ thống đang trong quá trình bảo trì định kỳ để nâng cấp hiệu năng. Vui lòng quay lại sau ít phút.',
  );
  const [allowBossBypass, setAllowBossBypass] = useState(true);
  const [statusAlert, setStatusAlert] = useState<string | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([
    {
      id: 'log-1',
      action: 'Automated DB Index Optimization',
      triggeredBy: 'Scheduled Cron',
      timestamp: 'Today at 03:00 AM',
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      action: 'Redis Queue Cache Purge',
      triggeredBy: 'System Web Admin',
      timestamp: 'Yesterday at 11:30 PM',
      status: 'SUCCESS',
    },
    {
      id: 'log-3',
      action: 'Vector Storage Health Verification',
      triggeredBy: 'Scheduled Cron',
      timestamp: '2 days ago',
      status: 'SUCCESS',
    },
  ]);

  const handleToggleMaintenance = () => {
    const newState = !maintenanceEnabled;
    setMaintenanceEnabled(newState);
    const newLog: MaintenanceLog = {
      id: `log-${Date.now()}`,
      action: newState ? 'Enabled System Maintenance Mode' : 'Disabled System Maintenance Mode',
      triggeredBy: 'Current Web Admin',
      timestamp: 'Just now',
      status: newState ? 'WARNING' : 'SUCCESS',
    };
    setLogs((prev) => [newLog, ...prev]);
    setStatusAlert(
      newState
        ? 'Chế độ bảo trì đã được KÍCH HOẠT. Người dùng thông thường sẽ thấy trang thông báo bảo trì.'
        : 'Chế độ bảo trì đã được TẮT. Hệ thống hoạt động bình thường.',
    );
  };

  const handleSaveMessage = () => {
    setStatusAlert('Đã lưu thông báo bảo trì thành công.');
    setTimeout(() => setStatusAlert(null), 3000);
  };

  const handleClearCache = () => {
    const newLog: MaintenanceLog = {
      id: `log-${Date.now()}`,
      action: 'Cleared Application & Query Cache',
      triggeredBy: 'Current Web Admin',
      timestamp: 'Just now',
      status: 'SUCCESS',
    };
    setLogs((prev) => [newLog, ...prev]);
    setStatusAlert('Đã làm sạch bộ nhớ đệm (Cache Flush) thành công.');
    setTimeout(() => setStatusAlert(null), 4000);
  };

  return (
    <AdminDashboardPage>
      <AdminPageHeader
        eyebrow="Web & System Administration"
        title="Bảo Trì Trang Web & Hệ Thống"
        description="Quản lý chế độ bảo trì toàn trang (Maintenance Mode), thông báo bảo trì cho người dùng và các tiện ích dọn dẹp hệ thống."
        actions={
          <AdminActionButton
            onClick={handleClearCache}
            variant="secondary"
          >
            Clear System Cache
          </AdminActionButton>
        }
      />

      {statusAlert && (
        <AdminInlineAlert tone={maintenanceEnabled ? 'revision' : 'approved'}>
          {statusAlert}
        </AdminInlineAlert>
      )}

      {/* Main Switch Card */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full ${
                  maintenanceEnabled ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <h2 className="text-lg font-semibold text-stone-900">
                {maintenanceEnabled ? 'Chế độ Bảo Trì đang BẬT' : 'Hệ thống đang hoạt động bình thường'}
              </h2>
            </div>
            <p className="mt-1 text-sm text-stone-600">
              Khi bật chế độ bảo trì, chỉ có tài khoản Quản trị viên (Web Admin {allowBossBypass ? '& Boss' : ''}) mới có quyền truy cập ứng dụng.
            </p>
          </div>

          <button
            onClick={handleToggleMaintenance}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              maintenanceEnabled
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm'
            }`}
          >
            {maintenanceEnabled ? 'TẮT Chế Độ Bảo Trì' : 'BẬT Chế Độ Bảo Trì'}
          </button>
        </div>

        {/* Sub-options */}
        <div className="mt-6 border-t border-stone-100 pt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowBossBypass}
              onChange={(e) => setAllowBossBypass(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-stone-700">
              Cho phép tài khoản Boss (Chủ doanh nghiệp) bỏ qua màn hình bảo trì
            </span>
          </label>
        </div>
      </div>

      {/* Maintenance Banner Message Configuration */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-semibold text-stone-900">
          Thông báo bảo trì hiển thị cho người dùng
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          Thông điệp này sẽ xuất hiện trên màn hình khi người dùng truy cập trang web trong lúc bảo trì.
        </p>

        <div className="mt-4">
          <textarea
            rows={3}
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            placeholder="Nhập thông báo bảo trì..."
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveMessage}
            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
          >
            Lưu Thông Báo
          </button>
        </div>
      </div>

      {/* Maintenance Audit History */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
        <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h3 className="text-base font-semibold text-stone-900">Nhật ký tác vụ bảo trì gần đây</h3>
          <p className="text-xs text-stone-500">Ghi lại lịch sử dọn dẹp, bảo trì và thao tác hệ thống</p>
        </div>

        <div className="divide-y divide-stone-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="font-medium text-stone-800">{log.action}</span>
                <span className="text-xs text-stone-500">by {log.triggeredBy}</span>
              </div>
              <span className="text-xs text-stone-400">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminDashboardPage>
  );
};
export default AdminMaintenance;
