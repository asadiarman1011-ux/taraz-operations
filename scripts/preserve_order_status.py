from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
s=s.replace('const [lines,setLines]=useState<Line[]>([blank()]); const [editingOrderId,setEditingOrderId]=useState<number|null>(null);', 'const [lines,setLines]=useState<Line[]>([blank()]); const [editingOrderId,setEditingOrderId]=useState<number|null>(null); const [editingOrderStatus,setEditingOrderStatus]=useState<"pending"|"delivered">("pending");')
s=s.replace('setEditingOrderId(order.id);const found=', 'setEditingOrderId(order.id);setEditingOrderStatus(order.status==="delivered"?"delivered":"pending");const found=')
s=s.replace('status:"pending" as const};if(editingOrderId)', 'status:editingOrderId?editingOrderStatus:"pending"};if(editingOrderId)')
p.write_text(s)
print('order status preservation added')
