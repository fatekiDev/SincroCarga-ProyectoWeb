import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePublicationQuote } from '../src/services/publicaciones.pricing.js'

const baseQuote = {
  tarifaBase: 100000,
  recargoCruce: 8000,
  distanciaKm: 220,
  cruceMaritimo: 'Pargua - Chacao',
}

test('uses the greater of actual and volumetric weight', () => {
  const quote = calculatePublicationQuote({
    ...baseQuote,
    pesoKg: 600,
    volumenM3: 5,
  })

  assert.equal(quote.pesoFacturableKg, 1250)
  assert.equal(quote.tramosAdicionales, 1)
  assert.equal(quote.recargoCarga, 15000)
  assert.equal(quote.tarifaOfrecida, 123000)
})

test('does not add a size surcharge within the first 1000 kg tier', () => {
  const quote = calculatePublicationQuote({
    ...baseQuote,
    pesoKg: 1000,
    volumenM3: 1,
  })

  assert.equal(quote.tramosAdicionales, 0)
  assert.equal(quote.recargoCarga, 0)
  assert.equal(quote.tarifaOfrecida, 108000)
})

test('adds 15 percent of the reference tariff per additional started tier', () => {
  const quote = calculatePublicationQuote({
    ...baseQuote,
    pesoKg: 2001,
    volumenM3: 1,
  })

  assert.equal(quote.tramosAdicionales, 2)
  assert.equal(quote.recargoCarga, 30000)
  assert.equal(quote.tarifaAjustada, 130000)
  assert.equal(quote.tarifaOfrecida, 138000)
})

test('preserves the maritime crossing fee separately from the size surcharge', () => {
  const quote = calculatePublicationQuote({
    ...baseQuote,
    recargoCruce: 0,
    cruceMaritimo: null,
    pesoKg: 1001,
    volumenM3: 1,
  })

  assert.equal(quote.recargoCruce, 0)
  assert.equal(quote.tarifaOfrecida, 115000)
})
