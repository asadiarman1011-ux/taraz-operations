from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('import { useLocation } from "wouter";', 'import { useLocation } from "wouter";\nimport { trpc } from "@/lib/trpc";')
s=s.replace('  const [deliveryDraft, setDeliveryDraft] = useState({ method: "اسنپ‌باکس", cost: 550000, date: Date.now(), note: "تحویل سالم تأیید شد." });', '  const [deliveryDraft, setDeliveryDraft] = useState({ method: "اسنپ‌باکس", cost: 550000, date: Date.now(), note: "تحویل سالم تأیید شد." });\n  const activityMutation=trpc.activities.create.useMutation();')
s=s.replace('localStorage.setItem("sepid-activities",JSON.stringify([{id:Date.now(),text,time:Date.now()},...current].slice(0,40))); } catch {} };', 'localStorage.setItem("sepid-activities",JSON.stringify([{id:Date.now(),text,time:Date.now()},...current].slice(0,40))); } catch {} activityMutation.mutate({text}); };')
p.write_text(s)
print('home activity api wired')
