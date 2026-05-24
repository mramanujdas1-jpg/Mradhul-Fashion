export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 py-8 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:block">
          <div className="h-5 w-32 animate-pulse rounded bg-brand-primary/10" />
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-4 animate-pulse rounded bg-gray-100" />
          ))}
        </aside>
        <section>
          <div className="mb-6 h-10 w-full animate-pulse rounded-full bg-white shadow-sm" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="aspect-[3/4] animate-pulse bg-brand-primary/10" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-brand-gold/20" />
                  <div className="h-4 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-brand-primary/10" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
