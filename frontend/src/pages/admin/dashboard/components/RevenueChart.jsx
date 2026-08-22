import { useMemo, useState, useEffect, useRef } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, Legend, Area,
} from "recharts";
import { formatRupiah } from "../../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../../lib/utils";

const RevenueChart = ({ data, months }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // ✅ FIX 1: IntersectionObserver - render hanya saat container visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ✅ FIX 2: ResizeObserver - track dimensi aktual
  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  const chartData = useMemo(() => {
    return (data || []).map((item) => ({
      ...item,
      revenueFormatted: formatRupiah(item.revenue),
    }));
  }, [data]);

  const totalRevenue = (data || []).reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = (data || []).reduce((sum, item) => sum + (item.orders || 0), 0);
  const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral', value: 0 };
    const last = chartData[chartData.length - 1]?.revenue || 0;
    const prev = chartData[chartData.length - 2]?.revenue || 0;
    if (prev === 0) return { direction: last > 0 ? 'up' : 'neutral', value: 100 };
    const change = ((last - prev) / prev) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: Math.abs(change),
    };
  }, [chartData]);

  const isMobile = containerSize.width < 640;
  const hasValidSize = containerSize.width >= 300 && containerSize.height >= 200;

  return (
    <div className="bg-white rounded-3xl border border-blue-100/60 shadow-sm shadow-blue-100/40 overflow-hidden hover:shadow-lg hover:shadow-blue-100/60 transition-shadow duration-500">
      
      {/* Header */}
      <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-blue-50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/40 to-sky-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-30" />
              <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-lg shadow-blue-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                Grafik Pendapatan
                <span className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-full ring-1 ring-blue-100">
                  {months} Bln
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Transaksi <span className="font-semibold text-blue-600">Selesai</span>
              </p>
            </div>
          </div>

          {chartData.length >= 2 && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ring-1",
              trend.direction === 'up' && "bg-emerald-50 text-emerald-700 ring-emerald-200",
              trend.direction === 'down' && "bg-rose-50 text-rose-700 ring-rose-200",
              trend.direction === 'neutral' && "bg-slate-50 text-slate-600 ring-slate-200"
            )}>
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{trend.value.toFixed(1)}% vs bulan lalu</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="px-3 sm:px-6 py-5">
        {!data || chartData.length === 0 ? (
          <EmptyChartState />
        ) : (
          <div
            ref={containerRef}
            className="w-full relative"
            style={{ 
              height: isMobile ? '280px' : '360px',
              minHeight: '280px',
              minWidth: '300px',
            }}
          >
            {/* ✅ FIX 3: Conditional render - hanya jika visible + valid size */}
            {!isVisible || !hasValidSize ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer 
                width="100%" 
                height="100%"
                minWidth={300}
                minHeight={280}
                debounce={150}
              >
                <ComposedChart 
                  data={chartData}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 5 : 15, 
                    left: isMobile ? -15 : -5, 
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                      <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.25" />
                    </filter>
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e0f2fe"
                    vertical={false}
                  />
                  
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e0f2fe", strokeWidth: 1 }}
                    interval={isMobile ? "preserveStartEnd" : 0}
                    tickMargin={10}
                    height={30}
                  />
                  
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                      return value;
                    }}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    width={isMobile ? 40 : 55}
                  />
                  
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    width={isMobile ? 25 : 35}
                  />
                  
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(59, 130, 246, 0.06)", radius: 4 }}
                  />
                  
                  <Legend
                    wrapperStyle={{ 
                      fontSize: "11px", 
                      paddingTop: "14px",
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
                    radius={[10, 10, 0, 0]}
                    maxBarSize={isMobile ? 28 : 45}
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
                      r: 3.5,
                    }}
                    activeDot={{ 
                      r: 5.5,
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
        )}
      </div>

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50/40 to-sky-50/40 border-t border-blue-50">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <ChartStat
              label="Total Pendapatan"
              value={formatRupiah(totalRevenue)}
              color="blue"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <ChartStat
              label="Total Order"
              value={totalOrders.toLocaleString('id-ID')}
              color="rose"
              icon={<BarChart3 className="w-3.5 h-3.5" />}
            />
            <ChartStat
              label="Rata-rata/Bulan"
              value={formatRupiah(avgRevenue)}
              color="sky"
              icon={<Sparkles className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ChartStat = ({ label, value, color, icon }) => {
  const colors = {
    blue: { icon: "bg-blue-100 text-blue-600", value: "text-blue-700" },
    rose: { icon: "bg-rose-100 text-rose-600", value: "text-rose-700" },
    sky: { icon: "bg-sky-100 text-sky-600", value: "text-sky-700" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="text-center group">
      <div className={cn(
        "w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
        c.icon
      )}>
        {icon}
      </div>
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={cn("text-sm sm:text-base font-bold truncate", c.value)}>
        {value}
      </p>
    </div>
  );
};

const EmptyChartState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <div className="relative">
      <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-60 scale-125" />
      <BarChart3 className="relative w-14 h-14 text-blue-300" />
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-600">Belum ada data chart</p>
    <p className="text-xs text-slate-400 mt-1">Data akan muncul setelah ada transaksi selesai</p>
  </div>
);

const ChartSkeleton = () => (
  <div className="w-full h-full flex items-end justify-around gap-3 p-4 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="flex-1 bg-gradient-to-t from-blue-100 to-sky-100 rounded-t-xl"
        style={{ height: `${25 + (i * 12) % 50}%` }}
      />
    ))}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-lg p-3.5 rounded-2xl shadow-xl shadow-blue-200/50 border border-blue-100 min-w-[190px]">
      <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-blue-50">
        <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-sky-500 rounded-full" />
        <p className="text-xs font-bold text-slate-800">{label}</p>
      </div>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-white"
                style={{ 
                  backgroundColor: entry.color,
                  boxShadow: `0 0 0 1px ${entry.color}30`,
                }}
              />
              <span className="text-[11px] text-slate-600 font-medium">
                {entry.name}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-800">
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