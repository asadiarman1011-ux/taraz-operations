import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import {
  Archive,
  ArrowDownLeft,
  ArrowUpLeft,
  Bell,
  Box,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Edit3,
  Filter,
  MapPin,
  MoreHorizontal,
  Package,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

type LocationPoint = { lat: number; lng: number; label: string };
type OrderStatus = "pending" | "delivered";
type Order = {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  business: string;
  product: string;
  qty: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
  location: LocationPoint;
  delivery?: { completedAt: number; cost: number; method: string; note: string };
};
type Garment = {
  id: string;
  type: string;
  fabric: string;
  color: string;
  stock: number;
  reserved: number;
  sku: string;
  details: string;
  weight: string;
  button: string;
  description: string;
};
type RawMaterial = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  threshold: number;
  tags: string[];
  description: string;
};

type OrderDraft = Omit<Order, "id" | "createdAt" | "status" | "delivery">;
type ProductDraft = Omit<Garment, "id">;
type MaterialDraft = Omit<RawMaterial, "id" | "tags">;

const initialOrders: Order[] = [
  {
    id: "ORD-1048", customer: "مریم محمدی", phone: "۰۹۱۲ ۶۸۴ ۱۰۴۸", city: "تهران", address: "ونک، خیابان ملاصدرا، کوچه نهم، پلاک ۲۴", business: "کافه آتریوم", product: "کاپشن کجراه سرمه‌ای", qty: 18, total: 19600000, status: "pending", createdAt: new Date(2026, 8, 8, 9, 15).getTime(),
    location: { lat: 35.7549, lng: 51.4096, label: "ونک، ملاصدرا" },
  },
  {
    id: "ORD-1047", customer: "علی شریفی", phone: "۰۹۱۳ ۳۲۱ ۸۰۲۱", city: "اصفهان", address: "خیابان چهارباغ بالا، مجتمع سپاهان", business: "رستوران ترنج", product: "پیراهن فرم کرم", qty: 32, total: 21400000, status: "pending", createdAt: new Date(2026, 8, 7, 13, 40).getTime(),
    location: { lat: 32.6333, lng: 51.6422, label: "چهارباغ بالا، اصفهان" },
  },
  {
    id: "ORD-1045", customer: "لیلا اکبری", phone: "۰۹۱۵ ۴۱۲ ۶۹۰۲", city: "مشهد", address: "بلوار سجاد، بین حامد و بهارستان", business: "کلینیک آرمان", product: "مانتو فرم طوسی", qty: 14, total: 17300000, status: "delivered", createdAt: new Date(2026, 8, 5, 10, 20).getTime(),
    location: { lat: 36.3133, lng: 59.5269, label: "بلوار سجاد، مشهد" }, delivery: { completedAt: new Date(2026, 8, 7, 16, 10).getTime(), cost: 620000, method: "اسنپ‌باکس", note: "تحویل به مسئول پذیرش کلینیک" },
  },
  {
    id: "ORD-1042", customer: "سارا رستمی", phone: "۰۹۱۲ ۷۶۸ ۱۴۹۰", city: "کرج", address: "عظیمیه، بلوار شریعتی، برج آرین", business: "آموزشگاه زبان دایان", product: "تی‌شرت پنبه‌ای سبز", qty: 24, total: 11800000, status: "delivered", createdAt: new Date(2026, 8, 2, 8, 30).getTime(),
    location: { lat: 35.8401, lng: 50.9391, label: "عظیمیه، کرج" }, delivery: { completedAt: new Date(2026, 8, 4, 12, 25).getTime(), cost: 480000, method: "باربری", note: "رسید باربری در پرونده سفارش ثبت شد" },
  },
];

const initialGarments: Garment[] = [
  { id: "GR-001", type: "کاپشن", fabric: "کجراه", color: "سرمه‌ای", stock: 48, reserved: 18, sku: "JK-TR-204", details: "سایز M تا 3XL", weight: "۲۸۰ گرم", button: "دکمه فشاری فلزی", description: "آستر توری، دو جیب زیپ‌دار، یقه ایستاده و نوار شب‌رنگ روی آستین." },
  { id: "GR-002", type: "پیراهن فرم", fabric: "ترگال", color: "کرم", stock: 76, reserved: 32, sku: "SH-CR-118", details: "سایز S تا 2XL", weight: "۲۰۰ گرم", button: "دکمه صدفی", description: "یقه مردانه، برش آزاد، قابلیت گلدوزی لوگو روی سینه." },
  { id: "GR-003", type: "مانتو فرم", fabric: "فاستونی", color: "طوسی", stock: 21, reserved: 0, sku: "MT-GR-087", details: "سایز 36 تا 48", weight: "۲۴۰ گرم", button: "مخفی", description: "پارچه ضدچروک، مچ قابل تنظیم و دوخت صنعتی تقویت‌شده." },
  { id: "GR-004", type: "تی‌شرت", fabric: "پنبه‌ای", color: "سبز زیتونی", stock: 64, reserved: 0, sku: "TS-OL-066", details: "سایز M تا XXL", weight: "۱۸۰ گرم", button: "بدون دکمه", description: "یقه کش‌بافت، مناسب استفاده روزانه و چاپ سیلک." },
];

const initialMaterials: RawMaterial[] = [
  { id: "RM-010", name: "پارچه کجراه", category: "پارچه", stock: 182, unit: "متر", threshold: 80, tags: ["پلی‌استر/ویسکوز", "سرمه‌ای", "۲۸۰ گرم"], description: "عرض ۱۵۰ سانتی‌متر، مناسب کاپشن و لباس کار." },
  { id: "RM-014", name: "نخ دوخت صنعتی", category: "نخ", stock: 24, unit: "قرقره", threshold: 30, tags: ["پلی‌استر", "سرمه‌ای", "ضخامت 40/2"], description: "مقاومت بالا برای چرخ صنعتی، قابل استفاده برای دوخت دوبل." },
  { id: "RM-018", name: "دکمه فشاری ۱۵mm", category: "دکمه", stock: 560, unit: "عدد", threshold: 250, tags: ["فلزی", "نقره‌ای", "ضدزنگ"], description: "مناسب کاپشن و مانتو؛ بسته‌های ۱۰۰تایی." },
  { id: "RM-023", name: "سوزن چرخ صنعتی", category: "سوزن", stock: 80, unit: "بسته", threshold: 40, tags: ["DP×5", "سایز 90", "نوک معمولی"], description: "مناسب پارچه‌های متوسط تا ضخیم؛ هر بسته ۱۰ عدد." },
];

const money = (value: number) => `${value.toLocaleString("fa-IR")} تومان`;
const number = (value: number) => value.toLocaleString("fa-IR");
const jalaliDate = (value: number, withTime = false) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric", month: "long", day: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
}).format(new Date(value));
const shortJalaliDate = (value: number) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" }).format(new Date(value));
const loadStored = <T,>(key: string, fallback: T): T => {
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
};

const blankOrder = (): OrderDraft => ({ customer: "", phone: "", city: "تهران", address: "", business: "", product: "", qty: 1, total: 0, location: { lat: 35.7219, lng: 51.3347, label: "تهران" } });
const blankProduct = (): ProductDraft => ({ type: "", fabric: "", color: "", stock: 0, reserved: 0, sku: "", details: "", weight: "", button: "", description: "" });
const blankMaterial = (): MaterialDraft => ({ name: "", category: "پارچه", stock: 0, unit: "متر", threshold: 0, description: "" });

function Modal({ open, onClose, title, subtitle, children, wide = false }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return <div className="modal-layer" role="dialog" aria-modal="true">
    <div className={`modal-card ${wide ? "modal-wide" : ""}`}>
      <div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="بستن"><X size={19} /></button></div>
      {children}
    </div>
  </div>;
}

function MiniMap({ location, onPick, interactive = false }: { location: LocationPoint; onPick?: (point: LocationPoint) => void; interactive?: boolean }) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const setMarker = (point: LocationPoint) => {
    if (!mapRef.current || !window.google) return;
    if (markerRef.current) markerRef.current.map = null;
    markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: { lat: point.lat, lng: point.lng }, title: point.label });
  };
  return <MapView className="location-map" initialCenter={{ lat: location.lat, lng: location.lng }} initialZoom={13} onMapReady={(map) => {
    mapRef.current = map; setMarker(location);
    if (interactive) map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const point = { lat: event.latLng.lat(), lng: event.latLng.lng(), label: `مختصات ${event.latLng.lat().toFixed(4)}، ${event.latLng.lng().toFixed(4)}` };
      setMarker(point); onPick?.(point);
    });
  }} />;
}

export default function Home() {
  const [route, setRoute] = useLocation();
  const [orders, setOrders] = useState<Order[]>(() => loadStored("taraz-orders", initialOrders));
  const [garments, setGarments] = useState<Garment[]>(() => loadStored("taraz-garments", initialGarments));
  const [materials, setMaterials] = useState<RawMaterial[]>(() => loadStored("taraz-materials", initialMaterials));
  const [orderModal, setOrderModal] = useState(false);
  const [mapModal, setMapModal] = useState(false);
  const [inventoryModal, setInventoryModal] = useState<"garment" | "material" | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(blankOrder());
  const [productDraft, setProductDraft] = useState<ProductDraft>(blankProduct());
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft>(blankMaterial());
  const [materialTags, setMaterialTags] = useState<string[]>([]);
  const [tagText, setTagText] = useState("");
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null);
  const [deliveryTab, setDeliveryTab] = useState<OrderStatus>("pending");
  const [query, setQuery] = useState("");
  const [inventoryTab, setInventoryTab] = useState<"garments" | "materials">("garments");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("ORD-1048");
  const [toast, setToast] = useState("");
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
  const [deliveryDraft, setDeliveryDraft] = useState({ method: "اسنپ‌باکس", cost: 550000, date: Date.now(), note: "تحویل سالم تأیید شد." });

  useEffect(() => { localStorage.setItem("taraz-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("taraz-garments", JSON.stringify(garments)); }, [garments]);
  useEffect(() => { localStorage.setItem("taraz-materials", JSON.stringify(materials)); }, [materials]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 3000); return () => window.clearTimeout(id); }, [toast]);

  const page = route.startsWith("/orders") ? "orders" : route.startsWith("/delivery") ? "delivery" : route.startsWith("/inventory") ? "inventory" : "dashboard";
  const pending = orders.filter(order => order.status === "pending");
  const delivered = orders.filter(order => order.status === "delivered");
  const selectedOrder = orders.find(order => order.id === selectedOrderId) ?? orders[0];
  const searchOrders = (data: Order[]) => data.filter(order => `${order.customer} ${order.city} ${order.business} ${order.product} ${order.phone}`.includes(query.trim()));
  const filteredOrders = searchOrders(orders);
  const filteredDelivery = searchOrders(deliveryTab === "pending" ? pending : delivered);
  const garmentStock = garments.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = materials.filter(item => item.stock <= item.threshold).length;

  const showToast = (message: string) => setToast(message);
  const openNewOrder = () => { setEditOrderId(null); setOrderDraft(blankOrder()); setOrderModal(true); };
  const openEditOrder = (order: Order) => { const { id, createdAt, status, delivery, ...draft } = order; setEditOrderId(id); setOrderDraft(draft); setOrderModal(true); };
  const saveOrder = (event: FormEvent) => {
    event.preventDefault();
    if (!orderDraft.customer || !orderDraft.product || !orderDraft.address) return showToast("نام مشتری، محصول و آدرس را کامل کنید.");
    if (editOrderId) {
      setOrders(data => data.map(item => item.id === editOrderId ? { ...item, ...orderDraft } : item));
      showToast("اطلاعات سفارش ویرایش شد.");
    } else {
      const newOrder: Order = { ...orderDraft, id: `ORD-${1050 + orders.length}`, status: "pending", createdAt: Date.now() };
      setOrders(data => [newOrder, ...data]); setSelectedOrderId(newOrder.id); showToast("سفارش ثبت و به صف تحویل اضافه شد.");
    }
    setOrderModal(false);
  };
  const openDeliveryConfirmation = (id: string) => { setDeliveryOrderId(id); setDeliveryDraft({ method: "اسنپ‌باکس", cost: 550000, date: Date.now(), note: "تحویل سالم تأیید شد." }); };
  const markDelivered = (event: FormEvent) => {
    event.preventDefault();
    if (!deliveryOrderId) return;
    setOrders(data => data.map(order => order.id === deliveryOrderId ? { ...order, status: "delivered", delivery: { completedAt: deliveryDraft.date, cost: deliveryDraft.cost, method: deliveryDraft.method, note: deliveryDraft.note } } : order));
    setDeliveryOrderId(null); setDeliveryTab("delivered"); showToast("هزینه و اطلاعات ارسال ثبت شد؛ سفارش تحویل‌شده شد.");
  };
  const saveGarment = (event: FormEvent) => {
    event.preventDefault();
    if (!productDraft.type || !productDraft.fabric || !productDraft.color) return showToast("نوع، جنس و رنگ پوشاک را وارد کنید.");
    if (editProductId) { setGarments(data => data.map(item => item.id === editProductId ? { ...item, ...productDraft } : item)); showToast("پوشاک ویرایش شد."); }
    else { setGarments(data => [{ ...productDraft, id: `GR-${String(data.length + 1).padStart(3, "0")}` }, ...data]); showToast("پوشاک به انبار اضافه شد."); }
    setInventoryModal(null);
  };
  const saveMaterial = (event: FormEvent) => {
    event.preventDefault();
    if (!materialDraft.name || !materialDraft.category) return showToast("نام و دسته‌بندی مواد اولیه را وارد کنید.");
    if (editMaterialId) { setMaterials(data => data.map(item => item.id === editMaterialId ? { ...item, ...materialDraft, tags: materialTags } : item)); showToast("ماده اولیه ویرایش شد."); }
    else { setMaterials(data => [{ ...materialDraft, tags: materialTags, id: `RM-${String(data.length + 25).padStart(3, "0")}` }, ...data]); showToast("ماده اولیه به انبار اضافه شد."); }
    setInventoryModal(null);
  };
  const openProduct = (item?: Garment) => { setEditProductId(item?.id ?? null); setProductDraft(item ? { ...item } : blankProduct()); setInventoryModal("garment"); };
  const openMaterial = (item?: RawMaterial) => { setEditMaterialId(item?.id ?? null); setMaterialDraft(item ? { name: item.name, category: item.category, stock: item.stock, unit: item.unit, threshold: item.threshold, description: item.description } : blankMaterial()); setMaterialTags(item?.tags ?? []); setTagText(""); setInventoryModal("material"); };
  const addTag = () => { const value = tagText.trim(); if (value && !materialTags.includes(value)) setMaterialTags(tags => [...tags, value]); setTagText(""); };

  const commonSearch = <div className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجو در نام، شهر، صنف و محصول..." /><kbd>⌘ K</kbd></div>;
  const PageHeading = ({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) => <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;

  const OrderTable = ({ data, compact = false }: { data: Order[]; compact?: boolean }) => <div className="data-card order-table-card">
    <div className="table-head"><div><h3>{compact ? "سفارش‌های نیازمند توجه" : "فهرست سفارش‌ها"}</h3><span>{number(data.length)} مورد</span></div>{!compact && <button className="filter-button"><SlidersHorizontal size={17} /> فیلترها <ChevronDown size={15} /></button>}</div>
    <div className="orders-list">
      {data.map(order => <div className="order-row" key={order.id} onClick={() => setSelectedOrderId(order.id)}>
        <div className="customer-avatar">{order.customer.slice(0, 1)}</div>
        <div className="order-person"><strong>{order.customer}</strong><span>{order.business} · {order.city}</span></div>
        {!compact && <div className="order-product"><span>{order.product}</span><small>{number(order.qty)} عدد · {order.id}</small></div>}
        <div className="order-date"><span>{shortJalaliDate(order.createdAt)}</span><small>{order.status === "pending" ? "در انتظار تحویل" : "تحویل شده"}</small></div>
        <div className="order-amount"><strong>{money(order.total)}</strong>{order.status === "pending" ? <span className="status amber"><Clock3 size={13} /> آماده‌سازی</span> : <span className="status green"><Check size={13} /> تحویل شده</span>}</div>
        <button className="row-menu" onClick={event => { event.stopPropagation(); openEditOrder(order); }} aria-label="ویرایش سفارش"><Edit3 size={16} /></button>
      </div>)}
      {data.length === 0 && <div className="empty-state"><Package size={25} /><strong>موردی با این جستجو پیدا نشد.</strong><span>عبارت یا فیلتر را تغییر دهید.</span></div>}
    </div>
  </div>;

  const DashboardPage = <>
    <PageHeading eyebrow={`امروز · ${jalaliDate(Date.now())}`} title="صبح بخیر، مدیر کارگاه" description="نمایی از سفارش‌ها، تحویل‌ها و موجودی امروز شما." action={<button className="primary-button" onClick={openNewOrder}><Plus size={18} /> ثبت سفارش جدید</button>} />
    <section className="stats-grid">
      <article className="stat-card green-card"><div className="stat-icon"><ClipboardList size={20} /></div><div><span>سفارش‌های فعال</span><strong>{number(pending.length)}</strong><small><ArrowUpLeft size={14} /> ۱۲٪ نسبت به هفته قبل</small></div></article>
      <article className="stat-card peach-card"><div className="stat-icon"><Truck size={20} /></div><div><span>در انتظار تحویل</span><strong>{number(pending.length)}</strong><small>۳ سفارش آماده‌ی ارسال</small></div></article>
      <article className="stat-card lavender-card"><div className="stat-icon"><Boxes size={20} /></div><div><span>موجودی پوشاک</span><strong>{number(garmentStock)}</strong><small>۴ مدل قابل تحویل</small></div></article>
      <article className="stat-card yellow-card"><div className="stat-icon"><CircleDollarSign size={20} /></div><div><span>فروش این ماه</span><strong>{money(85300000)}</strong><small><ArrowUpLeft size={14} /> ۱۸٪ رشد فروش</small></div></article>
    </section>
    <section className="dashboard-grid">
      <OrderTable data={pending.slice(0, 3)} compact />
      <aside className="readiness-card">
        <div className="card-topline"><div><span className="eyebrow">نبض انبار</span><h3>وضعیت تأمین امروز</h3></div><Sparkles size={19} /></div>
        <div className="inventory-hero"><div><span>پوشاک آماده</span><strong>{number(garmentStock)}<small> عدد</small></strong></div><div className="circle-meter"><span>۸۶٪</span></div></div>
        <div className="need-row"><div className="need-dot warning" /><div><strong>نخ دوخت صنعتی</strong><span>به نقطه سفارش رسیده</span></div><b>{number(24)} قرقره</b></div>
        <div className="need-row"><div className="need-dot okay" /><div><strong>پارچه کجراه</strong><span>موجودی ایمن</span></div><b>{number(182)} متر</b></div>
        <button className="text-button" onClick={() => setRoute("/inventory")}>مشاهده‌ی همه موجودی <ArrowDownLeft size={16} /></button>
      </aside>
    </section>
    <section className="location-strip">
      <div className="location-copy"><div className="location-icon"><MapPin size={20} /></div><div><span>آخرین نقطه‌ی ثبت‌شده</span><h3>{selectedOrder?.location.label}</h3><p>{selectedOrder?.customer} · {selectedOrder?.business}</p></div><button className="outline-button" onClick={() => setRoute("/orders")}>مشاهده سفارش</button></div>
      <div className="map-art"><span className="map-route route-one" /><span className="map-route route-two" /><i className="map-point pin-one"><MapPin size={14} /></i><i className="map-point pin-two" /></div>
    </section>
  </>;

  const OrdersPage = <>
    <PageHeading eyebrow="ثبت، پیگیری و ویرایش" title="سفارش‌ها" description="هر سفارش با تاریخ شمسی و موقعیت دقیق مشتری در اینجا نگهداری می‌شود." action={<button className="primary-button" onClick={openNewOrder}><Plus size={18} /> ثبت سفارش جدید</button>} />
    <section className="toolbar">{commonSearch}<div className="toolbar-actions"><button className="filter-button"><Filter size={17} /> همه شهرها <ChevronDown size={15} /></button><button className="filter-button"><CalendarDays size={17} /> تاریخ شمسی <ChevronDown size={15} /></button></div></section>
    <section className="orders-map-layout">{OrderTable({ data: filteredOrders })}<aside className="order-detail-card">
      {selectedOrder && <><div className="detail-title"><div><span className="eyebrow">جزئیات سفارش</span><h3>{selectedOrder.id}</h3></div><button className="icon-button" onClick={() => openEditOrder(selectedOrder)}><Edit3 size={17} /></button></div>
      <div className="detail-customer"><div className="customer-avatar large">{selectedOrder.customer.slice(0, 1)}</div><div><strong>{selectedOrder.customer}</strong><span>{selectedOrder.phone}</span></div></div>
      <div className="map-frame"><MiniMap location={selectedOrder.location} /><div className="map-label"><MapPin size={15} /><span>{selectedOrder.location.label}</span></div></div>
      <div className="detail-lines"><div><span>آدرس</span><p>{selectedOrder.address}</p></div><div className="line-split"><div><span>صنف</span><p>{selectedOrder.business}</p></div><div><span>تاریخ سفارش</span><p>{jalaliDate(selectedOrder.createdAt)}</p></div></div><div><span>خرید</span><p>{selectedOrder.product} · {number(selectedOrder.qty)} عدد</p></div></div>
      <button className="outline-button full" onClick={() => openEditOrder(selectedOrder)}><Edit3 size={16} /> ویرایش سفارش و لوکیشن</button></>}
    </aside></section>
  </>;

  const DeliveryPage = <>
    <PageHeading eyebrow="ثبت تاریخچه و هزینه ارسال" title="تحویل محصول" description="پس از ثبت سفارش، محصول به‌صورت خودکار وارد صف انتظار تحویل می‌شود." />
    <div className="delivery-tabs"><button className={deliveryTab === "pending" ? "selected" : ""} onClick={() => setDeliveryTab("pending")}><Clock3 size={17} /> در انتظار تحویل <b>{number(pending.length)}</b></button><button className={deliveryTab === "delivered" ? "selected" : ""} onClick={() => setDeliveryTab("delivered")}><PackageCheck size={17} /> تحویل داده‌شده <b>{number(delivered.length)}</b></button></div>
    <section className="toolbar delivery-toolbar">{commonSearch}<div className="toolbar-actions"><button className="filter-button"><Filter size={17} /> شهر و صنف <ChevronDown size={15} /></button><button className="filter-button"><CalendarDays size={17} /> بازه تاریخ <ChevronDown size={15} /></button></div></section>
    <div className="delivery-list">{filteredDelivery.map(order => <article className="delivery-card" key={order.id}>
      <div className="delivery-card-head"><div className="delivery-order-chip"><Package size={16} /> {order.id}</div><span>{jalaliDate(order.createdAt)}</span></div>
      <div className="delivery-main"><div className="customer-avatar">{order.customer.slice(0, 1)}</div><div className="delivery-customer"><strong>{order.customer}</strong><span>{order.phone} · {order.business}</span><p><MapPin size={14} /> {order.address}</p></div><div className="delivery-product"><span>اطلاعات خرید</span><strong>{order.product}</strong><p>{number(order.qty)} عدد · {money(order.total)}</p></div></div>
      {order.status === "pending" ? <div className="delivery-action"><div><Clock3 size={17} /><span>محصول آماده شد؟ هزینه، نوع ارسال، تاریخ و توضیحات را ثبت کنید.</span></div><button className="primary-button compact" onClick={() => openDeliveryConfirmation(order.id)}><CheckCircle2 size={17} /> ثبت تحویل</button></div> : <div className="delivery-history"><div><Truck size={17} /><span>ارسال با <strong>{order.delivery?.method}</strong> · {jalaliDate(order.delivery?.completedAt ?? order.createdAt, true)}</span></div><div><CircleDollarSign size={17} /><span>مبلغ دریافتی بابت ارسال: <strong>{money(order.delivery?.cost ?? 0)}</strong></span></div><p>{order.delivery?.note}</p></div>}
    </article>)}{filteredDelivery.length === 0 && <div className="empty-state large-empty"><Truck size={28} /><strong>سفارشی در این بخش نیست.</strong><span>با تغییر تب یا عبارت جستجو، سفارش‌ها را پیدا کنید.</span></div>}</div>
  </>;

  const InventoryPage = <>
    <PageHeading eyebrow="موجودی، ویژگی و قابلیت ویرایش" title="انبار" description="موجودی پوشاک و مواد اولیه را با جزئیات کامل، زیرشاخه و نقطه سفارش مدیریت کنید." action={<button className="primary-button" onClick={() => inventoryTab === "garments" ? openProduct() : openMaterial()}><Plus size={18} /> {inventoryTab === "garments" ? "افزودن پوشاک" : "افزودن ماده اولیه"}</button>} />
    <div className="inventory-tabs"><button className={inventoryTab === "garments" ? "selected" : ""} onClick={() => setInventoryTab("garments")}><Package size={18} /> پوشاک <span>{number(garments.length)} مدل</span></button><button className={inventoryTab === "materials" ? "selected" : ""} onClick={() => setInventoryTab("materials")}><Box size={18} /> مواد اولیه <span>{number(materials.length)} قلم</span></button></div>
    <section className="inventory-summary"><div><span>کل موجودی پوشاک</span><strong>{number(garmentStock)} <small>عدد</small></strong><p>در {number(garments.length)} مدل مختلف</p></div><div><span>مواد نیازمند سفارش</span><strong className="coral-text">{number(lowStock)} <small>قلم</small></strong><p>بر اساس نقطه سفارش شما</p></div><div className="fabric-promo"><div><span>طبقه‌بندی منعطف</span><strong>هر ویژگی را اضافه کنید.</strong><p>جنس، رنگ، گرماژ و زیرشاخه‌ها محدودیتی ندارند.</p></div></div></section>
    <section className="toolbar">{commonSearch}<div className="toolbar-actions"><button className="filter-button"><Tag size={17} /> {inventoryTab === "garments" ? "نوع و جنس" : "دسته‌بندی"} <ChevronDown size={15} /></button><button className="filter-button"><SlidersHorizontal size={17} /> فقط کم‌موجود</button></div></section>
    {inventoryTab === "garments" ? <div className="garment-grid">{garments.filter(item => `${item.type} ${item.fabric} ${item.color} ${item.sku}`.includes(query.trim())).map(item => <article className="garment-card" key={item.id}><div className="garment-top"><div className="fabric-swatch" style={{ background: item.color === "سرمه‌ای" ? "#233b58" : item.color === "کرم" ? "#dfd3be" : item.color === "طوسی" ? "#8b9291" : "#6e7a52" }}><span>{item.type}</span></div><button className="icon-button" onClick={() => openProduct(item)}><Edit3 size={16} /></button></div><div className="garment-name"><div><span>{item.sku}</span><h3>{item.type} {item.color}</h3><p>{item.fabric} · {item.details}</p></div><strong>{number(item.stock)}<small> عدد</small></strong></div><div className="stock-bar"><i style={{ width: `${Math.min(100, (item.stock / 90) * 100)}%` }} /></div><div className="garment-meta"><span>{item.weight}</span><span>{item.button}</span></div><p className="description">{item.description}</p><div className="garment-footer"><span>{number(item.reserved)} عدد رزرو شده</span><button onClick={() => openProduct(item)}>ویرایش</button></div></article>)}</div> : <div className="materials-table data-card"><div className="material-header-row"><span>نام ماده اولیه</span><span>دسته‌بندی و زیرشاخه</span><span>موجودی</span><span>وضعیت</span><span /></div>{materials.filter(item => `${item.name} ${item.category} ${item.tags.join(" ")}`.includes(query.trim())).map(item => <div className="material-row" key={item.id}><div><strong>{item.name}</strong><p>{item.description}</p></div><div className="tag-cloud"><b>{item.category}</b>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div><strong>{number(item.stock)} {item.unit}</strong><p>حد سفارش: {number(item.threshold)} {item.unit}</p></div><div>{item.stock <= item.threshold ? <span className="status red">نیاز به سفارش</span> : <span className="status green">موجودی ایمن</span>}</div><button className="icon-button" onClick={() => openMaterial(item)}><Edit3 size={16} /></button></div>)}</div>}
  </>;

  return <DashboardLayout><div className="workspace">
    <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><ArchiveIcon /></div><strong>تراز</strong></div><div className="topbar-date"><CalendarDays size={17} /><span>{jalaliDate(Date.now())}</span></div><div className="topbar-actions"><button className="notification"><Bell size={19} /><i /></button><div className="avatar small">م</div><ChevronDown size={16} /></div></header>
    <div className="page-content">{page === "dashboard" ? DashboardPage : page === "orders" ? OrdersPage : page === "delivery" ? DeliveryPage : InventoryPage}</div>
    {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}

    <Modal open={Boolean(deliveryOrderId)} onClose={() => setDeliveryOrderId(null)} title="ثبت تحویل محصول" subtitle="هزینه باربری، روش ارسال، تاریخ و توضیحات در سابقه این سفارش ذخیره می‌شود.">
      <form className="modal-form" onSubmit={markDelivered}><div className="form-grid two"><label>نوع ارسال / باربری<select value={deliveryDraft.method} onChange={e => setDeliveryDraft({ ...deliveryDraft, method: e.target.value })}><option>اسنپ‌باکس</option><option>باربری</option><option>پست پیشتاز</option><option>پیک اختصاصی</option><option>تحویل حضوری</option></select></label><label>مبلغ دریافتی بابت ارسال (تومان)<input type="number" min="0" value={deliveryDraft.cost} onChange={e => setDeliveryDraft({ ...deliveryDraft, cost: Number(e.target.value) })} /></label><label>تاریخ و زمان تحویل<input type="datetime-local" value={new Date(deliveryDraft.date - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={e => setDeliveryDraft({ ...deliveryDraft, date: new Date(e.target.value).getTime() })} /></label><div className="field-static"><span>تاریخ شمسی ثبت‌شده</span><strong>{jalaliDate(deliveryDraft.date, true)}</strong></div><label className="span-two">توضیحات تحویل<textarea value={deliveryDraft.note} onChange={e => setDeliveryDraft({ ...deliveryDraft, note: e.target.value })} placeholder="رسید، نام تحویل‌گیرنده، وضعیت بسته و ..." /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setDeliveryOrderId(null)}>انصراف</button><button className="primary-button" type="submit"><Check size={17} /> ثبت تحویل و انتقال سفارش</button></div></form>
    </Modal>

    <Modal open={orderModal} onClose={() => setOrderModal(false)} title={editOrderId ? "ویرایش سفارش" : "ثبت سفارش جدید"} subtitle="تاریخ سفارش به‌صورت خودکار بر اساس تقویم شمسی ثبت می‌شود." wide>
      <form className="modal-form" onSubmit={saveOrder}><div className="form-section-title"><span>اطلاعات مشتری</span><i /></div><div className="form-grid three"><label>نام و نام خانوادگی<input value={orderDraft.customer} onChange={e => setOrderDraft({ ...orderDraft, customer: e.target.value })} placeholder="مثلاً مریم محمدی" /></label><label>شماره تماس<input value={orderDraft.phone} onChange={e => setOrderDraft({ ...orderDraft, phone: e.target.value })} placeholder="۰۹۱۲ ..." /></label><label>شهر<select value={orderDraft.city} onChange={e => setOrderDraft({ ...orderDraft, city: e.target.value })}><option>تهران</option><option>اصفهان</option><option>مشهد</option><option>کرج</option><option>شیراز</option></select></label><label className="span-two">آدرس کامل<input value={orderDraft.address} onChange={e => setOrderDraft({ ...orderDraft, address: e.target.value })} placeholder="خیابان، کوچه، پلاک و ..." /></label><label>صنف / مجموعه<input value={orderDraft.business} onChange={e => setOrderDraft({ ...orderDraft, business: e.target.value })} placeholder="مثلاً کافه آتریوم" /></label></div><div className="map-picker-row"><div><div><MapPin size={18} /><strong>موقعیت دقیق مشتری</strong></div><p>{orderDraft.location.label}</p></div><button type="button" className="outline-button" onClick={() => setMapModal(true)}>انتخاب روی Google Maps</button></div><div className="form-section-title"><span>اطلاعات خرید</span><i /></div><div className="form-grid three"><label className="span-two">محصول / مدل<input value={orderDraft.product} onChange={e => setOrderDraft({ ...orderDraft, product: e.target.value })} placeholder="مثلاً کاپشن کجراه سرمه‌ای" /></label><label>تعداد<input type="number" min="1" value={orderDraft.qty} onChange={e => setOrderDraft({ ...orderDraft, qty: Number(e.target.value) })} /></label><label>مبلغ کل (تومان)<input type="number" min="0" value={orderDraft.total} onChange={e => setOrderDraft({ ...orderDraft, total: Number(e.target.value) })} /></label><label>تاریخ سفارش<input value={jalaliDate(Date.now())} disabled /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setOrderModal(false)}>انصراف</button><button type="submit" className="primary-button"><Check size={17} /> {editOrderId ? "ذخیره تغییرات" : "ثبت سفارش"}</button></div></form>
    </Modal>

    <Modal open={mapModal} onClose={() => setMapModal(false)} title="انتخاب نقطه روی نقشه" subtitle="روی Google Maps کلیک کنید تا موقعیت سفارش ذخیره شود." wide>
      <div className="picker-map-wrap"><MiniMap location={orderDraft.location} interactive onPick={point => setOrderDraft(draft => ({ ...draft, location: point }))} /></div><div className="selected-coordinates"><MapPin size={18} /><span>{orderDraft.location.label}</span><small>lat {orderDraft.location.lat.toFixed(5)} · lng {orderDraft.location.lng.toFixed(5)}</small><button className="primary-button compact" onClick={() => { setMapModal(false); showToast("موقعیت سفارش ثبت شد."); }}><Check size={16} /> تأیید موقعیت</button></div>
    </Modal>

    <Modal open={inventoryModal === "garment"} onClose={() => setInventoryModal(null)} title={editProductId ? "ویرایش پوشاک" : "افزودن پوشاک"} subtitle="همه ویژگی‌های پوشاک در کارت موجودی قابل مشاهده و ویرایش خواهند بود.">
      <form className="modal-form" onSubmit={saveGarment}><div className="form-grid two"><label>نوع لباس<input value={productDraft.type} onChange={e => setProductDraft({ ...productDraft, type: e.target.value })} placeholder="کاپشن، پیراهن، ..." /></label><label>کد کالا<input value={productDraft.sku} onChange={e => setProductDraft({ ...productDraft, sku: e.target.value })} placeholder="GR-001" /></label><label>جنس پارچه<input value={productDraft.fabric} onChange={e => setProductDraft({ ...productDraft, fabric: e.target.value })} placeholder="کجراه، ترگال، ..." /></label><label>رنگ<input value={productDraft.color} onChange={e => setProductDraft({ ...productDraft, color: e.target.value })} placeholder="سرمه‌ای" /></label><label>موجودی کل<input type="number" min="0" value={productDraft.stock} onChange={e => setProductDraft({ ...productDraft, stock: Number(e.target.value) })} /></label><label>رزرو شده<input type="number" min="0" value={productDraft.reserved} onChange={e => setProductDraft({ ...productDraft, reserved: Number(e.target.value) })} /></label><label>گرماژ<input value={productDraft.weight} onChange={e => setProductDraft({ ...productDraft, weight: e.target.value })} placeholder="۲۸۰ گرم" /></label><label>نوع دکمه<input value={productDraft.button} onChange={e => setProductDraft({ ...productDraft, button: e.target.value })} placeholder="دکمه فشاری فلزی" /></label><label className="span-two">سایز و ویژگی کوتاه<input value={productDraft.details} onChange={e => setProductDraft({ ...productDraft, details: e.target.value })} placeholder="سایز M تا 3XL" /></label><label className="span-two">توضیحات<textarea value={productDraft.description} onChange={e => setProductDraft({ ...productDraft, description: e.target.value })} placeholder="جزئیات دوخت، یقه، جیب و ..." /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setInventoryModal(null)}>انصراف</button><button className="primary-button" type="submit"><Check size={17} /> ذخیره پوشاک</button></div></form>
    </Modal>

    <Modal open={inventoryModal === "material"} onClose={() => setInventoryModal(null)} title={editMaterialId ? "ویرایش ماده اولیه" : "افزودن ماده اولیه"} subtitle="زیرشاخه و ویژگی‌های هر قلم محدودیتی ندارد؛ هر تعداد مورد که نیاز دارید اضافه کنید.">
      <form className="modal-form" onSubmit={saveMaterial}><div className="form-grid two"><label>نام ماده اولیه<input value={materialDraft.name} onChange={e => setMaterialDraft({ ...materialDraft, name: e.target.value })} placeholder="مثلاً پارچه کجراه" /></label><label>دسته‌بندی<input list="material-categories" value={materialDraft.category} onChange={e => setMaterialDraft({ ...materialDraft, category: e.target.value })} placeholder="پارچه، نخ، ..." /><datalist id="material-categories"><option value="پارچه" /><option value="نخ" /><option value="دکمه" /><option value="سوزن" /><option value="ملزومات" /></datalist></label><label>موجودی<input type="number" min="0" value={materialDraft.stock} onChange={e => setMaterialDraft({ ...materialDraft, stock: Number(e.target.value) })} /></label><label>واحد<select value={materialDraft.unit} onChange={e => setMaterialDraft({ ...materialDraft, unit: e.target.value })}><option>متر</option><option>عدد</option><option>بسته</option><option>قرقره</option><option>کیلوگرم</option></select></label><label>حد سفارش<input type="number" min="0" value={materialDraft.threshold} onChange={e => setMaterialDraft({ ...materialDraft, threshold: Number(e.target.value) })} /></label><div className="field-static"><span>وضعیت</span><strong>{materialDraft.stock <= materialDraft.threshold ? "نیاز به سفارش" : "موجودی ایمن"}</strong></div><label className="span-two">توضیحات<textarea value={materialDraft.description} onChange={e => setMaterialDraft({ ...materialDraft, description: e.target.value })} placeholder="عرض پارچه، کاربرد، مشخصات بسته‌بندی و ..." /></label></div><div className="tag-editor"><div><strong>زیرشاخه و ویژگی‌ها</strong><span>برای پارچه: جنس، رنگ، گرماژ · برای سوزن: هر مشخصه دلخواه</span></div><div className="tag-input"><input value={tagText} onChange={e => setTagText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="ویژگی را بنویسید و Enter بزنید" /><button type="button" onClick={addTag}><Plus size={16} /></button></div><div className="tag-cloud editable">{materialTags.map(tag => <span key={tag}>{tag}<button type="button" onClick={() => setMaterialTags(tags => tags.filter(value => value !== tag))}><X size={12} /></button></span>)}{materialTags.length === 0 && <em>هنوز زیرشاخه‌ای وارد نشده است.</em>}</div></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setInventoryModal(null)}>انصراف</button><button className="primary-button" type="submit"><Check size={17} /> ذخیره ماده اولیه</button></div></form>
    </Modal>
  </div></DashboardLayout>;
}

function ArchiveIcon() { return <Archive size={20} strokeWidth={2.4} />; }
