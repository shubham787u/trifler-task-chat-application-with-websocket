import { useContext } from "react";
import AuthContextValue from "../context/authContextValue";

export function useAuth() {
  const context = useContext(AuthContextValue);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
