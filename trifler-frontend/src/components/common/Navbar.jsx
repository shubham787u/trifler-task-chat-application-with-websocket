import {
  Bell,
  LogOut,
  MessageCircle,
  MessageSquareText,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({
  displayName,
  profileInitials,
  isGroupsPage,
  isPrivateChatPage = false,
  messageCount,
  privateChatCount,
  groupCount,
  onLogout,
  onShowUnread,
}) {
  const navigate = useNavigate();

  return (
    <aside className="navigation-rail" aria-label="Main navigation">
      <Link className="brand" to="/dashboard" aria-label="Trifler home">
        <span className="brand-mark"><MessageCircle size={21} strokeWidth={2.4} /></span>
        <span className="brand-name">trifler<span>.</span></span>
      </Link>

      <div className="rail-section-label">WORKSPACE</div>
      <button
        className={`rail-link ${!isGroupsPage && !isPrivateChatPage ? "is-active" : ""}`}
        type="button"
        aria-label="Messages"
        title="Messages"
        onClick={() => navigate("/dashboard")}
      >
        <MessageCircle size={19} />
        <span>Messages</span>
        <span className="rail-count">{messageCount}</span>
      </button>
      <button
        className={`rail-link ${isPrivateChatPage ? "is-active" : ""}`}
        type="button"
        aria-label="Private chats"
        title="Private chats"
        onClick={() => navigate("/private-chat")}
      >
        <MessageSquareText size={19} />
        <span>Private chats</span>
        <span className="rail-count">{privateChatCount}</span>
      </button>
      <button
        className={`rail-link ${isGroupsPage ? "is-active" : ""}`}
        type="button"
        aria-label="Groups"
        title="Groups"
        onClick={() => navigate("/groups")}
      >
        <Users size={19} />
        <span>Groups</span>
        <span className="rail-count">{groupCount}</span>
      </button>

      <div className="rail-section-label rail-section-spaced">YOUR SPACE</div>
      <button className="rail-link" type="button" aria-label="Activity" title="Activity" onClick={onShowUnread}>
        <Bell size={19} />
        <span>Activity</span>
        <span className="notification-dot" />
      </button>
      <div className="rail-bottom">
        <div className="profile-card">
          <Link
            className="avatar avatar-profile"
            to="/profile"
            aria-label="Open profile"
            title="Profile"
          >
            {profileInitials}
          </Link>
          <span className="profile-copy">
            <strong>{displayName}</strong>
            <Link to="/profile">Demo profile</Link>
          </span>
          <button
            className="profile-menu"
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={onLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}