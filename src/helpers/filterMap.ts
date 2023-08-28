export function filterMap<T = unknown, U = unknown>(
  collection: T[],
  filter: (value: T, index: number) => boolean,
  map: (value: T, index: number) => U,
) {
  const mapped: U[] = [];

  for (let i = 0; i < collection.length; i++) {
    const value = collection[i];

    if (filter(value, i)) {
      mapped.push(map(value, i));
    }
  }

  return mapped;
}
