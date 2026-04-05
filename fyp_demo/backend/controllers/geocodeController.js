/**
 * Nominatim is geocoding service run by OpenSteetMap,
 * OpenStreetMap community provides structured geo location data
 * Proxies OpenStreetMap Nominatim (usage policy: identify app + moderate request volume).
 */


//base url for osm, the backend will call urls(/search?... or /reverse?...) from this host to convert address into lat/long coords.
const NOMINATIM = 'https://nominatim.openstreetmap.org';  

//user-agent (string), this is sent by our server to the osm server to identify which app the request is sent through
const UA = process.env.NOMINATIM_USER_AGENT || 'CapellaFYP/1.0 (contact: dev@localhost)';

async function nominatimFetch(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Geocoding failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

function pickAddress(addr) {
  if (!addr) return { city: '', state: '', country: '' };
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    '';
  const state = addr.state || addr.region || '';
  const country = addr.country || '';
  return { city, state, country };
}

export async function searchLocation(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.status(400).json({ success: false, error: 'Query too short' });
    }

    const url = `${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const data = await nominatimFetch(url);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ success: false, error: 'No results' });
    }

    const hit = data[0];
    const lon = parseFloat(hit.lon);
    const lat = parseFloat(hit.lat);
    const addr = hit.address || {};
    const { city, state, country } = pickAddress(addr);

    const displayParts = [city, state, country].filter(Boolean);
    const displayLocation =
      displayParts.length > 0 ? displayParts.join(', ') : hit.display_name || q;

    return res.json({
      success: true,
      result: {
        coordinates: [lon, lat],
        city,
        state,
        country,
        displayLocation,
      },
    });
  } catch (e) {
    console.error('searchLocation:', e);
    return res.status(500).json({ success: false, error: e.message || 'Geocoding error' });
  }
}

export async function reverseLocation(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ success: false, error: 'Invalid lat/lon' });
    }

    const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lon}`;
    const hit = await nominatimFetch(url);
    const addr = hit.address || {};
    const { city, state, country } = pickAddress(addr);

    const displayParts = [city, state, country].filter(Boolean);
    const displayLocation =
      displayParts.length > 0 ? displayParts.join(', ') : hit.display_name || `${lat}, ${lon}`;

    return res.json({
      success: true,
      result: {
        coordinates: [parseFloat(hit.lon), parseFloat(hit.lat)],
        city,
        state,
        country,
        displayLocation,
      },
    });
  } catch (e) {
    console.error('reverseLocation:', e);
    return res.status(500).json({ success: false, error: e.message || 'Reverse geocoding error' });
  }
}
