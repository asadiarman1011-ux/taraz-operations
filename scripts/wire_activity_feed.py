from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/components/DashboardLayout.tsx')
s=p.read_text()
s=s.replace('import { useLocation } from "wouter";', 'import { useLocation } from "wouter";\nimport { trpc } from "@/lib/trpc";')
s=s.replace('const [notifications,setNotifications]=useState<Activity[]>(()=>{try{return JSON.parse(localStorage.getItem("sepid-activities")||"[]")}catch{return []}});', 'const [notifications,setNotifications]=useState<Activity[]>(()=>{try{return JSON.parse(localStorage.getItem("sepid-activities")||"[]")}catch{return []}});const activityQuery=trpc.activities.list.useQuery(undefined,{refetchInterval:5000});')
s=s.replace('useEffect(()=>{document.documentElement', 'useEffect(()=>{if(activityQuery.data){setNotifications((activityQuery.data as any[]).map(item=>({id:item.id,text:item.text,time:new Date(item.createdAt).getTime()})));}},[activityQuery.data]);useEffect(()=>{document.documentElement')
p.write_text(s)
print('activity feed wired')
