import { useState } from "react";
import defaultAvatar from "../assets/avatar.jpg";
import { profile } from "../data/mockData";

const PROFILE_STORAGE_KEY = "profile";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getInitialProfile() {
  const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

  if (!savedProfile) {
    return profile;
  }

  try {
    const parsedProfile = JSON.parse(savedProfile);
    const { avatar: legacyAvatar, ...savedProfileData } = parsedProfile;

    return {
      ...profile,
      ...savedProfileData,
      avatarUrl: parsedProfile.avatarUrl || legacyAvatar || profile.avatarUrl,
    };
  } catch {
    return profile;
  }
}

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(getInitialProfile);
  const [formData, setFormData] = useState(profileData);
  const [error, setError] = useState("");

  const projectLinks = [
    { label: "GitHub", url: profileData.githubUrl },
    { label: "Figma", url: profileData.figmaUrl },
    { label: "API Docs", url: profileData.apiDocsUrl },
    { label: "Report", url: profileData.reportUrl },
  ];

  function handleEdit() {
    setFormData({ ...profileData });
    setError("");
    setIsEditing(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAvatarChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Avatar must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        avatarUrl: reader.result,
      }));
      setError("");
    };

    reader.onerror = () => setError("Unable to read the selected image.");
    reader.readAsDataURL(file);
  }

  function handleSave(event) {
    event.preventDefault();

    const updatedProfile = {
      ...formData,
      fullName: formData.fullName.trim(),
      studentCode: formData.studentCode.trim(),
      email: formData.email.trim(),
      githubUrl: formData.githubUrl.trim(),
      figmaUrl: formData.figmaUrl.trim(),
      apiDocsUrl: formData.apiDocsUrl.trim(),
      reportUrl: formData.reportUrl.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (!updatedProfile.fullName || !updatedProfile.studentCode || !updatedProfile.email) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(updatedProfile.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfileData(updatedProfile);
      setError("");
      setIsEditing(false);
    } catch {
      setError("Unable to save profile in this browser.");
    }
  }

  function handleCancel() {
    setFormData({ ...profileData });
    setError("");
    setIsEditing(false);
  }

  return (
    <section className="page profile-page">
      <article className="profile-card">
        <header className="profile-header">
          <h1>Profile</h1>
          <p>Project owner information</p>
        </header>

        {isEditing ? (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-avatar-edit">
              <img src={formData.avatarUrl || defaultAvatar} alt="Profile avatar preview" className="profile-avatar" />
              <label htmlFor="profile-avatar">Avatar</label>
              <input
                id="profile-avatar"
                className="profile-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
              />
              <small>JPG, PNG, or WebP up to 2 MB. Stored locally in mock mode.</small>
            </div>

            <label className="profile-form-group">
              Full Name *
              <input name="fullName" value={formData.fullName} onChange={handleChange} required />
            </label>

            <label className="profile-form-group">
              Student Code *
              <input name="studentCode" value={formData.studentCode} onChange={handleChange} required />
            </label>

            <label className="profile-form-group">
              Email *
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </label>

            <label className="profile-form-group">
              GitHub URL
              <input name="githubUrl" type="url" value={formData.githubUrl} onChange={handleChange} />
            </label>

            <label className="profile-form-group">
              Figma URL
              <input name="figmaUrl" type="url" value={formData.figmaUrl} onChange={handleChange} />
            </label>

            <label className="profile-form-group">
              API Docs URL
              <input name="apiDocsUrl" type="url" value={formData.apiDocsUrl} onChange={handleChange} />
            </label>

            <label className="profile-form-group">
              Report URL
              <input name="reportUrl" type="url" value={formData.reportUrl} onChange={handleChange} />
            </label>

            {error && (
              <p className="profile-form-error" role="alert">
                {error}
              </p>
            )}

            <div className="profile-form-actions">
              <button className="secondary-button" type="button" onClick={handleCancel}>
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-avatar-container">
              <img src={profileData.avatarUrl || defaultAvatar} alt="Profile avatar" className="profile-avatar" />
            </div>

            <section className="profile-info">
              <h2>Personal Information</h2>
              <div className="profile-row">
                <span>Full Name</span>
                <strong>{profileData.fullName}</strong>
              </div>
              <div className="profile-row">
                <span>Student Code</span>
                <strong>{profileData.studentCode}</strong>
              </div>
              <div className="profile-row">
                <span>Email</span>
                <strong>{profileData.email}</strong>
              </div>
            </section>

            <section className="profile-links">
              <h2>Project Links</h2>
              <div className="profile-link-list">
                {projectLinks.map((link) =>
                  link.url && link.url !== "#" ? (
                    <a key={link.label} className="profile-link" href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <span key={link.label} className="profile-link disabled">
                      {link.label} - Not configured
                    </span>
                  ),
                )}
              </div>
            </section>

            <div className="profile-view-actions">
              <button className="primary-button profile-edit-button" type="button" onClick={handleEdit}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}

export default Profile;
