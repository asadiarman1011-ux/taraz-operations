from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
needle='const saveCustomer=()=>{if(!customer.name.trim()||!customer.phone.trim())return;const next=[customer,...customers.filter(item=>item.phone!==customer.phone)];setCustomers(next);localStorage.setItem("sepid-customers",JSON.stringify(next));setCustomerPicker(false);setSaved(false)};'
insert=needle+'\n  const confirmLocation=()=>{const address=(locationLabel.trim()||point.label).trim();if(!address)return;const nextCustomer={...customer,address};setCustomer(nextCustomer);const nextCustomers=customers.map(item=>item.phone===customer.phone?{...item,address}:item);setCustomers(nextCustomers);localStorage.setItem("sepid-customers",JSON.stringify(nextCustomers));setPoint({...point,label:address});setLocationLabel(address);setLocationStatus("آدرس این مشتری ثبت و به‌روزرسانی شد.");setMapModal(false);};'
if needle not in s: raise SystemExit('saveCustomer not found')
s=s.replace(needle,insert,1)
old='<button type="button" className="primary-button" onClick={()=>{const label=locationLabel.trim()||point.label;setPoint({...point,label});setMapModal(false)}}><Check size={16}/> ثبت این موقعیت</button>'
new='<button type="button" className="primary-button" onClick={confirmLocation}><Check size={16}/> ثبت آدرس این مشتری</button>'
if old not in s: raise SystemExit('confirm button not found')
s=s.replace(old,new,1)
# Ensure opening modal starts from the actual customer address, not stale map label.
s=s.replace('onClick={()=>{setLocationLabel(point.label);setMapModal(true)}}>تغییر لوکیشن', 'onClick={()=>{setLocationLabel(customer.address||point.label);setMapModal(true)}}>تغییر لوکیشن', 1)
# Change the map row display to reflect the selected customer address.
s=s.replace('<div className="order-map-line"><MapPin size={17}/><span>{point.label}</span>', '<div className="order-map-line"><MapPin size={17}/><span>{customer.address||point.label}</span>', 1)
p.write_text(s)
print('customer address confirmation wired')
