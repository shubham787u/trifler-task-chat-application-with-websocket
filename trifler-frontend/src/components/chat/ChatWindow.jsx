import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import TypeIndicator from "./TypeIndicator";

export default function ChatWindow({
  conversation,
  messagesEndRef,
  onBack,
  onAction,
  onSendMessage,
  onViewMembers,
}) {
  return (
    <section className="chat-panel" aria-label={`${conversation.name} conversation`}>
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onAction={onAction}
        onViewMembers={onViewMembers}
      />
      <MessageList conversation={conversation} messagesEndRef={messagesEndRef} />
      <TypeIndicator conversation={conversation} />
      <MessageInput
        conversation={conversation}
        onSend={onSendMessage}
      />
    </section>
  );
}