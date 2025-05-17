// src/utils/googleFonts.ts

export const googleFonts = [
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Great Vibes",
    "Pacifico",
    "Poppins",
  ];
  
  export function loadGoogleFont(fontName: string) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
      /\s+/g,
      "+"
    )}&display=swap`;
    document.head.appendChild(link);
  }
  