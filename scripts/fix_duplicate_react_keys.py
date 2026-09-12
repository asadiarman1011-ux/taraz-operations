from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('{data.map(order => <div className="order-row" key={order.id}', '{data.map((order,index) => <div className="order-row" key={`order-row-${order.id}-${order.phone||order.customer||""}-${index}`}')
s=s.replace('{filteredDelivery.map(order => <article className="delivery-card" key={order.id}', '{filteredDelivery.map((order,index) => <article className="delivery-card" key={`delivery-card-${order.id}-${order.phone||order.customer||""}-${index}`}')
p.write_text(s)

p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
s=s.replace('customers.map(item=><button type="button" key={item.phone}', 'customers.map((item,index)=><button type="button" key={`customer-picker-${item.id||item.phone}-${index}`}')
p.write_text(s)
print('unique composite keys applied to order, delivery, and customer picker lists')
