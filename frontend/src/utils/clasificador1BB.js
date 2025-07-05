import { vectores1BB } from './vector1BBBase.js';

export function hammingDistance(v1, v2) {
  if (v1.length !== v2.length) return Infinity;
  return v1.reduce((acc, val, i) => acc + (val !== v2[i] ? 1 : 0), 0);
}

export function es1BB(vectorEntrada, umbral = 2) {
  for (const ejemplo of Object.values(vectores1BB)) {
    if (hammingDistance(vectorEntrada, ejemplo) <= umbral) {
      return true;
    }
  }
  return false;
}
