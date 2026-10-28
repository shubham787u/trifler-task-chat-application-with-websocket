import { MessageCircle, Plus, Search } from "lucide-react";
import GroupList from "../groups/GroupList";
import Avatar from "./Avatar";

const filters = [
  { label: "All messages", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Groups", value: "group" },
];

export default function Sidebar({
  firstName,
  isGroupsPage,
  isPrivateChatPage,
  conversations,
  activeId,
  filter,
  search,
  searchRef,
  onSearchChange,
  onFilterChange,
  onSelectConversation,
  onCreate,
}) {
  const groups = conversations.filter(
    (conversation) => conversation.category === "group",
  );

  return (
    <section className="conversation-panel" aria-label="Conversations">
      <div className="inbox-heading">
        <div>
          <div className="eyebrow">
            GOOD MORNING, {firstName.toUpperCase()} <span>✦</span>
          </div>
          <h1>
            {isGroupsPage
              ? "Your groups"
              : isPrivateChatPage
                ? "Private chats"
                : "Messages"}
          </h1>
        </div>
        <button
          className="icon-button compose-button"
          type="button"
          aria-label={
            isGroupsPage
              ? "Create a group"
              : isPrivateChatPage
                ? "Start a private chat"
                : "Start a new conversation"
          }
          title={
            isGroupsPage
              ? "Create a group"
              : isPrivateChatPage
                ? "Start a private chat"
                : "New conversation"
          }
          onClick={onCreate}
        >
          <Plus size={20} />
        </button>
      </div>

      <label className="search-field">
        <Search size={17} />
        <input
          ref={searchRef}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={
            isPrivateChatPage ? "Search private chats" : "Search conversations"
          }
          aria-label={
            isPrivateChatPage ? "Search private chats" : "Search conversations"
          }
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div
        className="filter-tabs"
        role="tablist"
        aria-label="Filter conversations"
      >
        {filters
          .filter((item) => !isPrivateChatPage || item.value !== "group")
          .map((item) => (
            <button
              key={item.value}
              className={
                filter === item.value ? "filter-tab is-selected" : "filter-tab"
              }
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => onFilterChange(item.value)}
            >
              {item.label}
              {item.value === "unread" && <span className="unread-tab-dot" />}
            </button>
          ))}
      </div>

      <div className="conversation-list">
        {isGroupsPage ? (
          <GroupList
            groups={groups}
            activeGroupId={activeId}
            onSelectGroup={onSelectConversation}
          />
        ) : conversations.length ? (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`conversation-item ${activeId === conversation.id ? "is-current" : ""}`}
              type="button"
              onClick={() => onSelectConversation(conversation)}
            >
              <Avatar conversation={conversation} />
              <span className="conversation-copy">
                <span className="conversation-title">
                  <strong>{conversation.name}</strong>
                  <time>{conversation.time}</time>
                </span>
                <span className="conversation-preview">
                  {conversation.preview}
                </span>
              </span>
              {conversation.unread > 0 && (
                <span className="unread-count">{conversation.unread}</span>
              )}
            </button>
          ))
        ) : (
          <div className="empty-list">
            {isPrivateChatPage ? (
              <MessageCircle size={20} />
            ) : (
              <Search size={20} />
            )}
            <strong>
              {isPrivateChatPage
                ? "No private chats found"
                : "No conversations found"}
            </strong>
            <span>
              {isPrivateChatPage
                ? "Start a one-to-one chat or try another search"
                : "Try another name or clear your filters"}
            </span>
            {isPrivateChatPage && (
              <button
                className="empty-list-action"
                type="button"
                onClick={onCreate}
              >
                Start a private chat
              </button>
            )}
          </div>
        )}
      </div>

      <div className="inbox-footer">
        <span>
          <span className="connection-dot" /> All caught up
        </span>
        <button type="button" onClick={() => onFilterChange("all")}>
          See all
        </button>
      </div>
    </section>
  );
}
