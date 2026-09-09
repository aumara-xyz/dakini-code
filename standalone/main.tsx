import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';

// The shell keeps app frames mounted; only its same-origin parent controls this seat.
if (window.parent !== window) {
  document.documentElement.dataset.surfaceActive = 'false';
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    const message = event.data;
    if (message?.source !== 'aukora-shell' || message?.type !== 'surface-active'
      || message?.app !== 'dakini-code' || typeof message.active !== 'boolean') return;
    document.documentElement.dataset.surfaceActive = String(message.active);
    document.dispatchEvent(new Event('dakini-surface-visibility'));
  });
}

createRoot(document.getElementById('root')!).render(<Home/>);
