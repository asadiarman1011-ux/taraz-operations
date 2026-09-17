import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import {
  Archive,
  ArrowDownLeft,
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
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileDown,
  History,
  ListFilter,
  LoaderCircle,
  Printer,
  RefreshCw,
  RotateCcw,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { currencyLabel, formatCurrency, useCurrency } from "@/hooks/useCurrency";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";

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
  jalaliDate?: string;
  notes?: string;
  customerId?: number;
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
  breakdown?: { name: string; quantity: number; unit: string; children?: { name: string; quantity: number; unit: string }[] }[];
  description: string;
};

type OrderDraft = Omit<Order, "id" | "createdAt" | "status" | "delivery">;
type ProductDraft = Omit<Garment, "id">;
type MaterialDraft = Omit<RawMaterial, "id" | "tags">;

const COMPANY_LOGO = "/manus-storage/sepidfinal_0594416d.webp";
const PERSIAN_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

const initialOrders: Order[] = [];
const initialGarments: Garment[] = [];
const initialMaterials: RawMaterial[] = [];

const money = (value: number) => formatCurrency(value);
const number = (value: number) => value.toLocaleString("fa-IR");
const jalaliDate = (value: number, withTime = false) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric", month: "long", day: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
}).format(new Date(value));
const shortJalaliDate = (value: number) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" }).format(new Date(value));
const jalaliParts = (value: number) => { const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric" }).formatToParts(new Date(value)); return { year: Number(parts.find(part => part.type === "year")?.value || 1405), month: Number(parts.find(part => part.type === "month")?.value || 1) }; };
const jalaliYearLabel = (value: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(value);
const loadStored = <T,>(key: string, fallback: T): T => {
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
};

const blankOrder = (): OrderDraft => ({ customer: "", phone: "", city: "", address: "", business: "", product: "", qty: 1, total: 0, location: { lat: 35.7219, lng: 51.3347, label: "مرکز نقشه" } });
const blankProduct = (): ProductDraft => ({ type: "", fabric: "", color: "", stock: 0, reserved: 0, sku: "", details: "", weight: "", button: "", description: "" });
const blankMaterial = (): MaterialDraft => ({ name: "", category: "پارچه", stock: 0, unit: "متر", threshold: 0, breakdown: [], description: "" });

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
  useCurrency();
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
  const [materialBreakdown, setMaterialBreakdown] = useState<NonNullable<RawMaterial["breakdown"]>>([]);
  const [tagText, setTagText] = useState("");
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null);
  const [deliveryTab, setDeliveryTab] = useState<OrderStatus>("pending");
  const [query, setQuery] = useState("");
  const [orderCustomerQuery, setOrderCustomerQuery] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [inventoryTab, setInventoryTab] = useState<"garments" | "materials">("garments");
  const [inventoryFilterOpen, setInventoryFilterOpen] = useState(false);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("");
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState("");
  const [inventoryOnlyLow, setInventoryOnlyLow] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const currentJalali = jalaliParts(Date.now());
  const [deliveryYear, setDeliveryYear] = useState(String(currentJalali.year));
  const [deliveryMonth, setDeliveryMonth] = useState(String(currentJalali.month));
  const [toast, setToast] = useState("");
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
  const [deliveryMapOrderId, setDeliveryMapOrderId] = useState<string | null>(null);
  const [deliveryDraft, setDeliveryDraft] = useState({ method: "", cost: 0, date: Date.now(), note: "" });
  const [movementItemId, setMovementItemId] = useState<string | null>(null);
  const [editingMovementId, setEditingMovementId] = useState<number | null>(null);
  const [deleteMovementId, setDeleteMovementId] = useState<number | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [editMovementDraft, setEditMovementDraft] = useState({ branchPath: "کل موجودی", direction: "in" as "in" | "out" | "adjustment", quantity: 0, unit: "عدد", note: "" });
  const [movementBranchPath, setMovementBranchPath] = useState("کل موجودی");
  const [movementDraft, setMovementDraft] = useState({ direction: "in" as "in" | "out" | "adjustment", quantity: 0, unit: "عدد", note: "" });
  const activityMutation=trpc.activities.create.useMutation();
  const refreshInterval=useRefreshInterval();
  const customersQuery=trpc.crm.customers.useQuery(undefined,{refetchInterval:refreshInterval,refetchIntervalInBackground:true});
  const ordersQuery=trpc.crm.orders.useQuery(undefined,{refetchInterval:refreshInterval,refetchIntervalInBackground:true});
  const inventoryQuery=trpc.inventory.list.useQuery(undefined,{refetchInterval:refreshInterval,refetchIntervalInBackground:true});
  const createInventoryMutation=trpc.inventory.create.useMutation();
  const updateInventoryMutation=trpc.inventory.update.useMutation();
  const addMovementMutation=trpc.inventory.addMovement.useMutation();
  const editMovementMutation=trpc.inventory.editMovement.useMutation();
  const deleteMovementMutation=trpc.inventory.deleteMovement.useMutation();
  const movementHistoryId=movementItemId?.startsWith("INV-")?Number(movementItemId.replace("INV-","")):0;
  const movementHistoryQuery=trpc.inventory.movements.useQuery({inventoryItemId:movementHistoryId},{enabled:movementHistoryId>0,refetchInterval:refreshInterval,refetchIntervalInBackground:true});
  const createCustomerMutation=trpc.crm.createCustomer.useMutation();
  const createOrderMutation=trpc.crm.createOrder.useMutation();
  const updateOrderMutation=trpc.crm.updateOrder.useMutation();
  const updateCustomerMutation=trpc.crm.updateCustomer.useMutation();
  const utils=trpc.useUtils();
  const authQuery=trpc.auth.me.useQuery();
  const userPermissions=useMemo(()=>{if(authQuery.data?.role==="admin")return new Set(["inventory.view","inventory.edit","inventory.movements","inventory.history","reports.view","reports.export"]);try{return new Set(Object.entries(JSON.parse(authQuery.data?.permissionsJson||"{}" )).filter(([,value])=>value==="view"||value==="edit").map(([key])=>key));}catch{return new Set<string>();}},[authQuery.data]);
  const can=(scope:string)=>authQuery.data?.role==="admin"||userPermissions.has(scope);

  useEffect(() => { localStorage.setItem("taraz-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => {
    if (!ordersQuery.data || !customersQuery.data) return;
    const customerMap = new Map((customersQuery.data as any[]).map(customer => [customer.id, customer]));
    const sharedOrders: Order[] = (ordersQuery.data as any[]).map(row => {
      const customer = customerMap.get(row.customerId) || {};
      let items: any[] = [];
      try { items = JSON.parse(row.itemsJson || "[]"); } catch { items = []; }
      const item = items[0] || {};
      const qty = Number(item.qty || item.sizes?.reduce((sum:number, size:any) => sum + Number(size.qty || 0), 0) || 0);
      return { id: `DB-${row.id}`, customerId: row.customerId, customer: customer.name || "مشتری ثبت‌شده", phone: customer.phone || "", city: customer.city || "", address: row.address || customer.address || "", business: customer.business || "", product: item.product || item.type || "محصول سفارش", qty, total: Number(row.total || 0), status: row.status, createdAt: new Date(row.createdAt).getTime(), jalaliDate: row.jalaliDate, notes: row.notes || "", location: { lat: Number(row.lat || customer.lat || 35.7219), lng: Number(row.lng || customer.lng || 51.3347), label: row.address || customer.address || "لوکیشن ثبت‌شده" }, delivery: row.status === "delivered" ? { completedAt: row.deliveryAt ? new Date(row.deliveryAt).getTime() : new Date(row.createdAt).getTime(), cost: Number(row.deliveryCost || 0), method: row.deliveryMethod || "ثبت نشده", note: row.deliveryNote || "" } : undefined };
    });
    setOrders(sharedOrders);
    if (!selectedOrderId || !sharedOrders.some(order => order.id === selectedOrderId)) setSelectedOrderId(sharedOrders[0]?.id || "");
  }, [ordersQuery.data, customersQuery.data]);
  useEffect(() => {
    if (!inventoryQuery.data) return;
    const garmentsFromDb: Garment[] = []; const materialsFromDb: RawMaterial[] = [];
    (inventoryQuery.data as any[]).forEach(row => { try { const parsed = JSON.parse(row.dataJson); const value = { ...parsed, id: `INV-${row.id}` }; if (row.kind === "garment") garmentsFromDb.push(value); else materialsFromDb.push(value); } catch {} });
    setGarments(garmentsFromDb); setMaterials(materialsFromDb);
  }, [inventoryQuery.data]);
  useEffect(() => { localStorage.setItem("taraz-garments", JSON.stringify(garments)); }, [garments]);
  useEffect(() => { localStorage.setItem("taraz-materials", JSON.stringify(materials)); }, [materials]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 3000); return () => window.clearTimeout(id); }, [toast]);

  const page = route.startsWith("/orders") ? "orders" : route.startsWith("/delivery") ? "delivery" : route.startsWith("/inventory") ? "inventory" : "dashboard";
  const pending = orders.filter(order => order.status === "pending");
  const delivered = orders.filter(order => order.status === "delivered");
  const selectedOrder = orders.find(order => order.id === selectedOrderId) ?? orders[0];
  const searchOrders = (data: Order[]) => data.filter(order => `${order.customer} ${order.city} ${order.business} ${order.product} ${order.phone}`.includes(query.trim()));
  const filteredOrders = searchOrders(orders);
  const filteredOrderList = useMemo(() => orders.filter(order => {
    const customerMatch = order.customer.toLocaleLowerCase("fa-IR").includes(orderCustomerQuery.trim().toLocaleLowerCase("fa-IR"));
    const fromMatch = !orderDateFrom || order.createdAt >= new Date(`${orderDateFrom}T00:00:00`).getTime();
    const toMatch = !orderDateTo || order.createdAt <= new Date(`${orderDateTo}T23:59:59`).getTime();
    return customerMatch && fromMatch && toMatch;
  }), [orders, orderCustomerQuery, orderDateFrom, orderDateTo]);
  const filteredDelivery = searchOrders(deliveryTab === "pending" ? pending : delivered);
  const garmentStock = garments.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = materials.filter(item => item.stock <= item.threshold).length;
  const selectedDeliverySummary = useMemo(() => delivered.reduce((summary, order) => { const timestamp = order.delivery?.completedAt; if (!timestamp) return summary; const parts = jalaliParts(timestamp); if (parts.year === Number(deliveryYear) && parts.month === Number(deliveryMonth)) { summary.total += order.delivery?.cost ?? 0; summary.count += 1; } return summary; }, { total: 0, count: 0 }), [delivered, deliveryYear, deliveryMonth]);
  const salesByMonth = useMemo(() => PERSIAN_MONTHS.map((month, index) => ({ month, sales: orders.filter(order => jalaliParts(order.createdAt).month === index + 1).reduce((sum, order) => sum + Number(order.total || 0), 0) })), [orders]);
  const filteredGarments = useMemo(() => garments.filter(item => { const text = `${item.type} ${item.fabric} ${item.color} ${item.sku} ${item.details} ${item.description}`.toLocaleLowerCase("fa-IR"); const matchesText = text.includes(query.trim().toLocaleLowerCase("fa-IR")); const matchesCategory = !inventoryCategoryFilter || item.type === inventoryCategoryFilter || item.fabric === inventoryCategoryFilter || item.color === inventoryCategoryFilter; const matchesLow = !inventoryOnlyLow || item.stock <= item.reserved; return matchesText && matchesCategory && matchesLow; }), [garments, query, inventoryCategoryFilter, inventoryOnlyLow]);
  const filteredMaterials = useMemo(() => materials.filter(item => { const branches = (item.breakdown || []).flatMap(branch => [branch.name, ...(branch.children || []).map(child => child.name)]).join(" "); const text = `${item.name} ${item.category} ${item.tags.join(" ")} ${branches} ${item.description}`.toLocaleLowerCase("fa-IR"); const matchesText = text.includes(query.trim().toLocaleLowerCase("fa-IR")); const matchesCategory = !inventoryCategoryFilter || item.category === inventoryCategoryFilter; const matchesBranch = !inventoryBranchFilter || branches.toLocaleLowerCase("fa-IR").includes(inventoryBranchFilter.trim().toLocaleLowerCase("fa-IR")); const matchesLow = !inventoryOnlyLow || item.stock <= item.threshold; return matchesText && matchesCategory && matchesBranch && matchesLow; }), [materials, query, inventoryCategoryFilter, inventoryBranchFilter, inventoryOnlyLow]);
  const liveRefreshing = customersQuery.isFetching || ordersQuery.isFetching || inventoryQuery.isFetching;

  const showToast = (message: string) => setToast(message);
  const logActivity = (text: string) => { try { const current=JSON.parse(localStorage.getItem("sepid-activities")||"[]"); localStorage.setItem("sepid-activities",JSON.stringify([{id:Date.now(),text,time:Date.now()},...current].slice(0,40))); } catch {} activityMutation.mutate({text}); };
  const openNewOrder = () => { setEditOrderId(null); setOrderDraft(blankOrder()); setOrderModal(true); };
  const openEditOrder = (order: Order) => { const { id, createdAt, status, delivery, ...draft } = order; setEditOrderId(id); setOrderDraft(draft); setOrderModal(true); };
  const saveOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!orderDraft.customer || !orderDraft.product || !orderDraft.address) return showToast("نام مشتری، محصول و آدرس را کامل کنید.");
    try {
      const existingCustomer = (customersQuery.data as any[] | undefined)?.find(customer => customer.id === orderDraft.customerId || customer.phone === orderDraft.phone);
      const customer = existingCustomer || await createCustomerMutation.mutateAsync({ name: orderDraft.customer, phone: orderDraft.phone, business: orderDraft.business, city: orderDraft.city, address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng });
      await updateCustomerMutation.mutateAsync({ id: customer.id, data: { name: orderDraft.customer, phone: orderDraft.phone, business: orderDraft.business, city: orderDraft.city, address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng } });
      const itemsJson = JSON.stringify([{ product: orderDraft.product, qty: orderDraft.qty, unit: orderDraft.qty ? Math.round(orderDraft.total / orderDraft.qty) : orderDraft.total, sizes: [] }]);
      if (editOrderId && editOrderId.startsWith("DB-")) {
        const id = Number(editOrderId.replace("DB-", ""));
        const saved = await updateOrderMutation.mutateAsync({ id, data: { customerId: customer.id, address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng, itemsJson, total: orderDraft.total } });
        const next: Order = { ...orderDraft, id: editOrderId, customerId: customer.id, status: "pending", createdAt: Date.now(), location: { ...orderDraft.location, label: orderDraft.address } };
        setOrders(data => data.map(item => item.id === editOrderId ? { ...item, ...next, status: saved.status } : item));
        showToast("اطلاعات سفارش و لوکیشن در دیتابیس ذخیره شد."); logActivity(`سفارش ${editOrderId} ویرایش شد`);
      } else if (!editOrderId) {
        const saved = await createOrderMutation.mutateAsync({ customerId: customer.id, jalaliDate: jalaliDate(Date.now()), address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng, itemsJson, total: orderDraft.total, status: "pending" });
        const newOrder: Order = { ...orderDraft, id: `DB-${saved.id}`, customerId: customer.id, status: "pending", createdAt: new Date(saved.createdAt).getTime(), location: { ...orderDraft.location, label: orderDraft.address } };
        setOrders(data => [newOrder, ...data]); setSelectedOrderId(newOrder.id); showToast("سفارش ثبت و در صف تحویل قرار گرفت."); logActivity(`سفارش جدید ${newOrder.id} برای ${newOrder.customer} ثبت شد`);
      } else {
        setOrders(data => data.map(item => item.id === editOrderId ? { ...item, ...orderDraft } : item));
        showToast("اطلاعات سفارش ویرایش شد."); logActivity(`سفارش ${editOrderId} ویرایش شد`);
      }
      await utils.crm.orders.invalidate(); await utils.crm.customers.invalidate();
      setOrderModal(false);
    } catch { showToast("ذخیره سفارش انجام نشد؛ اتصال دیتابیس را بررسی کنید."); }
  };
  const openDeliveryConfirmation = (id: string) => { setDeliveryOrderId(id); setDeliveryDraft({ method: "", cost: 0, date: Date.now(), note: "" }); };
  const markDelivered = async (event: FormEvent) => {
    event.preventDefault();
    if (!deliveryOrderId) return;
    try {
      if (deliveryOrderId.startsWith("DB-")) await updateOrderMutation.mutateAsync({ id: Number(deliveryOrderId.replace("DB-", "")), data: { status: "delivered", deliveryMethod: deliveryDraft.method, deliveryCost: deliveryDraft.cost, deliveryAt: new Date(deliveryDraft.date), deliveryNote: deliveryDraft.note } });
      setOrders(data => data.map(order => order.id === deliveryOrderId ? { ...order, status: "delivered", delivery: { completedAt: deliveryDraft.date, cost: deliveryDraft.cost, method: deliveryDraft.method, note: deliveryDraft.note } } : order));
      await utils.crm.orders.invalidate();
      setDeliveryOrderId(null); setDeliveryTab("delivered"); showToast("هزینه و اطلاعات ارسال ثبت شد؛ سفارش تحویل‌شده شد."); logActivity(`تحویل سفارش ${deliveryOrderId} ثبت شد`);
    } catch { showToast("ثبت تحویل انجام نشد؛ دوباره تلاش کنید."); }
  };
  const saveGarment = async (event: FormEvent) => {
    event.preventDefault();
    if (!productDraft.type || !productDraft.fabric || !productDraft.color) return showToast("نوع، جنس و رنگ پوشاک را وارد کنید.");
    const payload = { ...productDraft, variants: (productDraft as any).variants || [] };
    if (editProductId?.startsWith("INV-")) { await updateInventoryMutation.mutateAsync({ id: Number(editProductId.replace("INV-", "")), data: { dataJson: JSON.stringify(payload) } }); showToast("پوشاک ویرایش شد."); logActivity(`پوشاک ${productDraft.type} ویرایش شد`); }
    else { await createInventoryMutation.mutateAsync({ kind: "garment", dataJson: JSON.stringify(payload) }); showToast("پوشاک به انبار اضافه شد."); logActivity(`پوشاک جدید ${productDraft.type} به انبار اضافه شد`); }
    await utils.inventory.list.invalidate();
    setInventoryModal(null);
  };
  const saveMaterial = async (event: FormEvent) => {
    event.preventDefault();
    if (!materialDraft.name || !materialDraft.category) return showToast("نام و دسته‌بندی مواد اولیه را وارد کنید.");
    const payload = { ...materialDraft, tags: materialTags, breakdown: materialBreakdown };
    if (editMaterialId?.startsWith("INV-")) { await updateInventoryMutation.mutateAsync({ id: Number(editMaterialId.replace("INV-", "")), data: { dataJson: JSON.stringify(payload) } }); showToast("ماده اولیه و زیرشاخه‌ها ویرایش شد."); logActivity(`ماده اولیه ${materialDraft.name} ویرایش شد`); }
    else { await createInventoryMutation.mutateAsync({ kind: "material", dataJson: JSON.stringify(payload) }); showToast("ماده اولیه به انبار اضافه شد."); logActivity(`ماده اولیه جدید ${materialDraft.name} اضافه شد`); }
    await utils.inventory.list.invalidate();
    setInventoryModal(null);
  };
  const openProduct = (item?: Garment) => { setEditProductId(item?.id ?? null); setProductDraft(item ? { ...item } : blankProduct()); setInventoryModal("garment"); };
  const openMaterial = (item?: RawMaterial) => { setEditMaterialId(item?.id ?? null); setMaterialDraft(item ? { name: item.name, category: item.category, stock: item.stock, unit: item.unit, threshold: item.threshold, description: item.description, breakdown: item.breakdown || [] } : blankMaterial()); setMaterialTags(item?.tags ?? []); setMaterialBreakdown(item?.breakdown || []); setTagText(""); setInventoryModal("material"); };
  const addTag = () => { const value = tagText.trim(); if (value && !materialTags.includes(value)) setMaterialTags(tags => [...tags, value]); setTagText(""); };
  const addBreakdown = () => setMaterialBreakdown(items => [...items, { name: "", quantity: 0, unit: materialDraft.unit, children: [] }]);
  const addBreakdownChild = (index: number) => setMaterialBreakdown(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, children: [...(item.children || []), { name: "", quantity: 0, unit: item.unit }] } : item));
  const movementItem = movementItemId ? [...materials, ...garments].find(item => item.id === movementItemId) : undefined;
  const movementBranches = movementItem && "breakdown" in movementItem ? (movementItem.breakdown || []).flatMap(branch => [{ path: branch.name, label: branch.name, unit: branch.unit }, ...(branch.children || []).map(child => ({ path: `${branch.name} > ${child.name}`, label: `${branch.name} > ${child.name}`, unit: child.unit }))]) : [];
  const openMovementHistory = (item: RawMaterial | Garment) => { setMovementItemId(item.id); setMovementBranchPath("کل موجودی"); setMovementDraft({ direction: "in", quantity: 0, unit: "breakdown" in item && item.breakdown?.[0]?.unit ? item.breakdown[0].unit : "عدد", note: "" }); };
  const applyMovementToItem = (item: any, path: string, direction: "in" | "out" | "adjustment", quantity: number) => {
    const delta = direction === "in" ? quantity : direction === "out" ? -quantity : 0;
    const next = JSON.parse(JSON.stringify(item));
    if (path === "کل موجودی") next.stock = direction === "adjustment" ? quantity : Math.max(0, Number(next.stock || 0) + delta);
    else if (next.breakdown) next.breakdown = next.breakdown.map((branch: any) => { if (path === branch.name) return { ...branch, quantity: direction === "adjustment" ? quantity : Math.max(0, Number(branch.quantity || 0) + delta) }; return { ...branch, children: (branch.children || []).map((child: any) => path === `${branch.name} > ${child.name}` ? { ...child, quantity: direction === "adjustment" ? quantity : Math.max(0, Number(child.quantity || 0) + delta) } : child) }; });
    return next;
  };
  const getBranchQuantity = (item: any, path: string) => { if (path === "کل موجودی") return Number(item.stock || 0); for (const branch of item.breakdown || []) { if (path === branch.name) return Number(branch.quantity || 0); for (const child of branch.children || []) if (path === `${branch.name} > ${child.name}`) return Number(child.quantity || 0); } return 0; };
  const saveMovement = async (event: FormEvent) => { event.preventDefault(); if (!movementItem || !movementItemId || movementDraft.quantity <= 0) return showToast("مقدار گردش موجودی را وارد کنید."); try { const next = applyMovementToItem(movementItem, movementBranchPath, movementDraft.direction, movementDraft.quantity); await updateInventoryMutation.mutateAsync({ id: Number(movementItemId.replace("INV-", "")), data: { dataJson: JSON.stringify(next) } }); await addMovementMutation.mutateAsync({ inventoryItemId: Number(movementItemId.replace("INV-", "")), branchPath: movementBranchPath, direction: movementDraft.direction, quantity: movementDraft.quantity, previousQuantity: getBranchQuantity(movementItem, movementBranchPath), unit: movementDraft.unit, note: movementDraft.note || null }); await utils.inventory.list.invalidate(); await movementHistoryQuery.refetch(); setMovementDraft(draft => ({ ...draft, quantity: 0, note: "" })); showToast("گردش موجودی ثبت و مقدار انبار به‌روزرسانی شد."); } catch { showToast("ثبت گردش موجودی انجام نشد."); } };
  const refreshMovementHistory = async () => { await utils.inventory.list.invalidate(); await movementHistoryQuery.refetch(); };
  const handleEditMovement = async (movement: any) => { if (!movementItem || !movementItemId) return; const reason = changeReason.trim(); if (reason.length < 3) return showToast("برای ویرایش، دلیل تغییر را ثبت کنید."); if (editMovementDraft.quantity <= 0) return showToast("مقدار جدید را وارد کنید."); try { const inverseDirection = movement.direction === "in" ? "out" : movement.direction === "out" ? "in" : "adjustment"; const restored = movement.direction === "adjustment" && movement.previousQuantity !== null ? applyMovementToItem(movementItem, movement.branchPath, "adjustment", Number(movement.previousQuantity)) : applyMovementToItem(movementItem, movement.branchPath, inverseDirection as "in" | "out" | "adjustment", Number(movement.quantity)); const corrected = applyMovementToItem(restored, editMovementDraft.branchPath, editMovementDraft.direction, editMovementDraft.quantity); await updateInventoryMutation.mutateAsync({ id: Number(movementItemId.replace("INV-", "")), data: { dataJson: JSON.stringify(corrected) } }); await editMovementMutation.mutateAsync({ id: movement.id, data: { branchPath: editMovementDraft.branchPath, direction: editMovementDraft.direction, quantity: Number(editMovementDraft.quantity), unit: editMovementDraft.unit, note: editMovementDraft.note || null, previousQuantity: getBranchQuantity(restored, editMovementDraft.branchPath), changeReason: reason } }); await refreshMovementHistory(); setEditingMovementId(null); setChangeReason(""); showToast("رکورد گردش با ثبت دلیل اصلاح شد."); } catch { showToast("ویرایش رکورد انجام نشد."); } };
  const handleDeleteMovement = async (movement: any) => { if (!movementItem || !movementItemId) return; const reason = deleteReason.trim(); if (reason.length < 3) return showToast("برای حذف، دلیل تغییر را ثبت کنید."); try { const inverseDirection = movement.direction === "in" ? "out" : movement.direction === "out" ? "in" : "adjustment"; const next = movement.direction === "adjustment" && movement.previousQuantity !== null ? applyMovementToItem(movementItem, movement.branchPath, "adjustment", Number(movement.previousQuantity)) : applyMovementToItem(movementItem, movement.branchPath, inverseDirection as "in" | "out" | "adjustment", Number(movement.quantity)); await updateInventoryMutation.mutateAsync({ id: Number(movementItemId.replace("INV-", "")), data: { dataJson: JSON.stringify(next) } }); await deleteMovementMutation.mutateAsync({ id: movement.id, changeReason: reason }); await refreshMovementHistory(); setDeleteMovementId(null); setDeleteReason(""); showToast("رکورد حذف نرم شد و اثر آن از موجودی برگشت داده شد."); } catch { showToast("حذف رکورد انجام نشد."); } };
  const exportMovementExcel = () => { const rows = (movementHistoryQuery.data || []) as any[]; const labels: Record<string,string> = { in:"ورود", out:"خروج", adjustment:"اصلاح موجودی" }; const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char] || char)); const html = `<html dir="rtl"><meta charset="utf-8"><table border="1"><thead><tr><th>واحد پول سامانه</th><th>شناسه</th><th>مسیر زیرشاخه</th><th>نوع گردش</th><th>مقدار</th><th>واحد</th><th>توضیحات</th><th>دلیل تغییر</th><th>تاریخ</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(currencyLabel())}</td><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.branchPath)}</td><td>${escapeHtml(row.isDeleted ? "حذف‌شده" : labels[row.direction] || row.direction)}</td><td>${escapeHtml(row.quantity)}</td><td>${escapeHtml(row.unit)}</td><td>${escapeHtml(row.note)}</td><td>${escapeHtml(row.changeReason)}</td><td>${escapeHtml(jalaliDate(new Date(row.createdAt).getTime(), true))}</td></tr>`).join("")}</tbody></table></html>`; const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `inventory-movements-${new Date().toISOString().slice(0,10)}.xls`; anchor.click(); URL.revokeObjectURL(url); showToast("گزارش Excel دانلود شد."); };
  const printMovementHistory = () => { const rows = (movementHistoryQuery.data || []) as any[]; const labels: Record<string,string> = { in:"ورود", out:"خروج", adjustment:"اصلاح موجودی" }; const popup = window.open("", "_blank", "width=1000,height=760"); if (!popup) return showToast("مرورگر اجازه باز کردن پنجره چاپ را نداد."); const itemName = movementItem && ("name" in movementItem ? movementItem.name : `${movementItem.type} ${movementItem.color}`); popup.document.write(`<html dir="rtl"><head><title>گزارش گردش موجودی - ${itemName}</title><style>body{font-family:Tahoma,Arial,sans-serif;padding:32px;color:#18251f}h1{font-size:22px;margin:0 0 8px}p{color:#68756d;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccd7ce;padding:9px;text-align:right;font-size:12px}th{background:#eaf3ea} .deleted{color:#9b5d50;text-decoration:line-through}@media print{button{display:none}}</style></head><body><h1>گزارش گردش موجودی: ${itemName || ""}</h1><p>تاریخ تهیه: ${jalaliDate(Date.now(), true)} · رکوردها: ${rows.length} · واحد پول سامانه: ${currencyLabel()}</p><table><thead><tr><th>شناسه</th><th>مسیر زیرشاخه</th><th>نوع</th><th>مقدار</th><th>واحد</th><th>توضیحات</th><th>دلیل تغییر</th><th>تاریخ</th></tr></thead><tbody>${rows.map(row => `<tr class="${row.isDeleted ? "deleted" : ""}"><td>${row.id}</td><td>${row.branchPath}</td><td>${row.isDeleted ? "حذف‌شده" : labels[row.direction] || row.direction}</td><td>${row.quantity}</td><td>${row.unit}</td><td>${row.note || ""}</td><td>${row.changeReason || "-"}</td><td>${jalaliDate(new Date(row.createdAt).getTime(), true)}</td></tr>`).join("")}</tbody></table><button onclick="window.print()">چاپ / ذخیره PDF</button></body></html>`); popup.document.close(); popup.focus(); };

  const commonSearch = <div className="search-field"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجو در نام، شهر، صنف و محصول..." /><kbd>⌘ K</kbd></div>;
  const PageHeading = ({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) => <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;

  const OrderTable = ({ data, compact = false }: { data: Order[]; compact?: boolean }) => <div className="data-card order-table-card">
    <div className="table-head"><div><h3>{compact ? "سفارش‌های نیازمند توجه" : "فهرست سفارش‌ها"}</h3><span>{number(data.length)} مورد</span></div>{!compact && <button className="filter-button"><SlidersHorizontal size={17} /> فیلترها <ChevronDown size={15} /></button>}</div>
    <div className="orders-list">
      {data.map((order,index) => <div className="order-row" key={`order-row-${order.id}-${order.phone||order.customer||""}-${index}`} onClick={() => setSelectedOrderId(order.id)}>
        <div className="customer-avatar">{order.customer.slice(0, 1)}</div>
        <div className="order-person"><strong>{order.customer}</strong><span>{order.business} · {order.city}</span></div>
        {!compact && <div className="order-product"><span>{order.product}</span><small>{number(order.qty)} عدد · {order.id}</small></div>}
        <div className="order-date"><span>{shortJalaliDate(order.createdAt)}</span><small>{order.status === "pending" ? "در انتظار تحویل" : "تحویل شده"}</small></div>
        <div className="order-amount"><strong>{money(order.total)}</strong>{order.status === "pending" ? <span className="status amber"><Clock3 size={13} /> آماده‌سازی</span> : <span className="status green"><Check size={13} /> تحویل شده</span>}</div>
        <button className="row-menu" onClick={event => { event.stopPropagation(); if (order.id.startsWith("DB-")) setRoute(`/orders/${order.id.replace("DB-", "")}`); else openEditOrder(order); }} aria-label="مشاهده جزئیات سفارش"><FileText size={16} /></button>
      </div>)}
      {data.length === 0 && <div className="empty-state"><Package size={25} /><strong>موردی با این جستجو پیدا نشد.</strong><span>عبارت یا فیلتر را تغییر دهید.</span></div>}
    </div>
  </div>;

  const DashboardPage = <>
    <div className="dashboard-brand-banner"><img src={COMPANY_LOGO} alt="لوگوی تولیدی پوشاک سپید" /><div><span className="eyebrow">برند رسمی کارخانه</span><strong>تولیدی پوشاک سپید</strong><small>سامانه مدیریت فروش، سفارش و انبار</small></div></div>
    <PageHeading eyebrow={`امروز · ${jalaliDate(Date.now())}`} title={`صبح بخیر، ${authQuery.data?.name || "همکار کارگاه"}`} description={authQuery.data?.role === "admin" ? "نمایی از سفارش‌ها، تحویل‌ها و موجودی امروز شما." : `سمت: ${authQuery.data?.jobTitle || "کارمند کارگاه"} · نمایی از بخش‌های مجاز شما.`} action={undefined} />
    <section className="stats-grid">
      <article className="stat-card green-card"><div className="stat-icon"><ClipboardList size={20} /></div><div><span>سفارش‌های فعال</span><strong>{number(pending.length)}</strong><small>از داده‌های ثبت‌شده</small></div></article>
      <article className="stat-card peach-card"><div className="stat-icon"><Truck size={20} /></div><div><span>در انتظار تحویل</span><strong>{number(pending.length)}</strong><small>سفارش آماده ارسال</small></div></article>
      <article className="stat-card lavender-card"><div className="stat-icon"><Boxes size={20} /></div><div><span>موجودی پوشاک</span><strong>{number(garmentStock)}</strong><small>{number(garments.length)} مدل ثبت‌شده</small></div></article>
      <article className="stat-card yellow-card"><div className="stat-icon"><CircleDollarSign size={20} /></div><div><span>فروش تحویل‌شده</span><strong>{money(delivered.reduce((sum, order) => sum + order.total, 0))}</strong><small>از داده‌های ثبت‌شده</small></div></article>
    </section>
    {can("reports.view") ? <section className="sales-chart-card"><div className="chart-card-head"><div><span className="eyebrow">تحلیل فروش</span><h3>مقایسه فروش ماه‌های مختلف</h3><p>مجموع مبلغ سفارش‌های ثبت‌شده بر اساس ماه شمسی</p></div><span className="chart-unit">{currencyLabel()}</span></div><div className="sales-chart"><ResponsiveContainer width="100%" height={270}><BarChart data={salesByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 2 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ece7"/><XAxis dataKey="month" tick={{ fontSize: 10, fill: "#718078" }} interval={0} tickFormatter={(value) => String(value).slice(0, 4)}/><YAxis tick={{ fontSize: 10, fill: "#718078" }} tickFormatter={(value) => new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))}/><Tooltip formatter={(value) => [money(Number(value)), `فروش (${currencyLabel()})`]} labelFormatter={(label) => `ماه ${label}`} contentStyle={{ direction: "rtl", borderRadius: 10, border: "1px solid #dfe8dd", fontFamily: "Vazirmatn" }}/><Bar dataKey="sales" name="فروش" fill="#31584a" radius={[7, 7, 0, 0]} maxBarSize={34}/></BarChart></ResponsiveContainer></div></section> : <section className="data-card restricted-card"><ShieldCheck size={21}/><strong>گزارش‌های فروش محدود شده است</strong><span>برای مشاهده نمودار، مجوز «گزارش‌ها · مشاهده» را از مدیر سیستم دریافت کنید.</span></section>}
    <section className="dashboard-grid">
      <OrderTable data={pending.slice(0, 3)} compact />
      <aside className="readiness-card">
        <div className="card-topline"><div><span className="eyebrow">نبض انبار</span><h3>وضعیت تأمین امروز</h3></div><Sparkles size={19} /></div>
        <div className="inventory-hero"><div><span>پوشاک آماده</span><strong>{number(garmentStock)}<small> عدد</small></strong></div><div className="circle-meter"><span>{garmentStock ? "ثبت‌شده" : "۰٪"}</span></div></div>
        {materials.length ? materials.slice(0,2).map(item => <div className="need-row" key={item.id}><div className={`need-dot ${item.stock <= item.threshold ? "warning" : "okay"}`} /><div><strong>{item.name}</strong><span>{item.stock <= item.threshold ? "به نقطه سفارش رسیده" : "موجودی ایمن"}</span></div><b>{number(item.stock)} {item.unit}</b></div>) : <div className="empty-mini">هنوز ماده اولیه‌ای ثبت نشده است.</div>}
        <button className="text-button" onClick={() => setRoute("/inventory")}>مشاهده‌ی همه موجودی <ArrowDownLeft size={16} /></button>
      </aside>
    </section>
    <section className="location-strip">
      <div className="location-copy"><div className="location-icon"><MapPin size={20} /></div><div><span>آخرین نقطه‌ی ثبت‌شده</span><h3>{selectedOrder?.location.label || "هنوز لوکیشنی ثبت نشده است"}</h3><p>{selectedOrder ? `${selectedOrder.customer} · ${selectedOrder.business}` : "پس از ثبت اولین سفارش، موقعیت اینجا نمایش داده می‌شود."}</p></div><button className="outline-button" onClick={() => setRoute("/orders")}>مشاهده سفارش‌ها</button></div>
      <div className="map-art"><span className="map-route route-one" /><span className="map-route route-two" /><i className="map-point pin-one"><MapPin size={14} /></i><i className="map-point pin-two" /></div>
    </section>
  </>;

  const OrdersPage = <>
    <PageHeading eyebrow="ثبت، پیگیری و ویرایش" title="سفارش‌ها" description="هر سفارش با تاریخ شمسی و موقعیت دقیق مشتری در اینجا نگهداری می‌شود." action={<button className="primary-button" onClick={openNewOrder}><Plus size={18} /> ثبت سفارش جدید</button>} />
    <section className="order-filter-panel"><div className="order-filter-search"><Search size={18} /><input value={orderCustomerQuery} onChange={e => setOrderCustomerQuery(e.target.value)} placeholder="جستجو بر اساس نام مشتری..." /><button type="button" className="clear-filter" onClick={() => setOrderCustomerQuery("")} aria-label="پاک کردن جستجو">{orderCustomerQuery ? <X size={15} /> : null}</button></div><div className="order-date-filter"><CalendarDays size={17} /><label>از تاریخ<input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} /></label><span>تا</span><label>تا تاریخ<input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} /></label></div><button type="button" className="filter-reset" onClick={() => { setOrderCustomerQuery(""); setOrderDateFrom(""); setOrderDateTo(""); }}>حذف فیلترها</button></section><div className="order-filter-result">{filteredOrderList.length.toLocaleString("fa-IR")} سفارش پیدا شد{(orderCustomerQuery || orderDateFrom || orderDateTo) && <span> · فیلتر فعال است</span>}</div>
    <section className="orders-map-layout">{OrderTable({ data: filteredOrderList })}<aside className="order-detail-card">
      {selectedOrder && <><div className="detail-title"><div><span className="eyebrow">جزئیات سفارش</span><h3>{selectedOrder.id}</h3></div><button className="icon-button" onClick={() => openEditOrder(selectedOrder)}><Edit3 size={17} /></button></div>
      <div className="detail-customer"><div className="customer-avatar large">{selectedOrder.customer.slice(0, 1)}</div><div><strong>{selectedOrder.customer}</strong><span>{selectedOrder.phone}</span></div></div>
      <div className="map-frame"><MiniMap location={selectedOrder.location} /><div className="map-label"><MapPin size={15} /><span>{selectedOrder.location.label}</span></div></div>
      <div className="detail-lines"><div><span>آدرس</span><p>{selectedOrder.address}</p></div><div className="line-split"><div><span>صنف</span><p>{selectedOrder.business}</p></div><div><span>تاریخ سفارش</span><p>{jalaliDate(selectedOrder.createdAt)}</p></div></div><div><span>خرید</span><p>{selectedOrder.product} · {number(selectedOrder.qty)} عدد</p></div></div>
      <button className="outline-button full" onClick={() => openEditOrder(selectedOrder)}><Edit3 size={16} /> ویرایش سفارش و لوکیشن</button></>}
    </aside></section>
  </>;

  const DeliveryPage = <>
    <PageHeading eyebrow="ثبت تاریخچه و هزینه ارسال" title="تحویل محصول" description="پس از ثبت سفارش، محصول به‌صورت خودکار وارد صف انتظار تحویل می‌شود." />
    <div className="delivery-period-panel"><div><span className="eyebrow">گزارش هزینه ارسال</span><h3>ماه موردنظر را انتخاب کنید</h3><p>مبلغ دریافتی و تعداد تحویل‌ها فقط برای ماه انتخاب‌شده نمایش داده می‌شود.</p></div><div className="delivery-period-fields"><label>سال شمسی<select value={deliveryYear} onChange={event=>setDeliveryYear(event.target.value)}>{Array.from({length:51},(_,index)=>1450-index).map(year=><option key={year} value={year}>{jalaliYearLabel(year)}</option>)}</select></label><label>ماه<select value={deliveryMonth} onChange={event=>setDeliveryMonth(event.target.value)}>{["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"].map((month,index)=><option key={month} value={index+1}>{month}</option>)}</select></label></div></div><div className="delivery-summary-grid"><div className="delivery-summary-box"><span>دریافتی ماه انتخاب‌شده</span><strong>{money(selectedDeliverySummary.total)}</strong><small>{number(selectedDeliverySummary.count)} تحویل ثبت‌شده</small></div><div className="delivery-summary-box"><span>ماه گزارش</span><strong>{["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"][Number(deliveryMonth)-1]} {jalaliYearLabel(Number(deliveryYear))}</strong><small>تقویم شمسی</small></div></div><div className="delivery-tabs"><button className={deliveryTab === "pending" ? "selected" : ""} onClick={() => setDeliveryTab("pending")}><Clock3 size={17} /> در انتظار تحویل <b>{number(pending.length)}</b></button><button className={deliveryTab === "delivered" ? "selected" : ""} onClick={() => setDeliveryTab("delivered")}><PackageCheck size={17} /> تحویل داده‌شده <b>{number(delivered.length)}</b></button></div>
    <section className="toolbar delivery-toolbar">{commonSearch}<div className="toolbar-actions"><button className="filter-button"><Filter size={17} /> شهر و صنف <ChevronDown size={15} /></button><button className="filter-button"><CalendarDays size={17} /> بازه تاریخ <ChevronDown size={15} /></button></div></section>
    <div className="delivery-list">{filteredDelivery.map((order,index) => <article className="delivery-card" key={`delivery-card-${order.id}-${order.phone||order.customer||""}-${index}`}>
      <div className="delivery-card-head"><div className="delivery-order-chip"><Package size={16} /> {order.id}</div><span>{jalaliDate(order.createdAt)}</span></div>
      <div className="delivery-main"><div className="customer-avatar">{order.customer.slice(0, 1)}</div><div className="delivery-customer"><strong>{order.customer}</strong><span>{order.phone} · {order.business}</span><p><MapPin size={14} /> {order.address}</p></div><div className="delivery-product"><span>اطلاعات خرید</span><strong>{order.product}</strong><p>{number(order.qty)} عدد · {money(order.total)}</p></div><button type="button" className="outline-button compact delivery-location-button" onClick={()=>setDeliveryMapOrderId(order.id)}><MapPin size={15}/> مشاهده لوکیشن</button>{order.id.startsWith("DB-")&&<button type="button" className="outline-button compact delivery-location-button" onClick={()=>setRoute(`/orders/${order.id.replace("DB-", "")}`)}><FileText size={15}/> جزئیات کامل</button>}</div>
      {order.status === "pending" ? <div className="delivery-action"><div><Clock3 size={17} /><span>محصول آماده شد؟ هزینه، نوع ارسال، تاریخ و توضیحات را ثبت کنید.</span></div><button className="primary-button compact" onClick={() => openDeliveryConfirmation(order.id)}><CheckCircle2 size={17} /> ثبت تحویل</button></div> : <div className="delivery-history"><div><Truck size={17} /><span>ارسال با <strong>{order.delivery?.method}</strong> · {jalaliDate(order.delivery?.completedAt ?? order.createdAt, true)}</span></div><div><CircleDollarSign size={17} /><span>مبلغ دریافتی بابت ارسال: <strong>{money(order.delivery?.cost ?? 0)}</strong></span></div><p>{order.delivery?.note}</p><button type="button" className="outline-button compact delivery-location-button" onClick={()=>setDeliveryMapOrderId(order.id)}><MapPin size={15}/> مشاهده لوکیشن ثبت‌شده</button></div>}
    </article>)}{filteredDelivery.length === 0 && <div className="empty-state large-empty"><Truck size={28} /><strong>سفارشی در این بخش نیست.</strong><span>با تغییر تب یا عبارت جستجو، سفارش‌ها را پیدا کنید.</span></div>}</div>
  </>;

  const InventoryPage = <>
    <PageHeading eyebrow="موجودی، ویژگی و قابلیت ویرایش" title="انبار" description="موجودی پوشاک و مواد اولیه را با جزئیات کامل، زیرشاخه و نقطه سفارش مدیریت کنید." action={<button className="primary-button" disabled={!can("inventory.edit")} title={!can("inventory.edit") ? "مجوز افزودن و ویرایش کالا لازم است" : undefined} onClick={() => inventoryTab === "garments" ? openProduct() : openMaterial()}><Plus size={18} /> {inventoryTab === "garments" ? "افزودن پوشاک" : "افزودن ماده اولیه"}</button>} />
    <div className="inventory-tabs"><button className={inventoryTab === "garments" ? "selected" : ""} onClick={() => setInventoryTab("garments")}><Package size={18} /> پوشاک <span>{number(garments.length)} مدل</span></button><button className={inventoryTab === "materials" ? "selected" : ""} onClick={() => setInventoryTab("materials")}><Box size={18} /> مواد اولیه <span>{number(materials.length)} قلم</span></button></div>
    <section className="inventory-summary"><div><span>کل موجودی پوشاک</span><strong>{number(garmentStock)} <small>عدد</small></strong><p>در {number(garments.length)} مدل مختلف</p></div><div><span>مواد نیازمند سفارش</span><strong className="coral-text">{number(lowStock)} <small>قلم</small></strong><p>بر اساس نقطه سفارش شما</p></div><div className="fabric-promo"><div><span>طبقه‌بندی منعطف</span><strong>هر ویژگی را اضافه کنید.</strong><p>جنس، رنگ، گرماژ و زیرشاخه‌ها محدودیتی ندارند.</p></div></div></section>
    <section className="toolbar inventory-toolbar">{commonSearch}<div className="toolbar-actions"><button className={`filter-button ${inventoryFilterOpen ? "active" : ""}`} onClick={() => setInventoryFilterOpen(value => !value)}><ListFilter size={17} /> فیلتر پیشرفته <ChevronDown size={15} /></button><button className={`filter-button ${inventoryOnlyLow ? "active" : ""}`} onClick={() => setInventoryOnlyLow(value => !value)}><SlidersHorizontal size={17} /> فقط کم‌موجود</button></div></section>
    {inventoryFilterOpen && <section className="inventory-filter-panel"><label>{inventoryTab === "garments" ? "نوع، جنس یا رنگ" : "دسته‌بندی"}<input value={inventoryCategoryFilter} onChange={event => setInventoryCategoryFilter(event.target.value)} placeholder={inventoryTab === "garments" ? "مثلاً کاپشن، کجراه، سرمه‌ای" : "مثلاً پارچه، نخ، دکمه"} /></label>{inventoryTab === "materials" && <label>جستجو در زیرشاخه‌ها<input value={inventoryBranchFilter} onChange={event => setInventoryBranchFilter(event.target.value)} placeholder="مثلاً قرمز یا فلزی" /></label>}<button className="outline-button compact" onClick={() => { setInventoryCategoryFilter(""); setInventoryBranchFilter(""); setInventoryOnlyLow(false); setQuery(""); }}>پاک کردن همه فیلترها</button><span className="filter-result-note">{inventoryTab === "garments" ? number(filteredGarments.length) : number(filteredMaterials.length)} نتیجه از دیتابیس</span></section>}
    {inventoryTab === "garments" ? <div className="garment-grid">{filteredGarments.map(item => <article className="garment-card" key={item.id}><div className="garment-top"><div className="fabric-swatch" style={{ background: item.color === "سرمه‌ای" ? "#233b58" : item.color === "کرم" ? "#dfd3be" : item.color === "طوسی" ? "#8b9291" : "#6e7a52" }}><span>{item.type}</span></div><button className="icon-button" onClick={() => openProduct(item)}><Edit3 size={16} /></button></div><div className="garment-name"><div><span>{item.sku}</span><h3>{item.type} {item.color}</h3><p>{item.fabric} · {item.details}</p></div><strong>{number(item.stock)}<small> عدد</small></strong></div><div className="stock-bar"><i style={{ width: `${Math.min(100, (item.stock / 90) * 100)}%` }} /></div><div className="garment-meta"><span>{item.weight}</span><span>{item.button}</span></div><p className="description">{item.description}</p><div className="garment-footer"><span>{number(item.reserved)} عدد رزرو شده</span><div className="inventory-card-actions"><button onClick={() => openMovementHistory(item)}><History size={14}/> گردش</button><button onClick={() => openProduct(item)}>ویرایش</button></div></div></article>)}</div> : <div className="materials-table data-card"><div className="material-header-row"><span>نام ماده اولیه</span><span>دسته‌بندی و زیرشاخه</span><span>موجودی</span><span>وضعیت</span><span /></div>{filteredMaterials.map(item => <div className="material-row" key={item.id}><div><strong>{item.name}</strong><p>{item.description}</p></div><div><div className="tag-cloud"><b>{item.category}</b>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{item.breakdown?.map((branch, branchIndex) => <div className="inventory-breakdown-preview" key={`${item.id}-branch-${branchIndex}`}><strong>{branch.name || "زیرشاخه"}: {number(branch.quantity)} {branch.unit}</strong>{branch.children?.map((child, childIndex) => <span key={`${item.id}-${branchIndex}-${childIndex}`}>↳ {child.name || "زیرزیرشاخه"}: {number(child.quantity)} {child.unit}</span>)}</div>)}</div><div><strong>{number(item.stock)} {item.unit}</strong><p>حد سفارش: {number(item.threshold)} {item.unit}</p></div><div>{item.stock <= item.threshold ? <span className="status red">نیاز به سفارش</span> : <span className="status green">موجودی ایمن</span>}</div><div className="inventory-row-actions"><button className="icon-button" onClick={() => openMovementHistory(item)} title="تاریخچه ورود و خروج"><History size={16} /></button><button className="icon-button" onClick={() => openMaterial(item)} title="ویرایش"><Edit3 size={16} /></button></div></div>)}</div>}
  </>;

  return <DashboardLayout><div className="workspace">
    <div className="page-content"><div className={`sync-indicator ${liveRefreshing ? "is-refreshing" : ""}`}><span className="sync-icon">{liveRefreshing ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />}</span><span>{liveRefreshing ? "در حال بروزرسانی اطلاعات..." : "اطلاعات با دیتابیس همگام است"}</span></div>{page === "dashboard" ? DashboardPage : page === "orders" ? OrdersPage : page === "delivery" ? DeliveryPage : InventoryPage}</div>
    {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}

    <Modal open={Boolean(movementItemId)} onClose={() => setMovementItemId(null)} title="گردش موجودی" subtitle={movementItem ? `${"name" in movementItem ? movementItem.name : `${movementItem.type} ${movementItem.color}`} · ورود، خروج و اصلاح مقدار` : ""} wide>
      {movementItem && <div className="movement-layout"><form className="movement-form" onSubmit={saveMovement}><div className="movement-current"><span>موجودی فعلی</span><strong>{number(movementItem.stock)} <small>{"unit" in movementItem ? movementItem.unit : "عدد"}</small></strong></div><label>زیرشاخه<select value={movementBranchPath} onChange={event => { setMovementBranchPath(event.target.value); const branch = movementBranches.find(item => item.path === event.target.value); if (branch) setMovementDraft(draft => ({ ...draft, unit: branch.unit })); }}><option value="کل موجودی">کل موجودی</option>{movementBranches.map(branch => <option key={branch.path} value={branch.path}>{branch.label}</option>)}</select></label><label>نوع گردش<select value={movementDraft.direction} onChange={event => setMovementDraft({ ...movementDraft, direction: event.target.value as "in" | "out" | "adjustment" })}><option value="in">ورود به انبار</option><option value="out">خروج از انبار</option><option value="adjustment">اصلاح موجودی</option></select></label><div className="form-grid two"><label>مقدار<input type="number" min="1" value={movementDraft.quantity} onChange={event => setMovementDraft({ ...movementDraft, quantity: Number(event.target.value) })} /></label><label>واحد<input value={movementDraft.unit} onChange={event => setMovementDraft({ ...movementDraft, unit: event.target.value })} /></label></div><label>توضیحات<textarea value={movementDraft.note} onChange={event => setMovementDraft({ ...movementDraft, note: event.target.value })} placeholder="خرید جدید، مصرف تولید، اصلاح شمارش و ..." /></label><button className="primary-button" type="submit" disabled={updateInventoryMutation.isPending || addMovementMutation.isPending}>{(updateInventoryMutation.isPending || addMovementMutation.isPending) ? <><LoaderCircle size={16} className="spin"/> در حال ثبت...</> : <><Check size={16}/> ثبت گردش موجودی</>}</button></form><div className="movement-history"><div className="movement-history-head"><div><strong>تاریخچه تغییرات</strong><span>{movementHistoryQuery.isFetching ? "در حال بروزرسانی" : `${number((movementHistoryQuery.data || []).length)} رکورد`}</span></div><div className="movement-export-actions"><button type="button" className="outline-button compact" onClick={exportMovementExcel} disabled={movementHistoryQuery.isLoading}><FileDown size={14}/> Excel</button><button type="button" className="outline-button compact" onClick={printMovementHistory} disabled={movementHistoryQuery.isLoading}><Printer size={14}/> PDF / چاپ</button></div></div>{movementHistoryQuery.isLoading ? <div className="movement-empty"><LoaderCircle className="spin" size={22}/><span>در حال دریافت تاریخچه...</span></div> : (movementHistoryQuery.data || []).length ? <div className="movement-list">{(movementHistoryQuery.data || []).map((movement: any) => <div className={`movement-row ${movement.isDeleted ? "deleted-movement" : ""}`} key={movement.id}><div className={`movement-icon ${movement.direction}`} >{movement.direction === "in" ? <ArrowDownToLine size={16}/> : movement.direction === "out" ? <ArrowUpFromLine size={16}/> : <RotateCcw size={16}/>}</div><div className="movement-info"><strong>{movement.isDeleted ? "حذف‌شده" : movement.direction === "in" ? "ورود" : movement.direction === "out" ? "خروج" : "اصلاح موجودی"} · {movement.branchPath}</strong><span>{number(movement.quantity)} {movement.unit} · {jalaliDate(new Date(movement.createdAt).getTime(), true)}</span>{movement.note && <p>{movement.note}</p>}{movement.changeReason && <p className="movement-reason">دلیل: {movement.changeReason}</p>}</div>{!movement.isDeleted && <div className="movement-row-actions"><button type="button" className="icon-button" title="ویرایش با ثبت دلیل" onClick={() => { setEditingMovementId(movement.id); setEditMovementDraft({ branchPath: movement.branchPath, direction: movement.direction, quantity: movement.quantity, unit: movement.unit, note: movement.note || "" }); setChangeReason(""); }}><Edit3 size={14}/></button><button type="button" className="icon-button danger" title="حذف با ثبت دلیل" onClick={() => { setDeleteMovementId(movement.id); setDeleteReason(""); }}><Trash2 size={14}/></button></div>}{editingMovementId === movement.id && <div className="movement-inline-editor"><select value={editMovementDraft.branchPath} onChange={event => setEditMovementDraft({ ...editMovementDraft, branchPath: event.target.value })}>{movementBranches.map(branch => <option key={branch.path} value={branch.path}>{branch.label}</option>)}<option value="کل موجودی">کل موجودی</option></select><select value={editMovementDraft.direction} onChange={event => setEditMovementDraft({ ...editMovementDraft, direction: event.target.value as "in" | "out" | "adjustment" })}><option value="in">ورود</option><option value="out">خروج</option><option value="adjustment">اصلاح</option></select><input type="number" min="1" value={editMovementDraft.quantity} onChange={event => setEditMovementDraft({ ...editMovementDraft, quantity: Number(event.target.value) })}/><input placeholder="واحد" value={editMovementDraft.unit} onChange={event => setEditMovementDraft({ ...editMovementDraft, unit: event.target.value })}/><input className="reason-input" placeholder="دلیل تغییر الزامی است" value={changeReason} onChange={event => setChangeReason(event.target.value)}/><div><button type="button" className="primary-button compact" onClick={() => handleEditMovement(movement)} disabled={editMovementMutation.isPending}><Check size={13}/> ذخیره اصلاح</button><button type="button" className="text-button" onClick={() => setEditingMovementId(null)}>انصراف</button></div></div>}{deleteMovementId === movement.id && <div className="movement-inline-editor delete-editor"><input className="reason-input" placeholder="دلیل حذف الزامی است" value={deleteReason} onChange={event => setDeleteReason(event.target.value)}/><button type="button" className="primary-button compact danger-button" onClick={() => handleDeleteMovement(movement)} disabled={deleteMovementMutation.isPending}><Trash2 size={13}/> تأیید حذف</button><button type="button" className="text-button" onClick={() => setDeleteMovementId(null)}>انصراف</button></div>}</div>)}</div> : <div className="movement-empty"><History size={24}/><span>هنوز گردش موجودی برای این قلم ثبت نشده است.</span></div>}</div></div>}
    </Modal>
    <Modal open={Boolean(deliveryMapOrderId)} onClose={() => setDeliveryMapOrderId(null)} title="لوکیشن ثبت‌شده سفارش" subtitle="موقعیتی که هنگام ثبت سفارش برای این مشتری ذخیره شده است.">{(()=>{const order=orders.find(item=>item.id===deliveryMapOrderId);return order?<div className="delivery-map-modal"><MiniMap location={order.location}/><div className="selected-location-row"><MapPin size={16}/><span>{order.location.label}</span></div><p>{order.customer} · {order.address}</p></div>:null})()}</Modal>
    <Modal open={Boolean(deliveryOrderId)} onClose={() => setDeliveryOrderId(null)} title="ثبت تحویل محصول" subtitle="هزینه باربری، روش ارسال، تاریخ و توضیحات در سابقه این سفارش ذخیره می‌شود.">
      <form className="modal-form" onSubmit={markDelivered}><div className="form-grid two"><label>نوع ارسال / باربری<select value={deliveryDraft.method} onChange={e => setDeliveryDraft({ ...deliveryDraft, method: e.target.value })}><option value="">انتخاب روش ارسال</option><option>اسنپ‌باکس</option><option>باربری</option><option>پست پیشتاز</option><option>پیک اختصاصی</option><option>تحویل حضوری</option></select></label><label>مبلغ دریافتی بابت ارسال ({currencyLabel()})<input type="number" min="0" value={deliveryDraft.cost} onChange={e => setDeliveryDraft({ ...deliveryDraft, cost: Number(e.target.value) })} /></label><label>تاریخ و زمان تحویل<input value={jalaliDate(deliveryDraft.date, true)} readOnly /></label><div className="field-static"><span>تاریخ شمسی ثبت‌شده</span><strong>{jalaliDate(deliveryDraft.date, true)}</strong></div><label className="span-two">توضیحات تحویل<textarea value={deliveryDraft.note} onChange={e => setDeliveryDraft({ ...deliveryDraft, note: e.target.value })} placeholder="رسید، نام تحویل‌گیرنده، وضعیت بسته و ..." /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setDeliveryOrderId(null)}>انصراف</button><button className="primary-button" type="submit"><Check size={17} /> ثبت تحویل و انتقال سفارش</button></div></form>
    </Modal>

    <Modal open={orderModal} onClose={() => setOrderModal(false)} title={editOrderId ? "ویرایش سفارش" : "ثبت سفارش جدید"} subtitle="تاریخ سفارش به‌صورت خودکار بر اساس تقویم شمسی ثبت می‌شود." wide>
      <form className="modal-form" onSubmit={saveOrder}><div className="form-section-title"><span>اطلاعات مشتری</span><i /></div><div className="form-grid three"><label>نام و نام خانوادگی<input value={orderDraft.customer} onChange={e => setOrderDraft({ ...orderDraft, customer: e.target.value })} placeholder="مثلاً مریم محمدی" /></label><label>شماره تماس<input value={orderDraft.phone} onChange={e => setOrderDraft({ ...orderDraft, phone: e.target.value })} placeholder="۰۹۱۲ ..." /></label><label>شهر<select value={orderDraft.city} onChange={e => setOrderDraft({ ...orderDraft, city: e.target.value })}><option>تهران</option><option>اصفهان</option><option>مشهد</option><option>کرج</option><option>شیراز</option></select></label><label className="span-two">آدرس کامل<input value={orderDraft.address} onChange={e => setOrderDraft({ ...orderDraft, address: e.target.value })} placeholder="خیابان، کوچه، پلاک و ..." /></label><label>صنف / مجموعه<input value={orderDraft.business} onChange={e => setOrderDraft({ ...orderDraft, business: e.target.value })} placeholder="مثلاً کافه آتریوم" /></label></div><div className="map-picker-row"><div><div><MapPin size={18} /><strong>موقعیت دقیق مشتری</strong></div><p>{orderDraft.location.label}</p></div><button type="button" className="outline-button" onClick={() => setMapModal(true)}>انتخاب روی Google Maps</button></div><div className="form-section-title"><span>اطلاعات خرید</span><i /></div><div className="form-grid three"><label className="span-two">محصول / مدل<input value={orderDraft.product} onChange={e => setOrderDraft({ ...orderDraft, product: e.target.value })} placeholder="مثلاً کاپشن کجراه سرمه‌ای" /></label><label>تعداد<input type="number" min="1" value={orderDraft.qty} onChange={e => setOrderDraft({ ...orderDraft, qty: Number(e.target.value) })} /></label><label>مبلغ کل ({currencyLabel()})<input type="number" min="0" value={orderDraft.total} onChange={e => setOrderDraft({ ...orderDraft, total: Number(e.target.value) })} /></label><label>تاریخ سفارش<input value={jalaliDate(Date.now())} disabled /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setOrderModal(false)}>انصراف</button><button type="submit" className="primary-button"><Check size={17} /> {editOrderId ? "ذخیره تغییرات" : "ثبت سفارش"}</button></div></form>
    </Modal>

    <Modal open={mapModal} onClose={() => setMapModal(false)} title="انتخاب نقطه روی نقشه" subtitle="روی Google Maps کلیک کنید تا موقعیت سفارش ذخیره شود." wide>
      <div className="picker-map-wrap"><MiniMap location={orderDraft.location} interactive onPick={point => setOrderDraft(draft => ({ ...draft, location: point }))} /></div><div className="selected-coordinates"><MapPin size={18} /><span>{orderDraft.location.label}</span><small>lat {orderDraft.location.lat.toFixed(5)} · lng {orderDraft.location.lng.toFixed(5)}</small><button className="primary-button compact" onClick={() => { setMapModal(false); showToast("موقعیت سفارش ثبت شد."); }}><Check size={16} /> تأیید موقعیت</button></div>
    </Modal>

    <Modal open={inventoryModal === "garment"} onClose={() => setInventoryModal(null)} title={editProductId ? "ویرایش پوشاک" : "افزودن پوشاک"} subtitle="همه ویژگی‌های پوشاک در کارت موجودی قابل مشاهده و ویرایش خواهند بود.">
      <form className="modal-form" onSubmit={saveGarment}><div className="form-grid two"><label>نوع لباس<input value={productDraft.type} onChange={e => setProductDraft({ ...productDraft, type: e.target.value })} placeholder="کاپشن، پیراهن، ..." /></label><label>کد کالا<input value={productDraft.sku} onChange={e => setProductDraft({ ...productDraft, sku: e.target.value })} placeholder="GR-001" /></label><label>جنس پارچه<input value={productDraft.fabric} onChange={e => setProductDraft({ ...productDraft, fabric: e.target.value })} placeholder="کجراه، ترگال، ..." /></label><label>رنگ<input value={productDraft.color} onChange={e => setProductDraft({ ...productDraft, color: e.target.value })} placeholder="سرمه‌ای" /></label><label>موجودی کل<input type="number" min="0" value={productDraft.stock} onChange={e => setProductDraft({ ...productDraft, stock: Number(e.target.value) })} /></label><label>رزرو شده<input type="number" min="0" value={productDraft.reserved} onChange={e => setProductDraft({ ...productDraft, reserved: Number(e.target.value) })} /></label><label>گرماژ<input value={productDraft.weight} onChange={e => setProductDraft({ ...productDraft, weight: e.target.value })} placeholder="۲۸۰ گرم" /></label><label>نوع دکمه<input value={productDraft.button} onChange={e => setProductDraft({ ...productDraft, button: e.target.value })} placeholder="دکمه فشاری فلزی" /></label><label className="span-two">سایز و ویژگی کوتاه<input value={productDraft.details} onChange={e => setProductDraft({ ...productDraft, details: e.target.value })} placeholder="سایز M تا 3XL" /></label><label className="span-two">توضیحات<textarea value={productDraft.description} onChange={e => setProductDraft({ ...productDraft, description: e.target.value })} placeholder="جزئیات دوخت، یقه، جیب و ..." /></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setInventoryModal(null)}>انصراف</button><button className="primary-button" type="submit"><Check size={17} /> ذخیره پوشاک</button></div></form>
    </Modal>

    <Modal open={inventoryModal === "material"} onClose={() => setInventoryModal(null)} title={editMaterialId ? "ویرایش ماده اولیه" : "افزودن ماده اولیه"} subtitle="زیرشاخه و ویژگی‌های هر قلم محدودیتی ندارد؛ هر تعداد مورد که نیاز دارید اضافه کنید.">
      <form className="modal-form" onSubmit={saveMaterial}><div className="form-grid two"><label>نام ماده اولیه<input value={materialDraft.name} onChange={e => setMaterialDraft({ ...materialDraft, name: e.target.value })} placeholder="مثلاً پارچه کجراه" /></label><label>دسته‌بندی<input list="material-categories" value={materialDraft.category} onChange={e => setMaterialDraft({ ...materialDraft, category: e.target.value })} placeholder="پارچه، نخ، ..." /><datalist id="material-categories"><option value="پارچه" /><option value="نخ" /><option value="دکمه" /><option value="سوزن" /><option value="ملزومات" /></datalist></label><label>موجودی<input type="number" min="0" value={materialDraft.stock} onChange={e => setMaterialDraft({ ...materialDraft, stock: Number(e.target.value) })} /></label><label>واحد<select value={materialDraft.unit} onChange={e => setMaterialDraft({ ...materialDraft, unit: e.target.value })}><option>متر</option><option>عدد</option><option>بسته</option><option>قرقره</option><option>کیلوگرم</option></select></label><label>حد سفارش<input type="number" min="0" value={materialDraft.threshold} onChange={e => setMaterialDraft({ ...materialDraft, threshold: Number(e.target.value) })} /></label><div className="field-static"><span>وضعیت</span><strong>{materialDraft.stock <= materialDraft.threshold ? "نیاز به سفارش" : "موجودی ایمن"}</strong></div><label className="span-two">توضیحات<textarea value={materialDraft.description} onChange={e => setMaterialDraft({ ...materialDraft, description: e.target.value })} placeholder="عرض پارچه، کاربرد، مشخصات بسته‌بندی و ..." /></label></div><div className="tag-editor"><div><strong>ویژگی‌های متنی</strong><span>برای پارچه: جنس، رنگ، گرماژ · برای سوزن: هر مشخصه دلخواه</span></div><div className="tag-input"><input value={tagText} onChange={e => setTagText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="ویژگی را بنویسید و Enter بزنید" /><button type="button" onClick={addTag}><Plus size={16} /></button></div><div className="tag-cloud editable">{materialTags.map(tag => <span key={tag}>{tag}<button type="button" onClick={() => setMaterialTags(tags => tags.filter(value => value !== tag))}><X size={12} /></button></span>)}{materialTags.length === 0 && <em>هنوز ویژگی‌ای وارد نشده است.</em>}</div></div><div className="inventory-breakdown-editor"><div className="breakdown-heading"><div><strong>موجودی زیرشاخه‌ها</strong><span>برای هر زیرشاخه و حتی زیرزیرشاخه تعداد و واحد جداگانه ثبت کنید.</span></div><button type="button" className="outline-button compact" onClick={addBreakdown}><Plus size={14}/> افزودن زیرشاخه</button></div>{materialBreakdown.map((branch, branchIndex) => <div className="breakdown-item" key={`breakdown-${branchIndex}`}><div className="breakdown-fields"><input placeholder="نام زیرشاخه؛ مثلاً رنگ" value={branch.name} onChange={e => setMaterialBreakdown(items => items.map((item,index) => index===branchIndex?{...item,name:e.target.value}:item))}/><input type="number" min="0" placeholder="تعداد" value={branch.quantity} onChange={e => setMaterialBreakdown(items => items.map((item,index) => index===branchIndex?{...item,quantity:Number(e.target.value)}:item))}/><input placeholder="واحد" value={branch.unit} onChange={e => setMaterialBreakdown(items => items.map((item,index) => index===branchIndex?{...item,unit:e.target.value}:item))}/><button type="button" className="icon-button" onClick={() => setMaterialBreakdown(items => items.filter((_,index) => index!==branchIndex))}><X size={15}/></button></div><div className="nested-breakdown">{(branch.children||[]).map((child, childIndex) => <div className="breakdown-fields nested" key={`child-${branchIndex}-${childIndex}`}><span>↳</span><input placeholder="نام زیرزیرشاخه" value={child.name} onChange={e => setMaterialBreakdown(items => items.map((item,index) => index===branchIndex?{...item,children:(item.children||[]).map((nested,nestedIndex)=>nestedIndex===childIndex?{...nested,name:e.target.value}:nested)}:item))}/><input type="number" min="0" placeholder="تعداد" value={child.quantity} onChange={e => setMaterialBreakdown(items => items.map((item,index) => index===branchIndex?{...item,children:(item.children||[]).map((nested,nestedIndex)=>nestedIndex===childIndex?{...nested,quantity:Number(e.target.value)}:nested)}:item))}/><input placeholder="واحد" value={child.unit} onChange={e => setMaterialBreakdown(items => items.map((item,index) => index===branchIndex?{...item,children:(item.children||[]).map((nested,nestedIndex)=>nestedIndex===childIndex?{...nested,unit:e.target.value}:nested)}:item))}/></div>)}<button type="button" className="text-button" onClick={() => addBreakdownChild(branchIndex)}><Plus size={14}/> افزودن زیرزیرشاخه برای {branch.name||"این زیرشاخه"}</button></div></div>)}{materialBreakdown.length===0&&<em>هنوز زیرشاخه‌ای با تعداد ثبت نشده است.</em>}</div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setInventoryModal(null)}>انصراف</button><button className="primary-button" type="submit"><Check size={17} /> ذخیره ماده اولیه</button></div></form>
    </Modal>
  </div></DashboardLayout>;
}

function ArchiveIcon() { return <Archive size={20} strokeWidth={2.4} />; }
