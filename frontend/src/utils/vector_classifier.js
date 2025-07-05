import { vectores1BB } from "./vector1BBBase";

export function es1BB(vector) {
  for (let key in vectores1BB) {
    const ref = vectores1BB[key];
    if (ref.length !== vector.length) continue;

    let diferencias = 0;
    for (let i = 0; i < ref.length; i++) {
      if (ref[i] !== vector[i]) diferencias++;
    }

    const porcentajeDiferencia = diferencias / ref.length;
    if (porcentajeDiferencia < 0.05) {
      return true;
    }
  }

  return false;
}
