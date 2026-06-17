'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPin {
  id: string
  lat: number
  lng: number
  label: string
  sublabel?: string
  badge?: string
  available?: boolean
  href?: string
}

function makeIcon(color: string, size = 28) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.29)}" viewBox="0 0 28 36">
      <path fill="${color}" d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`,
    iconSize: [size, Math.round(size * 1.29)],
    iconAnchor: [size / 2, Math.round(size * 1.29)],
    popupAnchor: [0, -Math.round(size * 1.29)],
  })
}

const iconAvailable = makeIcon('#22c55e')
const iconBusy = makeIcon('#f97316')
const iconUser = makeIcon('#3b82f6', 24)

interface Props {
  pins: MapPin[]
  userPin?: { lat: number; lng: number }
  center?: [number, number]
  zoom?: number
  height?: number | string
}

// Default center: Lagos
const LAGOS: [number, number] = [6.5244, 3.3792]

export default function MultiMarkerMap({ pins, userPin, center, zoom = 11, height = 480 }: Props) {
  const mapCenter: [number, number] =
    center ??
    (userPin ? [userPin.lat, userPin.lng] : pins.length > 0 ? [pins[0].lat, pins[0].lng] : LAGOS)

  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height, border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* User location pin */}
        {userPin && (
          <Marker position={[userPin.lat, userPin.lng]} icon={iconUser}>
            <Popup>
              <div style={{ fontWeight: 700 }}>Your location</div>
            </Popup>
          </Marker>
        )}

        {/* Repairer / seller pins */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={pin.available ? iconAvailable : iconBusy}
          >
            <Popup>
              <div style={{ minWidth: 160, fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{pin.label}</div>
                {pin.sublabel && (
                  <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: 4 }}>{pin.sublabel}</div>
                )}
                {pin.badge && (
                  <div style={{ fontSize: '0.75rem', marginBottom: 6, color: pin.available ? '#16a34a' : '#9ca3af' }}>
                    {pin.badge}
                  </div>
                )}
                {pin.href && (
                  <a
                    href={pin.href}
                    style={{ color: '#f97316', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}
                  >
                    View Profile →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
