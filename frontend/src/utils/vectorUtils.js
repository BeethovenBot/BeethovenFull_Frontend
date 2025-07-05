export function getBinaryVectorFromImage(ctx, width, height, threshold = 150) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const binaryVector = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const avg = (r + g + b) / 3;
    binaryVector.push(avg < threshold ? 1 : 0);
  }

  return binaryVector;
}
