import { useState } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, 
  Clock, MapPin, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Users, Wifi,
} from "lucide-react";
import { cn } from "../../../../lib/utils";

const LoginLogsPanel = ({ logs, isConnected, stats }) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredLogs = (logs || []).filter((log) => {
    if (filter === 'success') return log.success;
    if (filter === 'failed') return !log.success;
    return true;
  });

  const todayStats = stats?.today || {
    total_attempts: 0,
    successful: 0,
    failed: 0,
    success_rate: 0,
    unique_users: 0,
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-100/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-lg blur-md opacity-30" />
            <div className="relative p-2 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg shadow-md shadow-blue-200">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Login Activity
              {isConnected && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {(logs || []).length} aktivitas login • {todayStats.total_attempts} hari ini
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Stats Summary (Always Visible) */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-gradient-to-r from-blue-50/30 to-sky-50/30 border-b border-blue-50">
        <StatMini 
          label="Sukses" 
          value={todayStats.successful}
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
          color="emerald"
        />
        <StatMini 
          label="Gagal" 
          value={todayStats.failed}
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          color="rose"
        />
        <StatMini 
          label="Rate" 
          value={`${todayStats.success_rate}%`}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          color="blue"
        />
        <StatMini 
          label="Users" 
          value={todayStats.unique_users}
          icon={<Users className="w-3.5 h-3.5" />}
          color="sky"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {[
          { value: 'all', label: 'Semua' },
          { value: 'success', label: 'Sukses' },
          { value: 'failed', label: 'Gagal' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all",
              filter === f.value
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div className={cn(
        "divide-y divide-blue-50/50 transition-all duration-300",
        expanded ? "max-h-[400px]" : "max-h-[200px]",
        "overflow-y-auto"
      )}>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Shield className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Belum ada aktivitas login</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <LoginLogItem key={log.id || `log-${index}-${log.timestamp}`} log={log} />
          ))
        )}
      </div>
    </div>
  );
};

const StatMini = ({ label, value, icon, color }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', value: 'text-emerald-700' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', value: 'text-rose-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', value: 'text-blue-700' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', value: 'text-sky-700' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={cn("px-3 py-2 rounded-lg", c.bg)}>
      <div className={cn("flex items-center gap-1.5 mb-1", c.text)}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-lg font-bold", c.value)}>{value}</p>
    </div>
  );
};

const LoginLogItem = ({ log }) => {
  const isSuccess = log.success;
  const Icon = isSuccess ? ShieldCheck : ShieldAlert;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 hover:bg-blue-50/30 transition-colors animate-fadeIn",
      isSuccess ? "bg-white" : "bg-rose-50/30"
    )}>
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800 truncate">
            {log.user?.name || log.email}
          </p>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
            isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {isSuccess ? 'SUCCESS' : 'FAILED'}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {log.ip}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {log.time_ago}
          </span>
        </div>

        {!isSuccess && log.failure_reason && (
          <p className="text-[10px] text-rose-600 mt-1 font-medium">
            {log.failure_reason}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginLogsPanel;