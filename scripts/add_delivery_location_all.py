from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/Home.tsx')
s=p.read_text()
old='<div className="delivery-product"><span>اطلاعات خرید</span><strong>{order.product}</strong><p>{number(order.qty)} عدد · {money(order.total)}</p></div></div>'
new='<div className="delivery-product"><span>اطلاعات خرید</span><strong>{order.product}</strong><p>{number(order.qty)} عدد · {money(order.total)}</p></div><button type="button" className="outline-button compact delivery-location-button" onClick={()=>setDeliveryMapOrderId(order.id)}><MapPin size={15}/> مشاهده لوکیشن</button></div>'
if old not in s: raise SystemExit('delivery main marker not found')
s=s.replace(old,new,1)
p.write_text(s)
print('delivery location added to all cards')
