from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/OrderEntry.tsx')
s=p.read_text()
needle='useEffect(()=>{if(customersQuery.data&&customersQuery.data.length){setCustomers(customersQuery.data as Customer[]);}},[customersQuery.data]);'
replacement=needle+'\n  useEffect(()=>{const id=Number(new URLSearchParams(window.location.search).get("customer"));if(id&&customersQuery.data){const found=(customersQuery.data as Customer[]).find(item=>item.id===id);if(found){setCustomer(found);setPoint({lat:found.lat??35.7549,lng:found.lng??51.4096,label:found.address||"لوکیشن مشتری"});}}},[customersQuery.data]);'
if needle not in s: raise SystemExit('query effect not found')
s=s.replace(needle,replacement,1)
p.write_text(s)
print('customer preselection added')
