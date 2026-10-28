import { ArrowRight } from "lucide-react";

export default function RegisterForm({ onSubmit, isSubmitting, error }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>Your name</span>
        <input
          name="name"
          type="text"
          placeholder="What should we call you?"
          autoComplete="name"
          required
        />
      </label>
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
        {!isSubmitting && <ArrowRight size={17} />}
      </button>
    </form>
  );
}