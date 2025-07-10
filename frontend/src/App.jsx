import { useState, useRef } from 'react';
import './index.css';

function CapturasDebug({ images }) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {images.map((src, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <img src={src} alt={`ROI ${idx}`} className="w-24 h-auto border border-white" />
          <span className="text-xs mt-1">ROI {idx + 1}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [recomendacion, setRecomendacion] = useState('');
  const [streamIniciado, setStreamIniciado] = useState(false);
  const [debugImages, setDebugImages] = useState([]);
  const videoTrackRef = useRef(null);
  const intervalRef = useRef(null);
  const lastHashRef = useRef([]);

  async function enviarAlOCR(canvasList) {
    const formData = new FormData();

    canvasList.forEach((canvas, idx) => {
      canvas.toBlob(blob => {
        formData.append('imagenes', blob, `imagen${idx}.png`);
      }, 'image/png');
    });

    // Esperar un ciclo para asegurarse que todos los blobs se agregaron
    await new Promise(resolve => setTimeout(resolve, 100));

    const response = await fetch('https://beethoven-bot-backend.vercel.app/api/ocr', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    // Extraer textos si vienen en formato { results: [...] }
    const textos = data.results?.map(res => res.result?.map(r => r[1])).flat() || [];
    return textos;
  }

  async function capturarPantallaYProcesar() {
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

      const stackPotROIs = [
        { x: 207, y: 267, w: 70, h: 22 }, { x: 442, y: 219, w: 70, h: 22 },
        { x: 748, y: 267, w: 70, h: 22 }, { x: 678, y: 450, w: 70, h: 22 },
        { x: 517, y: 457, w: 70, h: 22 }, { x: 280, y: 451, w: 70, h: 22 },
        { x: 480, y: 380, w: 70, h: 22 },
        { x: 86, y: 238, w: 91, h: 22 }, { x: 467, y: 153, w: 91, h: 22 },
        { x: 850, y: 238, w: 91, h: 22 }, { x: 764, y: 538, w: 91, h: 22 },
        { x: 464, y: 592, w: 91, h: 22 }, { x: 170, y: 538, w: 91, h: 22 },
      ];

      const canvasList = stackPotROIs.map(({ x, y, w, h }) => {
        const roiCanvas = document.createElement('canvas');
        roiCanvas.width = w;
        roiCanvas.height = h;
        const roiCtx = roiCanvas.getContext('2d');
        roiCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        return roiCanvas;
      });

      const currentHashes = canvasList.map(canvas => canvas.toDataURL());
      const algunaCambio = lastHashRef.current.length === 0 || currentHashes.some((hash, idx) => hash !== lastHashRef.current[idx]);

      if (!algunaCambio) {
        setRecomendacion("⏸️ Imágenes iguales a la última captura. No se envía al backend.");
        return;
      }

      lastHashRef.current = currentHashes;
      setDebugImages(currentHashes);

      const textos = await enviarAlOCR(canvasList);

      setRecomendacion(
        `🔎 Resultados del OCR:\n\n${textos.map((t, i) => `• ${t}`).join('\n')}`
      );
    } catch (err) {
      console.error('Error al capturar o procesar:', err);
      setRecomendacion('⚠️ Ocurrió un error al procesar la información.');
    }
  }

  async function iniciarCaptura() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;
      setStreamIniciado(true);
      intervalRef.current = setInterval(capturarPantallaYProcesar, 1000);
    } catch (err) {
      console.error('Error al iniciar captura:', err);
      setRecomendacion('❌ No se pudo iniciar la captura.');
    }
  }

  async function detenerCaptura() {
    if (videoTrackRef.current) videoTrackRef.current.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStreamIniciado(false);
    setRecomendacion('🔴 Tracking detenido.');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-4">Asistente de Póker</h1>

      {!streamIniciado ? (
        <button onClick={iniciarCaptura} className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-lg font-semibold mb-4">
          Iniciar Captura
        </button>
      ) : (
        <button onClick={detenerCaptura} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg font-semibold mb-4">
          Detener
        </button>
      )}

      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mt-4">
        <h2 className="text-xl font-semibold mb-2">🧠 OCR Detectado</h2>
        <pre className="text-sm whitespace-pre-wrap break-words">{recomendacion}</pre>
      </div>

      <CapturasDebug images={debugImages} />
    </div>
  );
}

export default App;
