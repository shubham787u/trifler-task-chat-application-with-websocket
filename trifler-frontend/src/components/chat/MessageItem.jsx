import { CheckCheck } from "lucide-react";
import Avatar from "../common/Avatar";

export default function MessageItem({ message, conversation, showAuthor }) {
  const isMine = message.from === "me";

  return (
    <div className={`message-row ${isMine ? "message-mine" : ""}`}>
      {!isMine && (
        <span className="message-avatar-spacer">
          {showAuthor ? <Avatar conversation={conversation} size="avatar-small" /> : null}
        </span>
      )}
      <div className="message-content">
        {showAuthor && conversation.category === "group" && (
          <span className="message-author">{message.author}</span>
        )}
        <div className="message-bubble">{message.text}</div>
        <div className="message-meta">
          <time>{message.time}</time>
          {isMine && <CheckCheck size={14} className="message-seen" aria-label="Sent" />}
        </div>
      </div>
    </div>
  );
}