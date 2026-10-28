import api from "./api";

export async function getConversations() {
  const response = await api.get("/conversations");
  return response.data.conversations;
}

export async function createDirectConversation(userId) {
  const response = await api.post("/conversations/direct", { userId });
  return response.data.conversation;
}

export async function getConversationMessages(conversationId) {
  const response = await api.get(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { params: { limit: 100 } },
  );
  return response.data.messages;
}
