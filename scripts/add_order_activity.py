from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
old='await utils.crm.orders.invalidate();setSaved(true);'
new='await utils.crm.orders.invalidate();try{const current=JSON.parse(localStorage.getItem("sepid-activities")||"[]");localStorage.setItem("sepid-activities",JSON.stringify([{id:Date.now(),text:editingOrderId?`سفارش #${editingOrderId} ویرایش شد`:`سفارش جدید برای ${savedCustomer.name} ثبت شد`,time:Date.now()},...current].slice(0,40)));}catch{}setSaved(true);'
if old not in s: raise SystemExit('order success marker not found')
s=s.replace(old,new,1)
p.write_text(s)
print('order activity added')
