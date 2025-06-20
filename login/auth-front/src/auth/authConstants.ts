const isProduction = window.location.hostname !== "localhost";

export const API_URL = isProduction
  ? "https://api.santiago.maxtelperu.com"
  : "http://localhost:3000";

