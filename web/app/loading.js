export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-[#FAF7F2] px-4 py-10 md:px-12">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 h-8 w-48 rounded bg-brand-primary/10" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="aspect-[3/4] bg-brand-primary/10" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-24 rounded bg-brand-gold/20" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-brand-primary/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
