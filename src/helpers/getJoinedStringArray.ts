export function getJoinedStringArray(parts: string[]) {
  // if (parts.length < 2) return parts[0];

  // const body = [...parts];
  // const tail = body.pop();

  // return `${body.join(', ')} and ${tail}`;
  return parts.join(', ');
}
