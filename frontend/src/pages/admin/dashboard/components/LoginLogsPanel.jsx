import { useState } from "react";
import {
  Shield, ShieldCheck, ShieldAlert,
  Clock, MapPin, ChevronDown, ChevronUp,
  TrendingUp, Users, Search, X,
  Eye, ChevronLeft, ChevronRight, CalendarRange,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useDashboardFilters } from "../../../../lib/zustand/dashboardStore";
import { useDashboardLoginLogs } from "../../../../lib/zustand/dashboardStore";
import { useLoginLogs } from "../../../../hooks/useDashboard";
import LoginLogDetailModal from "./LoginLogDetailModal";

const LoginLogsPanel = ({ isConnected, stats }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  // ✅ Period sekarang ikut PeriodSelector GLOBAL
  const { period, customFrom, customTo, getPeriodLabel } = useDashboardFilters();

  const {
    loginLogsFilter,
    setLoginLogsPage,
    setLoginLogsSearch,
    setLoginLogsSuccessFilter,
  } = useDashboardLoginLogs();

  const isCustomIncomplete = period === "custom" && (!customFrom || !customTo);

  // ✅ Fetch logs: filter lokal + period global
  const { data: logsData, isLoading: isLoadingLogs } = useLoginLogs({
    ...loginLogsFilter,
    period,
    from: customFrom,
    to: customTo,
  });

  const logs = logsData?.data || [];
  const meta = logsData?.meta || {};

  // ✅ Count ikut periode (shape baru: summary, fallback: today)
  const summary = stats?.summary || stats?.today || {
    total_attempts: 0,
    successful: 0,
    failed: 0,
    success_rate: 0,
    unique_users: 0,
  };

  const handleSearch = () => setLoginLogsSearch(searchInput);

  const handleClearSearch = () => {
    setSearchInput("");
    setLoginLogsSearch("");
  };

  return (
    <>
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
                {/* ✅ Chip periode aktif */}
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold">
                  <CalendarRange className="w-3 h-3" />
                  {getPeriodLabel()}
                </span>
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
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
            aria-label={expanded ? "Ciutkan panel" : "Perluas panel"}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* ✅ Stats Summary — SEKARANG IKUT PERIODE GLOBAL */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gradient-to-r from-blue-50/30 to-sky-50/30 border-b border-blue-50">
          <StatMini
            label="Sukses"
            value={summary.successful}
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <StatMini
            label="Gagal"
            value={summary.failed}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
            color="rose"
          />
          <StatMini
            label="Rate"
            value={`${summary.success_rate}%`}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            color="blue"
          />
          <StatMini
            label="Users"
            value={summary.unique_users}
            icon={<Users className="w-3.5 h-3.5" />}
            color="sky"
          />
        </div>

        {/* Filters (tanpa period selector — period ikut global) */}
        {expanded && (
          <div className="p-4 border-b border-blue-50 space-y-3 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari email... (Enter untuk cari)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Success Filter */}
              <div className="flex gap-1">
                {[
                  { value: "", label: "Semua" },
                  { value: "true", label: "Sukses" },
                  { value: "false", label: "Gagal" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setLoginLogsSuccessFilter(f.value)}
                    className={cn(
                      "px-3 py-2 text-[11px] font-semibold rounded-lg transition-all",
                      loginLogsFilter.success === f.value
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className={cn(
          "divide-y divide-blue-50/50 transition-all duration-300",
          expanded ? "max-h-[500px]" : "max-h-[250px]",
          "overflow-y-auto"
        )}>
          {isCustomIncomplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CalendarRange className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Pilih rentang tanggal di Period Selector</p>
            </div>
          ) : isLoadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Shield className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Belum ada aktivitas login</p>
            </div>
          ) : (
            logs.map((log) => (
              <LoginLogItem
                key={log.id}
                log={log}
                onViewDetail={() => setSelectedLogId(log.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-blue-50 bg-slate-50/30">
            <div className="text-[11px] text-slate-500">
              Menampilkan {meta.from || 0}-{meta.to || 0} dari {meta.total || 0}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLoginLogsPage(Math.max(1, (meta.current_page || 1) - 1))}
                disabled={meta.current_page === 1}
                className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-slate-700">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => setLoginLogsPage(Math.min(meta.last_page, (meta.current_page || 1) + 1))}
                disabled={meta.current_page === meta.last_page}
                className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLogId && (
        <LoginLogDetailModal
          logId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </>
  );
};

const StatMini = ({ label, value, icon, color }) => {
  const colors = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", value: "text-emerald-700" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", value: "text-rose-700" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", value: "text-blue-700" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", value: "text-sky-700" },
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

const LoginLogItem = ({ log, onViewDetail }) => {
  const isSuccess = log.success;
  const Icon = isSuccess ? ShieldCheck : ShieldAlert;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 hover:bg-blue-50/30 transition-colors animate-fadeIn group",
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
            {log.user?.name || log.email_attempted}
          </p>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
              isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {isSuccess ? "SUCCESS" : "FAILED"}
            </span>
            <button
              onClick={onViewDetail}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
              title="Lihat detail"
              aria-label="Lihat detail log"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {log.ip_address}
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