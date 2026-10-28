export default function GroupMembers({ members = [] }) {
  if (members.length === 0) {
    return <p className="group-members-empty">No members have been added yet.</p>;
  }

  return (
    <ul className="group-members-list">
      {members.map((member) => {
        const name = typeof member === "string" ? member : member.name;
        return <li key={typeof member === "string" ? member : member.id || name}>{name}</li>;
      })}
    </ul>
  );
}