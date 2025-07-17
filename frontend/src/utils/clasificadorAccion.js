// utils/clasificadorAccion.js
import vectorAccion from './vectoraccion.json';

export function esIgual(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return false;

  let iguales = 0;
  for (let i = 0; i < vectorA.length; i++) {
    if (vectorA[i] === vectorB[i]) iguales++;
  }

  const porcentaje = iguales / vectorA.length;
  return porcentaje >= 0.985; // 98.5% de coincidencia
}

export const vectorReferencia = vectorAccion.accion;
