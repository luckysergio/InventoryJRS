import { useMemo, useState, useEffect, useRef } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Sparkles, Activity,
} from "lucide-react";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, Legend, Area,
} from "recharts";
import { formatRupiah } from "../../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../../lib/utils";

const BREAKPOINTS = { MOBILE: 480, TABLET: 768, DESKTOP: 1024 };
const MIN_CHART_WIDTH = 240;

const RevenueChart = ({ data, months }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // ==========================================
  // DIMENSION + VISIBILITY TRACKING
  // ==========================================
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // IntersectionObserver: detect kapan chart visible di viewport
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          io.disconnect(); // Hanya perlu 1x
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);

    // ResizeObserver: track width (height akan fixed dari state)
    let rafId = null;
    const ro = new ResizeObserver((entries) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const entry = entries[0];
        if (!entry) return;

        const w = Math.floor(entry.contentRect.width);

        // Skip dimensi tidak valid (hidden/collapsed)
        if (w < MIN_CHART_WIDTH) return;

        setContainerWidth((prev) =>
          Math.abs(prev - w) < 2 ? prev : w
        );
      });
    });
    ro.observe(el);

    return () => {
      io.disconnect();
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ==========================================
  // DATA PROCESSING
  // ==========================================
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      ...item,
      revenueFormatted: formatRupiah(item.revenue),
    }));
  }, [data]);

  const totalRevenue = useMemo(
    () => (data || []).reduce((sum, item) => sum + (item.revenue || 0), 0),
    [data]
  );

  const totalOrders = useMemo(
    () => (data || []).reduce((sum, item) => sum + (item.orders || 0), 0),
    [data]
  );

  const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  const trend = useMemo(() => {
    if (chartData.length < 2) {
      return { direction: "neutral", value: 0, icon: Minus };
    }
    const last = chartData[chartData.length - 1]?.revenue || 0;
    const prev = chartData[chartData.length - 2]?.revenue || 0;

    if (prev === 0) {
      return {
        direction: last > 0 ? "up" : "neutral",
        value: last > 0 ? 100 : 0,
        icon: last > 0 ? TrendingUp : Minus,
      };
    }

    const change = ((last - prev) / prev) * 100;
    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      value: Math.abs(change),
      icon: change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus,
    };
  }, [chartData]);

  // ==========================================
  // RESPONSIVE FLAGS
  // ==========================================
  const isMobile = containerWidth < BREAKPOINTS.MOBILE;
  const isTablet =
    containerWidth >= BREAKPOINTS.MOBILE &&
    containerWidth < BREAKPOINTS.TABLET;
  const isSmallMobile = containerWidth < 400;

  // ✅ HEIGHT EKSPLISIT (angka, bukan "100%") — kunci hilangkan warning
  const chartHeight = isMobile ? 280 : isTablet ? 320 : 360;

  // ✅ Only render chart jika:
  // 1. Visible di viewport (IntersectionObserver)
  // 2. Width valid (>= MIN_CHART_WIDTH)
  // 3. Data ada
  const shouldRenderChart =
    isVisible && containerWidth >= MIN_CHART_WIDTH && chartData.length > 0;

  const TrendIcon = trend.icon;
  const isEmptyData = !data || chartData.length === 0;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-blue-100/60 shadow-sm shadow-blue-100/40 overflow-hidden hover:shadow-lg hover:shadow-blue-100/60 transition-all duration-500 group">
      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}
      <div className="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-blue-50/80">
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-100/40 to-sky-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-lg shadow-blue-200/50">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                Grafik Pendapatan
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-50 rounded-full ring-1 ring-blue-100 whitespace-nowrap">
                  {months} Bln
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                Transaksi <span className="font-semibold text-blue-600">Selesai</span>
              </p>
            </div>
          </div>

          {chartData.length >= 2 && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all ring-1 w-fit",
                trend.direction === "up" &&
                  "bg-emerald-50 text-emerald-700 ring-emerald-200",
                trend.direction === "down" &&
                  "bg-rose-50 text-rose-700 ring-rose-200",
                trend.direction === "neutral" &&
                  "bg-slate-50 text-slate-600 ring-slate-200"
              )}
            >
              <TrendIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {trend.value.toFixed(1)}% vs bulan lalu
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* CHART AREA */}
      {/* ========================================== */}
      <div className="px-2 sm:px-6 py-4 sm:py-5">
        {isEmptyData ? (
          <EmptyChartState />
        ) : (
          <div
            ref={containerRef}
            className="w-full relative"
            style={{ height: `${chartHeight}px`, minHeight: "240px" }}
          >
            {/* ✅ Skeleton: hanya saat pertama kali belum visible */}
            {!isVisible && <ChartSkeleton />}

            {/* ✅ Chart wrapper dengan fade transition (TIDAK unmount/remount) */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                shouldRenderChart ? "opacity-100" : "opacity-0"
              )}
            >
              {shouldRenderChart && (
                <ResponsiveContainer
                  // ✅ KUNCI: height sebagai ANGKA, bukan "100%"
                  // Recharts tidak perlu ukur parent → TIDAK ADA warning
                  width="100%"
                  height={chartHeight}
                >
                  <ComposedChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: isMobile ? 5 : 15,
                      left: isMobile ? -10 : 0,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="blueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop
                          offset="50%"
                          stopColor="#0ea5e9"
                          stopOpacity={0.85}
                        />
                        <stop
                          offset="100%"
                          stopColor="#06b6d4"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                      <linearGradient
                        id="pinkGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop
                          offset="100%"
                          stopColor="#f43f5e"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <filter
                        id="barShadow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="2"
                          floodColor="#3b82f6"
                          floodOpacity="0.2"
                        />
                      </filter>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: isSmallMobile ? 9 : 11,
                        fill: "#64748b",
                        fontWeight: 500,
                      }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                      interval={isMobile ? "preserveStartEnd" : 0}
                      tickMargin={8}
                      height={30}
                    />

                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => {
                        if (value >= 1000000)
                          return `${(value / 1000000).toFixed(0)}jt`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                        return value;
                      }}
                      tick={{ fontSize: isSmallMobile ? 9 : 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={isMobile ? 35 : 50}
                    />

                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: isSmallMobile ? 9 : 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={isMobile ? 20 : 30}
                    />

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(59, 130, 246, 0.04)" }}
                    />

                    <Legend
                      wrapperStyle={{
                        fontSize: isSmallMobile ? "10px" : "11px",
                        paddingTop: "12px",
                        fontWeight: 500,
                      }}
                      iconType="circle"
                      iconSize={8}
                    />

                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      fill="url(#pinkGradient)"
                      stroke="transparent"
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />

                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Pendapatan"
                      fill="url(#blueGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={isMobile ? 24 : 40}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      filter="url(#barShadow)"
                    />

                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Jumlah Order"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{
                        fill: "#ffffff",
                        stroke: "#f43f5e",
                        strokeWidth: 2,
                        r: isSmallMobile ? 2.5 : 3.5,
                      }}
                      activeDot={{
                        r: isSmallMobile ? 4 : 5.5,
                        fill: "#f43f5e",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      isAnimationActive={true}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* SUMMARY STATS */}
      {/* ========================================== */}
      {chartData.length > 0 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50/50 to-sky-50/50 border-t border-blue-50/80">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <ChartStat
              label="Total Pendapatan"
              value={formatRupiah(totalRevenue)}
              color="blue"
              icon={<TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            />
            <ChartStat
              label="Total Order"
              value={totalOrders.toLocaleString("id-ID")}
              color="rose"
              icon={<BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            />
            <ChartStat
              label="Rata-rata/Bulan"
              value={formatRupiah(avgRevenue)}
              color="sky"
              icon={<Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CHART STAT
// ==========================================
const ChartStat = ({ label, value, color, icon }) => {
  const colors = {
    blue: { icon: "bg-blue-100 text-blue-600", value: "text-blue-700" },
    rose: { icon: "bg-rose-100 text-rose-600", value: "text-rose-700" },
    sky: { icon: "bg-sky-100 text-sky-600", value: "text-sky-700" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="text-center group">
      <div
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
          c.icon
        )}
      >
        {icon}
      </div>
      <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-0.5 sm:mb-1 leading-tight px-1 truncate">
        {label}
      </p>
      <p className={cn("text-xs sm:text-base font-bold truncate", c.value)}>
        {value}
      </p>
    </div>
  );
};

// ==========================================
// EMPTY STATE
// ==========================================
const EmptyChartState = () => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400">
    <div className="relative">
      <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-60 scale-125" />
      <BarChart3 className="relative w-12 h-12 sm:w-14 sm:h-14 text-blue-300" />
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-600">
      Belum ada data chart
    </p>
    <p className="text-xs text-slate-400 mt-1 text-center px-4">
      Data akan muncul setelah ada transaksi selesai
    </p>
  </div>
);

// ==========================================
// SKELETON
// ==========================================
const ChartSkeleton = () => (
  <div className="w-full h-full flex items-end justify-around gap-1.5 sm:gap-3 p-3 sm:p-4">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="flex-1 relative overflow-hidden rounded-t-lg"
        style={{
          height: `${30 + ((i * 15) % 55)}%`,
          animationDelay: `${i * 100}ms`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-100 via-sky-50 to-blue-50" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      </div>
    ))}
  </div>
);

// ==========================================
// CUSTOM TOOLTIP
// ==========================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-200/50 border border-blue-100 min-w-[160px] sm:min-w-[190px]">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-blue-50/80">
        <div className="w-1 h-3.5 sm:h-4 bg-gradient-to-b from-blue-500 to-sky-500 rounded-full" />
        <p className="text-[11px] sm:text-xs font-bold text-slate-800">
          {label}
        </p>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 sm:gap-3"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-white flex-shrink-0"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 0 1px ${entry.color}30`,
                }}
              />
              <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
                {entry.name}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 whitespace-nowrap">
              {entry.name === "Pendapatan"
                ? formatRupiah(entry.value)
                : `${entry.value} order`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;