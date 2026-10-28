import { ArrowLeft, MoreHorizontal, Phone, Users, Video } from "lucide-react";
import Avatar from "../common/Avatar";

export default function ChatHeader({
  conversation,
  onBack,
  onAction,
  onViewMembers,
}) {
  const isGroup = conversation.category === "group";

  return (
    <header className="chat-header">
      <button
        className="icon-button mobile-back"
        type="button"
        aria-label="Back to conversations"
        onClick={onBack}
      >
        <ArrowLeft size={19} />
      </button>
      <Avatar conversation={conversation} />
      <div className="chat-person">
        <strong>{conversation.name}</strong>
        <span>
          {isGroup
            ? `${conversation.members} · ${conversation.name === "Design team" ? "3 online" : "2 online"}`
            : conversation.online
              ? "Active now"
              : "Last seen recently"}
        </span>
      </div>
      <div className="chat-header-actions">
        {isGroup ? (
          <button
            className="icon-button"
            type="button"
            aria-label="View group members"
            title="Group members"
            onClick={onViewMembers}
          >
            <Users size={18} />
          </button>
        ) : (
          <>
            <button
              className="icon-button"
              type="button"
              aria-label="Start voice call"
              title="Voice call"
              onClick={() =>
                onAction(
                  "Voice calls are available when you connect a chat server",
                )
              }
            >
              <Phone size={18} />
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Start video call"
              title="Video call"
              onClick={() =>
                onAction(
                  "Video calls are available when you connect a chat server",
                )
              }
            >
              <Video size={18} />
            </button>
          </>
        )}
        <span className="header-divider" />
        {!isGroup && (
          <button
            className="icon-button"
            type="button"
            aria-label="More conversation options"
            title="More options"
            onClick={() =>
              onAction("More conversation options are coming soon.")
            }
          >
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
