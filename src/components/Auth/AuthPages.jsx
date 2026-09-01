import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/Aha-Rasam-logo.png";
import { useAuth } from "../../context/AuthContext";
import "./Auth.scss";

const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const safeReturnTo = (value) => {
  if (!value?.startsWith("/")) return "/";
  const url = new URL(value, window.location.origin);
  return url.origin === window.location.origin
    ? `${url.pathname}${url.search}${url.hash}`
    : "/";
};

const requestMessage = (error, fallback) =>
  error.response
    ? fallback
    : "We couldn't connect to Aha Rasam. Please check your connection and try again.";

const AuthShell = ({ title, intro, children }) => (
  <main className="auth-page">
    <section className="auth-card" aria-labelledby="auth-title">
      <Link to="/" className="auth-logo" aria-label="Aha Rasam home">
        <img src={logo} alt="Aha Rasam" />
      </Link>
      <h1 id="auth-title">{title}</h1>
      <p className="auth-intro">{intro}</p>
      {children}
    </section>
  </main>
);

const Field = ({ id, label, error, ...props }) => (
  <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
    {error && (
      <span id={`${id}-error`} className="auth-field-error">
        {error}
      </span>
    )}
  </div>
);

const Message = ({ children, success = false }) =>
  children ? (
    <p className={`auth-message ${success ? "success" : ""}`} role={success ? "status" : "alert"}>
      {children}
    </p>
  ) : null;

const redirectLink = (path, redirect) =>
  redirect === "/" ? path : `${path}?redirect=${encodeURIComponent(redirect)}`;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeReturnTo(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailError = error === "Enter a valid email address.";
  const passwordError = error === "Enter your password.";

  const submit = async (event) => {
    event.preventDefault();
    if (!emailIsValid(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");

    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (requestError) {
      setError(requestMessage(requestError, "Email or password is incorrect."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome Back" intro="Sign in to continue to Aha Rasam.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="login-email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError ? error : ""} required />
        <Field id="login-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError ? error : ""} required />
        <Message>{emailError || passwordError ? "" : error}</Message>
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">Forgot Password?</Link>
        <span>New here? <Link to={redirectLink("/register", redirect)}>Create Account</Link></span>
      </div>
    </AuthShell>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeReturnTo(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailError = error === "Enter a valid email address.";
  const passwordError = error === "Enter a password.";
  const confirmationError = error === "Passwords do not match.";

  const submit = async (event) => {
    event.preventDefault();
    if (!emailIsValid(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter a password.");
    if (password !== confirmation) return setError("Passwords do not match.");

    setError("");
    setSubmitting(true);
    try {
      await register(email, password);
      navigate(redirect, { replace: true });
    } catch (requestError) {
      setError(requestMessage(requestError, "We couldn't create your account. Please check your details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create Account" intro="Create your Aha Rasam account with email and password.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="register-email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError ? error : ""} required />
        <Field id="register-password" label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError ? error : ""} required />
        <Field id="register-confirmation" label="Confirm Password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} error={confirmationError ? error : ""} required />
        <Message>{emailError || passwordError || confirmationError ? "" : error}</Message>
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <div className="auth-links">
        <span>Already have an account? <Link to={redirectLink("/login", redirect)}>Login</Link></span>
      </div>
    </AuthShell>
  );
};

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailError = error === "Enter a valid email address.";

  const submit = async (event) => {
    event.preventDefault();
    if (!emailIsValid(email)) return setError("Enter a valid email address.");

    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setMessage("If an account exists for this email, a password reset link has been sent.");
    } catch (requestError) {
      setError(requestMessage(requestError, "We couldn't send a reset link. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Forgot Password" intro="Enter your email and we'll send you a password reset link.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="forgot-email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError ? error : ""} required />
        <Message>{emailError ? "" : error}</Message>
        <Message success>{message}</Message>
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
      <div className="auth-links"><Link to="/login">Back to Login</Link></div>
    </AuthShell>
  );
};

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordError = error === "Enter a new password.";
  const confirmationError = error === "Passwords do not match.";

  const submit = async (event) => {
    event.preventDefault();
    if (!code) return setError("This password reset link is missing its reset code.");
    if (!password) return setError("Enter a new password.");
    if (password !== confirmation) return setError("Passwords do not match.");

    setError("");
    setSubmitting(true);
    try {
      await resetPassword(code, password, confirmation);
      setSuccess(true);
    } catch (requestError) {
      setError(requestMessage(requestError, "This reset link is invalid or has expired."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset Password" intro="Choose a new password for your Aha Rasam account.">
      {success ? (
        <div className="auth-success">
          <Message success>Your password has been reset.</Message>
          <Link className="auth-submit" to="/login">Continue to Login</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          {!code && <Message>This password reset link is missing its reset code.</Message>}
          <Field id="reset-password" label="New Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError ? error : ""} required disabled={!code || submitting} />
          <Field id="reset-confirmation" label="Confirm Password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} error={confirmationError ? error : ""} required disabled={!code || submitting} />
          <Message>{passwordError || confirmationError ? "" : error}</Message>
          <button className="auth-submit" type="submit" disabled={!code || submitting}>
            {submitting ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
      <div className="auth-links"><Link to="/login">Back to Login</Link></div>
    </AuthShell>
  );
};

export const AccountPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <AuthShell title="Your Account" intro={`Signed in as ${user.email}.`}>
      <p className="account-note">
        {location.pathname === "/account"
          ? "Your account is ready. Order, address, and profile tools will appear here when their backend models are available."
          : "This account section will be available when its backend data model is added."}
      </p>
      {location.pathname === "/account" && (
        <button className="auth-submit account-logout" type="button" onClick={handleLogout}>
          Logout
        </button>
      )}
    </AuthShell>
  );
};
