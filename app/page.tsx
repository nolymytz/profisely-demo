import dynamic from "next/dynamic";
import { getDashboardData } from "@/lib/data";
import { format, parseISO } from "date-fns";

const RevenueChart = dynamic(() => import("@/components/RevenueChart"), {
  ssr: false,
  loading: () => (
    <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
  ),
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtExact(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function pct(n: number) { return `${n.toFixed(1)}%`; }
function formatDate(iso: string) {
  try { return format(parseISO(iso), "MMM d, yyyy"); } catch { return iso.slice(0, 10); }
}

export default async function Home() {
  const data = await getDashboardData();
  const { metrics, recentSales, chartData, activeListings, supplies, lastFetched } = data;
  const snapshotDate = format(parseISO(lastFetched), "MMMM d, yyyy 'at' h:mm a");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">Profisely</h1>
              <p className="text-xs text-gray-500">eBay Seller Dashboard</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Data snapshot</p>
            <p className="text-xs font-medium text-gray-600">{snapshotDate}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {data.error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm">
            <strong>Note:</strong> {data.error}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Performance Overview</h2>
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1">Last 30 days</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label="Revenue" value={fmt(metrics.totalRevenue)} sub="Gross sales" color="blue" />
            <MetricCard label="Net Profit" value={fmt(metrics.totalNetProfit)} sub="After all costs" color={metrics.totalNetProfit >= 0 ? "green" : "red"} />
            <MetricCard label="Orders" value={metrics.saleCount.toString()} sub="Completed sales" color="indigo" />
            <MetricCard label="Avg Margin" value={pct(metrics.averageMarginPct)} sub="Profit margin" color={metrics.averageMarginPct >= 20 ? "green" : "amber"} />
            <MetricCard label="eBay Fees" value={fmt(metrics.totalFees)} sub="FVF + ad fees" color="amber" />
            <MetricCard label="Cost of Goods" value={fmt(metrics.totalCogs)} sub="Purchase cost" color="gray" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue vs Net Profit</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 90 days — daily totals</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Net Profit</span>
            </div>
          </div>
          <RevenueChart data={chartData} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Sales</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last {recentSales.length} orders</p>
          </div>
          {recentSales.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No sales data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Item</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Sale Price</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Net Profit</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Margin</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Buyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSales.map((sale) => {
                    const profit = sale.net_profit;
                    const profitColor = profit >= 0 ? "text-emerald-600" : "text-red-500";
                    const margin = sale.margin_pct;
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 max-w-xs"><span className="line-clamp-2 text-gray-800 leading-snug">{sale.title}</span></td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap">{fmtExact(sale.sale_price)}</td>
                        <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap ${profitColor}`}>{profit >= 0 ? "+" : ""}{fmtExact(profit)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {margin != null ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${margin >= 25 ? "bg-emerald-50 text-emerald-700" : margin >= 10 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                              {margin.toFixed(1)}%
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{sale.buyer_username ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Active Listings</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeListings.length > 0 ? `Showing ${activeListings.length} active items` : "No active listings"}</p>
            </div>
          </div>
          {activeListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-400 text-sm">No active listings found</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {activeListings.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover bg-gray-50" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-700 leading-snug line-clamp-2 mb-1">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{item.listing_price != null ? fmtExact(item.listing_price) : "—"}</span>
                      {item.quantity > 1 && <span className="text-xs text-gray-400">×{item.quantity}</span>}
                    </div>
                    {item.purchase_cost > 0 && <p className="text-xs text-gray-400 mt-0.5">Cost: {fmtExact(item.purchase_cost)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Shipping Supplies</h2>
            <p className="text-xs text-gray-400 mt-0.5">{supplies.length} supplies tracked</p>
          </div>
          {supplies.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No supplies found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Supply</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">On Hand</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {supplies.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {s.is_favorite && (
                            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                          <span className="text-gray-800">{s.full_name ?? s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.category ? <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s.category}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">{fmtExact(s.unit_cost)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{s.quantity_on_hand}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${s.quantity_remaining <= 2 ? "text-red-500" : s.quantity_remaining <= 10 ? "text-amber-600" : "text-gray-700"}`}>
                          {s.quantity_remaining}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-gray-400 pb-8">
          Powered by{" "}
          <a href="https://profisely.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Profisely</a>
          {" "}· Data as of {snapshotDate}
        </footer>
      </main>
    </div>
  );
}

type Color = "blue" | "green" | "red" | "indigo" | "amber" | "gray";
const colorMap: Record<Color, { bg: string; text: string; label: string }> = {
  blue:   { bg: "bg-blue-50",    text: "text-blue-700",    label: "text-blue-500" },
  green:  { bg: "bg-emerald-50", text: "text-emerald-700", label: "text-emerald-500" },
  red:    { bg: "bg-red-50",     text: "text-red-700",     label: "text-red-500" },
  indigo: { bg: "bg-indigo-50",  text: "text-indigo-700",  label: "text-indigo-500" },
  amber:  { bg: "bg-amber-50",   text: "text-amber-700",   label: "text-amber-500" },
  gray:   { bg: "bg-gray-100",   text: "text-gray-700",    label: "text-gray-500" },
};
function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: Color }) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-xl p-4 border border-white`}>
      <p className={`text-xs font-medium ${c.label} uppercase tracking-wide`}>{label}</p>
      <p className={`text-2xl font-bold ${c.text} mt-1 leading-none`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
