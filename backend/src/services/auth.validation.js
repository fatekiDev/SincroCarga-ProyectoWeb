const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const RUT_PATTERN = /^(\d{1,2})\.(\d{3})\.(\d{3})-([\dkK])$/
const CURRENT_YEAR = new Date().getFullYear()

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

function requiredString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

function validEmail(email) {
  return typeof email === 'string'
    && email.length <= 150
    && EMAIL_PATTERN.test(email.trim())
}

function validRut(rut) {
  if (typeof rut !== 'string') return false

  const match = RUT_PATTERN.exec(rut.trim())
  if (!match) return false

  const number = match.slice(1, 4).join('')
  let sum = 0
  let factor = 2

  for (let index = number.length - 1; index >= 0; index -= 1) {
    sum += Number(number[index]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }

  const remainder = 11 - (sum % 11)
  const expectedVerifier = remainder === 11
    ? '0'
    : remainder === 10
      ? 'K'
      : String(remainder)

  return match[4].toUpperCase() === expectedVerifier
}

function validatePassword(password) {
  return typeof password === 'string'
    && password.length >= 12
    && Buffer.byteLength(password, 'utf8') <= 72
}

function validateCustomerProfile(profile) {
  const errors = []

  if (!isRecord(profile)) return ['profile debe ser un objeto']
  if (![1, 2].includes(profile.tipoClienteId)) {
    errors.push('tipoClienteId debe ser 1 (Empresa) o 2 (Persona Natural)')
  }
  if (!requiredString(profile.rut, 12)) {
    errors.push('rut es obligatorio y debe tener como máximo 12 caracteres')
  } else if (!validRut(profile.rut)) {
    errors.push('rut debe tener formato XX.XXX.XXX-X y un dígito verificador válido')
  }
  if (!requiredString(profile.nombreRazonSocial, 150)) {
    errors.push('nombreRazonSocial es obligatorio y debe tener como máximo 150 caracteres')
  }
  if (!requiredString(profile.telefono, 20)) {
    errors.push('telefono es obligatorio y debe tener como máximo 20 caracteres')
  }
  if (profile.direccion != null && !requiredString(profile.direccion, 200)) {
    errors.push('direccion debe tener como máximo 200 caracteres')
  }
  if (profile.comuna != null && !requiredString(profile.comuna, 100)) {
    errors.push('comuna debe tener como máximo 100 caracteres')
  }

  return errors
}

function validateCarrierProfile(profile) {
  const errors = []

  if (!isRecord(profile)) return ['profile debe ser un objeto']
  if (!isRecord(profile.empresa)) errors.push('empresa debe ser un objeto')
  if (!isRecord(profile.conductor)) errors.push('conductor debe ser un objeto')
  if (!isRecord(profile.camion)) errors.push('camion debe ser un objeto')
  if (errors.length > 0) return errors

  if (!requiredString(profile.empresa.rut, 12)) {
    errors.push('empresa.rut es obligatorio y debe tener como máximo 12 caracteres')
  } else if (!validRut(profile.empresa.rut)) {
    errors.push('empresa.rut debe tener formato XX.XXX.XXX-X y un dígito verificador válido')
  }
  if (!requiredString(profile.empresa.razonSocial, 150)) {
    errors.push('empresa.razonSocial es obligatoria y debe tener como máximo 150 caracteres')
  }
  if (profile.empresa.direccion != null && !requiredString(profile.empresa.direccion, 200)) {
    errors.push('empresa.direccion debe tener como máximo 200 caracteres')
  }
  if (!requiredString(profile.conductor.rut, 12)) {
    errors.push('conductor.rut es obligatorio y debe tener como máximo 12 caracteres')
  } else if (!validRut(profile.conductor.rut)) {
    errors.push('conductor.rut debe tener formato XX.XXX.XXX-X y un dígito verificador válido')
  }
  if (!requiredString(profile.conductor.nombre, 150)) {
    errors.push('conductor.nombre es obligatorio y debe tener como máximo 150 caracteres')
  }
  if (!requiredString(profile.conductor.telefono, 20)) {
    errors.push('conductor.telefono es obligatorio y debe tener como máximo 20 caracteres')
  }
  if (!requiredString(profile.conductor.licencia, 30)) {
    errors.push('conductor.licencia es obligatoria y debe tener como máximo 30 caracteres')
  }
  if (!isDate(profile.conductor.licenciaVencimiento)) {
    errors.push('conductor.licenciaVencimiento debe ser una fecha válida con formato YYYY-MM-DD')
  }

  const truck = profile.camion
  if (!requiredString(truck.tipo, 50)) errors.push('camion.tipo es obligatorio')
  if (!requiredString(truck.patente, 10)) errors.push('camion.patente es obligatorio')
  else if (!/^(?:[A-Z]{4}\d{2}|[A-Z]{2}\d{4})$/i.test(truck.patente.trim().replace(/[\s-]/g, ''))) {
    errors.push('camion.patente debe tener un formato chileno válido (ABCD-12 o AB-1234)')
  }
  if (!requiredString(truck.marca, 50)) errors.push('camion.marca es obligatoria')
  if (!requiredString(truck.modelo, 50)) errors.push('camion.modelo es obligatorio')
  if (!Number.isInteger(truck.anio) || truck.anio <= 1950 || truck.anio > CURRENT_YEAR + 1) {
    errors.push('camion.anio debe ser un año válido')
  }
  if (typeof truck.capacidadKg !== 'number' || !Number.isFinite(truck.capacidadKg) || truck.capacidadKg <= 0) {
    errors.push('camion.capacidadKg debe ser mayor que cero')
  }
  if (typeof truck.capacidadM3 !== 'number' || !Number.isFinite(truck.capacidadM3) || truck.capacidadM3 <= 0) {
    errors.push('camion.capacidadM3 debe ser mayor que cero')
  }

  return errors
}

export function validateRegistration(body) {
  if (!isRecord(body)) return ['El cuerpo debe ser un objeto JSON']

  const errors = []
  if (!validEmail(body.email)) errors.push('email debe tener un formato válido')
  if (!validatePassword(body.password)) {
    errors.push('password debe tener al menos 12 caracteres y como máximo 72 bytes')
  }
  if (!['cliente', 'camionero'].includes(body.role)) {
    errors.push('role debe ser cliente o camionero')
  }

  if (body.role === 'cliente') errors.push(...validateCustomerProfile(body.profile))
  if (body.role === 'camionero') errors.push(...validateCarrierProfile(body.profile))

  return errors
}

export function validateLogin(body) {
  if (!isRecord(body) || !validEmail(body.email) || typeof body.password !== 'string') {
    return ['email y password son obligatorios y deben tener un formato válido']
  }

  return []
}
