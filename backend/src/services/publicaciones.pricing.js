export const VOLUMETRIC_WEIGHT_FACTOR_KG_PER_M3 = 250
export const BILLABLE_WEIGHT_TIER_KG = 1000
export const ADDITIONAL_TIER_RATE = 0.15

export function calculatePublicationQuote({
  tarifaBase,
  recargoCruce,
  distanciaKm,
  cruceMaritimo,
  pesoKg,
  volumenM3,
}) {
  const pesoFacturableKg = Math.max(
    pesoKg,
    volumenM3 * VOLUMETRIC_WEIGHT_FACTOR_KG_PER_M3,
  )
  const tramosAdicionales = Math.max(
    Math.ceil(pesoFacturableKg / BILLABLE_WEIGHT_TIER_KG) - 1,
    0,
  )
  const recargoCarga = Math.round(tarifaBase * ADDITIONAL_TIER_RATE * tramosAdicionales)
  const tarifaAjustada = tarifaBase + recargoCarga

  return {
    tarifaBase,
    recargoCarga,
    tarifaAjustada,
    recargoCruce,
    tarifaOfrecida: tarifaAjustada + recargoCruce,
    pesoFacturableKg,
    tramosAdicionales,
    factorVolumetricoKgM3: VOLUMETRIC_WEIGHT_FACTOR_KG_PER_M3,
    distanciaKm,
    cruceMaritimo,
  }
}
