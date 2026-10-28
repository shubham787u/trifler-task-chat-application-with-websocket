import { ArrowRight } from "lucide-react";

export default function LoginForm({ onSubmit, isSubmitting, error }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>Email address</span>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
        {!isSubmitting && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
