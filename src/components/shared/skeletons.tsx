export function HoroscopeSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto h-4 w-32 shimmer rounded" />
        <div className="mx-auto mt-3 h-8 w-64 shimmer rounded" />
        <div className="mx-auto mt-2 h-4 w-48 shimmer rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shimmer rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-20 shimmer rounded" />
                <div className="mt-1 h-3 w-28 shimmer rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full shimmer rounded" />
              <div className="h-3 w-5/6 shimmer rounded" />
              <div className="h-3 w-4/6 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SignProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="text-center">
        <div className="mx-auto h-24 w-24 shimmer rounded-full" />
        <div className="mx-auto mt-4 h-4 w-32 shimmer rounded" />
        <div className="mx-auto mt-2 h-8 w-40 shimmer rounded" />
        <div className="mx-auto mt-1 h-3 w-24 shimmer rounded" />
      </div>
      <div className="my-8 h-px bg-border" />
      <div className="space-y-4">
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-4 w-5/6 shimmer rounded" />
      </div>
      <div className="mt-8 card p-6 space-y-3">
        <div className="h-4 w-32 shimmer rounded" />
        <div className="h-3 w-full shimmer rounded" />
        <div className="h-3 w-full shimmer rounded" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 shimmer rounded-full" />
        <div>
          <div className="h-4 w-24 shimmer rounded" />
          <div className="mt-1 h-3 w-32 shimmer rounded" />
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 shimmer rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full shimmer rounded" />
            <div className="h-3 w-5/6 shimmer rounded" />
          </div>
        </div>
        <div className="flex gap-3 flex-row-reverse">
          <div className="h-8 w-8 shimmer rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full shimmer rounded" />
            <div className="h-3 w-4/6 shimmer rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}