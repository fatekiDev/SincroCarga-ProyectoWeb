import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authRequest } from "../auth/api";
import logo from "../assets/logoprincipal.png";
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

export default function Login({ onAuthenticated }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Ingresa un correo electrónico válido.";
    }
    if (!form.password) next.password = "Ingresa tu contraseña.";
    setErrors(next);
    return Object.keys(next).length === 0;
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
      setRequestError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand" aria-label="Volver a SincroCarga">
        <img src={logo} alt="Logotipo de SincroCarga" className="auth-brand-logo" />
        <div className="auth-brand-text">
          <span className="auth-brand-name">SincroCarga</span>
          <span className="auth-brand-tag">MATCHING OPERATIVO</span>
        </div>
      </Link>

      <main className="auth-card">
        <h1 className="auth-title">Bienvenido de nuevo a SincroCarga</h1>
        <p className="auth-demo-notice" role="note">
          Ingresa con el correo y la contraseña de tu cuenta.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="auth-error">{errors.email}</p>}

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
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          {errors.password && <p className="auth-error">{errors.password}</p>}

          {requestError && <p className="auth-error" role="alert">{requestError}</p>}
          <button type="submit" className="auth-btn-primary">
            {isSubmitting ? "VERIFICANDO…" : "ENTRAR"}
            <ArrowIcon />
          </button>
        </form>

        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registro">Registrarse</Link>
        </p>

      </main>
    </div>
  );
}
