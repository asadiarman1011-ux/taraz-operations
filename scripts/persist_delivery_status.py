from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/Home.tsx')
s=p.read_text()
old='''  const markDelivered = (event: FormEvent) => {
    event.preventDefault();
    if (!deliveryOrderId) return;
    setOrders(data => data.map(order => order.id === deliveryOrderId ? { ...order, status: "delivered", delivery: { completedAt: deliveryDraft.date, cost: deliveryDraft.cost, method: deliveryDraft.method, note: deliveryDraft.note } } : order));
    setDeliveryOrderId(null); setDeliveryTab("delivered"); showToast("هزینه و اطلاعات ارسال ثبت شد؛ سفارش تحویل‌شده شد."); logActivity(`تحویل سفارش ${deliveryOrderId} ثبت شد`);
  };'''
new='''  const markDelivered = async (event: FormEvent) => {
    event.preventDefault();
    if (!deliveryOrderId) return;
    try {
      if (deliveryOrderId.startsWith("DB-")) await updateOrderMutation.mutateAsync({ id: Number(deliveryOrderId.replace("DB-", "")), data: { status: "delivered" } });
      setOrders(data => data.map(order => order.id === deliveryOrderId ? { ...order, status: "delivered", delivery: { completedAt: deliveryDraft.date, cost: deliveryDraft.cost, method: deliveryDraft.method, note: deliveryDraft.note } } : order));
      await utils.crm.orders.invalidate();
      setDeliveryOrderId(null); setDeliveryTab("delivered"); showToast("هزینه و اطلاعات ارسال ثبت شد؛ سفارش تحویل‌شده شد."); logActivity(`تحویل سفارش ${deliveryOrderId} ثبت شد`);
    } catch { showToast("ثبت تحویل انجام نشد؛ دوباره تلاش کنید."); }
  };'''
if old not in s: raise SystemExit('markDelivered block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('delivery status now persists for shared database orders')
