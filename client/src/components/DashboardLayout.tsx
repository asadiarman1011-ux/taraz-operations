import {
  Archive,
  Boxes,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  PackageCheck,
  Settings,
  Truck,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { useLocation } from "wouter";

const menuItems = [
  { icon: LayoutDashboard, label: "نمای کلی", path: "/", exact: true },
  { icon: ClipboardList, label: "سفارش‌ها", path: "/orders" },
  { icon: Truck, label: "تحویل محصول", path: "/delivery" },
  { icon: Boxes, label: "انبار", path: "/inventory" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [compact, setCompact] = useState(false);

  return (
    <div dir="rtl" className={`app-shell ${compact ? "sidebar-compact" : ""}`}>
      <aside className="app-sidebar">
        <div className="brand-row">
          <div className="brand-mark"><Archive size={20} strokeWidth={2.4} /></div>
          {!compact && <div><strong>تراز</strong><span>مدیریت عملیات</span></div>}
          <button className="sidebar-toggle" onClick={() => setCompact(!compact)} aria-label="تغییر حالت منو">
            <ChevronLeft size={17} className={compact ? "rotate-180" : ""} />
          </button>
        </div>

        <div className="sidebar-label">فضای کاری</div>
        <nav className="nav-list" aria-label="منوی اصلی">
          {menuItems.map(item => {
            const active = item.exact ? location === item.path : location.startsWith(item.path);
            return (
              <button key={item.path} className={`nav-item ${active ? "active" : ""}`} onClick={() => setLocation(item.path)}>
                <item.icon size={19} strokeWidth={active ? 2.4 : 1.9} />
                {!compact && <span>{item.label}</span>}
                {!compact && active && <i />}
              </button>
            );
          })}
        </nav>

        {!compact && (
          <div className="sidebar-help">
            <div className="help-icon"><MapPinned size={18} /></div>
            <div><strong>نقطه‌ی مشتری</strong><p>لوکیشن سفارش را روی نقشه ثبت کنید.</p></div>
          </div>
        )}

        <div className="sidebar-footer">
          <button className="nav-item muted"><Settings size={19} />{!compact && <span>تنظیمات</span>}</button>
          <div className="account-row">
            <div className="avatar">م</div>
            {!compact && <div><strong>مدیر کارگاه</strong><span>دسترسی کامل</span></div>}
            {!compact && <PackageCheck size={16} className="verified" />}
          </div>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
