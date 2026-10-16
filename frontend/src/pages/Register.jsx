import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authRequest } from "../auth/api";
import { getHomePath } from "../auth/session";
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
  { name: "nombre", label: "Nombre completo", type: "text", autoComplete: "name", maxLength: 150, placeholder: "Ej.: María González", showWhen: ["tipoClienteId", "2"] },
  { name: "razonSocial", label: "Razón social", type: "text", autoComplete: "organization", maxLength: 150, placeholder: "Ej.: Transportes del Sur Ltda.", showWhen: ["tipoClienteId", "1"] },
  { name: "rut", label: "RUT", type: "text", autoComplete: "off", maxLength: 12, placeholder: "12.345.678-9" },
  { name: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel", maxLength: 20, placeholder: "+56 9 1234 5678" },
  { name: "direccion", label: "Dirección (opcional)", type: "text", required: false, maxLength: 200, placeholder: "Calle y número" },
  { name: "comuna", label: "Comuna (opcional)", type: "text", required: false, maxLength: 100, placeholder: "Ej.: Castro" },
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email", maxLength: 150, placeholder: "nombre@correo.cl" },
  { name: "password", label: "Contraseña (mínimo 12 caracteres)", type: "password", autoComplete: "new-password", placeholder: "Crea una contraseña segura" },
  { name: "confirmPassword", label: "Confirmar contraseña", type: "password", autoComplete: "new-password", placeholder: "Escribe la misma contraseña" },
];

const PASSWORD_FIELDS = [
  { name: "password", label: "Contraseña (mínimo 12 caracteres)", type: "password", autoComplete: "new-password", placeholder: "Crea una contraseña segura" },
  { name: "confirmPassword", label: "Confirmar contraseña", type: "password", autoComplete: "new-password", placeholder: "Escribe la misma contraseña" },
];

const DRIVER_FIELDS = [
  { name: "email", label: "Correo electrónico", type: "email", autoComplete: "email", maxLength: 150, placeholder: "nombre@correo.cl" },
  ...PASSWORD_FIELDS,
  { name: "empresaRut", label: "RUT de la empresa transportista", type: "text", maxLength: 12, placeholder: "76.111.222-3" },
  { name: "empresaRazonSocial", label: "Razón social de la empresa", type: "text", maxLength: 150, placeholder: "Ej.: Transportes del Sur Ltda." },
  { name: "rut", label: "RUT del conductor", type: "text", maxLength: 12, placeholder: "12.345.678-9" },
  { name: "nombre", label: "Nombre completo del conductor", type: "text", autoComplete: "name", maxLength: 150, placeholder: "Ej.: María González" },
  { name: "telefono", label: "Teléfono de contacto", type: "tel", autoComplete: "tel", maxLength: 20, placeholder: "+56 9 1234 5678" },
  { name: "licencia", label: "Número de licencia de conducir", type: "text", maxLength: 30, placeholder: "Número indicado en tu licencia" },
  { name: "licenciaVencimiento", label: "Vencimiento de licencia", type: "date" },
  {
    name: "tipoVehiculo",
    label: "Tipo de vehículo",
    type: "select",
    options: ["Camión 3/4", "Camión simple", "Rampla", "Camioneta de carga", "Otro"],
    maxLength: 50,
  },
  { name: "patente", label: "Patente", type: "text", maxLength: 10, placeholder: "ABCD-12 o AB-1234" },
  { name: "marca", label: "Marca del vehículo", type: "text", maxLength: 50, placeholder: "Ej.: Mercedes-Benz" },
  { name: "modelo", label: "Modelo del vehículo", type: "text", maxLength: 50, placeholder: "Ej.: Atego" },
  { name: "anio", label: "Año del vehículo", type: "number", min: 1951, max: new Date().getFullYear() + 1, integer: true, placeholder: String(new Date().getFullYear()) },
  { name: "capacidadCargaKg", label: "Capacidad de carga (kg)", type: "number", min: 0, step: "any", positive: true, placeholder: "Ej.: 5000" },
  { name: "capacidadCargaM3", label: "Capacidad de carga (m³)", type: "number", min: 0, step: "any", positive: true, placeholder: "Ej.: 20" },
];

function getFieldSection(role, fieldName) {
  if (["email", "password", "confirmPassword"].includes(fieldName)) return "Datos de acceso";
  if (role === "cliente") return "Datos del cliente";
  if (["empresaRut", "empresaRazonSocial"].includes(fieldName)) return "Empresa transportista";
  if (["rut", "nombre", "telefono", "licencia", "licenciaVencimiento"].includes(fieldName)) {
    return "Datos del conductor";
  }
  return "Datos del vehículo";
}

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
      <h1 className="reg-title">Crea tu cuenta: elige tu perfil</h1>
      <p className="reg-subtitle">
        Selecciona cómo usarás SincroCarga. En el siguiente paso completarás los datos de tu cuenta.
      </p>
      <p className="reg-step" role="status">Paso 1 de 2 · Elige tu perfil</p>

      <div className="reg-role-grid">
        <div className="reg-role-card">
          <div className="reg-role-icon" aria-hidden="true">
            <TruckIcon />
          </div>
          <h2 className="reg-role-name">Camionero / Transportista</h2>
          <p className="reg-role-desc" id="camionero-role-description">
            Ofrece tu vehículo y capacidad de carga para transportar mercadería por Chiloé.
          </p>
          <button
            type="button"
            className="reg-role-btn"
            aria-describedby="camionero-role-description"
            onClick={() => onSelect("camionero")}
          >
            Soy Camionero
          </button>
        </div>

        <div className="reg-role-card">
          <div className="reg-role-icon" aria-hidden="true">
            <PersonIcon />
          </div>
          <h2 className="reg-role-name">Cliente / Generador de Carga</h2>
          <p className="reg-role-desc" id="cliente-role-description">
            Publica tu carga y encuentra al transportista adecuado para moverla.
          </p>
          <button
            type="button"
            className="reg-role-btn"
            aria-describedby="cliente-role-description"
            onClick={() => onSelect("cliente")}
          >
            Soy Cliente
          </button>
        </div>
      </div>

      <p className="reg-help">
        ¿Necesitas ayuda? <a href="mailto:contacto@sincrocarga.cl">Contacta a soporte</a>.
      </p>
      <p className="reg-switch">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link>
      </p>
    </>
  );
}

function RoleForm({ role, initialForm, onBack, onAuthenticated, onDraftChange }) {
  const config = ROLE_CONFIG[role];
  const [form, setForm] = useState(() => ({
    ...Object.fromEntries(config.fields.map((field) => [field.name, field.defaultValue || ""])),
    ...initialForm,
  }));
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const fields = config.fields.filter(
    (field) => !field.showWhen || form[field.showWhen[0]] === field.showWhen[1],
  );
  const fieldGroups = fields.reduce((groups, field) => {
    const section = getFieldSection(role, field.name);
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.section === section) {
      currentGroup.fields.push(field);
    } else {
      groups.push({ section, fields: [field] });
    }
    return groups;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    onDraftChange(nextForm);
    setRequestError("");
    setErrors((previous) => Object.fromEntries(
      Object.entries(previous).filter(([fieldName]) => {
        if (fieldName === name) return false;
        const field = config.fields.find((item) => item.name === fieldName);
        return !field?.showWhen || nextForm[field.showWhen[0]] === field.showWhen[1];
      }),
    ));
  };

  const validate = () => {
    const next = {};
    fields.forEach((field) => {
      const value = form[field.name]?.toString().trim() || "";
      if (field.required !== false && !value) {
        next[field.name] = "Este campo es obligatorio.";
      } else if (field.type === "number" && value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
          next[field.name] = "Ingresa un número válido.";
        } else if (field.integer && !Number.isInteger(numericValue)) {
          next[field.name] = "Ingresa un año entero.";
        } else if (field.positive && numericValue <= 0) {
          next[field.name] = "Ingresa un valor mayor que cero.";
        } else if (field.min != null && numericValue < field.min) {
          next[field.name] = `El valor mínimo es ${field.min}.`;
        } else if (field.max != null && numericValue > field.max) {
          next[field.name] = `El valor máximo es ${field.max}.`;
        }
      }
    });
    if (role === "camionero" && form.patente?.trim()) {
      const normalizedPlate = form.patente.trim().replace(/[\s-]/g, "").toUpperCase();
      if (!/^(?:[A-Z]{4}\d{2}|[A-Z]{2}\d{4})$/.test(normalizedPlate)) {
        next.patente = "Ingresa una patente chilena válida (ABCD-12 o AB-1234).";
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email?.trim() || "")) {
      next.email = "Ingresa un correo electrónico válido.";
    }
    if ((form.password || "").length < 12) {
      next.password = "La contraseña debe tener al menos 12 caracteres.";
    } else if (new TextEncoder().encode(form.password).length > 72) {
      next.password = "La contraseña no puede superar los 72 bytes.";
    }
    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      next.confirmPassword = "Las contraseñas no coinciden.";
    }
    setErrors(next);
    const firstInvalidField = Object.keys(next)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return false;
    }
    return true;
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
          patente: form.patente.trim().toUpperCase(),
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
      const clearedForm = { ...form, password: "", confirmPassword: "" };
      setForm(clearedForm);
      onDraftChange(clearedForm);
      onAuthenticated(user);
    } catch (error) {
      setRequestError(
        error instanceof TypeError
          ? "No pudimos conectar con el servicio de registro. Revisa tu conexión e inténtalo nuevamente."
          : error.message,
      );
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
      <p className="reg-step" role="status">Paso 2 de 2 · Completa tus datos</p>

      <form className="reg-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        {fieldGroups.map((group) => (
          <fieldset className="reg-fieldset" key={group.section}>
            <legend>{group.section}</legend>
            {group.fields.map((field) => (
              <div className="reg-field" key={field.name}>
                <label className="reg-label" htmlFor={field.name}>
                  {field.label}
                  {field.required !== false && <span className="reg-required" aria-hidden="true"> *</span>}
                </label>

                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    required={field.required !== false}
                    aria-invalid={Boolean(errors[field.name])}
                    aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
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
                ) : field.type === "password" ? (
                  <div className="reg-password-wrap">
                    <input
                      id={field.name}
                      name={field.name}
                      type={visiblePasswords[field.name] ? "text" : "password"}
                      required
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder || ""}
                      aria-invalid={Boolean(errors[field.name])}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : "password-hint"}
                      className={`reg-input ${errors[field.name] ? "has-error" : ""}`}
                      value={form[field.name]}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="reg-password-toggle"
                      aria-label={visiblePasswords[field.name] ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={Boolean(visiblePasswords[field.name])}
                      onClick={() => setVisiblePasswords((previous) => ({
                        ...previous,
                        [field.name]: !previous[field.name],
                      }))}
                    >
                      {visiblePasswords[field.name] ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    required={field.required !== false}
                    min={field.min}
                    max={field.max}
                    maxLength={field.maxLength}
                    step={field.step}
                    placeholder={field.placeholder || ""}
                    autoComplete={field.autoComplete || "off"}
                    aria-invalid={Boolean(errors[field.name])}
                    aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                    className={`reg-input ${errors[field.name] ? "has-error" : ""}`}
                    value={form[field.name]}
                    onChange={handleChange}
                  />
                )}

                {field.name === "password" && (
                  <p className="reg-hint" id="password-hint">
                    Usa entre 12 y 72 bytes. Puedes combinar varias palabras.
                  </p>
                )}
                {errors[field.name] && (
                  <p className="reg-error" id={`${field.name}-error`}>{errors[field.name]}</p>
                )}
              </div>
            ))}
          </fieldset>
        ))}

        {requestError && <p className="reg-error" role="alert">{requestError}</p>}
        <button type="submit" className="reg-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="reg-help">
        ¿Necesitas ayuda? <a href="mailto:contacto@sincrocarga.cl">Contacta a soporte</a>.
      </p>
      <p className="reg-switch">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </>
  );
}

export default function Register({ onAuthenticated, session }) {
  const [role, setRole] = useState(null); // null | "camionero" | "cliente"
  const [drafts, setDrafts] = useState({});

  return (
    <div className="reg-page">
      <Link to={getHomePath(session)} className="reg-brand" aria-label="SincroCarga, ir a mi inicio">
        <img src={logo} alt="Logotipo de SincroCarga" className="reg-brand-logo" />
        <div className="reg-brand-text">
          <span className="reg-brand-name">SincroCarga</span>
          <span className="reg-brand-tag">MATCHING OPERATIVO</span>
        </div>
      </Link>

      <main className={`reg-card ${role ? "reg-card-form" : ""}`}>
        {role ? (
          <RoleForm
            role={role}
            initialForm={drafts[role]}
            onBack={() => setRole(null)}
            onAuthenticated={onAuthenticated}
            onDraftChange={(draft) => setDrafts((previous) => ({ ...previous, [role]: draft }))}
          />
        ) : (
          <RoleSelector onSelect={setRole} />
        )}
      </main>
    </div>
  );
}
