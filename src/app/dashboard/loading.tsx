export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="skeleton h-11 w-28 rounded-xl" />
      </div>
      <div className="skeleton mb-6 h-12 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex gap-3">
              <div className="skeleton h-11 w-9" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              <div className="skeleton h-6 w-14 rounded-lg" />
              <div className="skeleton h-6 w-12 rounded-lg" />
              <div className="skeleton h-6 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
