from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/components/DashboardLayout.tsx')
s=p.read_text()
start=s.index('<header className="topbar">')
end=s.index('</header>',start)+len('</header>')
replacement='<header className="topbar"><div className="topbar-actions"><button className="notification-button" onClick={()=>setNoticeOpen(value=>!value)} aria-label="اعلان‌ها"><Bell size={19}/>{notifications.length>0&&<b>{Math.min(notifications.length,99).toLocaleString("fa-IR")}</b>}</button>{noticeOpen&&<div className="notification-popover"><div className="notification-head"><strong>اعلان‌های فعالیت</strong><span>{notifications.length.toLocaleString("fa-IR")} رویداد</span></div>{notifications.length?notifications.slice(0,8).map(item=><div className="notification-item" key={item.id}><div className="notification-dot"/><div><strong>{item.text}</strong><span>{new Intl.DateTimeFormat("fa-IR-u-ca-persian",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"}).format(item.time)}</span></div></div>):<div className="notification-empty">هنوز فعالیتی ثبت نشده است.</div>}</div>}</div></header>'
s=s[:start]+replacement+s[end:]
p.write_text(s)

p=Path('/home/ubuntu/taraz-operations/client/src/components/Map.tsx')
s=p.read_text().replace('script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly`;', 'script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker`;')
s=s.replace('mapTypeControl: true,', 'mapTypeControl: true,\n      clickableIcons: false,\n      gestureHandling: "greedy",')
p.write_text(s)
print('topbar and map permission fix applied')
