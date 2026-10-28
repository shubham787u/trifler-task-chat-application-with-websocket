import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  createDirectConversation as createDirectConversationRequest,
  getConversationMessages,
  getConversations,
} from "../services/chatService";
import {
  addGroupMember as addGroupMemberRequest,
  createGroup as createGroupRequest,
} from "../services/groupService";
import { isBackendEnabled } from "../services/api";
import { subscribeToEvents } from "../services/websocketService";
import ChatContextValue from "./chatContextValue";

const conversationsStorageKey = "trifler_conversations";
const legacyConversationsStorageKey = "trifler_demo_conversations";

function readConversations() {
  localStorage.removeItem(legacyConversationsStorageKey);
  const savedConversations = localStorage.getItem(conversationsStorageKey);
  if (!savedConversations) return [];

  try {
    const conversations = JSON.parse(savedConversations);
    if (Array.isArray(conversations)) return conversations;
    throw new Error("Saved conversations are not a list.");
  } catch (error) {
    console.error("[Trifler local chat] Could not restore conversations.", error);
    localStorage.removeItem(conversationsStorageKey);
    return [];
  }
}

function getId(value) {
  if (typeof value === "string") return value;
  return value?.id || value?._id || value?.toString?.();
}

function formatMessageTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

function mapServerMessage(message, currentUserId) {
  const senderId = getId(message.sender);
  return {
    id: getId(message),
    text: message.text,
    time: formatMessageTime(message.createdAt),
    from: senderId === currentUserId ? "me" : "them",
    author: message.sender?.name || "",
  };
}

function mapServerConversation(conversation, currentUserId, messages = []) {
  const members = conversation.members || [];
  const otherMember = members.find(
    (member) => getId(member) !== currentUserId,
  );
  const isGroup = conversation.type === "group";
  const name = isGroup ? conversation.name : otherMember?.name || "Chat";
  const lastMessage = conversation.lastMessage;
  const lastActivity = lastMessage?.createdAt || conversation.updatedAt;
  const admins = (conversation.admins || []).map(getId);

  return {
    id: getId(conversation),
    name,
    initials: name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    color: isGroup ? "blue" : "lavender",
    category: isGroup ? "group" : "direct",
    online: false,
    members: `${members.length} members`,
    memberList: members
      .filter((member) => member.name)
      .map((member) => ({ id: getId(member), name: member.name })),
    isAdmin: admins.includes(currentUserId),
    preview: lastMessage?.text || "Start a conversation",
    time: lastActivity
      ? formatMessageTime(lastActivity)
      : "",
    unread: 0,
    messages,
  };
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [chatState, setChatState] = useState(() => ({
    userId: currentUserId,
    conversations: isBackendEnabled ? [] : readConversations(),
  }));
  const conversations = useMemo(
    () =>
      isBackendEnabled && chatState.userId !== currentUserId
        ? []
        : chatState.conversations,
    [chatState, currentUserId],
  );
  const setConversations = useCallback((update) => {
    setChatState((current) => {
      const currentConversations =
        isBackendEnabled && current.userId !== currentUserId
          ? []
          : current.conversations;
      return {
        userId: currentUserId,
        conversations:
          typeof update === "function"
            ? update(currentConversations)
            : update,
      };
    });
  }, [currentUserId]);
  const conversationsRef = useRef(conversations);
  const userIdRef = useRef(currentUserId);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (isBackendEnabled) {
      localStorage.removeItem(conversationsStorageKey);
      localStorage.removeItem(legacyConversationsStorageKey);
      return;
    }

    if (conversations.length > 0) {
      localStorage.setItem(conversationsStorageKey, JSON.stringify(conversations));
    } else {
      localStorage.removeItem(conversationsStorageKey);
    }
  }, [conversations]);

  const loadConversations = useCallback(async () => {
    if (!isBackendEnabled || !currentUserId) {
      return { userId: currentUserId, conversations: [] };
    }

    const serverConversations = await getConversations();
    const normalized = await Promise.all(
      serverConversations.map(async (conversation) => {
        const id = getId(conversation);
        const messages = await getConversationMessages(id);
        return mapServerConversation(
          conversation,
          currentUserId,
          messages.map((message) => mapServerMessage(message, currentUserId)),
        );
      }),
    );
    return { userId: currentUserId, conversations: normalized };
  }, [currentUserId]);

  useEffect(() => {
    let isCurrent = true;
    loadConversations()
      .then((result) => {
        if (isCurrent && userIdRef.current === result.userId) {
          setConversations(result.conversations);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          console.error("[Trifler chat] Could not load conversations from backend.", error);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [loadConversations, setConversations]);

  const markConversationRead = useCallback((conversationId) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId && conversation.unread
          ? { ...conversation, unread: 0 }
          : conversation,
      ),
    );
  }, [setConversations]);

  const clearConversations = useCallback(() => {
    setConversations([]);
    localStorage.removeItem(conversationsStorageKey);
    localStorage.removeItem(legacyConversationsStorageKey);
    console.info("[Trifler local chat] Local conversations cleared.");
  }, [setConversations]);

  // Map backend message events into the shape used by the chat UI.
  const receiveMessage = useCallback((conversationId, incomingEvent) => {
    const payload = incomingEvent?.message || incomingEvent;
    if (!conversationId || typeof payload?.text !== "string" || !payload.text.trim()) {
      console.error("[Trifler chat] Ignored an invalid incoming message.", incomingEvent);
      return;
    }

    const message = {
      id:
        incomingEvent?.clientId && getId(payload.sender) === currentUserId
          ? incomingEvent.clientId
          : getId(payload) || `${Date.now()}-${Math.random()}`,
      text: payload.text,
      time: formatMessageTime(payload.createdAt) || formatMessageTime(new Date()),
      from: getId(payload.sender) === currentUserId ? "me" : "them",
      author: payload.sender?.name || "",
    };

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const optimisticIndex = incomingEvent?.clientId
          ? conversation.messages.findIndex(
              (item) => item.id === incomingEvent.clientId,
            )
          : -1;
        if (
          optimisticIndex < 0 &&
          conversation.messages.some((item) => item.id === message.id)
        ) {
          return conversation;
        }
        const messages = [...conversation.messages];
        if (optimisticIndex >= 0) messages.splice(optimisticIndex, 1);
        return {
          ...conversation,
          messages: [...messages, message],
          preview: message.text,
          time: message.time,
        };
      }),
    );
  }, [currentUserId, setConversations]);

  useEffect(() => subscribeToEvents((event) => {
    const refresh = () => {
      loadConversations()
        .then((result) => {
          if (userIdRef.current === result.userId) {
            setConversations(result.conversations);
          }
        })
        .catch((error) => {
          console.error("[Trifler chat] Could not refresh conversations.", error);
        });
    };

    if (event?.type === "conversation.created") {
      refresh();
      return;
    }

    if (event?.type !== "message.new" || !event.message) return;
    const conversationId = getId(event.message.conversation);
    if (conversationsRef.current.some((item) => item.id === conversationId)) {
      receiveMessage(conversationId, event);
    } else {
      refresh();
    }
  }), [loadConversations, receiveMessage, setConversations]);

  const sendMessage = useCallback((conversation, text) => {
    const messageText = text.trim();
    if (!conversation || !messageText) return null;

    const message = {
      id: `${Date.now()}-${Math.random()}`,
      text: messageText,
      time: formatMessageTime(new Date()),
      from: "me",
    };

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              messages: [...item.messages, message],
              preview: messageText,
              time: message.time,
            }
          : item,
      ),
    );
    return message;
  }, [setConversations]);

  const removeMessage = useCallback((conversationId, messageId) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.filter(
                (message) => message.id !== messageId,
              ),
            }
          : conversation,
      ),
    );
  }, [setConversations]);

  const createGroup = useCallback(async ({ name, memberIds }) => {
    const groupName = name.trim();
    if (!groupName || !memberIds?.length) {
      throw new Error("Enter a group name and select at least one member.");
    }

    const serverGroup = await createGroupRequest({
      name: groupName,
      memberIds,
    });
    const group = mapServerConversation(serverGroup, currentUserId);
    setConversations((current) => [group, ...current]);
    return group;
  }, [currentUserId, setConversations]);

  const addGroupMember = useCallback(async (groupId, userId) => {
    const serverGroup = await addGroupMemberRequest(groupId, userId);
    const group = mapServerConversation(serverGroup, currentUserId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === group.id ? { ...conversation, ...group } : conversation,
      ),
    );
    return group;
  }, [currentUserId, setConversations]);

  const createDirectConversation = useCallback(async (contact) => {
    const contactId = getId(contact);
    if (!contactId) throw new Error("Select a registered user to start a chat.");

    const serverConversation =
      await createDirectConversationRequest(contactId);
    const conversation = mapServerConversation(
      serverConversation,
      currentUserId,
    );
    setConversations((current) => {
      const existing = current.find((item) => item.id === conversation.id);
      return existing
        ? current.map((item) =>
            item.id === conversation.id ? { ...item, ...conversation } : item,
          )
        : [conversation, ...current];
    });
    return conversation;
  }, [currentUserId, setConversations]);

  return (
    <ChatContextValue.Provider
      value={{
        conversations,
        clearConversations,
        markConversationRead,
        receiveMessage,
        sendMessage,
        removeMessage,
        createGroup,
        addGroupMember,
        createDirectConversation,
      }}
    >
      {children}
    </ChatContextValue.Provider>
  );
}