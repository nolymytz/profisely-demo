import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Missing Supabase env vars (SUPABASE_URL=${!!url}, SUPABASE_SERVICE_ROLE_KEY=${!!key})`
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface SaleRow {
  id: string;
  title: string;
  sale_price: number;
  net_profit: number;
  margin_pct: number | null;
  sale_date: string;
  buyer_username: string | null;
  actual_shipping_cost: number;
  ebay_final_value_fee: number;
  ebay_ad_fee: number;
  paypal_fee: number;
  supply_cost: number;
  purchase_cost: number;
  is_returned: boolean;
}

export interface ItemRow {
  id: string;
  title: string;
  sku: string | null;
  listing_price: number | null;
  purchase_cost: number;
  status: string;
  image_url: string | null;
  ebay_category: string | null;
  quantity: number;
}

export interface SupplyRow {
  id: string;
  name: string;
  full_name: string | null;
  category: string | null;
  unit_cost: number;
  quantity_remaining: number;
  quantity_on_hand: number;
  is_favorite: boolean;
  image_url: string | null;
}

export interface ChartPoint {
  date: string;
  revenue: number;
  netProfit: number;
}

export interface Metrics {
  totalRevenue: number;
  totalNetProfit: number;
  totalFees: number;
  totalCogs: number;
  saleCount: number;
  averageMarginPct: number;
  returnCount: number;
}

export interface DashboardData {
  metrics: Metrics;
  recentSales: SaleRow[];
  chartData: ChartPoint[];
  activeListings: ItemRow[];
  supplies: SupplyRow[];
  lastFetched: string;
  error?: string;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const lastFetched = now.toISOString();

  try {
    const sb = getSupabase();

    // If a specific user ID is set, filter to that user.
    // Otherwise, service role key bypasses RLS and we get all rows (fine for single-user demo).
    const userId = process.env.DEMO_USER_ID || null;
    console.log("[demo] DEMO_USER_ID:", userId ?? "(not set, querying all)");

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const twoYearsAgo = new Date(now.getTime() - 730 * 86400000);

    // Build queries. userId filter is applied only if DEMO_USER_ID is set.
    const ytdSalesBase = sb
      .from("sales_with_profit")
      .select(
        "id,title,sale_price,net_profit,margin_pct,sale_date,actual_shipping_cost,ebay_final_value_fee,ebay_ad_fee,paypal_fee,supply_cost,purchase_cost,is_returned"
      )
      .eq("is_cancelled", false)
      .gte("sale_date", twoYearsAgo.toISOString())
      .order("sale_date", { ascending: true });

    const recentBase = sb
      .from("sales_with_profit")
      .select(
        "id,title,sale_price,net_profit,margin_pct,sale_date,buyer_username,actual_shipping_cost,ebay_final_value_fee,ebay_ad_fee,paypal_fee,supply_cost,purchase_cost,is_returned"
      )
      .eq("is_cancelled", false)
      .order("sale_date", { ascending: false })
      .limit(25);

    const listingsBase = sb
      .from("items")
      .select(
        "id,title,sku,listing_price,purchase_cost,status,image_url,ebay_category,quantity"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24);

    const suppliesBase = sb
      .from("shipping_supplies_with_stock")
      .select(
        "id,name,full_name,category,unit_cost,quantity_remaining,quantity_on_hand,is_favorite,image_url"
      )
      .order("is_favorite", { ascending: false })
      .limit(30);

    const [ytdSalesRes, recentSalesRes, listingsRes, suppliesRes] =
      await Promise.all([
        userId ? ytdSalesBase.eq("user_id", userId) : ytdSalesBase,
        userId ? recentBase.eq("user_id", userId) : recentBase,
        userId ? listingsBase.eq("user_id", userId) : listingsBase,
        userId ? suppliesBase.eq("user_id", userId) : suppliesBase,
      ]);

    console.log(
      "[demo] ytd:", ytdSalesRes.data?.length ?? 0,
      "| recent:", recentSalesRes.data?.length ?? 0,
      "| listings:", listingsRes.data?.length ?? 0,
      "| supplies:", suppliesRes.data?.length ?? 0
    );
    if (ytdSalesRes.error) console.error("[demo] ytd error:", ytdSalesRes.error.message);
    if (recentSalesRes.error) console.error("[demo] recent error:", recentSalesRes.error.message);
    if (listingsRes.error) console.error("[demo] listings error:", listingsRes.error.message);
    if (suppliesRes.error) console.error("[demo] supplies error:", suppliesRes.error.message);

    const allSales = (ytdSalesRes.data ?? []) as SaleRow[];
    const recentSales = (recentSalesRes.data ?? []) as SaleRow[];

    // 30-day metrics
    const last30 = allSales.filter(
      (s) => !s.is_returned && new Date(s.sale_date) >= thirtyDaysAgo
    );
    const marginsWithValue = last30.filter((s) => s.margin_pct != null);

    const metrics: Metrics = {
      totalRevenue: round(last30.reduce((acc, s) => acc + s.sale_price, 0)),
      totalNetProfit: round(last30.reduce((acc, s) => acc + s.net_profit, 0)),
      totalFees: round(
        last30.reduce(
          (acc, s) =>
            acc +
            (s.ebay_final_value_fee +
              (s.ebay_ad_fee ?? 0) +
              (s.paypal_fee ?? 0)),
          0
        )
      ),
      totalCogs: round(
        last30.reduce((acc, s) => acc + (s.purchase_cost ?? 0), 0)
      ),
      saleCount: last30.length,
      averageMarginPct:
        marginsWithValue.length > 0
          ? round(
              marginsWithValue.reduce(
                (acc, s) => acc + (s.margin_pct as number),
                0
              ) / marginsWithValue.length
            )
          : 0,
      returnCount: allSales.filter((s) => s.is_returned).length,
    };

    // 90-day chart data (daily aggregates)
    const chartByDay: Record<string, { revenue: number; netProfit: number }> =
      {};
    for (const s of allSales) {
      if (new Date(s.sale_date) < ninetyDaysAgo) continue;
      if (s.is_returned) continue;
      const day = s.sale_date.slice(0, 10);
      if (!chartByDay[day]) chartByDay[day] = { revenue: 0, netProfit: 0 };
      chartByDay[day].revenue += s.sale_price;
      chartByDay[day].netProfit += s.net_profit;
    }
    const chartData: ChartPoint[] = Object.entries(chartByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        revenue: round(v.revenue),
        netProfit: round(v.netProfit),
      }));

    console.log("[demo] metrics saleCount:", metrics.saleCount, "revenue:", metrics.totalRevenue);

    return {
      metrics,
      recentSales,
      chartData,
      activeListings: (listingsRes.data ?? []) as ItemRow[],
      supplies: (suppliesRes.data ?? []) as SupplyRow[],
      lastFetched,
    };
  } catch (err) {
    console.error("[demo] getDashboardData error:", err);
    return emptyData(
      lastFetched,
      err instanceof Error ? err.message : "Unknown error"
    );
  }
}

function emptyData(lastFetched: string, error?: string): DashboardData {
  return {
    metrics: {
      totalRevenue: 0,
      totalNetProfit: 0,
      totalFees: 0,
      totalCogs: 0,
      saleCount: 0,
      averageMarginPct: 0,
      returnCount: 0,
    },
    recentSales: [],
    chartData: [],
    activeListings: [],
    supplies: [],
    lastFetched,
    error,
  };
}
