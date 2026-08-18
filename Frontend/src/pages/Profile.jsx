import avatar from "../assets/avatar.jpg";
import { profile } from "../data/mockData";

function Profile() {
  const projectLinks = [
    { label: "GitHub", url: profile.githubUrl },
    { label: "Figma", url: profile.figmaUrl },
    { label: "API Docs", url: profile.apiDocsUrl },
    { label: "Report", url: profile.reportUrl },
  ];

  return (
    <section className="page profile-page">
      <article className="profile-card">
        <h1>Profile</h1>

        <div className="profile-avatar-container">
          <img src={avatar} alt="Profile avatar" className="profile-avatar" />
        </div>

        <section className="profile-info">
          <h2>Personal Information</h2>
          <div className="profile-row">
            <span>Full Name</span>
            <strong>{profile.fullName}</strong>
          </div>
          <div className="profile-row">
            <span>Student Code</span>
            <strong>{profile.studentCode}</strong>
          </div>
          <div className="profile-row">
            <span>Email</span>
            <strong>{profile.email}</strong>
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
      </article>
    </section>
  );
}

export default Profile;
