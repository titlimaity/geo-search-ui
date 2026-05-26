import { useState } from "react";
import axios from "axios";
import MapView from "./MapView";
import { ClipLoader } from "react-spinners";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   DISTANCE FUNCTION
========================= */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (R * c).toFixed(2);
};

const cleanValue = (value, fallback = "Not available") => {
  if (!value) return fallback;
  if (String(value).toLowerCase().includes("unknown")) return fallback;
  return value;
};

function App() {
  const [address, setAddress] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchCoords, setSearchCoords] = useState(null);
  const [selected, setSelected] = useState(null);

  const searchLocation = async () => {
    if (!address) {
      alert("Please enter address");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(API_URL, {
        complete_address: address,
      });

      const data =
        typeof response.data.body === "string"
          ? JSON.parse(response.data.body)
          : response.data;

      const resultsData = data.results || [];

      setResults(resultsData);

      if (resultsData.length > 0) {
        setSelected(resultsData[0]);
      } else {
        setSelected(null);
      }

      setSearchCoords({
        lat: data.search_latitude,
        lng: data.search_longitude,
      });
    } catch (error) {
      console.log(error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const openFullMap = () => {
    if (!searchCoords?.lat || !searchCoords?.lng) {
      alert("Please search a location first");
      return;
    }

    window.open(
      `https://www.openstreetmap.org/#map=12/${searchCoords.lat}/${searchCoords.lng}`,
      "_blank"
    );
  };

  return (
    <div className="appContainer">
      {/* BACKGROUND EFFECTS */}
      <div className="bgBlobOne" />
      <div className="bgBlobTwo" />
      <div className="bgGrid" />

      {/* HEADER */}
      <div className="glassCard">
        <div className="headerWrapper">
          {/* LEFT */}
          <div className="brandSection">
            <div className="iconGlow">🌍</div>

            <div>
              <h1 className="mainTitle">
                Geo Search Intelligence Platform
              </h1>

              <p className="subTitle">
                Premium location intelligence dashboard
              </p>
            </div>
          </div>

          {/* RIGHT */}
          {results.length > 0 && (
            <div className="resultBadge">
              📍 Found {results.length} nearby locations
            </div>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="glassCard">
        <div className="searchContainer">
          {/* INPUT */}
          <div className="searchInputWrapper">
            <span className="searchIcon">🔍</span>

            <input
              type="text"
              placeholder="Search location or address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchLocation();
                }
              }}
              className="searchInput"
            />
          </div>

          {/* BUTTON */}
          <button onClick={searchLocation} className="searchButton">
            🔍 Search
          </button>
        </div>
      </div>

      {/* LOADER */}
      {loading && (
        <div className="loaderContainer">
          <ClipLoader size={45} color="#8b5cf6" />
        </div>
      )}

      {/* EMPTY */}
      {!loading && results.length === 0 && (
        <div className="emptyState">
          <div className="emptyIcon">🌎</div>

          <h2>No Results Found</h2>

          <p>Search for a location to discover nearby places.</p>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      {!loading && results.length > 0 && (
        <div className="dashboardLayout noPageScrollDashboard">
          {/* SIDEBAR */}
          <div className="sidebarContainer">
            {results.map((item, index) => {
              const isSelected = selected?.name === item.name;

              return (
                <div
                  key={index}
                  onClick={() => setSelected(item)}
                  className={`locationCard equalLocationCard ${
                    isSelected ? "locationCardActive" : ""
                  }`}
                >
                  <div className="cardTop">
                    {/* LEFT */}
                    <div className="cardLeft">
                      {/* NUMBER */}
                      <div className="numberBadge">{index + 1}</div>

                      {/* DETAILS */}
                      <div className="cardDetails">
                        <div className="cardTags">
                          <div className="categoryIcon">
                            {item.type === "hospital" ? "🏥" :
                            item.type === "school" ? "🏫" :
                            item.type === "restaurant" ? "🍽️" :
                            item.type === "bank" ? "🏦" :
                            item.type === "place_of_worship" ? "🛕" :
                            item.type === "railway_station" ? "🚉" :
                            item.type === "mall" || item.type === "shop" ? "🛍️" :
                            "📍"}
                          </div>

                          {index === 0 && (
                            <div className="nearestBadge">
                              Nearest
                            </div>
                          )}
                        </div>

                        <h3 className="locationTitle">
                          {cleanValue(item.name, "Unnamed Location")}
                        </h3>
                        <p className="locationCategory">
                          {item.category || "Location"}
                        </p>

                        <p className="locationText">
                          📍 {cleanValue(item.line1)}
                        </p>

                        <p className="locationText">
                          🏙 {cleanValue(item.city)}
                        </p>

                        <p className="locationText">
                          🌐 {cleanValue(item.state)}
                        </p>
                      </div>
                    </div>

                    {/* DISTANCE */}
                    <div className="distanceBadge">
                      {searchCoords?.lat &&
                      searchCoords?.lng &&
                      item.latitude &&
                      item.longitude
                        ? getDistanceKm(
                            searchCoords.lat,
                            searchCoords.lng,
                            item.latitude,
                            item.longitude
                          )
                        : "N/A"}{" "}
                      KM
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MAP */}
          <div className="mapContainerWrapper fullMapWrapper">
            <button
              type="button"
              onClick={openFullMap}
              className="openFullMapButton"
            >
              🗺 Open Full Map
            </button>

            <MapView
              results={results}
              searchCoords={searchCoords}
              selected={selected}
              address={address}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;