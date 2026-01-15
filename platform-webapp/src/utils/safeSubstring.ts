export const safeSubstring = (value: string | null | undefined, start: number, end?: number): string => {
  if (!value) {
    return ''; // Retourne une chaîne vide si la valeur est null ou undefined
  }
  return value.substring(start, end);
};
