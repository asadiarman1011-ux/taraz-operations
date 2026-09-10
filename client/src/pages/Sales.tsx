import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, ChevronDown, Clock3, Edit3, Filter, History, MapPin, MoreHorizontal, Phone, Plus, Search, ShieldCheck, Star, UserRoundCheck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export type CustomerStatus = "ثابت" | "غیر ثابت" | "نیاز به پیگیری" | "در حال پیگیری";
type Customer = { id:number; name:string; phone:string; business:string; city:string; address:string; status:CustomerStatus; note?:string|null; lat?:number|null; lng?:number|null; createdAt?:Date|string; updatedAt?:Date|string };
type Order = { id:number; customerId:number; jalaliDate:string; address:string; total:number; status:string; itemsJson:string; createdAt?:Date|string };
const money=(v:number)=>`${v.toLocaleString("fa-IR")} تومان`;
const date=(v:Date|string|undefined)=>v?new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"short",day:"numeric"}).format(new Date(v)):"—";
const statusClass=(s:CustomerStatus)=>s==="ثابت"?"green":s==="غیر ثابت"?"gray":s==="نیاز به پیگیری"?"red":"amber";

export default function Sales(){
 const [,setLocation]=useLocation();
 const customersQuery=trpc.crm.customers.useQuery();
 const ordersQuery=trpc.crm.orders.useQuery();
 const updateCustomer=trpc.crm.updateCustomer.useMutation();
 const utils=trpc.useUtils();
 const customers=(customersQuery.data||[]) as Customer[];
 const orders=(ordersQuery.data||[]) as Order[];
 const [segment,setSegment]=useState<"همه"|CustomerStatus>("همه");
 const [query,setQuery]=useState("");
 const [selected,setSelected]=useState<Customer|null>(null);
 const [notice,setNotice]=useState("");
 useEffect(()=>{if(!selected&&customers[0])setSelected(customers[0]);else if(selected){const fresh=customers.find(c=>c.id===selected.id);if(fresh)setSelected(fresh);}},[customers,selected]);
 const enriched=useMemo(()=>customers.map(c=>({...c,customerOrders:orders.filter(o=>o.customerId===c.id)})),[customers,orders]);
 const filtered=useMemo(()=>enriched.filter(c=>(segment==="همه"||c.status===segment)&&`${c.name} ${c.city} ${c.business} ${c.phone} ${c.status} ${c.address}`.toLowerCase().includes(query.trim().toLowerCase())),[enriched,segment,query]);
 const promote=async(id:number)=>{await updateCustomer.mutateAsync({id,data:{status:"ثابت"}});await utils.crm.customers.invalidate();setNotice("مشتری به فهرست مشتریان ثابت اضافه شد.");};
 const totalSales=orders.reduce((sum,o)=>sum+o.total,0);
 return <div className="sales-page">
  <div className="page-heading"><div><span className="eyebrow">فروش · ارتباط با مشتری</span><h1>مشتری‌ها</h1><p>اطلاعات و تاریخچه واقعی مشتریان و سفارش‌های ذخیره‌شده در دیتابیس.</p></div><button className="primary-button" onClick={()=>setLocation("/orders/new")}><Plus size={18}/> ثبت سفارش برای مشتری</button></div>
  <div className="sales-kpis"><div><UsersRound size={19}/><span>همه مشتری‌ها</span><strong>{customers.length.toLocaleString("fa-IR")}</strong></div><div><UserRoundCheck size={19}/><span>مشتری ثابت</span><strong>{customers.filter(c=>c.status==="ثابت").length.toLocaleString("fa-IR")}</strong></div><div><Clock3 size={19}/><span>نیازمند پیگیری</span><strong>{customers.filter(c=>c.status==="نیاز به پیگیری"||c.status==="در حال پیگیری").length.toLocaleString("fa-IR")}</strong></div><div><Building2 size={19}/><span>فروش ثبت‌شده</span><strong>{money(totalSales)}</strong></div></div>
  <div className="segment-tabs">{(["همه","ثابت","غیر ثابت","نیاز به پیگیری","در حال پیگیری"] as const).map(item=><button key={item} className={segment===item?"selected":""} onClick={()=>setSegment(item)}>{item}<b>{(item==="همه"?customers:customers.filter(c=>c.status===item)).length.toLocaleString("fa-IR")}</b></button>)}</div>
  <div className="toolbar"><div className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو بر اساس نام، شهر، صنف، شماره یا آدرس..."/><kbd>⌘ K</kbd></div><div className="toolbar-actions"><button className="filter-button"><Filter size={17}/> شهر <ChevronDown size={15}/></button><button className="filter-button"><Filter size={17}/> وضعیت مشتری <ChevronDown size={15}/></button></div></div>
  <div className="sales-layout"><section className="data-card customer-table"><div className="table-head"><div><h3>فهرست مشتری‌ها</h3><span>{filtered.length.toLocaleString("fa-IR")} مورد نمایش داده می‌شود</span></div><button className="filter-button"><MoreHorizontal size={16}/> عملیات</button></div>{customersQuery.isLoading?<div className="empty-state">در حال دریافت مشتری‌ها از دیتابیس...</div>:filtered.map(c=>{const customerOrders=orders.filter(o=>o.customerId===c.id);const last=customerOrders[0];return <button className={`customer-row ${selected?.id===c.id?"active":""}`} key={c.id} onClick={()=>setSelected(c)}><div className="customer-avatar">{c.name.slice(0,1)}</div><div className="customer-main"><strong>{c.name}</strong><span>{c.business} · {c.city}</span></div><div className="customer-orders"><strong>{customerOrders.length.toLocaleString("fa-IR")} خرید</strong><span>{last?.jalaliDate||"هنوز خریدی ثبت نشده"}</span></div><span className={`status-pill ${statusClass(c.status)}`}>{c.status}</span><ArrowLeft size={16}/></button>})}{!customersQuery.isLoading&&!filtered.length&&<div className="empty-state"><UsersRound size={26}/><strong>مشتری‌ای با این مشخصات پیدا نشد.</strong><span>مشتری جدید را از صفحه ثبت سفارش اضافه کنید.</span></div>}</section>
  {selected&&<aside className="customer-profile"><div className="profile-head"><div className="profile-avatar">{selected.name.slice(0,1)}</div><div><span className={`status-pill ${statusClass(selected.status)}`}>{selected.status}</span><h2>{selected.name}</h2><p>{selected.business||"بدون نام صنف"}</p></div><button className="icon-button"><Edit3 size={17}/></button></div><div className="profile-actions"><button className="outline-button"><Phone size={15}/> تماس</button><button className="primary-button" onClick={()=>setLocation(`/orders/new?customer=${selected.id}`)}><Plus size={15}/> ثبت خرید جدید</button></div><div className="profile-info"><div><Phone size={15}/><span>{selected.phone}</span></div><div><MapPin size={15}/><span>{selected.address||"آدرس ثبت نشده"}</span></div><div><ShieldCheck size={15}/><span>عضویت از {date(selected.createdAt)}</span></div></div>{selected.note&&<div className="profile-note"><strong>یادداشت فروش</strong><p>{selected.note}</p></div>}<div className="purchase-history"><div className="section-title"><div><History size={16}/><strong>تاریخچه خرید</strong></div><span>{orders.filter(o=>o.customerId===selected.id).length.toLocaleString("fa-IR")} خرید</span></div>{orders.filter(o=>o.customerId===selected.id).map((order,i)=>{let items:any[]=[];try{items=JSON.parse(order.itemsJson)}catch{}return <div className="purchase-item" key={order.id}><div><span>خرید {(i+1).toLocaleString("fa-IR")} · سفارش #{order.id}</span><strong>{items.map(item=>item.product||"محصول").join("، ")||"سفارش ثبت‌شده"}</strong></div><div><b>{money(order.total)}</b><small>{order.jalaliDate}</small></div></div>})}{!orders.some(o=>o.customerId===selected.id)&&<div className="empty-mini">هنوز فاکتور خریدی ثبت نشده است.</div>}</div>{selected.status!=="ثابت"&&<button className="promote-button" onClick={()=>promote(selected.id)}><Star size={16}/> افزودن به مشتری‌های ثابت</button>}</aside>}
  </div>{notice&&<div className="toast"><CheckCircle2 size={18}/>{notice}</div>}
 </div>;
}
