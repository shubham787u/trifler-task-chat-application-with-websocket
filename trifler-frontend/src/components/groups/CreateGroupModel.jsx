import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { searchUsers } from "../../services/userService";

export default function CreateGroupModel({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const search = query.trim();
    if (!isOpen || search.length < 2) return undefined;

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
  }, [isOpen, query]);

  if (!isOpen) return null;

  function reset() {
    setName("");
    setQuery("");
    setUsers([]);
    setSelectedUsers([]);
    setError("");
  }

  function closeModal() {
    reset();
    onClose();
  }

  function toggleUser(user) {
    const userId = user.id || user._id;
    setSelectedUsers((current) =>
      current.some((selected) => selected.id === userId)
        ? current.filter((selected) => selected.id !== userId)
        : [...current, { ...user, id: userId }],
    );
  }

  async function submitGroup(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || selectedUsers.length === 0 || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      await onCreate({
        name: trimmedName,
        memberIds: selectedUsers.map((user) => user.id),
      });
      reset();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not create the group. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <p>Name your group and choose at least one person to add.</p>
        <form className="auth-form" onSubmit={submitGroup}>
          <label>
            <span>Group name</span>
            <input
              autoFocus
              maxLength={60}
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekend plans"
              required
            />
          </label>
          <label>
            <span>Add members</span>
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
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <button
                  className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-800"
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user)}
                  aria-label={`Remove ${user.name}`}
                >
                  {user.name} ×
                </button>
              ))}
            </div>
          )}
          {isSearching && <p role="status">Searching…</p>}
          {users.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
              {users.map((user) => {
                const userId = user.id || user._id;
                const isSelected = selectedUsers.some(
                  (selected) => selected.id === userId,
                );
                return (
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-violet-50"
                    key={userId}
                    type="button"
                    onClick={() => toggleUser(user)}
                  >
                    <span>{user.name}</span>
                    {isSelected && <Check size={16} aria-label="Selected" />}
                  </button>
                );
              })}
            </div>
          )}
          {query.trim().length >= 2 &&
            !isSearching &&
            users.length === 0 &&
            !error && <p>No registered users found.</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button
            className="auth-primary-button"
            type="submit"
            disabled={name.trim().length < 2 || selectedUsers.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Creating group…" : "Create group"} <Check size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
