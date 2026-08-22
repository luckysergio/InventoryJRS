import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../../../lib/utils";

const StatsCard = ({
  title,
  value,
  previousValue,
  subtitle,
  growth,
  icon,
  accentColor = "blue",
}) => {
  const hasGrowth = growth !== undefined && growth !== null;
  const isPositive = hasGrowth && growth > 0;
  const isNegative = hasGrowth && growth < 0;

  // Soft blue palette variants
  const accentMap = {
    blue: {
      iconBg: "bg-gradient-to-br from-blue-500 to-sky-500",
      iconGlow: "bg-blue-400",
      decoration: "from-blue-100 to-sky-100",
      growthPositive: "text-blue-700",
    },
    sky: {
      iconBg: "bg-gradient-to-br from-sky-500 to-cyan-500",
      iconGlow: "bg-sky-400",
      decoration: "from-sky-100 to-cyan-100",
      growthPositive: "text-sky-700",
    },
    cyan: {
      iconBg: "bg-gradient-to-br from-cyan-500 to-teal-500",
      iconGlow: "bg-cyan-400",
      decoration: "from-cyan-100 to-teal-100",
      growthPositive: "text-cyan-700",
    },
    indigo: {
      iconBg: "bg-gradient-to-br from-indigo-500 to-blue-500",
      iconGlow: "bg-indigo-400",
      decoration: "from-indigo-100 to-blue-100",
      growthPositive: "text-indigo-700",
    },
  };

  const accent = accentMap[accentColor] || accentMap.blue;

  return (
    <div className="group relative bg-white rounded-2xl border border-blue-100/60 p-5 hover:shadow-xl hover:shadow-blue-100/60 hover:border-blue-200 transition-all duration-300 overflow-hidden">
      {/* Decorative gradient blob */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl opacity-40 transition-all duration-500 group-hover:opacity-70 group-hover:scale-110",
        accent.decoration
      )} />

      <div className="relative">
        {/* Header: Icon + Growth */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-xl blur-md opacity-40 transition-opacity group-hover:opacity-60",
              accent.iconGlow
            )} />
            <div className={cn(
              "relative p-2.5 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3",
              accent.iconBg
            )}>
              {icon}
            </div>
          </div>

          {hasGrowth && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
              isPositive && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
              isNegative && "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
              !isPositive && !isNegative && "bg-slate-50 text-slate-500 ring-1 ring-slate-100"
            )}>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              <span>{Math.abs(growth).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium pt-1">{subtitle}</p>
          )}
        </div>

        {/* Growth bar */}
        {hasGrowth && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="text-slate-400 font-medium">Sebelumnya</span>
              <span className="text-slate-500 font-semibold">{previousValue}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  isPositive && "bg-gradient-to-r from-emerald-400 to-teal-500",
                  isNegative && "bg-gradient-to-r from-rose-400 to-pink-500",
                  !isPositive && !isNegative && "bg-slate-300"
                )}
                style={{ width: `${Math.min(Math.abs(growth), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;