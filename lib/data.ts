import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Missing Supabase env vars (url=${!!url}, key=${!!key})`
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserId(): Promise<string | null> {
  // 1. Explicit override via env var (most reliable)
  if (process.env.DEMO_USER_ID) {
    console.log("[demo] Using DEMO_USER_ID from env:", process.env.DEMO_USER_ID);
    return process.env.DEMO_USER_ID;
  }

  const sb = getSupabase();

  // 2. Try user_settings table
  const { data: settings, error: settingsErr } = await sb
    .from("user_settings")
    .select("user_id")
    .limit(1)
    .single();
  if (settingsErr) console.log("[demo] user_settings error:", settingsErr.message);
  if (settings?.user_id) {
    console.log("[demo] Found user_id from user_settings:", settings.user_id);
    return settings.user_id;
  }

  // 3. Try sales_with_profit view
  const { data: sale, error: saleErr } = await sb
    .from("sales_with_profit")
    .select("user_id")
    .limit(1)
    .single();
  if (saleErr) console.log("[demo] sales_with_profit error:", saleErr.message);
  if (sale?.user_id) {
    console.log("[demo] Found user_id from sales_with_profit:", sale.user_id);
    return sale.user_id;
  }

  // 4. Try items table
  const { data: item, error: itemErr } = await sb
    .from("items")
    .select("user_id")
    .limit(1)
    .single();
  if (itemErr) console.log("[demo] items error:", itemErr.message);
  if (item?.user_id) {
    console.log("[demo] Found user_id from items:", item.user_id);
    return item.user_id;
  }

  console.log("[demo] Could not resolve user_id from any table");
  return null;
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
    const userId = await getUserId();

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const twoYearsAgo = new Date(now.getTime() - 730 * 86400000);

    // Build queries — filter by user_id if we found one, otherwise return all
    // (service role key bypasses RLS so this is safe for a demo)
    function applyUserFilter<T extends { eq: (col: string, val: string) => T }>(
      query: T
    ): T {
      if (userId) return query.eq("user_id", userId);
      return query;
    }

    const ytdSalesQuery = applyUserFilter(
      sb
        .from("sales_with_profit")
        .select(
          "id,title,sale_price,net_profit,margin_pct,sale_date,actual_shipping_cost,ebay_final_value_fee,ebay_ad_fee,paypal_fee,supply_cost,purchase_cost,is_returned,user_id"
        )
        .eq("is_cancelled", false)
        .gte("sale_date", twoYearsAgo.toISOString())
        .order("sale_date", { ascending: true })
    );

    const recentSalesQuery = applyUserFilter(
      sb
        .from("sales_with_profit")
        .select(
          "id,title,sale_price,net_profit,margin_pct,sale_date,buyer_username,actual_shipping_cost,ebay_final_value_fee,ebay_ad_fee,paypal_fee,supply_cost,purchase_cost,is_returned"
        )
        .eq("is_cancelled", false)
        .order("sale_date", { ascending: false })
        .limit(25)
    );

    const listingsQuery = applyUserFilter(
      sb
        .from("items")
        .select(
          "id,title,sku,listing_price,purchase_cost,status,image_url,ebay_category,quantity"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24)
    );

    const suppliesQuery = applyUserFilter(
      sb
        .from("shipping_supplies_with_stock")
        .select(
          "id,name,full_name,category,unit_cost,quantity_remaining,quantity_on_hand,is_favorite,image_url"
        )
        .order("is_favorite", { ascending: false })
        .limit(30)
    );

    const [ytdSalesRes, recentSalesRes, listingsRes, suppliesRes] =
      await Promise.all([
        ytdSalesQuery,
        recentSalesQuery,
        listingsQuery,
        suppliesQuery,
      ]);

    console.log("[demo] ytd sales count:", ytdSalesRes.data?.length ?? 0, ytdSalesRes.error?.message ?? "");
    console.log("[demo] recent sales count:", recentSalesRes.data?.length ?? 0, recentSalesRes.error?.message ?? "");
    console.log("[demo] listings count:", listingsRes.data?.length ?? 0, listingsRes.error?.message ?? "");
    console.log("[demo] supplies count:", suppliesRes.data?.length ?? 0, suppliesRes.error?.message ?? "");

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
            (s.ebay_final_value_fee + (s.ebay_ad_fee ?? 0) + (s.paypal_fee ?? 0)),
          0
        )
      ),
      totalCogs: round(last30.reduce((acc, s) => acc + (s.purchase_cost ?? 0), 0)),
      saleCount: last30.length,
      averageMarginPct:
        marginsWithValue.length > 0
          ? round(
              marginsWithValue.reduce((acc, s) => acc + s.margin_pct!, 0) /
                marginsWithValue.length
            )
          : 0,
      returnCount: allSales.filter((s) => s.is_returned).length,
    };

    // 90-day chart data (daily aggregates)
    const chartByDay: Record<string, { revenue: number; netProfit: number }> = {};
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

    console.log("[demo] metrics:", JSON.stringify(metrics));

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
