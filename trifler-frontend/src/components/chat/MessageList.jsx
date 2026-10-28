import MessageItem from "./MessageItem";

export default function MessageList({ conversation, messagesEndRef }) {
  return (
    <div className="messages-area" aria-live="polite">
      <div className="day-divider"><span>TODAY</span></div>
      {conversation.messages.map((message, index) => {
        const previous = conversation.messages[index - 1];
        const showAuthor = message.from === "them" && (
          conversation.category !== "group" ||
          !previous ||
          previous.author !== message.author
        );

        return (
          <MessageItem
            key={message.id}
            message={message}
            conversation={conversation}
            showAuthor={showAuthor}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}