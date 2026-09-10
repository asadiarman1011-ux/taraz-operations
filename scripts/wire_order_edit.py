from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
s=s.replace('const createOrderMutation=trpc.crm.createOrder.useMutation();', 'const createOrderMutation=trpc.crm.createOrder.useMutation();\n  const ordersQuery=trpc.crm.orders.useQuery();\n  const updateOrderMutation=trpc.crm.updateOrder.useMutation();')
s=s.replace('const [lines,setLines]=useState<Line[]>([blank()]);', 'const [lines,setLines]=useState<Line[]>([blank()]); const [editingOrderId,setEditingOrderId]=useState<number|null>(null);')
needle='useEffect(()=>{const id=Number(new URLSearchParams(window.location.search).get("customer"));if(id&&customersQuery.data){const found=(customersQuery.data as Customer[]).find(item=>item.id===id);if(found){setCustomer(found);setPoint({lat:found.lat??35.7549,lng:found.lng??51.4096,label:found.address||"لوکیشن مشتری"});}}},[customersQuery.data]);'
insert=needle+'\n  useEffect(()=>{const orderId=Number(new URLSearchParams(window.location.search).get("order"));if(!orderId||!ordersQuery.data||!customersQuery.data)return;const order=(ordersQuery.data as any[]).find(item=>item.id===orderId);if(!order)return;let parsed:Line[]=[];try{parsed=JSON.parse(order.itemsJson)}catch{}if(parsed.length)setLines(parsed.map(item=>({...item,id:item.id||Date.now()+Math.random(),sizes:item.sizes?.length?item.sizes:[{size:item.size||"",qty:item.qty||0}]})));const parts=String(order.jalaliDate).split(" ");if(parts.length>=3)setOrderDate({day:parts[0],month:parts[1],year:parts[2]});setEditingOrderId(order.id);const found=(customersQuery.data as Customer[]).find(item=>item.id===order.customerId);if(found){setCustomer(found);setPoint({lat:order.lat??found.lat??35.7549,lng:order.lng??found.lng??51.4096,label:order.address||found.address||"لوکیشن سفارش"});}},[ordersQuery.data,customersQuery.data]);'
if needle not in s: raise SystemExit('customer effect marker not found')
s=s.replace(needle,insert,1)
old='const submitOrder=async()=>{try{const savedCustomer=await saveCustomer();if(!savedCustomer?.id)return;await createOrderMutation.mutateAsync({customerId:savedCustomer.id,jalaliDate:`${orderDate.day} ${orderDate.month} ${orderDate.year}`,address:savedCustomer.address,lat:point.lat,lng:point.lng,itemsJson:JSON.stringify(lines),total,status:"pending"});setSaved(true);}catch{setSaved(false);}};'
new='const submitOrder=async()=>{try{const savedCustomer=await saveCustomer();if(!savedCustomer?.id)return;const data={customerId:savedCustomer.id,jalaliDate:`${orderDate.day} ${orderDate.month} ${orderDate.year}`,address:savedCustomer.address,lat:point.lat,lng:point.lng,itemsJson:JSON.stringify(lines),total,status:"pending" as const};if(editingOrderId)await updateOrderMutation.mutateAsync({id:editingOrderId,data});else await createOrderMutation.mutateAsync(data);await utils.crm.orders.invalidate();setSaved(true);}catch{setSaved(false);}};'
if old not in s: raise SystemExit('submit marker not found')
s=s.replace(old,new,1)
s=s.replace('<h1>سفارش جدید</h1>', '<h1>{editingOrderId?"ویرایش سفارش":"سفارش جدید"}</h1>')
s=s.replace('پیش‌نویس · تاریخ شمسی امروز', '{editingOrderId?`ویرایش سفارش #${editingOrderId}`:"پیش‌نویس · تاریخ شمسی امروز"}')
s=s.replace('ثبت سفارش و افزودن به تاریخچه مشتری', '{editingOrderId?"ذخیره تغییرات سفارش":"ثبت سفارش و افزودن به تاریخچه مشتری"}')
p.write_text(s)
print('order edit flow added')
