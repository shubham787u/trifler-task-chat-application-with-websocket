import { X } from "lucide-react";
import GroupMembers from "./GroupMembers";

export default function AddMemberModel({
  isOpen,
  group,
  members = [],
  onClose,
}) {
  if (!isOpen || !group) return null;

  function closeModal() {
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeModal();
    }}>
      <section className="new-chat-modal" role="dialog" aria-modal="true" aria-labelledby="group-members-title">
        <div className="modal-heading">
          <div>
            <span className="modal-kicker">GROUP MEMBERS</span>
            <h2 id="group-members-title">{group.name}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={closeModal}>
            <X size={19} />
          </button>
        </div>
        <GroupMembers members={members} />
      </section>
    </div>
  );
}