import assert from 'node:assert/strict'
import test from 'node:test'
import { validateRegistration } from '../src/services/auth.validation.js'

const customerRegistration = {
  role: 'cliente',
  email: 'cliente@example.cl',
  password: 'very-secure-password',
  profile: {
    tipoClienteId: 2,
    rut: '12.345.678-5',
    nombreRazonSocial: 'Cliente de prueba',
    telefono: '+56912345678',
  },
}

const carrierRegistration = {
  role: 'camionero',
  email: 'transportista@example.cl',
  password: 'very-secure-password',
  profile: {
    empresa: {
      rut: '76.111.222-8',
      razonSocial: 'Transportes de prueba',
    },
    conductor: {
      rut: '12.345.678-5',
      nombre: 'Conductor de prueba',
      telefono: '+56912345678',
      licencia: 'ABC123',
      licenciaVencimiento: '2030-01-01',
    },
    camion: {
      tipo: 'Camión simple',
      patente: 'ABCD-12',
      marca: 'Marca',
      modelo: 'Modelo',
      anio: 2025,
      capacidadKg: 1000,
      capacidadM3: 10,
    },
  },
}

test('accepts a correctly formatted RUT with a valid verifier', () => {
  assert.deepEqual(validateRegistration(customerRegistration), [])
})

test('rejects RUTs that are not in the required format', () => {
  const errors = validateRegistration({
    ...customerRegistration,
    profile: { ...customerRegistration.profile, rut: '21327.659-k' },
  })

  assert.ok(errors.some((error) => error.includes('XX.XXX.XXX-X')))
})

test('rejects a RUT with an invalid verifier', () => {
  const errors = validateRegistration({
    ...customerRegistration,
    profile: { ...customerRegistration.profile, rut: '12.345.678-9' },
  })

  assert.ok(errors.some((error) => error.includes('dígito verificador válido')))
})

test('requires formatted valid RUTs for both the carrier and its driver', () => {
  const errors = validateRegistration({
    ...carrierRegistration,
    profile: {
      ...carrierRegistration.profile,
      empresa: { ...carrierRegistration.profile.empresa, rut: '76111222-8' },
      conductor: { ...carrierRegistration.profile.conductor, rut: '12.345.678-9' },
    },
  })

  assert.ok(errors.some((error) => error.startsWith('empresa.rut debe tener formato')))
  assert.ok(errors.some((error) => error.startsWith('conductor.rut debe tener formato')))
})
