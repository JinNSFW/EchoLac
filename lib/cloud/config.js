'use strict';
// Supabase settings from the build-generated config.js (window.ECHOLAC_CONFIG); the publishable key is public by design.
function readCloudConfig() {
  const c = (typeof window !== 'undefined' && window.ECHOLAC_CONFIG) || {};
  const url = typeof c.supabaseUrl === 'string' ? c.supabaseUrl : '', key = typeof c.supabaseKey === 'string' ? c.supabaseKey : '';
  return { url, key, enabled: !!(url && key) };
}

const CLOUD = readCloudConfig();
let loadingCloudConfig = null;

function recoverCloudConfig() {
  if (window.ECHOLAC_CONFIG || navigator.onLine === false) return Promise.resolve();
  loadingCloudConfig ||= loadScript(['config.js', '']).then(() => Object.assign(CLOUD, readCloudConfig()))
    .catch(() => {}).finally(() => { loadingCloudConfig = null; });
  return loadingCloudConfig;
}
