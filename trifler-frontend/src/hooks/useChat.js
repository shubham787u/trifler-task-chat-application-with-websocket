import { useContext } from "react";
import ChatContextValue from "../context/chatContextValue";

export default function useChat() {
  const context = useContext(ChatContextValue);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;
}