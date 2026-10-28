import { useState } from "react";
import { Check, X } from "lucide-react";

export default function CreateGroupModel({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  function submitGroup(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate(trimmedName);
    setName("");
  }

  function closeModal() {
    setName("");
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeModal();
    }}>
      <section className="new-chat-modal" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
        <div className="modal-heading">
          <div>
            <span className="modal-kicker">BRING PEOPLE TOGETHER</span>
            <h2 id="create-group-title">Create a group</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={closeModal}>
            <X size={19} />
          </button>
        </div>
        <p>Give your group a name. You can add people later.</p>
        <form className="auth-form" onSubmit={submitGroup}>
          <label>
            <span>Group name</span>
            <input
              autoFocus
              maxLength={48}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekend plans"
              required
            />
          </label>
          <button className="auth-primary-button" type="submit" disabled={!name.trim()}>
            Create group <Check size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}