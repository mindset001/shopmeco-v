'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const markerIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path fill="var(--color-accent, #e05c1a)" d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  height?: number | string
}

// Default center — Lagos, Nigeria
const DEFAULT_LAT = 6.5244
const DEFAULT_LNG = 3.3792

export default function LocationPicker({ lat, lng, onChange, height = 300 }: LocationPickerProps) {
  const [locating, setLocating] = useState(false)

  const centerLat = lat ?? DEFAULT_LAT
  const centerLng = lng ?? DEFAULT_LNG

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-300)' }}>
          {lat && lng
            ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : 'Click the map or use GPS to set your location'}
        </div>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={useMyLocation}
          disabled={locating}
          style={{ flexShrink: 0 }}
        >
          {locating ? 'Locating…' : '📡 Use my location'}
        </button>
      </div>

      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height, border: '1px solid var(--color-border)', cursor: 'crosshair' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={lat ? 14 : 11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {lat && lng && (
            <>
              <Recenter lat={lat} lng={lng} />
              <Marker position={[lat, lng]} icon={markerIcon} />
            </>
          )}
        </MapContainer>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-400)', marginTop: 6 }}>
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>OpenStreetMap</a> contributors
      </div>
    </div>
  )
}
