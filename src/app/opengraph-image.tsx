import { ImageResponse } from 'next/og';
 
// Route segment config
export const runtime = 'edge';
 
// Image metadata
export const alt = 'FinanceTracker - Gestión de Finanzas Personales';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #ebf5ff, #ffffff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          padding: 48,
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 40,
          background: '#2563eb',
          color: 'white',
          padding: '0 40px',
          borderRadius: 24,
        }}>
          <span style={{ fontSize: 80, marginRight: 20 }}>💰</span>
          <span style={{ fontWeight: 'bold' }}>FinanceTracker</span>
        </div>
        <div style={{ 
          fontSize: 48, 
          color: '#4b5563',
          textAlign: 'center',
          maxWidth: '80%',
        }}>
          Gestiona tus finanzas personales de manera fácil y eficiente
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse options
      ...size,
    }
  );
}
