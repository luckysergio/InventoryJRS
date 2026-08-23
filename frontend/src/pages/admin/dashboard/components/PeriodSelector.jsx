import { useState, useRef, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { useDashboardFilters } from "../../../../lib/zustand/dashboardStore";
import { cn } from "../../../../lib/utils";

// ✅ Ditambah "all" — berlaku untuk stats utama DAN login logs
const PERIODS = [
  { value: "daily", label: "Harian", icon: "📅" },
  { value: "weekly", label: "Mingguan", icon: "📆" },
  { value: "monthly", label: "Bulanan", icon: "🗓️" },
  { value: "yearly", label: "Tahunan", icon: "📊" },
  { value: "custom", label: "Custom", icon: "🎯" },
  { value: "all", label: "Semua", icon: "📋" },
];

const PeriodSelector = () => {
  const {
    period,
    setPeriod,
    customFrom,
    customTo,
    setCustomRange,
    realtime,
    toggleRealtime, // ✅ FIX: sebelumnya tidak di-destructure tapi dipanggil
  } = useDashboardFilters();

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempFrom, setTempFrom] = useState(customFrom || "");
  const [tempTo, setTempTo] = useState(customTo || "");
  const pickerRef = useRef(null);

  // Auto-enable realtime saat mount
  useEffect(() => {
    if (!realtime) {
      toggleRealtime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowCustomPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (period === "custom") {
      setShowCustomPicker(true);
      if (!tempFrom) setTempFrom(customFrom || "");
      if (!tempTo) setTempTo(customTo || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleApplyCustom = () => {
    if (tempFrom && tempTo) {
      setCustomRange(tempFrom, tempTo);
      setShowCustomPicker(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === "custom") {
      setShowCustomPicker(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100/60 p-4 sm:p-5 shadow-sm shadow-blue-100/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Period Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Periode
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={cn(
                  "relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300",
                  period === p.value
                    ? "bg-gradient-to-br from-blue-500 to-sky-500 text-white shadow-lg shadow-blue-200 scale-105"
                    : "bg-blue-50/50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 ring-1 ring-blue-100/50"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* LIVE Indicator */}
        <div className="flex items-center gap-3">
          {realtime && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full animate-fadeIn">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Live
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Custom Date Picker */}
      {period === "custom" && showCustomPicker && (
        <div
          ref={pickerRef}
          className="mt-4 p-4 bg-gradient-to-br from-blue-50/50 to-sky-50/50 rounded-xl border border-blue-100 animate-fadeIn"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <input
                type="date"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
                max={tempTo || new Date().toISOString().split("T")[0]}
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:block">sampai</span>
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <input
                type="date"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
                min={tempFrom}
                max={new Date().toISOString().split("T")[0]}
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyCustom}
                disabled={!tempFrom || !tempTo}
                className="px-4 py-2 bg-gradient-to-br from-blue-500 to-sky-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
              >
                Terapkan
              </button>
              <button
                onClick={() => setShowCustomPicker(false)}
                className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-50 ring-1 ring-slate-200 transition"
                aria-label="Tutup date picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applied custom range display */}
      {period === "custom" && customFrom && customTo && !showCustomPicker && (
        <div className="mt-3 flex items-center justify-between px-3 py-2 bg-blue-50/50 rounded-lg ring-1 ring-blue-100/50">
          <span className="text-xs text-slate-600 font-medium">
            📅 {new Date(customFrom).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} —{" "}
            {new Date(customTo).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setShowCustomPicker(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Ubah
          </button>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;