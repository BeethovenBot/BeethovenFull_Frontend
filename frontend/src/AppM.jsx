import React, { useRef, useState } from "react";
import { procesarImagenCanvas } from "./utils/procesarImagen";
import { clasificarVector as clasificarPaloOBoton } from "./utils/clasificador";
import { clasificarVector } from "./utils/clasificadorNum";
import { es1BB } from "./utils/vector_classifier";
import './index.css';


export default function App() {
  const divRef = useRef(null);
  const [recomendacion, setRecomendacion] = useState("");

  const coordenadasCartas = [
    { x: 447, y: 498, w: 20, h: 25 },
    { x: 447, y: 524, w: 18, h: 18 },
    { x: 514, y: 498, w: 20, h: 25 },
    { x: 514, y: 524, w: 18, h: 18 },
    { x: 343, y: 278, w: 20, h: 25 },
    { x: 343, y: 304, w: 18, h: 18 },
    { x: 414, y: 278, w: 20, h: 25 },
    { x: 414, y: 304, w: 18, h: 18 },
    { x: 485, y: 278, w: 20, h: 25 },
    { x: 485, y: 304, w: 18, h: 18 },
    { x: 556, y: 278, w: 20, h: 25 },
    { x: 556, y: 304, w: 18, h: 18 },
    { x: 627, y: 278, w: 20, h: 25 },
    { x: 627, y: 304, w: 18, h: 18 },
  ];

  const dealerROIs = [
    { x: 174, y: 267, w: 35, h: 28 },
    { x: 406, y: 172, w: 35, h: 28 },
    { x: 813, y: 267, w: 35, h: 28 },
    { x: 673, y: 476, w: 35, h: 28 },
    { x: 408, y: 489, w: 35, h: 28 },
    { x: 318, y: 477, w: 35, h: 28 },
  ];

  const stackPotROIs = [
    { x: 207, y: 267, w: 70, h: 22 },
    { x: 442, y: 219, w: 70, h: 22 },
    { x: 748, y: 267, w: 70, h: 22 },
    { x: 678, y: 450, w: 70, h: 22 },
    { x: 517, y: 457, w: 70, h: 22 },
    { x: 280, y: 451, w: 70, h: 22 },
    { x: 480, y: 380, w: 70, h: 22 },
    { x: 86, y: 238, w: 91, h: 22 },
    { x: 467, y: 153, w: 91, h: 22 },
    { x: 850, y: 238, w: 91, h: 22 },
    { x: 764, y: 538, w: 91, h: 22 },
    { x: 464, y: 592, w: 91, h: 22 },
    { x: 170, y: 538, w: 91, h: 22 },
  ];

  const capturar = async () => {
    const canvas = await html2canvas(document.body);
    const base64s = await Promise.all(stackPotROIs.map(roi => procesarImagenCanvas(canvas, roi)));
    const cartas = await Promise.all(coordenadasCartas.map(c => procesarImagenCanvas(canvas, c)));
    const dealer = await Promise.all(dealerROIs.map(d => procesarImagenCanvas(canvas, d)));

    const cartasJugador = [
      clasificarVector(cartas[0]) + " " + clasificarPaloOBoton(cartas[1]),
      clasificarVector(cartas[2]) + " " + clasificarPaloOBoton(cartas[3])
    ];

    const cartasMesa = [];
    for (let i = 4; i < cartas.length; i += 2) {
      const numero = clasificarVector(cartas[i]);
      const palo = clasificarPaloOBoton(cartas[i + 1]);
      if (numero && palo) cartasMesa.push(numero + " " + palo);
    }

    const botonPos = dealer.findIndex(v => clasificarPaloOBoton(v) === "BOTON") + 1;

    const payload = {
      cartas_jugador: cartasJugador,
      cartas_mesa: cartasMesa,
      boton_posicion: botonPos,
      asiento_jugador: 5,
      imagenes: base64s,
    };

    try {
      const res = await fetch("https://beethoven.up.railway.app/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setRecomendacion(data.respuesta || "No hay recomendación");
    } catch (err) {
      console.error("Error:", err);
      setRecomendacion("No hay respuesta del backend.");
    }
  };

  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "white", padding: "2rem" }} ref={divRef}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Asistente de Póker</h1>
      <button onClick={capturar} style={{ background: "#b45309", padding: "1rem", fontSize: "1rem", borderRadius: "0.5rem" }}>
        Iniciar Captura
      </button>
      <div style={{ background: "#1f2937", marginTop: "2rem", padding: "1rem", borderRadius: "0.5rem" }}>
        🧠 <strong>Recomendación</strong>
        <p>{recomendacion}</p>
      </div>
    </div>
  );
}