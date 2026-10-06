import { useEffect, useState } from "react";
import defaultAvatar from "../assets/avatar.jpg";
import { api } from "../services/api";

const fields = ["fullName", "studentCode", "email", "githubUrl", "figmaUrl", "apiDocsUrl", "reportUrl", "avatarUrl"];
const links = [
  { label: "GitHub", field: "githubUrl" }, { label: "Figma", field: "figmaUrl" },
  { label: "Tài liệu API", field: "apiDocsUrl" }, { label: "Báo cáo", field: "reportUrl" },
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await api("/profile");
      setProfile(result); setError("");
    } catch (problem) {
      setError(problem.status ? "Không tải được hồ sơ." : "Không thể kết nối máy chủ.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function beginEdit() {
    setForm(Object.fromEntries(fields.map((field) => [field, profile[field] || ""])));
    setError(""); setNotice(""); setEditing(true);
  }

  async function save(event) {
    event.preventDefault();
    setError(""); setSaving(true);
    const body = Object.fromEntries(fields.map((field) => [field,
      ["fullName", "studentCode", "email"].includes(field) ? form[field].trim() : form[field].trim() || null]));
    try {
      const result = await api("/profile", { method: "PUT", body: JSON.stringify(body) });
      setProfile(result); setEditing(false); setNotice("Đã lưu hồ sơ.");
    } catch (problem) {
      setError(problem.status === 409 ? "Email hoặc mã sinh viên đã được sử dụng." :
        problem.status === 400 ? "Dữ liệu không hợp lệ. Kiểm tra mã sinh viên, email và các URL." :
          problem.status ? "Không lưu được hồ sơ." : "Không thể kết nối máy chủ.");
    } finally { setSaving(false); }
  }

  return (
    <section className="page profile-page"><article className="profile-card">
      <header className="profile-header"><h1>Hồ sơ</h1></header>
      {loading && <p>Đang tải hồ sơ...</p>}
      {!profile && error && <p className="profile-form-error" role="alert">{error} <button type="button" onClick={load}>Thử lại</button></p>}
      {profile && (editing ? (
        <form className="profile-form" onSubmit={save}>
          <div className="profile-avatar-edit">
            <img src={form.avatarUrl || defaultAvatar} alt="Xem trước ảnh đại diện" className="profile-avatar" />
            <label htmlFor="avatar-url">URL ảnh đại diện HTTPS</label>
            <input id="avatar-url" name="avatarUrl" type="url" value={form.avatarUrl}
              onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="https://..." />
            <small>Chỉ hỗ trợ URL ảnh HTTPS; chưa tải ảnh từ máy.</small>
          </div>
          {[
            ["fullName", "Họ và tên *", "text"], ["studentCode", "Mã sinh viên *", "text"],
            ["email", "Email *", "email"], ["githubUrl", "Liên kết GitHub", "url"],
            ["figmaUrl", "Liên kết Figma", "url"], ["apiDocsUrl", "Liên kết tài liệu API", "url"],
            ["reportUrl", "Liên kết báo cáo", "url"],
          ].map(([name, label, type]) => <label className="profile-form-group" key={name}>{label}
            <input name={name} type={type} value={form[name]} required={["fullName", "studentCode", "email"].includes(name)}
              onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
          </label>)}
          {error && <p className="profile-form-error" role="alert">{error}</p>}
          <div className="profile-form-actions">
            <button className="secondary-button" type="button" disabled={saving} onClick={() => { setEditing(false); setError(""); }}>Hủy</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
          </div>
        </form>
      ) : <>
        <div className="profile-avatar-container"><img src={profile.avatarUrl || defaultAvatar} alt="Ảnh đại diện" className="profile-avatar" /></div>
        <section className="profile-info"><h2>Thông tin cá nhân</h2>
          <div className="profile-row"><span>Họ và tên</span><strong>{profile.fullName}</strong></div>
          <div className="profile-row"><span>Mã sinh viên</span><strong>{profile.studentCode}</strong></div>
          <div className="profile-row"><span>Email</span><strong>{profile.email}</strong></div>
        </section>
        <section className="profile-links"><h2>Liên kết đồ án</h2><div className="profile-link-list">
          {links.map(({ label, field }) => profile[field] ?
            <a key={field} className="profile-link" href={profile[field]} target="_blank" rel="noreferrer">{label}</a> :
            <span key={field} className="profile-link disabled" title="Chưa thiết lập">{label}</span>)}
        </div></section>
        {notice && <p className="profile-save-notice" role="status">{notice}</p>}
        <div className="profile-view-actions"><button className="primary-button profile-edit-button" type="button" onClick={beginEdit}>Chỉnh sửa hồ sơ</button></div>
      </>)}
    </article></section>
  );
}
