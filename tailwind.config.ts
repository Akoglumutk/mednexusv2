import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Academia Palette
        bg: "#050505",       // Deepest Black
        surface: "#121212",  // Soft Charcoal
        accent: "#D4AF37",   // Gold
        "accent-dim": "#8C7321", // Muted Gold for borders/hover
      },
      fontFamily: {
        // Optional: Add a serif font here later for the "Academic" feel
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Needed for the Editor later
  ],
};
export default config;