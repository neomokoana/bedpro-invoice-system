/**
 * Root-level loading state — shown while server components are streaming.
 * Kept minimal because most loading happens inside the (app) layout below.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6]">
      <div className="flex items-center gap-3 text-gray-500">
        <span className="h-2 w-2 rounded-full bg-[#E8191A] animate-pulse" />
        <span className="h-2 w-2 rounded-full bg-[#E8191A] animate-pulse" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 rounded-full bg-[#E8191A] animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
