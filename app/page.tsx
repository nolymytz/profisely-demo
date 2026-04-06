import dynamic from "next/dynamic";
import { getDashboardData } from "@/lib/data";
import { format, parseISO } from "date-fns";

const Charts = dynamic(() => import("@/components/DemoCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0,1,2].map((i) => (
        <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 h-44 animate-pulse" />
      ))}
    </div>
  ),
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtExact(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function formatDate(iso: string) {
  try { return format(parseISO(iso), "MMM d, yyyy"); } catch { return iso.slice(0, 10); }
}

export default async function Home() {
  const data = await getDashboardData();
  const { metrics, recentSales, chartData, activeListings, supplies, lastFetched } = data;
  const snapshotDate = format(parseISO(lastFetched), "MMM d, yyyy");

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Snapshot as of {snapshotDate}</p>
        </div>
        <span className="text-xs bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-semibold">
          Last 12 months
        </span>
      </div>

      {data.error && (
        <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm">
          <strong>Data error:</strong> {data.error}
        </div>
      )}

      {/* Metrics grid */}
      <div id="dashboard" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "TOTAL REVENUE",   value: fmt(metrics.totalRevenue),    badge: `${metrics.saleCount} sales`,        badgeClass: "bg-tertiary-container text-on-tertiary-container" },
          { label: "NET PROFIT",       value: fmt(metrics.totalNetProfit),   badge: metrics.totalNetProfit >= 0 ? "Positive" : "Negative", badgeClass: metrics.totalNetProfit >= 0 ? "bg-tertiary-container text-on-tertiary-container" : "bg-error-container text-on-error-container" },
          { label: "AVG MARGIN",       value: `${metrics.averageMarginPct.toFixed(1)}%`, badge: metrics.averageMarginPct >= 20 ? "Healthy" : metrics.averageMarginPct >= 10 ? "Stable" : "Low", badgeClass: "text-on-surface-variant", plain: true },
          { label: "TOTAL FEES PAID",  value: fmt(metrics.totalFees),       badge: "Marketplace + payment",            badgeClass: "text-on-surface-variant", plain: true },
          { label: "COGS",             value: fmt(metrics.totalCogs),        badge: "Cost of goods",                   badgeClass: "text-on-surface-variant", plain: true },
          { label: "RETURNS",          value: metrics.returnCount.toString(), badge: metrics.returnCount === 0 ? "None" : `${metrics.returnCount} returned`, badgeClass: metrics.returnCount > 0 ? "bg-error-container text-on-error-container" : "text-on-surface-variant", plain: metrics.returnCount === 0 },
        ].map(({ label, value, badge, badgeClass, plain }) => (
          <div key={label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-1 border border-outline-variant/10">
            <span className="text-on-surface-variant font-label text-[10px] font-semibold tracking-widest uppercase">
              {label}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-headline text-2xl font-bold tabular-nums text-on-surface">{value}</span>
              {plain ? (
                <span className={`text-xs font-medium ${badgeClass}`}>{badge}</span>
              ) : (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeClass}`}>{badge}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <Charts data={chartData} />

      {/* Recent Sales */}
      <section id="sales">
        <h2 className="font-headline text-base font-bold text-on-surface mb-4">Recent Sales</h2>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {recentSales.length === 0 ? (
            <div className="px-6 py-10 text-center text-on-surface-variant text-sm">No sales data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Item</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Sale Price</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Net Profit</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Margin</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Buyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentSales.map((sale) => {
                    const profit = sale.net_profit;
                    const margin = sale.margin_pct;
                    return (
                      <tr key={sale.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-3 max-w-xs">
                          <span className="line-clamp-2 text-on-surface text-sm leading-snug">{sale.title}</span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant text-xs whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                        <td className="px-4 py-3 font-semibold text-on-surface text-right whitespace-nowrap tabular-nums">{fmtExact(sale.sale_price)}</td>
                        <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {profit >= 0 ? "+" : ""}{fmtExact(profit)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {margin != null ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              margin >= 25 ? "bg-tertiary-container text-on-tertiary-container"
                              : margin >= 10 ? "bg-amber-100 text-amber-700"
                              : "bg-error-container text-on-error-container"
                            }`}>{margin.toFixed(1)}%</span>
                          ) : <span className="text-outline">—</span>}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant text-xs">{sale.buyer_username ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Active Listings */}
      <section id="listings">
        <h2 className="font-headline text-base font-bold text-on-surface mb-4">
          Active Listings
          {activeListings.length > 0 && <span className="ml-2 text-xs font-medium text-on-surface-variant">({activeListings.length} shown)</span>}
        </h2>
        {activeListings.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 px-6 py-10 text-center text-on-surface-variant text-sm">No active listings found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeListings.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover bg-surface-container" />
                ) : (
                  <div className="w-full aspect-square bg-surface-container flex items-center justify-center">
                    <svg className="w-8 h-8 text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-on-surface leading-snug line-clamp-2 mb-1">{item.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-on-surface tabular-nums">{item.listing_price != null ? fmtExact(item.listing_price) : "—"}</span>
                    {item.quantity > 1 && <span className="text-xs text-on-surface-variant">×{item.quantity}</span>}
                  </div>
                  {item.purchase_cost > 0 && <p className="text-[10px] text-on-surface-variant mt-0.5">Cost: {fmtExact(item.purchase_cost)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shipping Supplies */}
      <section id="supplies">
        <h2 className="font-headline text-base font-bold text-on-surface mb-4">Shipping Supplies</h2>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {supplies.length === 0 ? (
            <div className="px-6 py-10 text-center text-on-surface-variant text-sm">No supplies found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Supply</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Category</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">On Hand</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {supplies.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-on-surface">{s.full_name ?? s.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.category
                          ? <span className="text-[10px] bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 font-medium">{s.category}</span>
                          : <span className="text-outline">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface font-semibold tabular-nums">{fmtExact(s.unit_cost)}</td>
                      <td className="px-4 py-3 text-right text-on-surface-variant tabular-nums">{s.quantity_on_hand}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={`font-semibold ${
                          s.quantity_remaining <= 2 ? "text-red-500"
                          : s.quantity_remaining <= 10 ? "text-amber-500"
                          : "text-on-surface"
                        }`}>{s.quantity_remaining}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-on-surface-variant pt-4 pb-2">
        Powered by <a href="https://profisely.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">Profisely</a>
        {" "}· Snapshot {snapshotDate}
      </footer>
    </div>
  );
}
