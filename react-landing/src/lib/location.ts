export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const STATE_MAP: Record<string, string> = {
  "gj": "Gujarat",
  "rj": "Rajasthan",
  "mh": "Maharashtra",
  "dl": "Delhi",
  "ka": "Karnataka",
  "tn": "Tamil Nadu",
  "kl": "Kerala",
  "up": "Uttar Pradesh",
  "ap": "Andhra Pradesh",
  "tg": "Telangana",
  "wb": "West Bengal"
};

export function matchState(detectedState: string): string | null {
  if (!detectedState) return null;
  const normalized = detectedState.toLowerCase().trim();
  
  if (STATE_MAP[normalized]) {
    return STATE_MAP[normalized];
  }
  
  // Try exact match or close containment match
  for (const st of STATES) {
    const sLower = st.toLowerCase();
    if (normalized === sLower || normalized.includes(sLower) || sLower.includes(normalized)) {
      return st;
    }
  }
  return null;
}

export function detectLocation(email: string, force: boolean = false): Promise<string | null> {
  const attemptKey = `smartgov_location_attempted_${email}`;
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser. Triggering IP fallback.");
      localStorage.setItem(attemptKey, "unsupported");
      runIpFallback(email, resolve, attemptKey);
      return;
    }

    const attempt = localStorage.getItem(attemptKey);
    // If not forced and we already have a diagnostic status like denied or unsupported, skip to avoid prompt loops
    if (!force && (attempt === "denied" || attempt === "unsupported")) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`[GEOLOCATION DEBUG] GPS coordinates received: lat=${latitude}, lon=${longitude}, acc=${accuracy}m`);

        // Ignore geolocation coordinates if accuracy is extremely poor (>100km)
        if (accuracy && accuracy > 100000) {
          console.warn(`[GEOLOCATION DEBUG] Location accuracy is too poor (${accuracy}m). Triggering IP fallback.`);
          await runIpFallback(email, resolve, attemptKey);
          return;
        }

        try {
          console.log(`[GEOLOCATION DEBUG] Running reverse geocoding via Nominatim...`);
          // Fetch reverse geocoding from OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) {
            throw new Error("Geocoding service error");
          }

          const data = await response.json();
          console.log(`[GEOLOCATION DEBUG] Nominatim response:`, JSON.stringify(data));
          const address = data.address || {};
          
          const rawState = address.state || address.state_district || address.territory || address.region;
          const district = address.district || address.county || address.state_district || null;
          const city = address.city || address.town || address.village || address.suburb || address.municipality || null;
          const country = address.country || null;

          if (!rawState) {
            console.warn("[GEOLOCATION DEBUG] Reverse geocoding succeeded but raw state was not found in address data.");
            localStorage.setItem(attemptKey, "no_state_in_geocoding");
            resolve(null);
            return;
          }

          const matched = matchState(rawState);
          if (matched) {
            console.log(`[GEOLOCATION DEBUG] Mapped state: ${matched}. Saving coordinates...`);
            // Save coordinates and full derived location to SQLite backend
            await fetch("/api/user/save-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude,
                longitude,
                accuracy,
                state: matched,
                district,
                city,
                country,
                location_source: "browser_geolocation"
              })
            });
            localStorage.setItem(attemptKey, "success");
            resolve(matched);
          } else {
            console.warn(`[GEOLOCATION DEBUG] Mapped state is null for raw state: ${rawState}. Triggering IP fallback.`);
            await runIpFallback(email, resolve, attemptKey);
          }
        } catch (err) {
          console.error("[GEOLOCATION DEBUG] Error reverse geocoding coordinates:", err);
          console.warn("[GEOLOCATION DEBUG] Triggering IP fallback after geocoding error.");
          await runIpFallback(email, resolve, attemptKey);
        }
      },
      async (error) => {
        console.warn("[GEOLOCATION DEBUG] User denied Geolocation or error occurred:", error.message);
        console.warn("[GEOLOCATION DEBUG] Triggering IP fallback after geolocation denial/error.");
        await runIpFallback(email, resolve, attemptKey);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000 
      }
    );
  });
}

async function runIpFallback(
  email: string, 
  resolve: (value: string | null) => void, 
  attemptKey: string
) {
  try {
    console.log("[GEOLOCATION DEBUG] Triggering IP-based location fallback (ipapi.co)...");
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      throw new Error(`IP API returned status ${response.status}`);
    }
    const data = await response.json();
    console.log("[GEOLOCATION DEBUG] IP Geolocation response:", JSON.stringify(data));

    const country = data.country_name || null;
    const rawState = data.region || null;
    const city = data.city || null;
    const latitude = data.latitude || null;
    const longitude = data.longitude || null;

    if (!rawState) {
      console.warn("[GEOLOCATION DEBUG] IP-based location succeeded but region was not found.");
      localStorage.setItem(attemptKey, "ip_fallback_no_state");
      resolve(null);
      return;
    }

    const matched = matchState(rawState);
    if (matched) {
      console.log(`[GEOLOCATION DEBUG] Mapped IP fallback state: ${matched}. Saving coordinates...`);
      await fetch("/api/user/save-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy: 50000, // Coarse accuracy for IP geolocation
          state: matched,
          district: null,
          city,
          country,
          location_source: "ip_fallback"
        })
      });
      localStorage.setItem(attemptKey, "success_ip_fallback");
      resolve(matched);
    } else {
      console.warn(`[GEOLOCATION DEBUG] Could not match raw IP state "${rawState}" with standard State/UT.`);
      localStorage.setItem(attemptKey, "ip_fallback_unmatched");
      resolve(null);
    }
  } catch (err) {
    console.error("[GEOLOCATION DEBUG] Error during IP geolocation fallback:", err);
    localStorage.setItem(attemptKey, "ip_fallback_error");
    resolve(null);
  }
}
