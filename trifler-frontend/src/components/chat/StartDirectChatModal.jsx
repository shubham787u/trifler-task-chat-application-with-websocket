import { MessageCircle, Search, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { searchUsers } from "../../services/userService";

export default function StartDirectChatModal({ isOpen, onClose, onStart }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
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

  function closeModal() {
    setQuery("");
    setUsers([]);
    setSelectedUser(null);
    setError("");
    onClose();
  }

  async function submitConversation(event) {
    event.preventDefault();
    if (!selectedUser || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      await onStart(selectedUser);
      setQuery("");
      setUsers([]);
      setSelectedUser(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not start this conversation. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        className="new-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-direct-chat-title"
      >
        <div className="modal-heading">
          <div>
            <span className="modal-kicker">ONE-TO-ONE CHAT</span>
            <h2 id="start-direct-chat-title">Start a conversation</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close"
            onClick={closeModal}
          >
            <X size={19} />
          </button>
        </div>
        <p>Search for a registered user by name or email.</p>
        <form className="auth-form" onSubmit={submitConversation}>
          <label>
            <span>Name or email</span>
            <span className="direct-chat-name-field">
              <Search size={17} aria-hidden="true" />
              <input
                autoFocus
                autoComplete="off"
                maxLength={50}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setUsers([]);
                  setSelectedUser(null);
                  setIsSearching(false);
                  setError("");
                }}
                placeholder="Search at least 2 characters"
                aria-label="Search users by name or email"
                required
              />
            </span>
          </label>
          {isSearching && <p role="status">Searching…</p>}
          {users.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
              {users.map((user) => {
                const userId = user.id || user._id;
                return (
                  <button
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-violet-50 ${
                      selectedUser?.id === userId ? "bg-violet-50" : ""
                    }`}
                    key={userId}
                    type="button"
                    onClick={() => setSelectedUser({ ...user, id: userId })}
                  >
                    <UserRound size={17} aria-hidden="true" />
                    <span>{user.name}</span>
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
            disabled={!selectedUser || isSubmitting}
          >
            <MessageCircle size={16} />
            {isSubmitting ? "Opening chat…" : "Open private chat"}
          </button>
        </form>
        <div className="modal-note">
          Messages are delivered between registered accounts.
        </div>
      </section>
    </div>
  );
}
