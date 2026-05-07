import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function Popup() {
  return (
    <div style={{
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="11" fill="hsl(32,95%,54%)" />
          <text x="11" y="16" textAnchor="middle" fontSize="12" fontWeight="800"
            fontFamily="system-ui,sans-serif" fill="white">W</text>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917' }}>Worthly AI</span>
      </div>
      <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.5 }}>
        Visit any Amazon product page to see a verdict.
      </p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
