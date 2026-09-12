from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('  delivery?: { completedAt: number; cost: number; method: string; note: string };\n};', '  delivery?: { completedAt: number; cost: number; method: string; note: string };\n  customerId?: number;\n};')
s=s.replace('  const activityMutation=trpc.activities.create.useMutation();', '  const activityMutation=trpc.activities.create.useMutation();\n  const customersQuery=trpc.crm.customers.useQuery();\n  const ordersQuery=trpc.crm.orders.useQuery();\n  const createCustomerMutation=trpc.crm.createCustomer.useMutation();\n  const createOrderMutation=trpc.crm.createOrder.useMutation();\n  const updateOrderMutation=trpc.crm.updateOrder.useMutation();\n  const updateCustomerMutation=trpc.crm.updateCustomer.useMutation();\n  const utils=trpc.useUtils();')
needle='  useEffect(() => { localStorage.setItem("taraz-orders", JSON.stringify(orders)); }, [orders]);'
replacement='''  useEffect(() => { localStorage.setItem("taraz-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => {
    if (!ordersQuery.data || !customersQuery.data || ordersQuery.data.length === 0) return;
    const customerMap = new Map((customersQuery.data as any[]).map(customer => [customer.id, customer]));
    const sharedOrders: Order[] = (ordersQuery.data as any[]).map(row => {
      const customer = customerMap.get(row.customerId) || {};
      let items: any[] = [];
      try { items = JSON.parse(row.itemsJson || "[]"); } catch { items = []; }
      const item = items[0] || {};
      const qty = Number(item.qty || item.sizes?.reduce((sum:number, size:any) => sum + Number(size.qty || 0), 0) || 0);
      return { id: `DB-${row.id}`, customerId: row.customerId, customer: customer.name || "مشتری ثبت‌شده", phone: customer.phone || "", city: customer.city || "", address: row.address || customer.address || "", business: customer.business || "", product: item.product || item.type || "محصول سفارش", qty, total: Number(row.total || 0), status: row.status, createdAt: new Date(row.createdAt).getTime(), location: { lat: Number(row.lat || customer.lat || 35.7219), lng: Number(row.lng || customer.lng || 51.3347), label: row.address || customer.address || "لوکیشن ثبت‌شده" } };
    });
    setOrders(sharedOrders);
    if (!selectedOrderId || !sharedOrders.some(order => order.id === selectedOrderId)) setSelectedOrderId(sharedOrders[0]?.id || "");
  }, [ordersQuery.data, customersQuery.data]);'''
if needle not in s: raise SystemExit('orders local effect not found')
s=s.replace(needle,replacement,1)
old='''  const saveOrder = (event: FormEvent) => {
    event.preventDefault();
    if (!orderDraft.customer || !orderDraft.product || !orderDraft.address) return showToast("نام مشتری، محصول و آدرس را کامل کنید.");
    if (editOrderId) {
      setOrders(data => data.map(item => item.id === editOrderId ? { ...item, ...orderDraft } : item));
      showToast("اطلاعات سفارش ویرایش شد."); logActivity(`سفارش ${editOrderId} ویرایش شد`);
    } else {
      const newOrder: Order = { ...orderDraft, id: `ORD-${1050 + orders.length}`, status: "pending", createdAt: Date.now() };
      setOrders(data => [newOrder, ...data]); setSelectedOrderId(newOrder.id); showToast("سفارش ثبت و به صف تحویل اضافه شد."); logActivity(`سفارش جدید ${newOrder.id} برای ${newOrder.customer} ثبت شد`);
    }
    setOrderModal(false);
  };'''
new='''  const saveOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!orderDraft.customer || !orderDraft.product || !orderDraft.address) return showToast("نام مشتری، محصول و آدرس را کامل کنید.");
    try {
      const existingCustomer = (customersQuery.data as any[] | undefined)?.find(customer => customer.id === orderDraft.customerId || customer.phone === orderDraft.phone);
      const customer = existingCustomer || await createCustomerMutation.mutateAsync({ name: orderDraft.customer, phone: orderDraft.phone, business: orderDraft.business, city: orderDraft.city, address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng });
      await updateCustomerMutation.mutateAsync({ id: customer.id, data: { name: orderDraft.customer, phone: orderDraft.phone, business: orderDraft.business, city: orderDraft.city, address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng } });
      const itemsJson = JSON.stringify([{ product: orderDraft.product, qty: orderDraft.qty, unit: orderDraft.qty ? Math.round(orderDraft.total / orderDraft.qty) : orderDraft.total, sizes: [] }]);
      if (editOrderId && editOrderId.startsWith("DB-")) {
        const id = Number(editOrderId.replace("DB-", ""));
        const saved = await updateOrderMutation.mutateAsync({ id, data: { customerId: customer.id, address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng, itemsJson, total: orderDraft.total } });
        const next: Order = { ...orderDraft, id: editOrderId, customerId: customer.id, status: "pending", createdAt: Date.now(), location: { ...orderDraft.location, label: orderDraft.address } };
        setOrders(data => data.map(item => item.id === editOrderId ? { ...item, ...next, status: saved.status } : item));
        showToast("اطلاعات سفارش و لوکیشن در دیتابیس ذخیره شد."); logActivity(`سفارش ${editOrderId} ویرایش شد`);
      } else if (!editOrderId) {
        const saved = await createOrderMutation.mutateAsync({ customerId: customer.id, jalaliDate: jalaliDate(Date.now()), address: orderDraft.address, lat: orderDraft.location.lat, lng: orderDraft.location.lng, itemsJson, total: orderDraft.total, status: "pending" });
        const newOrder: Order = { ...orderDraft, id: `DB-${saved.id}`, customerId: customer.id, status: "pending", createdAt: new Date(saved.createdAt).getTime(), location: { ...orderDraft.location, label: orderDraft.address } };
        setOrders(data => [newOrder, ...data]); setSelectedOrderId(newOrder.id); showToast("سفارش ثبت و در صف تحویل قرار گرفت."); logActivity(`سفارش جدید ${newOrder.id} برای ${newOrder.customer} ثبت شد`);
      } else {
        setOrders(data => data.map(item => item.id === editOrderId ? { ...item, ...orderDraft } : item));
        showToast("اطلاعات سفارش ویرایش شد."); logActivity(`سفارش ${editOrderId} ویرایش شد`);
      }
      await utils.crm.orders.invalidate(); await utils.crm.customers.invalidate();
      setOrderModal(false);
    } catch { showToast("ذخیره سفارش انجام نشد؛ اتصال دیتابیس را بررسی کنید."); }
  };'''
if old not in s: raise SystemExit('saveOrder block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('Home now reads and writes shared CRM orders and customers')
