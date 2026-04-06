import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  HandshakeIcon,
  Tag,
  Settings,
  HelpCircle,
  Activity,
  ShieldOff,
  ClipboardList,
  Wand2,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { href: "/",    label: "Dashboard",     icon: LayoutDashboard, active: true  },
      { href: "#sales",     label: "Sales",         icon: ShoppingCart    },
      { href: "#deals",     label: "Deal Analyzer", icon: HandshakeIcon   },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "#listings",  label: "Inventory",         icon: Package   },
      { href: "#supplies",  label: "Shipping Supplies", icon: Truck     },
      { href: "#",          label: "Blocked Buyers",    icon: ShieldOff },
    ],
  },
  {
    label: "Tasks",
    items: [
      { href: "#", label: "Price Review",    icon: Tag           },
      { href: "#", label: "Inventory Count", icon: ClipboardList  },
      { href: "#", label: "Smart Pricing",   icon: Wand2          },
    ],
  },
];

export function DemoSidebar() {
  return (
    <aside className="hidden lg:flex w-64 bg-slate-100 border-r border-slate-200/30 flex-col gap-1 lg:sticky lg:top-0 lg:h-screen lg:z-40">
      {/* Branding */}
      <div className="h-14 shrink-0 flex items-center px-5 border-b border-slate-200/40 gap-2">
        <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <span className="font-headline font-extrabold text-base tracking-tight text-slate-900">Profisely</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon, active }) => (
                <a
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/10"
                      : "text-slate-500 hover:text-slate-900 hover:translate-x-1"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-slate-900" : "text-slate-400"}`} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="shrink-0 flex flex-col gap-1 px-4 pb-4 border-t border-slate-200/50 pt-3">
        {[
          { label: "Settings",     icon: Settings   },
          { label: "Help Center",  icon: HelpCircle },
          { label: "System Status",icon: Activity   },
        ].map(({ label, icon: Icon }) => (
          <span key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 cursor-default">
            <Icon className="w-4 h-4 text-slate-300" />
            {label}
          </span>
        ))}
      </div>
    </aside>
  );
}
