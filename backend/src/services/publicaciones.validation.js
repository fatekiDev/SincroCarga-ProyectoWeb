const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  return parsedDate.getUTCFullYear() === year
    && parsedDate.getUTCMonth() === month - 1
    && parsedDate.getUTCDate() === day
}

function isCurrentOrFutureDate(value) {
  return isDate(value) && value >= new Date().toISOString().slice(0, 10)
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isPositiveId(value) {
  return Number.isSafeInteger(value) && value > 0
}

function isNonNegativeNumber(value) {
  return value === null
    || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
}

function validateCommonFields(body) {
  const errors = []

  if (!Number.isSafeInteger(body.tipoCargaId) || body.tipoCargaId < 1) {
    errors.push('tipoCargaId debe ser un entero positivo')
  }
  if (typeof body.descripcion !== 'string' || !body.descripcion.trim() || body.descripcion.length > 300) {
    errors.push('descripcion es obligatoria y debe tener como máximo 300 caracteres')
  }
  if (!isPositiveNumber(body.pesoKg)) errors.push('pesoKg debe ser un número mayor que cero')
  if (!isPositiveNumber(body.volumenM3)) errors.push('volumenM3 debe ser un número mayor que cero')
  if (!isNonNegativeNumber(body.valorDeclarado)) {
    errors.push('valorDeclarado debe ser null o un número mayor o igual a cero')
  }
  if (!isPositiveId(body.rutaId)) errors.push('rutaId debe ser un entero positivo')
  if (!isCurrentOrFutureDate(body.fechaLimitePostulacion)) {
    errors.push('fechaLimitePostulacion debe ser una fecha válida, actual o futura, con formato YYYY-MM-DD')
  }
  return errors
}

export function validateNewPublication(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['El cuerpo debe ser un objeto JSON']
  }

  const errors = validateCommonFields(body)

  return errors
}

export function validateUpdatedPublication(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['El cuerpo debe ser un objeto JSON']
  }

  return validateCommonFields(body)
}
