// config.ts

// Pour Vite : import.meta.env.VITE_... 
// Pour CRA : process.env.REACT_APP_...

export const API_BASE_URL =
  // Vite
  (typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_URL) ||
  // CRA
  (typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_API_URL) ||
  // fallback si aucune variable n'est définie
  "http://localhost:3000";

console.log("API_BASE_URL:", API_BASE_URL);
