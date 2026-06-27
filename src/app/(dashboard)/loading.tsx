export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div>
        <div className="h-7 w-48 rounded-lg skeleton-shimmer mb-2" />
        <div className="h-4 w-72 rounded skeleton-shimmer" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-28">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-7 w-32 rounded-lg skeleton-shimmer" />
                <div className="h-3 w-28 rounded skeleton-shimmer" />
              </div>
              <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-64 skeleton-shimmer" />
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-64 skeleton-shimmer" />
      </div>

      {/* Feed skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-64 skeleton-shimmer" />
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-64 skeleton-shimmer" />
      </div>
    </div>
  );
}
