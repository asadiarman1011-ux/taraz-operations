from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
s=s.replace('<h2>تغییر لوکیشن</h2>','<h2>انتخاب لوکیشن</h2>')
s=s.replace('تغییر لوکیشن</button></div></section>','انتخاب لوکیشن</button></div></section>')
start=s.index('<div className="summary-lines">')
end=s.index('<button className="primary-button full"', start)
replacement='''<div className="summary-lines detailed-proforma">{lines.map((line,index)=><div className="summary-line-card" key={line.id}><div className="summary-line-head"><div><strong>{(index+1).toLocaleString("fa-IR")} · {line.product||"محصول جدید"}</strong><span>{line.fabric||"جنس مشخص نشده"} · {line.color||"رنگ مشخص نشده"}</span></div><b>{money(line.qty*(line.unit+line.frontPrice+line.backPrice+line.materialPrice))} تومان</b></div><div className="summary-meta"><span>تعداد کل: <b>{line.qty.toLocaleString("fa-IR")} عدد</b></span><span>دکمه: <b>{line.button||"—"}</b></span><span>زیپ: <b>{line.zipper||"—"}</b></span><span>جیب: <b>{line.pocket||"—"}</b></span></div><div className="summary-sizes"><small>تفکیک سایز</small>{line.sizes.filter(row=>row.qty>0||row.size).map((row,sizeIndex)=><span key={`${line.id}-summary-${sizeIndex}`}>{row.size||"بدون سایز"}: {row.qty.toLocaleString("fa-IR")} عدد</span>)}</div><div className="summary-prints"><span>چاپ جلو: <b>{line.front||"بدون چاپ"}</b> · {money(line.frontPrice)} تومان</span><span>چاپ پشت: <b>{line.back||"بدون چاپ"}</b> · {money(line.backPrice)} تومان</span></div><div className="summary-price-grid"><span>واحد محصول <b>{money(line.unit)}</b></span><span>جنس / متریال <b>{money(line.materialPrice)}</b></span></div></div>)}</div><div className="summary-total"><span>مبلغ نهایی سفارش</span><strong>{money(total)}<small> تومان</small></strong></div>'''
s=s[:start]+replacement+s[end:]
p.write_text(s)
print('order summary refined')
