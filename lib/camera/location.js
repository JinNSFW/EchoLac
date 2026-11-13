'use strict';
// Browser GPS access and sample-location lookup.

function locate() {
  const s = SCENARIOS[CL.scen], at = loc(s.at);
  if (isDemo()) return new Promise(r => setTimeout(r, 700)).then(() => (G.gps = gpsMatch(at && { lat: at.lat + 0.0003, lng: at.lng, acc: 20 }))); // ~30 m from the sample place
  if (!('geolocation' in navigator)) return Promise.resolve(G.gps = gpsMatch(null));
  return new Promise(res => navigator.geolocation.getCurrentPosition(
    p => res(G.gps = gpsMatch({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy })),
    () => res(G.gps = gpsMatch(null)),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }));
}
