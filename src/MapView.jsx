import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";

import MarkerClusterGroup from "react-leaflet-cluster";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* =========================
   ICONS
========================= */

const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [26, 42],
  iconAnchor: [13, 42],
});

const selectedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",

  shadowUrl: markerShadow,

  iconSize: [38, 58],
  iconAnchor: [19, 58],
  popupAnchor: [1, -45],
});

const searchLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  shadowUrl: markerShadow,

  iconSize: [38, 58],
  iconAnchor: [19, 58],
  popupAnchor: [1, -45],
});

/* =========================
   RESIZE FIX
========================= */

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);

  return null;
}

/* =========================
   FLY TO
========================= */

function FlyToLocation({ selected }) {
  const map = useMap();

  useEffect(() => {
    if (selected?.latitude && selected?.longitude) {
      map.flyTo(
        [selected.latitude, selected.longitude],
        13,
        {
          duration: 1.5,
        }
      );
    }
  }, [selected, map]);

  return null;
}

/* =========================
   FIT BOUNDS
========================= */

function FitBounds({
  results,
  searchCoords,
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];

    if (
      searchCoords?.lat &&
      searchCoords?.lng
    ) {
      bounds.push([
        searchCoords.lat,
        searchCoords.lng,
      ]);
    }

    results.forEach((item) => {
      if (item.latitude && item.longitude) {
        bounds.push([
          item.latitude,
          item.longitude,
        ]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
      });
    }
  }, [results, searchCoords, map]);

  return null;
}

/* =========================
   MAIN COMPONENT
========================= */

function MapView({
  results,
  searchCoords,
  selected,
  address,
}) {
  const defaultPosition = [22.5726, 88.3639];

  return (
    <MapContainer
      center={defaultPosition}
      zoom={10}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "24px",
      }}
    >
      {/* MAP TILE */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* HELPERS */}
      <ResizeMap />

      <FlyToLocation
        selected={selected}
      />

      <FitBounds
        results={results}
        searchCoords={searchCoords}
      />

      {/* SEARCH LOCATION */}
      {searchCoords && (
        <>
          <Circle
            center={[
              searchCoords.lat,
              searchCoords.lng,
            ]}
            radius={5000}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#ef4444",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />

          <Marker
            position={[
              searchCoords.lat,
              searchCoords.lng,
            ]}
            icon={searchLocationIcon}
          >
            <Popup>
              <div
                style={{
                  minWidth: "180px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    color: "#ef4444",
                    fontSize: "16px",
                  }}
                >
                  📍 {address}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#4b5563",
                    fontSize: "13px",
                  }}
                >
                  Search center location
                </p>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {/* RESULT MARKERS */}
      <MarkerClusterGroup chunkedLoading>
        {results.map((item, index) =>
          item.latitude &&
          item.longitude ? (
            <Marker
              key={index}
              position={[
                item.latitude,
                item.longitude,
              ]}
              icon={
                selected?.name === item.name
                  ? selectedIcon
                  : defaultIcon
              }
            >
              <Popup>
                <div
                  style={{
                    minWidth: "220px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      color: "#111827",
                    }}
                  >
                    {item.name}
                  </h3>

                  <p>
                    📍{" "}
                    {item.line1 ||
                      "Address unavailable"}
                  </p>

                  <p>
                    🏙{" "}
                    {item.city ||
                      "City unavailable"}
                  </p>

                  <p>
                    🌐{" "}
                    {item.state ||
                      "State unavailable"}
                  </p>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

export default MapView;