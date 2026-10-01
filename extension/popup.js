const DEFAULTS = { backendUrl: 'http://localhost:8000', appUrl: 'http://localhost:5173', apiKey: '' };
const $ = (id) => document.getElementById(id);

async function checkHealth(url) {
  try {
    const res = await fetch(`${url}/api/health`);
    const data = await res.json();
    const det = data.ai_detector?.loaded ? 'detector loaded' : 'detector loading';
    $('health').className = 'status ok';
    $('health').textContent = `Backend online - ${det}${data.gemini_configured ? ', Gemini key set' : ''}`;
  } catch {
    $('health').className = 'status error';
    $('health').textContent = `Backend offline at ${url}. Start it with: python main.py`;
  }
}

(async () => {
  const s = await chrome.storage.sync.get(DEFAULTS);
  $('backendUrl').value = s.backendUrl;
  $('appUrl').value = s.appUrl;
  $('apiKey').value = s.apiKey;
  checkHealth(s.backendUrl);
})();

$('save').addEventListener('click', async () => {
  const s = {
    backendUrl: $('backendUrl').value.trim().replace(/\/$/, '') || DEFAULTS.backendUrl,
    appUrl: $('appUrl').value.trim() || DEFAULTS.appUrl,
    apiKey: $('apiKey').value.trim()
  };
  await chrome.storage.sync.set(s);
  $('saved').hidden = false;
  checkHealth(s.backendUrl);
});
