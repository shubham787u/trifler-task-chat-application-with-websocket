import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Groups from "../pages/Groups";
import NotFound from "../pages/NotFound";
import PrivateChat from "../pages/PrivateChat";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/common/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/private-chat" element={<PrivateChat />} />
              <Route path="/private-chat/:userId" element={<PrivateChat />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<Groups />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Default route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
