import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authRequest } from "../auth/api";
import { getHomePath } from "../auth/session";
import logo from "../assets/logoprincipal.svg";
import "./Login.css";

// Iconos simples en SVG (sin dependencias externas)
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4.5" y="10.5" width="15" height="9" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function Login({ onAuthenticated, session, isAdminLogin = false }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supportHref = `mailto:contacto@sincrocarga.cl?subject=${encodeURIComponent(
    "Ayuda para acceder a SincroCarga",
  )}&body=${encodeURIComponent(`Correo de mi cuenta: ${form.email.trim()}`)}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setRequestError("");
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Ingresa un correo electrónico válido.";
    }
    if (!form.password) next.password = "Ingresa tu contraseña.";
    setErrors(next);
    const firstInvalidField = Object.keys(next)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setRequestError("");
    setIsSubmitting(true);

    try {
      const user = await authRequest("login", {
        method: "POST",
        body: { email: form.email.trim(), password: form.password },
      });
      setForm((current) => ({ ...current, password: "" }));
      onAuthenticated(user);
    } catch (error) {
      setRequestError(
        error instanceof TypeError
          ? "No pudimos conectar con el servicio de acceso. Revisa tu conexión e inténtalo nuevamente."
          : error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to={getHomePath(session)} className="auth-brand" aria-label="SincroCarga, ir a mi inicio">
        <img src={logo} alt="Logotipo de SincroCarga" className="auth-brand-logo" />
        <div className="auth-brand-text">
          <span className="auth-brand-name">SincroCarga</span>
          <span className="auth-brand-tag">MATCHING OPERATIVO</span>
        </div>
      </Link>

      <main className="auth-card">
        <h1 className="auth-title">
          {isAdminLogin ? 'Acceso administrativo' : 'Bienvenido de nuevo a SincroCarga'}
        </h1>
        {isAdminLogin && <p className="auth-help">Ingresa con la cuenta de administración autorizada.</p>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <label className="auth-label" htmlFor="email">
            Correo Electrónico
          </label>
          <div className={`auth-input-wrap ${errors.email ? "has-error" : ""}`}>
            <span className="auth-input-icon">
              <MailIcon />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              value={form.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="auth-error" id="email-error">{errors.email}</p>}

          <label className="auth-label" htmlFor="password">
            Contraseña
          </label>
          <div className={`auth-input-wrap ${errors.password ? "has-error" : ""}`}>
            <span className="auth-input-icon">
              <LockIcon />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="auth-password-toggle"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {errors.password && <p className="auth-error" id="password-error">{errors.password}</p>}

          {requestError && <p className="auth-error" role="alert">{requestError}</p>}
          <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "VERIFICANDO…" : "ENTRAR"}
            <span aria-hidden="true"><ArrowIcon /></span>
          </button>
        </form>

        <p className="auth-help">
          ¿Problemas para acceder? <a href={supportHref}>Contacta a soporte</a> por correo.
        </p>
        <p className="auth-switch">
          {isAdminLogin
            ? <>¿No eres administrador? <Link to="/login">Volver al acceso general</Link></>
            : <>¿No tienes cuenta? <Link to="/registro">Registrarse</Link></>}
        </p>
        {!isAdminLogin && (
          <p className="auth-switch">
            <Link to="/admin/login">Acceso administrador</Link>
          </p>
        )}

      </main>
    </div>
  );
}
