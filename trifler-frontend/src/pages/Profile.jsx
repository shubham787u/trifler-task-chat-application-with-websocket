import { useState } from "react";
import {
  ArrowLeft,
  Check,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useChat from "../hooks/useChat";
import "../styles/profile.css";

export default function Profile() {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const { clearConversations } = useChat();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  async function saveProfile(event) {
    event.preventDefault();
    setSaved(false);
    setError("");
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function signOut() {
    console.info("[Trifler demo] User signed out", {
      name: user?.name || "",
      email: user?.email || "",
    });
    logout();
    navigate("/login", { replace: true });
  }

  async function deleteUser() {
    setDeleteError("");
    setIsDeleting(true);
    try {
      await deleteAccount();
      clearConversations();
      navigate("/login", {
        replace: true,
        state: { notice: "Your account has been deleted." },
      });
    } catch (requestError) {
      setDeleteError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not delete the account. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-topbar">
          <Link className="profile-back-link" to="/dashboard">
            <ArrowLeft size={17} />
            <span>Back to workspace</span>
          </Link>
          <Link
            className="profile-wordmark"
            to="/dashboard"
            aria-label="Trifler home"
          >
            <span className="profile-wordmark-icon">
              <UserRound size={17} />
            </span>
            trifler<span>.</span>
          </Link>
        </header>

        <section className="profile-settings-card">
          <header className="profile-hero">
            <div className="profile-hero-copy">
              <span className="profile-eyebrow">YOUR ACCOUNT</span>
              <h1>Profile settings</h1>
              <p>Manage the details people see when they connect with you.</p>
            </div>
            <span className="profile-hero-decoration" aria-hidden="true">
              <UserRound size={76} strokeWidth={1.2} />
            </span>
          </header>

          <div className="profile-content">
            <div className="profile-editor">
              <div className="profile-section-heading">
                <div className="profile-avatar">{initials}</div>
                <div>
                  <h2>Personal details</h2>
                  <p>Update your name and email address.</p>
                </div>
              </div>

              <form className="profile-form" onSubmit={saveProfile}>
                <label className="profile-field">
                  <span>Display name</span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setSaved(false);
                    }}
                    required
                  />
                </label>

                <label className="profile-field">
                  <span>Email address</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setSaved(false);
                    }}
                    required
                  />
                </label>

                {error && (
                  <p className="profile-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="profile-actions">
                  <button
                    className="profile-save-button"
                    type="submit"
                    disabled={isSaving}
                  >
                    <Save size={16} />
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                  {saved && (
                    <span className="profile-saved" role="status">
                      <Check size={15} />
                      Profile updated
                    </span>
                  )}
                </div>
              </form>
            </div>

            <aside className="profile-aside">
              <div className="profile-aside-heading">
                <span className="profile-aside-icon">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h2>Account overview</h2>
                  <p>Your Trifler identity</p>
                </div>
              </div>
              <div className="profile-account-row">
                <span className="profile-account-icon">
                  <UserRound size={16} />
                </span>
                <span>
                  <small>DISPLAY NAME</small>
                  <strong>{name.trim() || "Your name"}</strong>
                </span>
              </div>
              <div className="profile-account-row">
                <span className="profile-account-icon">
                  <Mail size={16} />
                </span>
                <span>
                  <small>EMAIL ADDRESS</small>
                  <strong>{email.trim() || "Add your email"}</strong>
                </span>
              </div>
              <div className="profile-signout">
                <div>
                  <strong>Finished for now?</strong>
                  <span>You can sign back in anytime.</span>
                </div>
                <button type="button" onClick={signOut} aria-label="Sign out">
                  <LogOut size={17} />
                </button>
              </div>
              <div className="profile-delete-account">
                <div>
                  <strong>Delete account</strong>
                  {deleteError ? (
                    <span className="profile-delete-error" role="alert">
                      {deleteError}
                    </span>
                  ) : (
                    <span>Permanently remove this account and local chat data.</span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={isDeleting ? "Deleting account" : "Delete account"}
                  title={isDeleting ? "Deleting account" : "Delete account"}
                  onClick={deleteUser}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
