export const pickRandom = (arr: any[]) =>
  arr[Math.floor(Math.random() * arr.length)];

export const randomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(max - min) + min;
};
