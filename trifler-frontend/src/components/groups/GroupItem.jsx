import Avatar from "../common/Avatar";

export default function GroupItem({ group, isActive, onSelect }) {
  return (
    <button
      className={`conversation-item ${isActive ? "is-current" : ""}`}
      type="button"
      onClick={() => onSelect(group)}
      aria-current={isActive ? "page" : undefined}
    >
      <Avatar conversation={group} />
      <span className="conversation-copy">
        <span className="conversation-title">
          <strong>{group.name}</strong>
          <time>{group.time}</time>
        </span>
        <span className="conversation-preview">{group.preview}</span>
      </span>
      {group.unread > 0 && <span className="unread-count">{group.unread}</span>}
    </button>
  );
}