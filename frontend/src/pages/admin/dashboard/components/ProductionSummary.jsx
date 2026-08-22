import { Clock, Play, AlertCircle } from "lucide-react";
import { cn } from "../../../../lib/utils";

const ProductionSummary = ({ production }) => {
  const items = [
    {
      label: "Antri Produksi",
      value: production.antri || 0,
      icon: Clock,
      gradient: "from-slate-500 to-slate-600",
      glow: "bg-slate-400",
      bg: "bg-slate-50",
      ring: "ring-slate-200",
      valueColor: "text-slate-700",
    },
    {
      label: "Sedang Produksi",
      value: production.produksi || 0,
      icon: Play,
      gradient: "from-blue-500 to-sky-500",
      glow: "bg-blue-400",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
      valueColor: "text-blue-700",
    },
    {
      label: "Belum Dibuat",
      value: production.belum_dibuat || 0,
      icon: AlertCircle,
      gradient: "from-amber-500 to-orange-500",
      glow: "bg-amber-400",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
      valueColor: "text-amber-700",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-blue-100/60 p-5 sm:p-6 shadow-sm shadow-blue-100/40 hover:shadow-lg hover:shadow-blue-100/60 transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-30" />
          <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-lg shadow-blue-200">
            <Play className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Status Produksi</h3>
          <p className="text-xs text-slate-500">Ringkasan pesanan dalam produksi</p>
        </div>
      </div>

      {/* Grid Items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "group relative flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-300 overflow-hidden",
              item.bg,
              `ring-1 ${item.ring}`,
              "hover:shadow-md hover:scale-[1.02]"
            )}
          >
            {/* Decorative glow */}
            <div className={cn(
              "absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60",
              item.glow
            )} />
            
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-xl blur-md opacity-50",
                item.glow
              )} />
              <div className={cn(
                "relative p-2.5 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6",
                `bg-gradient-to-br ${item.gradient}`
              )}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            
            <div className="relative flex-1 min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className={cn("text-2xl font-bold tracking-tight", item.valueColor)}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionSummary;