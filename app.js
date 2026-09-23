const form = document.querySelector('#gif-form');
const urlInput = document.querySelector('#gif-url');
const pasteButton = document.querySelector('#paste-button');
const message = document.querySelector('#message');
const result = document.querySelector('#result');
const preview = document.querySelector('#gif-preview');
const imageStatus = document.querySelector('#image-status');
const downloadButton = document.querySelector('#download-button');
const openButton = document.querySelector('#open-button');

let activeUrl = '';
let loaded = false;

function showMessage(text, success = false) {
  message.textContent = text;
  message.classList.toggle('success', success);
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}

function parseGifUrl(value) {
  let url;
  try { url = new URL(value.trim()); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  return url;
}

pasteButton.addEventListener('click', async () => {
  try {
    urlInput.value = await navigator.clipboard.readText();
    urlInput.focus();
    clearMessage();
  } catch {
    showMessage('Clipboard unavailable. Touch and hold the link field to paste.');
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearMessage();
  const url = parseGifUrl(urlInput.value);
  if (!url) {
    result.hidden = true;
    showMessage('Enter a valid http or https GIF link.');
    urlInput.focus();
    return;
  }

  activeUrl = url.href;
  loaded = false;
  result.hidden = false;
  preview.removeAttribute('src');
  imageStatus.textContent = 'Loading…';
  downloadButton.disabled = true;
  openButton.href = activeUrl;
  preview.src = activeUrl;
});

preview.addEventListener('load', () => {
  if (!activeUrl || preview.src !== activeUrl) return;
  loaded = true;
  imageStatus.textContent = 'Ready to save';
  downloadButton.disabled = false;
});

preview.addEventListener('error', () => {
  loaded = false;
  imageStatus.textContent = 'Preview unavailable';
  downloadButton.disabled = true;
  showMessage('Could not preview this link. Check that it points directly to a public GIF file, or open it in a new tab.');
});

function gifFilename(url) {
  const raw = url.pathname.split('/').pop() || 'gif';
  let last;
  try { last = decodeURIComponent(raw); } catch { last = raw; }
  const clean = last.replace(/[^a-z0-9._-]/gi, '-').replace(/\.+$/, '').slice(0, 80);
  return (clean || 'animation').replace(/\.[^.]+$/, '') + '.gif';
}

function saveBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}

downloadButton.addEventListener('click', async () => {
  if (!loaded || !activeUrl) return;
  downloadButton.disabled = true;
  downloadButton.firstChild.textContent = 'Preparing GIF ';
  clearMessage();
  try {
    const response = await fetch(activeUrl, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error('fetch failed');
    const blob = await response.blob();
    if (!blob.type.toLowerCase().startsWith('image/gif')) {
      showMessage('This link did not return a GIF file. Try a direct .gif link.');
      return;
    }
    saveBlob(blob, gifFilename(new URL(activeUrl)));
    showMessage('Download started. On iPhone, find it in Files → Downloads. To save to Photos, touch and hold the preview above.', true);
  } catch {
    showMessage('This GIF site blocks direct downloads here. Touch and hold the preview to save it, or tap Open GIF and save it there.');
  } finally {
    downloadButton.disabled = false;
    downloadButton.firstChild.textContent = 'Download GIF ';
  }
});
