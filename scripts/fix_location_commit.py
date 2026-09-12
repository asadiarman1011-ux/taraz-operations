from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
old='const commitPoint=(lat:number,lng:number)=>{const next={lat,lng,label:locationLabel.trim()||`نقطه انتخاب‌شده · ${lat.toFixed(4)}، ${lng.toFixed(4)}`};placeMarker(next);setPoint(next);setLocationLabel(next.label);setLocationStatus("نقطه انتخاب شد؛ برای ذخیره روی «ثبت این موقعیت» بزنید.");};'
new='const commitPoint=(lat:number,lng:number)=>{const next={lat,lng,label:`نقطه انتخاب‌شده · ${lat.toFixed(5)}، ${lng.toFixed(5)}`};placeMarker(next);setPoint(next);setLocationLabel(next.label);setLocationStatus(`نقطه جدید ثبت شد: ${lat.toFixed(5)}، ${lng.toFixed(5)} · برای ذخیره روی «ثبت این موقعیت» بزنید.`);};'
if old not in s: raise SystemExit('commitPoint block not found')
s=s.replace(old,new,1)
old2='const address=(locationLabel.trim()||point.label).trim();if(!address)return;'
new2='const address=(point.label||locationLabel.trim()).trim();if(!address)return;'
if old2 not in s: raise SystemExit('confirm address block not found')
s=s.replace(old2,new2,1)
p.write_text(s)
print('location commit now replaces address label with clicked coordinates')
