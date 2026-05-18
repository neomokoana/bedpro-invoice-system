/**
 * Skeleton shown while any page under (app) streams in. Sits inside the
 * sidebar+header shell from layout.tsx, so users always see the chrome.
 */
export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 bg-gray-200 animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bp-card p-4">
            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-3" />
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded mt-3" />
          </div>
        ))}
      </div>
      <div className="bp-card p-4">
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-full bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
