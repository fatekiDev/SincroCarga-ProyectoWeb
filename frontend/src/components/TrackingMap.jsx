import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

const CITY_COORDINATES = {
  'puerto montt': [-41.4693, -72.9424],
  pargua: [-41.7538, -73.5824],
  chacao: [-41.8294, -73.5354],
  ancud: [-41.8697, -73.827],
  castro: [-42.4807, -73.7623],
  chonchi: [-42.6229, -73.7708],
  quellon: [-43.117, -73.616],
}

const CROSSING_COORDINATE = [-41.804, -73.555]

const DEMO_ROUTES = {
  'puerto montt>castro': [
    CITY_COORDINATES['puerto montt'],
    [-41.53, -73.12],
    [-41.66, -73.39],
    CITY_COORDINATES.pargua,
    CROSSING_COORDINATE,
    CITY_COORDINATES.chacao,
    CITY_COORDINATES.ancud,
    [-42.06, -73.77],
    [-42.3, -73.7],
    CITY_COORDINATES.castro,
  ],
  'puerto montt>quellon': [
    CITY_COORDINATES['puerto montt'],
    [-41.53, -73.12],
    [-41.66, -73.39],
    CITY_COORDINATES.pargua,
    CROSSING_COORDINATE,
    CITY_COORDINATES.chacao,
    CITY_COORDINATES.ancud,
    [-42.06, -73.77],
    CITY_COORDINATES.castro,
    CITY_COORDINATES.chonchi,
    [-42.88, -73.51],
    CITY_COORDINATES.quellon,
  ],
  'castro>quellon': [
    CITY_COORDINATES.castro,
    CITY_COORDINATES.chonchi,
    [-42.88, -73.51],
    CITY_COORDINATES.quellon,
  ],
  'ancud>castro': [
    CITY_COORDINATES.ancud,
    [-42.02, -73.77],
    [-42.25, -73.7],
    CITY_COORDINATES.castro,
  ],
}

const ORIGIN_ICON = L.divIcon({
  className: 'tracking-map__icon-shell',
  html: '<span class="tracking-map__pin tracking-map__pin--origin"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const DESTINATION_ICON = L.divIcon({
  className: 'tracking-map__icon-shell',
  html: '<span class="tracking-map__pin tracking-map__pin--destination"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const CROSSING_ICON = L.divIcon({
  className: 'tracking-map__icon-shell',
  html: '<span class="tracking-map__crossing-pin">F</span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

const TRUCK_ICON = L.divIcon({
  className: 'tracking-map__icon-shell',
  html: '<span class="tracking-map__truck-pin" aria-label="Camión">🚚</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

function normalizePlace(value) {
  return value
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function getRouteCoordinates(route) {
  const origin = normalizePlace(route.origen)
  const destination = normalizePlace(route.destino)
  const direct = DEMO_ROUTES[`${origin}>${destination}`]
  if (direct) return direct

  const reverse = DEMO_ROUTES[`${destination}>${origin}`]
  if (reverse) return [...reverse].reverse()

  const start = CITY_COORDINATES[origin]
  const end = CITY_COORDINATES[destination]
  if (start && end) {
    return route.cruceMaritimo
      ? [start, CITY_COORDINATES.pargua, CROSSING_COORDINATE, CITY_COORDINATES.chacao, end]
      : [start, end]
  }

  return [CITY_COORDINATES.ancud, CITY_COORDINATES.castro]
}

function interpolatePosition(positions, percent) {
  const segments = positions.slice(1).map((position, index) => ({
    start: positions[index],
    end: position,
    length: L.latLng(positions[index]).distanceTo(L.latLng(position)),
  }))
  const totalLength = segments.reduce((total, segment) => total + segment.length, 0)
  let remainingLength = totalLength * Math.min(100, Math.max(0, percent)) / 100

  for (const segment of segments) {
    if (remainingLength <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remainingLength / segment.length
      return [
        segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
        segment.start[1] + (segment.end[1] - segment.start[1]) * ratio,
      ]
    }
    remainingLength -= segment.length
  }

  return positions[positions.length - 1]
}

function FitRoute({ positions, routeId }) {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(L.latLngBounds(positions).pad(0.12), { animate: false })
  }, [map, positions, routeId])

  return null
}

export default function TrackingMap({ viaje, progress }) {
  const { id: routeId, origen, destino, cruceMaritimo, duracionEstimadaMin } = viaje.ruta
  const positions = useMemo(() => getRouteCoordinates({
    id: routeId,
    origen,
    destino,
    cruceMaritimo,
  }), [routeId, origen, destino, cruceMaritimo])
  const truckPosition = interpolatePosition(positions, progress)
  const crossingPosition = cruceMaritimo ? CROSSING_COORDINATE : null
  const routeIdentity = `${routeId}-${origen}-${destino}`

  return (
    <div className="tracking-map" aria-label={`Mapa demostrativo de ${viaje.ruta.origen} a ${viaje.ruta.destino}`}>
      <MapContainer
        key={routeIdentity}
        center={positions[Math.floor(positions.length / 2)]}
        zoom={8}
        scrollWheelZoom={false}
        zoomControl
        className="tracking-map__leaflet"
      >
        <FitRoute positions={positions} routeId={routeIdentity} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} pathOptions={{ color: '#2f6feb', weight: 5, opacity: 0.82 }} />
        <Marker position={positions[0]} icon={ORIGIN_ICON}>
          <Popup>{viaje.ruta.origen}</Popup>
        </Marker>
        <Marker position={positions[positions.length - 1]} icon={DESTINATION_ICON}>
          <Popup>{viaje.ruta.destino}</Popup>
        </Marker>
        {crossingPosition && (
          <Marker position={crossingPosition} icon={CROSSING_ICON}>
            <Popup>{`Cruce ${cruceMaritimo} · ${duracionEstimadaMin} min estimados`}</Popup>
          </Marker>
        )}
        <Marker position={truckPosition} icon={TRUCK_ICON}>
          <Popup>Posición simulada del camión</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}