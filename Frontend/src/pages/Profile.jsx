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

function createProfileForm(profile) {
  const formValues = {};

  for (const field of FORM_FIELDS) {
    formValues[field.name] =
      profile[field.name] || "";
  }

  formValues.avatarUrl =
    profile.avatarUrl || "";

  return formValues;
}

function createProfileUpdate(formValues) {
  const update = {};

  for (const field of FORM_FIELDS) {
    const value =
      formValues[field.name].trim();

    update[field.name] =
      field.required
        ? value
        : value || null;
  }

  update.avatarUrl =
    formValues.avatarUrl.trim() || null;

  return update;
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function loadProfile() {
    setIsLoading(true);

    try {
      const result = await requestApi("/profile");

      setProfile(result);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error.status
          ? "Không tải được hồ sơ."
          : "Không thể kết nối máy chủ.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit() {
    setFormValues(
      createProfileForm(profile),
    );

    setErrorMessage("");
    setNotice("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setErrorMessage("");
  }

  function handleFieldChange(name, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    setErrorMessage("");
    setIsSaving(true);

    try {
      const result = await requestApi("/profile", {
        method: "PUT",
        body: JSON.stringify(
          createProfileUpdate(formValues),
        ),
      });

      setProfile(result);
      setIsEditing(false);
      setNotice("Đã lưu hồ sơ.");
    } catch (error) {
      if (error.status === 409) {
        setErrorMessage(
          "Email hoặc mã sinh viên đã được sử dụng.",
        );
      } else if (error.status === 400) {
        setErrorMessage(
          "Dữ liệu không hợp lệ. Kiểm tra mã sinh viên, email và các URL.",
        );
      } else {
        setErrorMessage(
          error.status
            ? "Không lưu được hồ sơ."
            : "Không thể kết nối máy chủ.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  return (
    <section className="page profile-page">
      <article className="profile-card">
        <header className="profile-header">
          <h1>Hồ sơ</h1>
        </header>

        {isLoading && (
          <p>Đang tải hồ sơ...</p>
        )}

        {!profile && errorMessage && (
          <p
            className="profile-form-error"
            role="alert"
          >
            {errorMessage}{" "}
            <button
              type="button"
              onClick={loadProfile}
            >
              Thử lại
            </button>
          </p>
        )}

        {profile && (
          isEditing ? (
            <form
              className="profile-form"
              onSubmit={handleSave}
            >
              <div className="profile-avatar-edit">
                <img
                  src={
                    formValues.avatarUrl ||
                    defaultAvatar
                  }
                  alt="Xem trước ảnh đại diện"
                  className="profile-avatar"
                />

                <label htmlFor="avatar-url">
                  URL ảnh đại diện HTTPS
                </label>

                <input
                  id="avatar-url"
                  name="avatarUrl"
                  type="url"
                  value={formValues.avatarUrl}
                  onChange={(event) =>
                    handleFieldChange(
                      "avatarUrl",
                      event.target.value,
                    )
                  }
                  placeholder="https://..."
                />

                <small>
                  Chỉ hỗ trợ URL ảnh HTTPS; chưa tải ảnh từ máy.
                </small>
              </div>

              {FORM_FIELDS.map((field) => (
                <label
                  className="profile-form-group"
                  key={field.name}
                >
                  {field.label}

                  <input
                    name={field.name}
                    type={field.type}
                    value={formValues[field.name]}
                    required={field.required}
                    onChange={(event) =>
                      handleFieldChange(
                        field.name,
                        event.target.value,
                      )
                    }
                  />
                </label>
              ))}

              {errorMessage && (
                <p
                  className="profile-form-error"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <div className="profile-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                >
                  Hủy
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-avatar-container">
                <img
                  src={
                    profile.avatarUrl ||
                    defaultAvatar
                  }
                  alt="Ảnh đại diện"
                  className="profile-avatar"
                />
              </div>

              <section className="profile-info">
                <h2>Thông tin cá nhân</h2>

                <div className="profile-row">
                  <span>Họ và tên</span>
                  <strong>
                    {profile.fullName}
                  </strong>
                </div>

                <div className="profile-row">
                  <span>Mã sinh viên</span>
                  <strong>
                    {profile.studentCode}
                  </strong>
                </div>

                <div className="profile-row">
                  <span>Email</span>
                  <strong>
                    {profile.email}
                  </strong>
                </div>
              </section>

              <section className="profile-links">
                <h2>Liên kết đồ án</h2>

                <div className="profile-link-list">
                  {PROJECT_LINKS.map(
                    ({ label, field }) =>
                      profile[field] ? (
                        <a
                          key={field}
                          className="profile-link"
                          href={profile[field]}
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

              {notice && (
                <p
                  className="profile-save-notice"
                  role="status"
                >
                  {notice}
                </p>
              )}

              <div className="profile-view-actions">
                <button
                  className="primary-button profile-edit-button"
                  type="button"
                  onClick={handleEdit}
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </>
          )
        )}
      </article>
    </section>
  );
}