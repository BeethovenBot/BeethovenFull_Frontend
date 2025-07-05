  import { useState, useRef } from 'react';
import './index.css';

function App() {
  const [recomendacion, setRecomendacion] = useState('');
  const [streamIniciado, setStreamIniciado] = useState(false);

  const videoTrackRef = useRef(null);
  const intervalRef = useRef(null);

  const API_URL = 'http://localhost:8000';

  async function iniciarCaptura() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;
      setStreamIniciado(true);

      intervalRef.current = setInterval(capturarPantallaYEnviar, 10000);
    } catch (err) {
      console.error('Error al iniciar captura:', err);
      setRecomendacion('❌ No se pudo iniciar la captura.');
    }
  }

  async function detenerCaptura() {
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStreamIniciado(false);
    setRecomendacion('🔴 Tracking detenido.');
  }

  async function capturarPantallaYEnviar() {
    if (!videoTrackRef.current) return;

    try {
      const video = document.createElement('video');
      video.srcObject = new MediaStream([videoTrackRef.current]);
      video.muted = true;
      await video.play();

      const fullWidth = video.videoWidth;
      const fullHeight = video.videoHeight;

      const canvas = document.createElement('canvas');
      canvas.width = fullWidth;
      canvas.height = fullHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, fullWidth, fullHeight);

      // Carta 1
      const roi1 = { x: 446, y: 498, width: 20, height: 25 };  // Número
      const roi2 = { x: 446, y: 524, width: 18, height: 18 };  // Palo

      // Carta 2 (68 px a la derecha)
      const roi3 = { x: roi1.x + 68, y: roi1.y, width: roi1.width, height: roi1.height };
      const roi4 = { x: roi2.x + 68, y: roi2.y, width: roi2.width, height: roi2.height };

      function extraerRoi(roi) {
        const roiCanvas = document.createElement('canvas');
        roiCanvas.width = roi.width;
        roiCanvas.height = roi.height;
        const roiCtx = roiCanvas.getContext('2d');
        roiCtx.drawImage(canvas, roi.x, roi.y, roi.width, roi.height, 0, 0, roi.width, roi.height);
        return roiCanvas.toDataURL('image/jpeg', 1.0);
      }

      const roi1Data = extraerRoi(roi1);
      const roi2Data = extraerRoi(roi2);
      const roi3Data = extraerRoi(roi3);
      const roi4Data = extraerRoi(roi4);

      const response = await fetch(`${API_URL}/procesar-imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagen1: roi1Data,
          imagen2: roi2Data,
          imagen3: roi3Data,
          imagen4: roi4Data
        })
      });

      const data = await response.json();
      setRecomendacion(data.mensaje || data.respuesta || '✅ Imágenes enviadas correctamente.');
    } catch (err) {
      console.error('Error al capturar o enviar la imagen:', err);
      setRecomendacion('❌ Error al capturar o enviar la imagen.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Asistente de Póker con IA</h1>

      {!streamIniciado ? (
        <button
          onClick={iniciarCaptura}
          className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-lg font-semibold mb-4"
        >
          Iniciar Captura de Pantalla
        </button>
      ) : (
        <button
          onClick={detenerCaptura}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg font-semibold mb-4"
        >
          Detener Tracking
        </button>
      )}

      <div className="bg-gray-800 p-4 rounded mt-4 max-w-2xl text-left min-h-[100px] w-full">
        <h2 className="text-xl font-semibold mb-2">📝 Recomendación:</h2>
        <p className="whitespace-pre-line">{recomendacion}</p>
      </div>
    </div>
  );
}

export default App;
