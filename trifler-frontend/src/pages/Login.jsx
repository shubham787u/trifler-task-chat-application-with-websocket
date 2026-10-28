import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";
import { loginUser } from "../services/authService";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginUser({
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || ""),
      });
      const token = result?.token || result?.accessToken;
      if (!token) {
        throw new Error("The sign-in service did not return an access token.");
      }

      login(token, result.user);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="auth-brand" to="/login">
          <span className="auth-brand-mark"><MessageCircle size={20} /></span>
          trifler<span>.</span>
        </Link>
        <div className="story-content">
          <h1>Good conversations<br />make <span>everything</span><br />better.</h1>
          <p>A quieter, more thoughtful place to catch up with your people and make room for what matters.</p>
          <div className="story-social-proof">
            <div className="story-avatar-stack"><span>MC</span><span>AR</span><span>NW</span><span>+</span></div>
            <span>Good people. Great conversations.</span>
          </div>
        </div>
        <div className="story-decoration story-decoration-one" />
        <div className="story-decoration story-decoration-two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <div className="auth-mobile-brand"><span className="auth-brand-mark"><MessageCircle size={18} /></span> trifler<span>.</span></div>
            {/* <span className="auth-kicker">YOUR PEOPLE ARE HERE</span> */}
            <h2>Welcome back</h2>
          </div>
          {location.state?.notice && <div className="auth-success"><Check size={16} />{location.state.notice}</div>}
          <LoginForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
          <div className="auth-form-footer">
            New to trifler? <Link to="/register">Create your account <ArrowRight size={13} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
