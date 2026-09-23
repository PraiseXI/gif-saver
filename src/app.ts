import { gifFilename, parseGifUrl } from './core.js';

const form = document.querySelector<HTMLFormElement>('#gif-form');
const urlInput = document.querySelector<HTMLInputElement>('#gif-url');
const pasteButton = document.querySelector<HTMLButtonElement>('#paste-button');
const message = document.querySelector<HTMLDivElement>('#message');
const result = document.querySelector<HTMLElement>('#result');
const preview = document.querySelector<HTMLImageElement>('#gif-preview');
const imageStatus = document.querySelector<HTMLSpanElement>('#image-status');
const downloadButton = document.querySelector<HTMLButtonElement>('#download-button');
const openButton = document.querySelector<HTMLAnchorElement>('#open-button');

if (!form || !urlInput || !pasteButton || !message || !result || !preview || !imageStatus || !downloadButton || !openButton) {
  throw new Error('GIF Saver UI is incomplete');
}

const statusMessage = message;
const downloadLabel = downloadButton.firstChild;
if (!(downloadLabel instanceof Text)) {
  throw new Error('Download button label is missing');
}

let activeUrl = '';
let loaded = false;

function showMessage(text: string, success = false): void {
  statusMessage.textContent = text;
  statusMessage.classList.toggle('success', success);
  statusMessage.hidden = false;
}

function clearMessage(): void {
  statusMessage.hidden = true;
  statusMessage.textContent = '';
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

form.addEventListener('submit', (event: SubmitEvent) => {
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

function saveBlob(blob: Blob, filename: string): void {
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
  downloadLabel.textContent = 'Preparing GIF ';
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
    downloadLabel.textContent = 'Download GIF ';
  }
});
