const DashboardSkeleton = () => {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-blue-100/60 p-5 overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-sky-100 rounded-xl" />
              <div className="w-14 h-6 bg-blue-50 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-gradient-to-r from-blue-50 to-sky-50 rounded w-3/4" />
              <div className="h-2 bg-slate-100 rounded w-1/3 mt-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-3xl border border-blue-100/60 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-sky-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
        <div className="h-80 flex items-end justify-around gap-3 px-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-blue-100 to-sky-100 rounded-t-xl"
              style={{ height: `${25 + (i * 12) % 55}%` }}
            />
          ))}
        </div>
      </div>

      {/* Production Summary */}
      <div className="bg-white rounded-3xl border border-blue-100/60 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-sky-100 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 p-4 bg-blue-50/50 rounded-2xl ring-1 ring-blue-100/50">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-sky-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-2 bg-slate-200 rounded w-2/3" />
                <div className="h-6 bg-white rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-blue-100/60 p-5">
            <div className="flex items-center gap-3 pb-4 mb-3 border-b border-blue-50">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-sky-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-2 bg-slate-50 rounded w-1/3" />
                  </div>
                  <div className="h-3 bg-blue-50 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;