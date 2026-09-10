from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
s=s.replace('const [customerPicker,setCustomerPicker]=useState(false);', 'const [customerPicker,setCustomerPicker]=useState(false);\n  const [orderDate,setOrderDate]=useState({day:"19",month:"شهریور",year:"1405"});')
s=s.replace('انتخاب مشتری <ChevronDown size={14}/>', 'مشتری جدید / انتخاب مشتری <ChevronDown size={14}/>')
s=s.replace('نام فرد یا شرکت<input', 'نام شخص<input')
s=s.replace('صنف / مجموعه<input', 'نام شرکت / فروشگاه<input')
old='<label>شهر / استان<input list="city-suggestions" value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})} placeholder="نام هر شهر را تایپ کنید"/><datalist id="city-suggestions"><option value="تهران"/><option value="اصفهان"/><option value="مشهد"/><option value="کرج"/><option value="شیراز"/><option value="رشت"/></datalist></label><label className="span-two">آدرس کامل'
new='<label>شهر / استان<input list="city-suggestions" value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})} placeholder="نام هر شهر را تایپ کنید"/><datalist id="city-suggestions"><option value="تهران"/><option value="اصفهان"/><option value="مشهد"/><option value="کرج"/><option value="شیراز"/><option value="رشت"/></datalist></label><div className="jalali-date-field"><span>تاریخ سفارش (شمسی)</span><div><select value={orderDate.day} onChange={e=>setOrderDate({...orderDate,day:e.target.value})}>{Array.from({length:31},(_,i)=><option key={i+1}>{String(i+1).padStart(2,"۰")}</option>)}</select><select value={orderDate.month} onChange={e=>setOrderDate({...orderDate,month:e.target.value})}>{["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"].map(month=><option key={month}>{month}</option>)}</select><select value={orderDate.year} onChange={e=>setOrderDate({...orderDate,year:e.target.value})}><option>۱۴۰۵</option><option>۱۴۰۶</option><option>۱۴۰۷</option></select></div><small>تاریخ انتخاب‌شده: {orderDate.day} {orderDate.month} {orderDate.year}</small></div><label className="span-two">آدرس کامل'
if old not in s: raise SystemExit('customer city block not found')
s=s.replace(old,new,1)
p.write_text(s)

css=Path('/home/ubuntu/taraz-operations/client/src/factory-pages.css')
css.write_text(css.read_text()+'''\n.order-entry-page .form-card-title{align-items:flex-start}.order-entry-page .form-card-title>div:nth-child(2){min-width:0}.customer-actions{flex-wrap:wrap}.jalali-date-field{display:flex;flex-direction:column;gap:6px}.jalali-date-field>span{font-size:12px;font-weight:700;color:#17233d}.jalali-date-field>div{display:grid;grid-template-columns:80px 1fr 90px;gap:6px}.jalali-date-field select{min-width:0;border:1px solid #d8dee8;background:#fff;border-radius:8px;padding:9px 8px;font-family:inherit;font-size:12px;color:#17233d}.jalali-date-field small{font-size:10px;color:#68758a}.dark .jalali-date-field>span{color:#fff}.dark .jalali-date-field select{background:#111725;border-color:#33405a;color:#fff}.dark .jalali-date-field small{color:#a8b0c0}\n''')
print('refined order form')
