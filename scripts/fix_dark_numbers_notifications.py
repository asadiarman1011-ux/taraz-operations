from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/components/DashboardLayout.tsx')
s=p.read_text()
s=s.replace('const [noticeOpen,setNoticeOpen]=useState(false);', 'const [noticeOpen,setNoticeOpen]=useState(false);const [unreadCount,setUnreadCount]=useState(()=>Number(localStorage.getItem("sepid-unread-count")||"0"));')
s=s.replace('setNotifications((activityQuery.data as any[]).map(item=>({id:item.id,text:item.text,time:new Date(item.createdAt).getTime()})));', 'setNotifications((activityQuery.data as any[]).map(item=>({id:item.id,text:item.text,time:new Date(item.createdAt).getTime()})));if(!localStorage.getItem("sepid-unread-count")){setUnreadCount((activityQuery.data as any[]).length);localStorage.setItem("sepid-unread-count",String((activityQuery.data as any[]).length));}')
s=s.replace('onClick={()=>setNoticeOpen(value=>!value)}', 'onClick={()=>{setNoticeOpen(value=>!value);setUnreadCount(0);localStorage.setItem("sepid-unread-count","0")}}')
s=s.replace('{notifications.length>0&&<b>{Math.min(notifications.length,99).toLocaleString("fa-IR")}</b>}', '{unreadCount>0&&<b>{Math.min(unreadCount,99).toLocaleString("fa-IR")}</b>}')
p.write_text(s)

p=Path('/home/ubuntu/taraz-operations/client/src/index.css')
s=p.read_text()
s += '\n/* Dark mode readability for all operational numbers and totals */\nhtml.dark .stat-card strong,html.dark .stat-card small,html.dark .order-amount strong,html.dark .order-amount span,html.dark .order-product small,html.dark .order-date span,html.dark .order-date small,html.dark .delivery-summary-box strong,html.dark .delivery-summary-box small,html.dark .delivery-history strong,html.dark .summary-total strong,html.dark .summary-total span,html.dark .detail-lines p,html.dark .need-row b,html.dark .inventory-hero strong,html.dark .table-head span,html.dark .order-filter-result,html.dark .order-filter-result span{color:#f3f6fb!important}html.dark .stat-card span,html.dark .order-product span,html.dark .order-date small,html.dark .delivery-summary-box span,html.dark .delivery-history span,html.dark .detail-lines span,html.dark .need-row span{color:#c3ccda!important}html.dark .notification-button b{color:#fff!important;background:#e26459}\n'
p.write_text(s)
print('dark numbers and notification unread state fixed')
