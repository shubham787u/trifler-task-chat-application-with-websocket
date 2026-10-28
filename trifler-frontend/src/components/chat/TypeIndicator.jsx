export default function TypeIndicator({ conversation }) {
  if (!conversation.isTyping) return null;

  const name = conversation.category === "group"
    ? conversation.typingName || "Someone"
    : conversation.typingName || conversation.name.split(" ")[0];

  return (
    <div className="typing-status" aria-label={`${name} is typing`}>
      <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
      {name} is typing
    </div>
  );
}