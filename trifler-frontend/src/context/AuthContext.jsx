import { useEffect, useState } from "react";
import AuthContextValue from "./authContextValue";
import {
  deleteCurrentUser,
  getCurrentUser,
  updateUserProfile,
} from "../services/userService";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("chatconnect_token"),
  );
  const [isLoading, setIsLoading] = useState(
    () => Boolean(localStorage.getItem("chatconnect_token")),
  );
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("chatconnect_user");
    if (!storedUser) return null;
    try {
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || typeof parsedUser !== "object" || Array.isArray(parsedUser)) {
        throw new Error("Saved chat profile is not a user object.");
      }
      return parsedUser;
    } catch (error) {
      console.error("Could not restore the saved chat profile.", error);
      localStorage.removeItem("chatconnect_user");
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("chatconnect_token", token);
    } else {
      localStorage.removeItem("chatconnect_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("chatconnect_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("chatconnect_user");
    }
  }, [user]);

  useEffect(() => {
    if (!token) return undefined;

    let isCurrent = true;
    getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) setUser(currentUser);
      })
      .catch((error) => {
        console.error("[Trifler auth] Could not verify the saved session.", error);
        if (isCurrent) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  function login(tokenValue, userValue = null) {
    setToken(tokenValue);
    setUser(userValue);
    setIsLoading(false);
  }

  async function updateProfile(profileValue) {
    const name = profileValue?.name?.trim();
    const email = profileValue?.email?.trim();
    if (!name || !email) {
      throw new Error("A display name and email address are required.");
    }

    const responseProfile = await updateUserProfile({ name, email });
    const updatedUser = {
      ...user,
      ...(responseProfile && typeof responseProfile === "object" ? responseProfile : {}),
      name,
      email,
    };
    setUser(updatedUser);
  }

  async function deleteAccount() {
    await deleteCurrentUser();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }

  return (
    <AuthContextValue.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        updateProfile,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContextValue.Provider>
  );
}
