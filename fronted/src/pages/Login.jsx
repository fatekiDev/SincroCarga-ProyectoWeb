import React, { useState } from "react";
import { Link } from "react-router-dom";
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

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.75l3.99-3.11Z" />
    <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.63l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2">
    <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.68H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);

export default function Login({ onSubmit }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [role, setRole] = useState("cliente");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Ingresa tu correo electrónico.";
    if (!form.password) next.password = "Ingresa tu contraseña.";
    if (!role) next.role = "Selecciona el tipo de cuenta.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (onSubmit) onSubmit({ ...form, role });
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand" aria-label="Volver a SincroCarga">
        <img src={logo} alt="Sincro Chiloé" className="auth-brand-logo" />
        <div className="auth-brand-text">
          <span className="auth-brand-name">Sincro Chiloé</span>
          <span className="auth-brand-tag">MATCHING OPERATIVO</span>
        </div>
      </Link>

      <main className="auth-card">
        <h1 className="auth-title">Bienvenido de nuevo a Sincro Chiloé</h1>

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

          <label className="auth-label" htmlFor="role">
            Tipo de cuenta
          </label>
          <select
            id="role"
            name="role"
            className={`auth-select ${errors.role ? "has-error" : ""}`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="cliente">Cliente / Generador de carga</option>
            <option value="camionero">Camionero / Transportista</option>
          </select>
          {errors.role && <p className="auth-error">{errors.role}</p>}

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

          <div className="auth-forgot">
            <Link to="/login">¿Contraseña olvidada?</Link>
          </div>

          <button type="submit" className="auth-btn-primary">
            ENTRAR
            <ArrowIcon />
          </button>
        </form>

        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registro">Registrarse</Link>
        </p>

        <div className="auth-divider">
          <span>O accede con:</span>
        </div>

        <div className="auth-social">
          <button type="button" className="auth-social-btn" aria-label="Continuar con Google">
            <GoogleIcon />
          </button>
          <button type="button" className="auth-social-btn" aria-label="Continuar con LinkedIn">
            <LinkedInIcon />
          </button>
        </div>
      </main>
    </div>
  );
}
