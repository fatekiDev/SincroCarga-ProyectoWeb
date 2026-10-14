import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authRequest } from "../auth/api";
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

const CLIENTE_FIELDS = [
  {
    name: "tipoClienteId",
    label: "Tipo de cliente",
    type: "select",
    defaultValue: "2",
    options: [
      { value: "2", label: "Persona natural" },
      { value: "1", label: "Empresa" },
    ],
  },
  { name: "nombre", label: "Nombre completo", type: "text", autoComplete: "name", showWhen: ["tipoClienteId", "2"] },
  { name: "razonSocial", label: "Razón social", type: "text", autoComplete: "organization", showWhen: ["tipoClienteId", "1"] },
  { name: "rut", label: "RUT", type: "text", autoComplete: "off", placeholder: "12.345.678-9" },
  { name: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
  { name: "direccion", label: "Dirección (opcional)", type: "text", required: false },
  { name: "comuna", label: "Comuna (opcional)", type: "text", required: false },
  { name: "password", label: "Contraseña (mínimo 12 caracteres)", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar contraseña", type: "password", autoComplete: "new-password" },
];

const PASSWORD_FIELDS = [
  { name: "password", label: "Contraseña (mínimo 12 caracteres)", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar contraseña", type: "password", autoComplete: "new-password" },
];

const DRIVER_FIELDS = [
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
  ...PASSWORD_FIELDS,
  { name: "empresaRut", label: "RUT de la empresa transportista", type: "text", placeholder: "76.111.222-3" },
  { name: "empresaRazonSocial", label: "Razón social de la empresa", type: "text" },
  { name: "rut", label: "RUT del conductor", type: "text", placeholder: "12.345.678-9" },
  { name: "nombre", label: "Nombre completo del conductor", type: "text", autoComplete: "name" },
  { name: "telefono", label: "Teléfono de contacto", type: "tel", autoComplete: "tel" },
  { name: "licencia", label: "Número de licencia de conducir", type: "text" },
  { name: "licenciaVencimiento", label: "Vencimiento de licencia", type: "date" },
  {
    name: "tipoVehiculo",
    label: "Tipo de vehículo",
    type: "select",
    options: ["Camión 3/4", "Camión simple", "Rampla", "Camioneta de carga", "Otro"],
  },
  { name: "patente", label: "Patente", type: "text", placeholder: "AB-CD-12" },
  { name: "marca", label: "Marca del vehículo", type: "text" },
  { name: "modelo", label: "Modelo del vehículo", type: "text" },
  { name: "anio", label: "Año del vehículo", type: "number", min: 1951, max: new Date().getFullYear() + 1 },
  { name: "capacidadCargaKg", label: "Capacidad de carga (kg)", type: "number", min: 0, step: "any" },
  { name: "capacidadCargaM3", label: "Capacidad de carga (m³)", type: "number", min: 0, step: "any" },
];

const ROLE_CONFIG = {
  camionero: {
    title: "Regístrate como Camionero / Transportista",
    subtitle: "Estos son tus datos básicos. La verificación de licencia y documentos se realiza más adelante.",
    fields: DRIVER_FIELDS,
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

function RoleForm({ role, onBack, onAuthenticated }) {
  const config = ROLE_CONFIG[role];
  const initialState = Object.fromEntries(
    config.fields.map((field) => [field.name, field.defaultValue || ""]),
  );
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fields = config.fields.filter(
    (field) => !field.showWhen || form[field.showWhen[0]] === field.showWhen[1],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    fields.forEach((field) => {
      if (field.required !== false && !form[field.name]?.toString().trim()) {
        next[field.name] = "Este campo es obligatorio.";
      }
    });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email?.trim() || "")) {
      next.email = "Ingresa un correo electrónico válido.";
    }
    if ((form.password || "").length < 12) {
      next.password = "La contraseña debe tener al menos 12 caracteres.";
    }
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

  const toRegistrationPayload = () => {
    if (role === "cliente") {
      return {
        role,
        email: form.email,
        password: form.password,
        profile: {
          tipoClienteId: Number(form.tipoClienteId),
          rut: form.rut,
          nombreRazonSocial: form.tipoClienteId === "1" ? form.razonSocial : form.nombre,
          telefono: form.telefono,
          direccion: form.direccion || null,
          comuna: form.comuna || null,
        },
      };
    }

    return {
      role,
      email: form.email,
      password: form.password,
      profile: {
        empresa: {
          rut: form.empresaRut,
          razonSocial: form.empresaRazonSocial,
        },
        conductor: {
          rut: form.rut,
          nombre: form.nombre,
          telefono: form.telefono,
          licencia: form.licencia,
          licenciaVencimiento: form.licenciaVencimiento,
        },
        camion: {
          tipo: form.tipoVehiculo,
          patente: form.patente,
          marca: form.marca,
          modelo: form.modelo,
          anio: Number(form.anio),
          capacidadKg: Number(form.capacidadCargaKg),
          capacidadM3: Number(form.capacidadCargaM3),
        },
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setRequestError("");
    setIsSubmitting(true);

    try {
      const user = await authRequest("register", {
        method: "POST",
        body: toRegistrationPayload(),
      });
      setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
      onAuthenticated(user);
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="reg-back" onClick={onBack}>
        <BackIcon /> Cambiar perfil
      </button>

      <h1 className="reg-title reg-title-form">{config.title}</h1>
      <p className="reg-subtitle">{config.subtitle}</p>

      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        {fields.map((field) => (
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
                {field.options.map((option) => {
                  const value = typeof option === "string" ? option : option.value;
                  const label = typeof option === "string" ? option : option.label;
                  return <option key={value} value={value}>{label}</option>;
                })}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                min={field.min}
                max={field.max}
                step={field.step}
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

        {requestError && <p className="reg-error" role="alert">{requestError}</p>}
        <button type="submit" className="reg-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </>
  );
}

export default function Register({ onAuthenticated }) {
  const [role, setRole] = useState(null); // null | "camionero" | "cliente"

  return (
    <div className="reg-page">
      <Link to="/" className="reg-brand" aria-label="Volver a SincroCarga">
        <img src={logo} alt="Logotipo de SincroCarga" className="reg-brand-logo" />
        <div className="reg-brand-text">
          <span className="reg-brand-name">SincroCarga</span>
          <span className="reg-brand-tag">MATCHING OPERATIVO</span>
        </div>
      </Link>

      <main className={`reg-card ${role ? "reg-card-form" : ""}`}>
        <p className="reg-demo-notice" role="note">
          Registro conectado a la base local de desarrollo. Usa datos de prueba;
          el servicio todavía no está preparado para producción.
        </p>
        {role ? (
          <RoleForm
            role={role}
            onBack={() => setRole(null)}
            onAuthenticated={onAuthenticated}
          />
        ) : (
          <RoleSelector onSelect={setRole} />
        )}
      </main>
    </div>
  );
}
