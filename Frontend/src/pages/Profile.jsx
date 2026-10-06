import { useEffect, useState } from "react";

import defaultAvatar from "../assets/avatar.jpg";
import { requestApi } from "../services/api";

const FORM_FIELDS = [
  {
    name: "fullName",
    label: "Họ và tên *",
    type: "text",
    required: true,
  },
  {
    name: "studentCode",
    label: "Mã sinh viên *",
    type: "text",
    required: true,
  },
  {
    name: "email",
    label: "Email *",
    type: "email",
    required: true,
  },
  {
    name: "githubUrl",
    label: "Liên kết GitHub",
    type: "url",
  },
  {
    name: "figmaUrl",
    label: "Liên kết Figma",
    type: "url",
  },
  {
    name: "apiDocsUrl",
    label: "Liên kết tài liệu API",
    type: "url",
  },
  {
    name: "reportUrl",
    label: "Liên kết báo cáo",
    type: "url",
  },
];

const PROJECT_LINKS = [
  { label: "GitHub", field: "githubUrl" },
  { label: "Figma", field: "figmaUrl" },
  { label: "Tài liệu API", field: "apiDocsUrl" },
  { label: "Báo cáo", field: "reportUrl" },
];

function taoFormHoSo(profile) {
  const form = {};

  for (const field of FORM_FIELDS) {
    form[field.name] = profile[field.name] || "";
  }

  form.avatarUrl = profile.avatarUrl || "";

  return form;
}

function taoDuLieuCapNhat(form) {
  const duLieu = {};

  for (const field of FORM_FIELDS) {
    const value = form[field.name].trim();
    duLieu[field.name] = field.required ? value : value || null;
  }

  duLieu.avatarUrl = form.avatarUrl.trim() || null;

  return duLieu;
}

export default function Profile() {
  const [hoSo, setHoSo] = useState(null);
  const [formHoSo, setFormHoSo] = useState({});
  const [dangChinhSua, setDangChinhSua] = useState(false);
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBaoLoi, setThongBaoLoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  // Tải hồ sơ
  async function taiHoSo() {
    setDangTai(true);

    try {
      const result = await requestApi("/profile");

      setHoSo(result);
      setThongBaoLoi("");
    } catch (error) {
      setThongBaoLoi(
        error.status
          ? "Không tải được hồ sơ."
          : "Không thể kết nối máy chủ.",
      );
    } finally {
      setDangTai(false);
    }
  }

  function batDauChinhSua() {
    setFormHoSo(taoFormHoSo(hoSo));
    setThongBaoLoi("");
    setThongBao("");
    setDangChinhSua(true);
  }

  function huyChinhSua() {
    setDangChinhSua(false);
    setThongBaoLoi("");
  }

  function thayDoiTruong(name, value) {
    setFormHoSo((formHienTai) => ({
      ...formHienTai,
      [name]: value,
    }));
  }

  // Lưu hồ sơ
  async function luuHoSo(event) {
    event.preventDefault();
    setThongBaoLoi("");
    setDangLuu(true);

    try {
      const result = await requestApi("/profile", {
        method: "PUT",
        body: JSON.stringify(taoDuLieuCapNhat(formHoSo)),
      });

      setHoSo(result);
      setDangChinhSua(false);
      setThongBao("Đã lưu hồ sơ.");
    } catch (error) {
      if (error.status === 409) {
        setThongBaoLoi("Email hoặc mã sinh viên đã được sử dụng.");
      } else if (error.status === 400) {
        setThongBaoLoi(
          "Dữ liệu không hợp lệ. Kiểm tra mã sinh viên, email và các URL.",
        );
      } else {
        setThongBaoLoi(
          error.status
            ? "Không lưu được hồ sơ."
            : "Không thể kết nối máy chủ.",
        );
      }
    } finally {
      setDangLuu(false);
    }
  }

  useEffect(() => {
    void taiHoSo();
  }, []);

  return (
    <section className="page profile-page">
      <article className="profile-card">
        <header className="profile-header">
          <h1>Hồ sơ</h1>
        </header>

        {dangTai && <p>Đang tải hồ sơ...</p>}

        {!hoSo && thongBaoLoi && (
          <p className="profile-form-error" role="alert">
            {thongBaoLoi}{" "}
            <button type="button" onClick={taiHoSo}>
              Thử lại
            </button>
          </p>
        )}

        {hoSo &&
          (dangChinhSua ? (
            <form className="profile-form" onSubmit={luuHoSo}>
              <div className="profile-avatar-edit">
                <img
                  src={formHoSo.avatarUrl || defaultAvatar}
                  alt="Xem trước ảnh đại diện"
                  className="profile-avatar"
                />

                <label htmlFor="avatar-url">URL ảnh đại diện HTTPS</label>

                <input
                  id="avatar-url"
                  name="avatarUrl"
                  type="url"
                  value={formHoSo.avatarUrl}
                  onChange={(event) =>
                    thayDoiTruong("avatarUrl", event.target.value)
                  }
                  placeholder="https://..."
                />

                <small>Chỉ hỗ trợ URL ảnh HTTPS; chưa tải ảnh từ máy.</small>
              </div>

              {FORM_FIELDS.map((field) => (
                <label className="profile-form-group" key={field.name}>
                  {field.label}

                  <input
                    name={field.name}
                    type={field.type}
                    value={formHoSo[field.name]}
                    required={field.required}
                    onChange={(event) =>
                      thayDoiTruong(field.name, event.target.value)
                    }
                  />
                </label>
              ))}

              {thongBaoLoi && (
                <p className="profile-form-error" role="alert">
                  {thongBaoLoi}
                </p>
              )}

              <div className="profile-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={dangLuu}
                  onClick={huyChinhSua}
                >
                  Hủy
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={dangLuu}
                >
                  {dangLuu ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-avatar-container">
                <img
                  src={hoSo.avatarUrl || defaultAvatar}
                  alt="Ảnh đại diện"
                  className="profile-avatar"
                />
              </div>

              <section className="profile-info">
                <h2>Thông tin cá nhân</h2>

                <div className="profile-row">
                  <span>Họ và tên</span>
                  <strong>{hoSo.fullName}</strong>
                </div>

                <div className="profile-row">
                  <span>Mã sinh viên</span>
                  <strong>{hoSo.studentCode}</strong>
                </div>

                <div className="profile-row">
                  <span>Email</span>
                  <strong>{hoSo.email}</strong>
                </div>
              </section>

              <section className="profile-links">
                <h2>Liên kết đồ án</h2>

                <div className="profile-link-list">
                  {PROJECT_LINKS.map(({ label, field }) =>
                    hoSo[field] ? (
                      <a
                        key={field}
                        className="profile-link"
                        href={hoSo[field]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {label}
                      </a>
                    ) : (
                      <span
                        key={field}
                        className="profile-link disabled"
                        title="Chưa thiết lập"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </section>

              {thongBao && (
                <p className="profile-save-notice" role="status">
                  {thongBao}
                </p>
              )}

              <div className="profile-view-actions">
                <button
                  className="primary-button profile-edit-button"
                  type="button"
                  onClick={batDauChinhSua}
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </>
          ))}
      </article>
    </section>
  );
}