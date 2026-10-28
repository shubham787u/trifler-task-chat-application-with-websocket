import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { searchUsers } from "../../services/userService";
import GroupMembers from "./GroupMembers";

export default function AddMemberModel({
  isOpen,
  group,
  members = [],
  onAddMember,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState("");
  const [error, setError] = useState("");
  const memberIds = new Set(members.map((member) => (
    typeof member === "string" ? "" : member.id || member._id
  )));

  useEffect(() => {
    const search = query.trim();
    if (!isOpen || !group?.isAdmin || search.length < 2) return undefined;

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      searchUsers(search)
        .then((results) => {
          if (isCurrent) setUsers(results);
        })
        .catch((requestError) => {
          if (!isCurrent) return;
          setUsers([]);
          setError(
            requestError.response?.data?.message ||
              "Could not search users. Please try again.",
          );
        })
        .finally(() => {
          if (isCurrent) setIsSearching(false);
        });
    }, 250);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [group?.isAdmin, isOpen, query]);

  if (!isOpen || !group) return null;

  async function addMember(user) {
    const userId = user.id || user._id;
    setError("");
    setAddingUserId(userId);
    try {
      await onAddMember(group.id, userId);
      setQuery("");
      setUsers([]);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not add this member. Please try again.",
      );
    } finally {
      setAddingUserId("");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="new-chat-modal" role="dialog" aria-modal="true" aria-labelledby="group-members-title">
        <div className="modal-heading">
          <div>
            <span className="modal-kicker">GROUP MEMBERS</span>
            <h2 id="group-members-title">{group.name}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <GroupMembers members={members} />
        {group.isAdmin && (
          <div className="mt-5 space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Add a registered user</span>
              <input
                autoComplete="off"
                maxLength={50}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setUsers([]);
                  setIsSearching(false);
                  setError("");
                }}
                placeholder="Search by name or email"
              />
            </label>
            {isSearching && <p role="status">Searching…</p>}
            {users.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                {users.map((user) => {
                  const userId = user.id || user._id;
                  const isMember = memberIds.has(userId);
                  return (
                    <li key={userId} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span>{user.name}</span>
                      <button
                        className="inline-flex items-center gap-1 text-sm text-violet-700 disabled:opacity-50"
                        type="button"
                        disabled={isMember || Boolean(addingUserId)}
                        onClick={() => addMember(user)}
                      >
                        <UserPlus size={15} />
                        {isMember
                          ? "Added"
                          : addingUserId === userId
                            ? "Adding…"
                            : "Add"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {query.trim().length >= 2 &&
              !isSearching &&
              users.length === 0 &&
              !error && <p>No registered users found.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
