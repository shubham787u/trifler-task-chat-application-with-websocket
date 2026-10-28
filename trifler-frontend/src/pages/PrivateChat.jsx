import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ChatWindow from "../components/chat/ChatWindow";
import StartDirectChatModal from "../components/chat/StartDirectChatModal";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { useAuth } from "../hooks/useAuth";
import useChat from "../hooks/useChat";
import useWebSocket from "../hooks/useWebSocket";
import "../styles/dashboard.css";

export default function PrivateChat() {
  const { user, logout } = useAuth();
  const {
    conversations,
    createDirectConversation,
    markConversationRead,
    receiveMessage,
    sendMessage: createMessage,
    removeMessage,
  } = useChat();
  const { publishMessage, subscribe } = useWebSocket();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(userId));
  const [startChatOpen, setStartChatOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef(null);
  const searchRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const directConversations = useMemo(
    () => conversations.filter((conversation) => conversation.category === "direct"),
    [conversations],
  );
  const activeConversation =
    directConversations.find((conversation) => conversation.id === userId) ||
    (!userId ? directConversations[0] || null : null);
  const activeConversationId = activeConversation?.id;
  const activeMessages = activeConversation?.messages;

  const visibleConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return directConversations.filter((conversation) => {
      const matchesFilter =
        filter === "all" || (filter === "unread" && conversation.unread > 0);
      const matchesSearch =
        !normalizedSearch ||
        conversation.name.toLowerCase().includes(normalizedSearch) ||
        conversation.preview.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [directConversations, filter, search]);

  const displayName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim()
      : "Your profile";
  const profileInitials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    if (!activeConversationId) return;
    markConversationRead(activeConversationId);
  }, [activeConversationId, markConversationRead]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    return subscribe(activeConversationId, (message) => {
      receiveMessage(activeConversationId, message);
    });
  }, [activeConversationId, receiveMessage, subscribe]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeMessages]);

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), []);

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 3200);
  }, []);

  function openConversation(conversation) {
    setMobileChatOpen(true);
    markConversationRead(conversation.id);
    navigate(`/private-chat/${conversation.id}`);
  }

  async function startConversation(contact) {
    const conversation = await createDirectConversation(contact);
    if (!conversation) return;
    setStartChatOpen(false);
    setSearch("");
    setFilter("all");
    openConversation(conversation);
  }

  function sendMessage(text) {
    if (!activeConversation) return;
    const message = createMessage(activeConversation, text);
    if (message && !publishMessage(activeConversation.id, message)) {
      removeMessage(activeConversation.id, message.id);
      showNotice("Message not sent. Reconnect and try again.");
    }
  }

  function handleLogout() {
    console.info("[Trifler demo] User signed out", {
      name: user?.name || "",
      email: user?.email || "",
    });
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="workspace">
      <div className={`workspace-shell ${mobileChatOpen && activeConversation ? "is-chat-open" : ""}`}>
        <Navbar
          displayName={displayName}
          profileInitials={profileInitials}
          isGroupsPage={false}
          isPrivateChatPage
          privateChatCount={directConversations.length}
          messageCount={directConversations.length}
          groupCount={conversations.filter(
            (conversation) => conversation.category === "group",
          ).length}
          onLogout={handleLogout}
          onShowUnread={() => {
            setFilter("unread");
            setMobileChatOpen(false);
          }}
        />

        <Sidebar
          firstName={displayName.split(/\s+/)[0]}
          isGroupsPage={false}
          isPrivateChatPage
          conversations={visibleConversations}
          activeId={activeConversation?.id}
          filter={filter}
          search={search}
          searchRef={searchRef}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSelectConversation={openConversation}
          onCreate={() => setStartChatOpen(true)}
        />

        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messagesEndRef={messagesEndRef}
            onBack={() => setMobileChatOpen(false)}
            onAction={showNotice}
            onSendMessage={sendMessage}
          />
        ) : (
          <section className="chat-panel" aria-label="Private chat not selected">
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                {userId ? <UserRound size={25} /> : <MessageCircle size={25} />}
              </span>
              <h1 className="text-lg font-semibold text-slate-800">
                {userId ? "Private chat not found" : "Start a one-to-one chat"}
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {userId
                  ? "This conversation is not in your local chat list. Start a new chat or choose one from the list."
                  : "Choose a conversation from your list, or start a new one to chat privately."}
              </p>
              <button
                className="mt-5 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
                type="button"
                onClick={() => setStartChatOpen(true)}
              >
                Start a private chat
              </button>
            </div>
          </section>
        )}
      </div>

      {notice && (
        <div className="action-notice" role="status">
          {notice}
        </div>
      )}

      <StartDirectChatModal
        isOpen={startChatOpen}
        onClose={() => setStartChatOpen(false)}
        onStart={startConversation}
      />
    </main>
  );
}
