const DEFAULTS = { backendUrl: 'http://localhost:8000', appUrl: 'http://localhost:5173', apiKey: '' };

const $ = (id) => document.getElementById(id);

const tone = (verdict = '') => {
  const v = verdict.toLowerCase();
  if (v.includes('possibly') || v.includes('manipulation')) return 'amber';
  if (v.includes('synthetic') || v.includes('generated') || v === 'edited' || v.includes('likely edited')) return 'red';
  if (v.includes('authentic') || v.includes('no editing')) return 'green';
  return 'grey';
};

async function run() {
  const src = new URLSearchParams(location.search).get('src');
  const settings = await chrome.storage.sync.get(DEFAULTS);
  $('openApp').href = settings.appUrl;
  if (!src) {
    $('status').textContent = 'No image was selected.';
    return;
  }
  $('preview').src = src;

  try {
    // Extension pages may fetch cross-origin images thanks to host_permissions
    const imageResponse = await fetch(src);
    if (!imageResponse.ok) throw new Error(`Could not download the image (${imageResponse.status})`);
    const blob = await imageResponse.blob();
    const name = (src.startsWith('data:') ? 'image' : src.split('/').pop().split('?')[0]) || 'image';

    const form = new FormData();
    form.append('file', blob, name.includes('.') ? name : `${name}.${(blob.type.split('/')[1] || 'jpg')}`);
    if (settings.apiKey) form.append('api_key', settings.apiKey);

    const response = await fetch(`${settings.backendUrl}/api/analyze-media`, { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `Backend returned ${response.status}`);
    render(data.report);
  } catch (err) {
    $('status').className = 'status error';
    $('status').textContent = err.message.includes('Failed to fetch')
      ? `Could not reach the VeriLens backend at ${settings.backendUrl}. Is it running (python main.py)?`
      : `Check failed: ${err.message}`;
  }
}

function render(report) {
  $('status').hidden = true;
  $('result').hidden = false;

  $('verdict').textContent = report.verdict_category;
  $('verdict').className = `badge ${tone(report.verdict_category)}`;
  $('confidence').textContent = `Confidence: ${report.confidence}`;
  $('aiProb').textContent = report.ai_probability != null ? `${report.ai_probability}%` : '-';

  const edit = report.edit_analysis;
  $('editVerdict').textContent = edit ? `${edit.verdict} (${edit.edit_probability}%)` : '-';
  $('editVerdict').className = edit ? tone(edit.verdict) : '';

  $('summary').textContent = report.summary || '';
  if (report.api_notice) {
    $('notice').hidden = false;
    $('notice').textContent = report.api_notice;
  }

  const list = $('findings');
  const order = { high: 0, medium: 1, low: 2, neutral: 3 };
  (report.findings || [])
    .slice()
    .sort((a, b) => (order[a.suspicion_level] ?? 4) - (order[b.suspicion_level] ?? 4))
    .slice(0, 5)
    .forEach((f) => {
      const li = document.createElement('li');
      li.className = f.suspicion_level || 'neutral';
      const title = document.createElement('strong');
      title.textContent = f.label;
      const text = document.createElement('span');
      text.textContent = f.what_we_found || '';
      li.append(title, text);
      list.append(li);
    });
}

run();
