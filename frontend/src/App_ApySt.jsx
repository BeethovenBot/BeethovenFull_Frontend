import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import './index.css';

function App() {
  const [recomendacion, setRecomendacion] = useState('');
  const [streamIniciado, setStreamIniciado] = useState(false);
  const [debugImages, setDebugImages] = useState([]);
  const videoTrackRef = useRef(null);
  const intervalRef = useRef(null);
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
  async function extraerTextosOCR(canvasList) {
    const base64List = canvasList.map(canvas => {
      const dataUrl = canvas.toDataURL('image/jpeg');
      return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    });
    const response = await fetch('https://beethoven.up.railway.app/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imagenes: base64List })
    });
    const data = await response.json();
    return data.textos || [];
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
        // Apuestas
        { x: 207, y: 267, w: 70, h: 22 },
        { x: 442, y: 219, w: 70, h: 22 },
        { x: 748, y: 267, w: 70, h: 22 },
        { x: 678, y: 450, w: 70, h: 22 },
        { x: 517, y: 457, w: 70, h: 22 },
        { x: 280, y: 451, w: 70, h: 22 },

        // Pote
        { x: 480, y: 380, w: 70, h: 22 },

        // Stacks totales (valores aproximados, AJUSTA estos valores en pantalla)
        { x: 86, y: 238, w: 91, h: 22 }, // Stack jugador 1 
        { x: 467, y: 153, w: 91, h: 22 }, // Stack jugador 2 
        { x: 850, y: 238, w: 91, h: 22 }, // Stack jugador 3
        { x: 764, y: 538, w: 91, h: 22 }, // Stack jugador 4
        { x: 464, y: 592, w: 91, h: 22 }, // Stack jugador 5
        { x: 170, y: 538, w: 91, h: 22 }, // Stack jugador 6
      ];

      const canvasList = stackPotROIs.map(({ x, y, w, h }) => {
        const roiCanvas = document.createElement('canvas');
        roiCanvas.width = w;
        roiCanvas.height = h;
        const roiCtx = roiCanvas.getContext('2d');
        roiCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        return roiCanvas;
      });

      const textos = await extraerTextosOCR(canvasList);
      const debugImgs = canvasList.map(canvas => canvas.toDataURL());

      setDebugImages(debugImgs);

      const apuestas = textos.slice(0, 6);
      const pote = textos[6];
      const stacks = textos.slice(7);

      setRecomendacion(
        `📸 Capturando en pantalla...
Stacks actuales: ${stacks.join(', ')}
Apuestas: ${apuestas.join(', ')}
Pote: ${pote}`
      );

    } catch (err) {
      console.error('Error al capturar o procesar:', err);
      setRecomendacion('⚠️ Ocurrió un error al procesar la información.');
    }
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

      <div className="bg-gray-800 p-6 rounded-lg max-w-xl w-full mt-4">
        <h2 className="text-xl font-semibold mb-2">🧠 Recomendación</h2>
        <p className="text-sm whitespace-pre-line">{recomendacion}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {debugImages.map((src, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <img src={src} alt={`ROI ${idx}`} className="w-24 h-auto border border-white" />
            <span className="text-xs mt-1">ROI {idx + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
