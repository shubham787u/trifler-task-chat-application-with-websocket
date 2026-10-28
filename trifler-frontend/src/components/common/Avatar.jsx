export default function Avatar({ conversation, size = "", className = "" }) {
  const initials = conversation?.initials || conversation?.name?.trim()?.slice(0, 2)?.toUpperCase() || "?";
  const color = conversation?.color || "lavender";

  return (
    <span className={`avatar avatar-${color} ${size} ${className}`.trim()}>
      {initials}
      {conversation?.online && <span className="avatar-online" />}
    </span>
  );
}