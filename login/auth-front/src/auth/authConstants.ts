const isProduction = window.location.hostname !== "localhost";

export const URL = isProduction
  ? "https://api.santiago.maxtelperu.com"
  : "http://localhost:3000";

export const API_URL = `${URL}/api`;