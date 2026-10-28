import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AddMemberModel from "../components/groups/AddMemberModel";
import CreateGroupModel from "../components/groups/CreateGroupModel";
import GroupInfoPanel from "../components/groups/GroupInfoPanel";
import ChatWindow from "../components/chat/ChatWindow";
import StartDirectChatModal from "../components/chat/StartDirectChatModal";
import Avatar from "../components/common/Avatar";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { useAuth } from "../hooks/useAuth";
import useChat from "../hooks/useChat";
import useWebSocket from "../hooks/useWebSocket";
import "../styles/dashboard.css";


export default function Dashboard({ mode = "workspace" }) {
  const { user, logout } = useAuth();
  const displayName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim()
      : "Your profile";
  const {
    conversations,
    markConversationRead,
    receiveMessage,
    sendMessage: createMessage,
    removeMessage,
    createGroup: createLocalGroup,
    addGroupMember,
    createDirectConversation,
  } = useChat();
  const { publishMessage, subscribe } = useWebSocket();
  const { userId, groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [startDirectChatOpen, setStartDirectChatOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef(null);
  const searchRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const isGroupsPage = mode === "groups" || location.pathname.startsWith("/groups");
  const activeId = groupId || userId || (isGroupsPage ? "design-team" : "maya");

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id === activeId &&
        conversation.category === (isGroupsPage ? "group" : "direct"),
    ) ||
    conversations.find(
      (conversation) =>
        conversation.category === (isGroupsPage ? "group" : "direct"),
    ) ||
    null;
  const activeConversationId = activeConversation?.id;

  const visibleConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesSection =
        filter === "all" ||
        (filter === "unread" && conversation.unread > 0) ||
        (filter === "group" && conversation.category === "group");
      const matchesPage = isGroupsPage
        ? conversation.category === "group"
        : true;
      const matchesSearch =
        !normalizedSearch ||
        conversation.name.toLowerCase().includes(normalizedSearch) ||
        conversation.preview.toLowerCase().includes(normalizedSearch);
      return matchesSection && matchesPage && matchesSearch;
    });
  }, [conversations, filter, isGroupsPage, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    return subscribe(activeConversationId, (message) => {
      receiveMessage(activeConversationId, message);
    });
  }, [activeConversationId, receiveMessage, subscribe]);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), []);

  function showNotice(message) {
    setNotice(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 3200);
  }

 //! Private Conversation here one to one 
  function openConversation(conversation) {
    setMobileChatOpen(true);
    markConversationRead(conversation.id);
    navigate(
      conversation.category === "group"
        ? `/groups/${conversation.id}`
        : `/private-chat/${conversation.id}`,
    );
  }

  function sendMessage(text) {
    if (!activeConversation) return;
    const message = createMessage(activeConversation, text);
    if (message && !publishMessage(activeConversation.id, message)) {
      removeMessage(activeConversation.id, message.id);
      showNotice("Message not sent. Reconnect and try again.");
    }
  }

  function startConversation(conversation) {
    setNewChatOpen(false);
    setSearch("");
    setFilter("all");
    openConversation(conversation);
  }

  async function startDirectConversation(contact) {
    const conversation = await createDirectConversation(contact);
    if (!conversation) return;
    setStartDirectChatOpen(false);
    setNewChatOpen(false);
    setSearch("");
    setFilter("all");
    setMobileChatOpen(true);
    navigate(`/private-chat/${conversation.id}`);
  }

  async function createGroup(groupData) {
    const group = await createLocalGroup(groupData);
    if (!group) return;
    setCreateGroupOpen(false);
    setFilter("all");
    setSearch("");
    setMobileChatOpen(true);
    navigate(`/groups/${group.id}`);
  }

  function handleLogout() {
    console.info("[Trifler demo] User signed out", {
      name: user?.name || "",
      email: user?.email || "",
    });
    logout();
  }

  const firstName = displayName.split(/\s+/)[0];
  const profileInitials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const activeGroupMembers = activeConversation?.memberList || [displayName];
  const hasGroupInfo = activeConversation?.category === "group";
  return (
    <main className="workspace">
      <div className={`workspace-shell ${mobileChatOpen && activeConversation ? "is-chat-open" : ""} ${hasGroupInfo ? "has-group-info" : ""}`}>
        <Navbar
          displayName={displayName}
          profileInitials={profileInitials}
          isGroupsPage={isGroupsPage}
          privateChatCount={conversations.filter(
            (conversation) => conversation.category === "direct",
          ).length}
          messageCount={conversations.length}
          groupCount={
            conversations.filter(
              (conversation) => conversation.category === "group",
            ).length
          }
          onLogout={handleLogout}
          onShowUnread={() => {
            setFilter("unread");
            setMobileChatOpen(false);
            navigate("/dashboard");
          }}
        />

        <Sidebar
          firstName={firstName}
          isGroupsPage={isGroupsPage}
          conversations={visibleConversations}
          activeId={activeConversation?.id}
          filter={filter}
          search={search}
          searchRef={searchRef}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSelectConversation={openConversation}
          onCreate={() =>
            isGroupsPage ? setCreateGroupOpen(true) : setNewChatOpen(true)
          }
        />

        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messagesEndRef={messagesEndRef}
            onBack={() => setMobileChatOpen(false)}
            onAction={showNotice}
            onSendMessage={sendMessage}
            onViewMembers={() => setMembersOpen(true)}
          />
        ) : (
          <section className="chat-panel" aria-label="No conversation selected">
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-2xl text-violet-700">
                ✦
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Your workspace is clear
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                There are no conversations or messages yet. Create a group or start a private chat.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  className="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
                  type="button"
                  onClick={() => setCreateGroupOpen(true)}
                >
                  Create a group
                </button>
                <button
                  className="rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                  type="button"
                  onClick={() => setStartDirectChatOpen(true)}
                >
                  Start a private chat
                </button>
              </div>
            </div>
          </section>
        )}

        {hasGroupInfo && (
          <GroupInfoPanel
            group={activeConversation}
            members={activeGroupMembers}
            onViewMembers={() => setMembersOpen(true)}
          />
        )}
      </div>

      {notice && (
        <div className="action-notice" role="status">
          {notice}
        </div>
      )}

      {newChatOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setNewChatOpen(false);
          }}
        >
          <section
            className="new-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-chat-title"
          >
            <div className="modal-heading">
              <div>
                <span className="modal-kicker">MAKE A CONNECTION</span>
                <h2 id="new-chat-title">Start a conversation</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setNewChatOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <p>Pick someone from your workspace to say hello.</p>
            <button
              className="start-private-chat-action"
              type="button"
              onClick={() => {
                setNewChatOpen(false);
                setStartDirectChatOpen(true);
              }}
            >
              Start a one-to-one chat
            </button>
            <div className="new-chat-list">
              {conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => startConversation(conversation)}
                >
                  <Avatar conversation={conversation} />
                  <span>
                    <strong>{conversation.name}</strong>
                    <small>
                      {conversation.category === "group"
                        ? `${conversation.members} · Group`
                        : "Direct message"}
                    </small>
                  </span>
                  <ChevronDown size={16} className="new-chat-arrow" />
                </button>
              ))}
            </div>
            <div className="modal-note">
              <Check size={14} /> Conversations stay in this browser and are
              never sent.
            </div>
          </section>
        </div>
      )}
      <CreateGroupModel
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreate={createGroup}
      />
      <StartDirectChatModal
        isOpen={startDirectChatOpen}
        onClose={() => setStartDirectChatOpen(false)}
        onStart={startDirectConversation}
      />
      <AddMemberModel
        isOpen={membersOpen}
        group={
          activeConversation?.category === "group" ? activeConversation : null
        }
        members={activeGroupMembers}
        onAddMember={addGroupMember}
        onClose={() => setMembersOpen(false)}
      />
    </main>
  );
}
