import { useEffect, useState } from "react";
import { Camera, Check, LoaderCircle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ProfileUser = { name?: string | null; avatarUrl?: string | null; jobTitle?: string | null; username?: string | null };

export default function ProfileEditor({ user, onClose }: { user: ProfileUser; onClose: () => void }) {
  const [name, setName] = useState(user.name || "");
  const [avatarData, setAvatarData] = useState("");
  const [notice, setNotice] = useState("");
  const update = trpc.auth.updateProfile.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chooseAvatar = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setNotice("حجم تصویر باید کمتر از ۴ مگابایت باشد."); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarData(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await update.mutateAsync({ name: name.trim(), ...(avatarData ? { avatarData } : {}) });
      await utils.auth.me.invalidate();
      setNotice("پروفایل شما با موفقیت ذخیره شد.");
      window.setTimeout(onClose, 650);
    } catch (error: any) { setNotice(error?.message || "ذخیره پروفایل انجام نشد."); }
  };

  return <div className="profile-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="profile-modal" onSubmit={save} dir="rtl">
      <div className="profile-modal-head"><div><span className="eyebrow">حساب کاربری</span><h2>ویرایش پروفایل من</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="بستن"><X size={18}/></button></div>
      <div className="profile-avatar-picker"><div className="profile-avatar-large">{avatarData || user.avatarUrl ? <img src={avatarData || user.avatarUrl || ""} alt="پروفایل"/> : (name || "ک").slice(0, 1)}</div><label className="avatar-upload-label"><Camera size={16}/> تغییر عکس<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => chooseAvatar(event.target.files?.[0])}/></label></div>
      <label>نام و نام خانوادگی<input required minLength={2} value={name} onChange={event => setName(event.target.value)} /></label>
      <div className="profile-readonly"><span>نام کاربری</span><strong dir="ltr">@{user.username || "—"}</strong><small>{user.jobTitle || "کارمند کارگاه"}</small></div>
      {notice && <div className="settings-notice"><Check size={15}/> {notice}</div>}
      <button className="primary-button profile-save" type="submit" disabled={update.isPending}>{update.isPending ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>} ذخیره پروفایل</button>
    </form>
  </div>;
}
