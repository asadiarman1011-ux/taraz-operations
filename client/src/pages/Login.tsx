import { FormEvent, useState } from "react";
import { ArrowLeft, KeyRound, LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Login(){
  const [mode,setMode]=useState<"login"|"register">("login");
  const [username,setUsername]=useState(""); const [password,setPassword]=useState("");
  const [name,setName]=useState(""); const [jobTitle,setJobTitle]=useState(""); const [remember,setRemember]=useState(false); const [notice,setNotice]=useState("");
  const login=trpc.auth.login.useMutation(); const register=trpc.auth.register.useMutation();
  const submit=async(event:FormEvent)=>{event.preventDefault();setNotice("");try{if(mode==="register"){await register.mutateAsync({name,jobTitle,username,password});setNotice("حساب شما ساخته شد. اکنون با نام کاربری و رمز عبور وارد شوید.");setMode("login");setPassword("");}else{await login.mutateAsync({username,password,remember});window.location.replace("/");}}catch(error:any){setNotice(error?.message||"عملیات انجام نشد؛ اطلاعات را بررسی کنید.");}};
  const busy=login.isPending||register.isPending;
  return <main className="login-shell" dir="rtl"><section className="login-card"><div className="login-mark"><KeyRound size={25}/></div><span className="eyebrow">تولیدی پوشاک سپید</span><h1>{mode==="login"?"ورود به سامانه":"ساخت حساب کارکنان"}</h1><p>{mode==="login"?"برای ورود، نام کاربری و رمز عبور خود را وارد کنید.":"اطلاعات خود را ثبت کنید تا مدیر کارخانه سطح دسترسی شما را تعیین کند."}</p><form onSubmit={submit} className="login-form">{mode==="register"&&<><label>نام و نام خانوادگی<input required value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً علی رضایی" /></label><label>سمت در کارگاه<input required value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="مثلاً مسئول انبار" /></label></>}<label>نام کاربری<input required minLength={3} pattern="[A-Za-z0-9_.-]+" dir="ltr" value={username} onChange={e=>setUsername(e.target.value)} placeholder="مثلاً ali.rezaei" /></label><label>رمز عبور<input required minLength={6} type="password" dir="ltr" value={password} onChange={e=>setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" /></label>{mode==="login"&&<label className="remember-row"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>مرا به خاطر بسپار</span></label>}<button className="primary-button login-submit" disabled={busy}>{busy?<LoaderCircle size={17} className="spin"/>:mode==="login"?<LogIn size={17}/>:<UserPlus size={17}/>} {busy?"در حال انجام...":mode==="login"?"ورود":"ساخت حساب"}</button></form>{notice&&<div className="login-notice">{notice}</div>}<button type="button" className="login-switch" onClick={()=>{setMode(mode==="login"?"register":"login");setNotice("")}}>{mode==="login"?<><UserPlus size={16}/> حساب کارکنان ندارید؟ ثبت‌نام کنید</>:<><ArrowLeft size={16}/> بازگشت به صفحه ورود</>}</button><small className="login-footnote">پس از ثبت‌نام، مدیر سیستم از بخش «دسترسی کاربران» مجوزهای شما را فعال می‌کند.</small></section></main>;
}

// Keep this page independent from DashboardLayout so an unauthenticated employee can always reach it.
void 0;
