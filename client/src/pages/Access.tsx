import { KeyRound, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
const sections=["فروش و مشتری‌ها","ثبت سفارش","تحویل محصول","انبار","گزارش‌ها","مدیریت کاربران"] as const;
type Permission="view"|"edit"|"none";
type User={id:number;name:string;email:string;role:string;permissions:Record<string,Permission>;owner?:boolean};
export default function Access(){
  const [users]=useState<User[]>([]); const [notice,setNotice]=useState("");
  return <div className="access-page"><div className="page-heading"><div><span className="eyebrow">مدیریت سازمان و نقش‌ها</span><h1>دسترسی کاربران</h1><p>برای هر بخش مشخص کنید کاربر فقط ببیند، امکان تغییر داشته باشد یا هیچ دسترسی نداشته باشد.</p></div><button className="primary-button" onClick={()=>setNotice("کاربر جدید پس از ورود به سیستم در این فهرست نمایش داده می‌شود.")}><Plus size={18}/> دعوت کاربر جدید</button></div><div className="access-banner"><div className="access-banner-icon"><KeyRound size={22}/></div><div><strong>سیستم آماده تنظیم دسترسی است</strong><p>هنوز کاربری به‌جز حساب جاری در این محیط ثبت نشده است.</p></div><ShieldCheck size={25}/></div><section className="data-card access-empty-card"><UsersRound size={30}/><h2>{users.length?"کاربران مجموعه":"فهرست کاربران خالی است"}</h2><p>پس از ورود یا دعوت کاربران، سطح دسترسی هر بخش را در این صفحه تنظیم کنید.</p><button className="outline-button" onClick={()=>setNotice("برای افزودن کاربر، ابتدا ورود کاربر جدید را تکمیل کنید.")}><Plus size={16}/> افزودن کاربر</button></section>{notice&&<div className="toast">{notice}</div>}</div>;
}
