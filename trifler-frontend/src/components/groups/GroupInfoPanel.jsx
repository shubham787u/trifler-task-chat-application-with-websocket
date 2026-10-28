import { ChevronRight, Users } from "lucide-react";

export default function GroupInfoPanel({ group, members, onViewMembers }) {
  if (!group) return null;

  return (
    <aside className="group-info-panel" aria-label={`${group.name} group information`}>
      <header className="group-info-heading">
        <div>
          <span className="group-info-kicker">CONVERSATION</span>
          <h2>Group info</h2>
        </div>
        <span className="group-info-count">{members.length}</span>
      </header>

      <section className="group-info-summary">
        <span className={`group-info-avatar avatar-${group.color || "lavender"}`}>
          {group.initials || group.name.slice(0, 2).toUpperCase()}
        </span>
        <h3>{group.name}</h3>
        <p>{members.length} {members.length === 1 ? "member" : "members"}</p>
      </section>

      <section className="group-info-members">
        <div className="group-info-section-heading">
          <div>
            <Users size={15} />
            <h3>Members</h3>
          </div>
          <button type="button" onClick={onViewMembers} aria-label="View and manage group members">
            <ChevronRight size={17} />
          </button>
        </div>
        <ul>
          {members.slice(0, 5).map((member, index) => {
            const name = typeof member === "string" ? member : member.name;
            const initials = name
              .split(/\s+/)
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <li key={typeof member === "string" ? member : member.id || name}>
                <span className={`group-member-avatar group-member-avatar-${index % 5}`}>
                  {initials || "?"}
                </span>
                <span className="group-member-name">{name}</span>
              </li>
            );
          })}
        </ul>
        <button className="group-info-view-all" type="button" onClick={onViewMembers}>
          View and manage members
        </button>
      </section>
    </aside>
  );
}
