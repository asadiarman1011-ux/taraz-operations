from pathlib import Path

files = {
    'client/src/pages/Home.tsx': ('const money = (value: number) => `${value.toLocaleString("fa-IR")} تومان`;', 'const money = (value: number) => formatCurrency(value);'),
    'client/src/pages/Sales.tsx': ('const money=(v:number)=>`${v.toLocaleString("fa-IR")} تومان`;', 'const money=(v:number)=>formatCurrency(v);'),
    'client/src/pages/OrderDetails.tsx': ('const money=(value:number)=>`${Number(value||0).toLocaleString("fa-IR")} تومان`;', 'const money=(value:number)=>formatCurrency(value);'),
    'client/src/pages/OrderEntry.tsx': ('const money = (value:number) => value.toLocaleString("fa-IR");', 'const money = (value:number) => formatCurrency(value);'),
}
for name, (old, new) in files.items():
    p=Path(name); s=p.read_text()
    if old not in s: raise SystemExit(f'missing helper in {name}')
    s=s.replace(old,new)
    marker='import { trpc } from "@/lib/trpc";'
    if marker not in s: raise SystemExit(f'missing import marker in {name}')
    s=s.replace(marker, marker+'\nimport { currencyLabel, formatCurrency, useCurrency } from "@/hooks/useCurrency";')
    s=s.replace(')} تومان', ')}').replace(')} تومان</', ')}</')
    p.write_text(s)
for name, needle in [('client/src/pages/Home.tsx','export default function Home() {'),('client/src/pages/Sales.tsx','export default function Sales(){'),('client/src/pages/OrderDetails.tsx','export default function OrderDetails(){'),('client/src/pages/OrderEntry.tsx','export default function OrderEntry(){')]:
    p=Path(name); s=p.read_text()
    if needle not in s: raise SystemExit(f'missing component in {name}')
    s=s.replace(needle, needle+'\n  useCurrency();',1)
    p.write_text(s)
p=Path('client/src/pages/OrderEntry.tsx'); s=p.read_text()
for field in ['frontPrice','backPrice','unit','materialPrice']:
    old=f'<input type="number" value={{line.{field}||""}} onChange={{e=>update(line.id,"{field}",Number(e.target.value))}} placeholder="تومان"/>'
    new=f'<input inputMode="numeric" value={{formatNumberInput(line.{field})}} onChange={{e=>update(line.id,"{field}",parseNumberInput(e.target.value))}} placeholder={{currencyLabel()}}/>'
    if old not in s: raise SystemExit(f'missing numeric field {field}')
    s=s.replace(old,new)
old='<input type="number" min="0" value={row.qty} onChange={e=>updateSize(line.id,sizeIndex,"qty",e.target.value)} placeholder="تعداد"/>'
new='<input inputMode="numeric" min="0" value={formatNumberInput(row.qty)} onChange={e=>updateSize(line.id,sizeIndex,"qty",parseNumberInput(e.target.value))} placeholder="تعداد"/>'
if old not in s: raise SystemExit('missing size quantity field')
s=s.replace(old,new)
s=s.replace('import { currencyLabel, formatCurrency, useCurrency }', 'import { currencyLabel, formatCurrency, formatNumberInput, parseNumberInput, useCurrency }')
p.write_text(s)
