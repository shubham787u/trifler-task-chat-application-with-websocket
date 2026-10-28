import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth } from "../hooks/useAuth";
import { registerUser } from "../services/authService";
import "../styles/auth.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await registerUser({
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || ""),
      });

      if (result?.token || result?.accessToken) {
        login(result.token || result.accessToken, result.user);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", {
          replace: true,
          state: { notice: "Your account is ready. Sign in to continue." },
        });
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not create your account. Please try again.",
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
          <h1>Your next<br />favorite <span>conversation</span><br />starts here</h1>
          <p>Bring your people together in a space that feels a little more like you</p>
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
          <Link to="/login" className="auth-back-link"><ArrowLeft size={15} /> Back to sign in</Link>
          <div className="auth-form-heading">
            <div className="auth-mobile-brand"><span className="auth-brand-mark"><MessageCircle size={18} /></span> trifler<span>.</span></div>
            {/* <span className="auth-kicker">LET’S GET TO KNOW YOU</span> */}
            <h2>Create your account</h2>
          </div>
          <RegisterForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
          <p className="auth-form-footer">Already have an account? <Link to="/login">Sign in <ArrowRight size={13} /></Link></p>
        </div>
      </section>
    </main>
  );
}
