import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logoprincipal.png";
import "./Register.css";

const TruckIcon = () => (
  <svg viewBox="0 0 48 48" width="30" height="30" fill="none" stroke="#2b6cb0" strokeWidth="2">
    <rect x="3" y="14" width="24" height="16" rx="2" />
    <path d="M27 20h9l6 6v4h-15z" />
    <circle cx="13" cy="34" r="3.2" fill="#2b6cb0" stroke="none" />
    <circle cx="34" cy="34" r="3.2" fill="#2b6cb0" stroke="none" />
  </svg>
);

const PersonIcon = () => (
  <svg viewBox="0 0 48 48" width="30" height="30" fill="none" stroke="#2b6cb0" strokeWidth="2">
    <circle cx="24" cy="15" r="7" />
    <path d="M10 38c1.5-8 7-12 14-12s12.5 4 14 12" />
    <rect x="30" y="24" width="9" height="9" rx="1.5" fill="#2b6cb0" stroke="none" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

// Campos comunes a ambos perfiles
const BASE_FIELDS = [
  { name: "nombre", label: "Nombre completo", type: "text", autoComplete: "name" },
  { name: "rut", label: "RUT", type: "text", autoComplete: "off", placeholder: "12.345.678-9" },
  { name: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
  { name: "password", label: "Contraseña", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar contraseña", type: "password", autoComplete: "new-password" },
];

// Datos propios del Camionero: solo información básica del vehículo,
// la verificación de documentos/licencia se hace después en otra pantalla.
const CAMIONERO_FIELDS = [
  ...BASE_FIELDS,
  {
    name: "tipoVehiculo",
    label: "Tipo de vehículo",
    type: "select",
    options: ["Camión 3/4", "Camión simple", "Rampla", "Camioneta de carga", "Otro"],
  },
  { name: "patente", label: "Patente", type: "text", autoComplete: "off", placeholder: "AB-CD-12" },
  { name: "capacidadCarga", label: "Capacidad de carga aprox. (kg)", type: "number" },
];

// Datos propios del Cliente / Generador de carga
const CLIENTE_FIELDS = [
  ...BASE_FIELDS,
  { name: "empresa", label: "Empresa (opcional)", type: "text", autoComplete: "organization" },
  {
    name: "tipoCarga",
    label: "Tipo de carga habitual",
    type: "select",
    options: ["Alimentos", "Materiales de construcción", "Insumos agrícolas", "Carga general", "Otro"],
  },
];

const ROLE_CONFIG = {
  camionero: {
    title: "Regístrate como Camionero / Transportista",
    subtitle: "Estos son tus datos básicos. La verificación de licencia y documentos se realiza más adelante.",
    fields: CAMIONERO_FIELDS,
  },
  cliente: {
    title: "Regístrate como Cliente / Generador de Carga",
    subtitle: "Completa tus datos para empezar a solicitar transporte de carga.",
    fields: CLIENTE_FIELDS,
  },
};

function RoleSelector({ onSelect }) {
  return (
    <>
      <h1 className="reg-title">Crea tu Cuenta: ¿Qué quieres ser?</h1>

      <div className="reg-role-grid">
        <div className="reg-role-card">
          <div className="reg-role-icon">
            <TruckIcon />
          </div>
          <h2 className="reg-role-name">Camionero / Transportista</h2>
          <p className="reg-role-desc">
            Ofrece tu vehículo y capacidad de carga para transportar mercadería por Chiloé.
          </p>
          <button type="button" className="reg-role-btn" onClick={() => onSelect("camionero")}>
            Soy Camionero
          </button>
        </div>

        <div className="reg-role-card">
          <div className="reg-role-icon">
            <PersonIcon />
          </div>
          <h2 className="reg-role-name">Cliente / Generador de Carga</h2>
          <p className="reg-role-desc">
            Publica tu carga y encuentra al transportista adecuado para moverla.
          </p>
          <button type="button" className="reg-role-btn" onClick={() => onSelect("cliente")}>
            Soy Cliente
          </button>
        </div>
      </div>

      <p className="reg-switch">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link>
      </p>
    </>
  );
}

function RoleForm({ role, onBack, onSubmit }) {
  const config = ROLE_CONFIG[role];
  const initialState = Object.fromEntries(config.fields.map((f) => [f.name, ""]));
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    config.fields.forEach((f) => {
      if (!form[f.name] || !form[f.name].toString().trim()) {
        next[f.name] = "Este campo es obligatorio.";
      }
    });
    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      next.confirmPassword = "Las contraseñas no coinciden.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (onSubmit) onSubmit({ role, ...form });
  };

  return (
    <>
      <button type="button" className="reg-back" onClick={onBack}>
        <BackIcon /> Cambiar perfil
      </button>

      <h1 className="reg-title reg-title-form">{config.title}</h1>
      <p className="reg-subtitle">{config.subtitle}</p>

      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        {config.fields.map((field) => (
          <div className="reg-field" key={field.name}>
            <label className="reg-label" htmlFor={field.name}>
              {field.label}
            </label>

            {field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                className={`reg-select ${errors[field.name] ? "has-error" : ""}`}
                value={form[field.name]}
                onChange={handleChange}
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder || ""}
                autoComplete={field.autoComplete || "off"}
                className={`reg-input ${errors[field.name] ? "has-error" : ""}`}
                value={form[field.name]}
                onChange={handleChange}
              />
            )}

            {errors[field.name] && <p className="reg-error">{errors[field.name]}</p>}
          </div>
        ))}

        <button type="submit" className="reg-submit-btn">
          Crear cuenta
        </button>
      </form>
    </>
  );
}

export default function Register({ onSubmit }) {
  const [role, setRole] = useState(null); // null | "camionero" | "cliente"

  return (
    <div className="reg-page">
      <Link to="/" className="reg-brand" aria-label="Volver a SincroCarga">
        <img src={logo} alt="Sincro Chiloé" className="reg-brand-logo" />
        <div className="reg-brand-text">
          <span className="reg-brand-name">Sincro Chiloé</span>
          <span className="reg-brand-tag">MATCHING OPERATIVO</span>
        </div>
      </Link>

      <main className={`reg-card ${role ? "reg-card-form" : ""}`}>
        {role ? (
          <RoleForm role={role} onBack={() => setRole(null)} onSubmit={onSubmit} />
        ) : (
          <RoleSelector onSelect={setRole} />
        )}
      </main>
    </div>
  );
}
