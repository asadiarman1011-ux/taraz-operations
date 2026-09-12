from pathlib import Path
p=Path('/home/ubuntu/taraz-operations/client/src/pages/Home.tsx')
s=p.read_text()
old='    <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><ArchiveIcon /></div><strong>تراز</strong></div><div className="topbar-date"><CalendarDays size={17} /><span>{jalaliDate(Date.now())}</span></div><div className="topbar-actions"><button className="notification"><Bell size={19} /><i /></button><div className="avatar small">م</div><ChevronDown size={16} /></div></header>\n'
if old not in s:
    raise SystemExit('duplicate page topbar not found')
s=s.replace(old,'',1)
p.write_text(s)
print('removed duplicate page-level topbar')
