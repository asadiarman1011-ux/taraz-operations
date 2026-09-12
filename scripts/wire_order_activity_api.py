from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
s=s.replace('const updateOrderMutation=trpc.crm.updateOrder.useMutation();', 'const updateOrderMutation=trpc.crm.updateOrder.useMutation();\n  const activityMutation=trpc.activities.create.useMutation();')
s=s.replace('try{const current=JSON.parse(localStorage.getItem("sepid-activities")||"[]");localStorage.setItem("sepid-activities",JSON.stringify([{id:Date.now(),text:editingOrderId?`سفارش #${editingOrderId} ویرایش شد`:`سفارش جدید برای ${savedCustomer.name} ثبت شد`,time:Date.now()},...current].slice(0,40)));}catch{}setSaved(true);', 'try{const text=editingOrderId?`سفارش #${editingOrderId} ویرایش شد`:`سفارش جدید برای ${savedCustomer.name} ثبت شد`;activityMutation.mutate({text});const current=JSON.parse(localStorage.getItem("sepid-activities")||"[]");localStorage.setItem("sepid-activities",JSON.stringify([{id:Date.now(),text,time:Date.now()},...current].slice(0,40)));}catch{}setSaved(true);')
p.write_text(s)
print('order activity api wired')
