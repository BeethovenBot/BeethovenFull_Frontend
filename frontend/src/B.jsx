import { useState, useRef } from 'react';
import { procesarImagenCanvas } from './utils/procesarImagen';
import Historial from './components/historial';
import { clasificarVector as clasificarNumero } from './utils/clasificadorNum';
import { clasificarVector as clasificarPaloOBoton } from './utils/clasificador';
import { es1BB } from './utils/vector_classifier';
import './index.css';

function App() {
  const [recomendacion, setRecomendacion] = useState('');
  const [streamIniciado, setStreamIniciado] = useState(false);
  const [historial, setHistorial] = useState([]);
  const videoTrackRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSnapshotRef = useRef('');

  async function iniciarCaptura() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;
      setStreamIniciado(true);
      intervalRef.current = setInterval(capturarPantallaYEnviar, 1000);
    } catch (err) {
      console.error('Error al iniciar captura:', err);
      setRecomendacion('❌ No se pudo iniciar la captura.');
    }
  }

  
  async function cargarHistorial() {
    const res = await fetch('https://beethoven.up.railway.app/historial');
    const data = await res.json();
    setHistorial(data);
  }
async function detenerCaptura() {
    if (videoTrackRef.current) videoTrackRef.current.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
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

      const extraerRoiCanvas = ({ x, y, w, h }) => {
        const roiCanvas = document.createElement('canvas');
        roiCanvas.width = w;
        roiCanvas.height = h;
        const roiCtx = roiCanvas.getContext('2d');
        roiCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        return roiCanvas;
      };

      const coordenadas = [
        { x: 447, y: 498, w: 20, h: 25 }, { x: 447, y: 524, w: 18, h: 18 },
        { x: 514, y: 498, w: 20, h: 25 }, { x: 514, y: 524, w: 18, h: 18 },
        { x: 343, y: 278, w: 20, h: 25 }, { x: 343, y: 304, w: 18, h: 18 },
        { x: 414, y: 278, w: 20, h: 25 }, { x: 414, y: 304, w: 18, h: 18 },
        { x: 485, y: 278, w: 20, h: 25 }, { x: 485, y: 304, w: 18, h: 18 },
        { x: 556, y: 278, w: 20, h: 25 }, { x: 556, y: 304, w: 18, h: 18 },
        { x: 627, y: 278, w: 20, h: 25 }, { x: 627, y: 304, w: 18, h: 18 }
      ];

      const dealerROIs = [
        { x: 174, y: 267, w: 35, h: 28 }, { x: 406, y: 172, w: 35, h: 28 },
        { x: 813, y: 267, w: 35, h: 28 }, { x: 673, y: 476, w: 35, h: 28 },
        { x: 408, y: 489, w: 35, h: 28 }, { x: 318, y: 477, w: 35, h: 28 }
      ];

      const stackPotROIs = [
        { x: 207, y: 267, w: 70, h: 22 }, { x: 442, y: 219, w: 70, h: 22 },
        { x: 748, y: 267, w: 70, h: 22 }, { x: 678, y: 450, w: 70, h: 22 },
        { x: 517, y: 457, w: 70, h: 22 }, { x: 280, y: 451, w: 70, h: 22 },
        { x: 480, y: 380, w: 70, h: 22 },  // Pote
        { x: 86, y: 238, w: 91, h: 22 }, { x: 467, y: 153, w: 91, h: 22 },
        { x: 850, y: 238, w: 91, h: 22 }, { x: 764, y: 538, w: 91, h: 22 },
        { x: 464, y: 592, w: 91, h: 22 }, { x: 170, y: 538, w: 91, h: 22 }
      ];

      const cartas = [];
      for (let i = 0; i < coordenadas.length; i += 2) {
        const canvasNum = extraerRoiCanvas(coordenadas[i]);
        const canvasPalo = extraerRoiCanvas(coordenadas[i + 1]);
        const resNum = await procesarImagenCanvas(canvasNum, 20, 25);
        const resPalo = await procesarImagenCanvas(canvasPalo, 18, 18);
        const numero = clasificarNumero(resNum.vectorBinario);
        const palo = clasificarPaloOBoton(resPalo.vectorBinario);
        cartas.push(numero !== 'nada' && palo !== 'nada' ? `${numero} ${palo}` : "N/A");
      }

      const botonesDetectados = [];
      for (let roi of dealerROIs) {
        const canvasDealer = extraerRoiCanvas(roi);
        const resDealer = await procesarImagenCanvas(canvasDealer, 18, 18);
        botonesDetectados.push(resDealer.vectorBinario);
      }
      const boton_posicion = botonesDetectados.findIndex(vec => vec.some(v => v === 1)) + 1 || null;

      const cartas_jugador = cartas.slice(0, 2).filter(c => c !== 'N/A');
      const cartas_mesa = cartas.slice(2).filter(c => c !== 'N/A');

      const apuestas = [];
      for (let i = 0; i < 6; i++) {
        const canvasApuesta = extraerRoiCanvas(stackPotROIs[i]);
        const res = await procesarImagenCanvas(canvasApuesta, 70, 22);
        apuestas.push(es1BB(res.vectorBinario) ? "1 BB" : res.clase);
      }

      const potCanvas = extraerRoiCanvas(stackPotROIs[6]);
      const potRes = await procesarImagenCanvas(potCanvas, 70, 22);
      const pot = es1BB(potRes.vectorBinario) ? "1 BB" : potRes.clase;

      const stacks = [];
      for (let i = 7; i < stackPotROIs.length; i++) {
        const canvasStack = extraerRoiCanvas(stackPotROIs[i]);
        const res = await procesarImagenCanvas(canvasStack, 91, 22);
        stacks.push(res.clase);
      }

      const snapshot = JSON.stringify({ cartas_jugador, cartas_mesa, boton_posicion, asiento_jugador: 5 });
      if (snapshot === lastSnapshotRef.current) return;
      lastSnapshotRef.current = snapshot;

      if (cartas_jugador.length < 2) {
        setRecomendacion('⚠️ No se detectaron suficientes cartas para realizar una recomendación.');
        return;
      }

      setRecomendacion('⏳ Analizando…');

      const payload = {
        cartas_jugador,
        cartas_mesa,
        boton_posicion,
        asiento_jugador: 5,
        apuestas,
        pot,
        stacks
      };
      console.log("Enviando payload:", payload);

      const response = await fetch('https://beethoven.up.railway.app/guardar_historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setRecomendacion(data.resultado || '⚠️ No hay respuesta del backend.');

    } catch (err) {
      console.error('Error al capturar o procesar:', err);
      setRecomendacion('⚠️ Ocurrió un error al procesar la información.');
    }
  }

return (
  <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-6">
    <h1 className="text-3xl font-bold mb-4">Asistente de Póker</h1>

    {!streamIniciado ? (
      <button
        onClick={iniciarCaptura}
        className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-lg font-semibold mb-4"
      >
        Iniciar Captura
      </button>
    ) : (
      <button
        onClick={detenerCaptura}
        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg font-semibold mb-4"
      >
        Detener
      </button>
    )}

    <div className="bg-gray-800 p-6 rounded-lg max-w-xl w-full mt-4 shadow-md">
      <h2 className="text-xl font-semibold mb-2">🧠 Recomendación</h2>
      <p className="text-sm whitespace-pre-line">{recomendacion}</p>
    </div>

    <Historial />
  </div>
);

}

export default App;