import { Send, Smile } from "lucide-react";
import { useState } from "react";

export default function MessageInput({ conversation, onSend }) {
  const [draft, setDraft] = useState("");
  const isGroup = conversation.category === "group";
  const recipient = isGroup ? "the group" : conversation.name.split(" ")[0];

  function submitMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <form className="message-composer" onSubmit={submitMessage}>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form.requestSubmit();
          }
        }}
        placeholder={`Message to ${recipient}.....`}
        aria-label="Write a message"
        rows={1}
      />
      <div className="composer-toolbar">
        <div className="composer-tools">
          <button
            type="button"
            aria-label="Add emoji"
            title="Add emoji"
            onClick={() => setDraft((value) => `${value}${value ? " " : ""}😊`)}
          >
            <Smile size={18} />
          </button>
        </div>
        <div className="composer-send">
          {/* <span>Press <kbd>↵</kbd> to send</span> */}
          <button
            className="send-button"
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </form>
  );
}
