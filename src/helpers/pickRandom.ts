export const pickRandom = (arr: unknown[]) => {
  return arr[Math.floor(Math.random() * arr.length)];
};
