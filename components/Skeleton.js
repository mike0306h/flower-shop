'use client'

export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-96 rounded-2xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-1/4" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-14 flex-1 rounded-xl" />
            <Skeleton className="h-14 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Skeleton className="h-10 w-1/4 mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl mt-8" />
    </div>
  )
}
