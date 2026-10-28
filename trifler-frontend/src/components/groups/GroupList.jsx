import { Search } from "lucide-react";
import GroupItem from "./GroupItem";

export default function GroupList({ groups, activeGroupId, onSelectGroup }) {
  if (groups.length === 0) {
    return (
      <div className="empty-list">
        <Search size={21} />
        <strong>No groups found</strong>
        <span>Try another search or create a group.</span>
      </div>
    );
  }

  return (
    <>
      {groups.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          isActive={group.id === activeGroupId}
          onSelect={onSelectGroup}
        />
      ))}
    </>
  );
}
