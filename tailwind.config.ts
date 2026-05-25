import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#081336",
        royal: "#1957ff",
        electric: "#2d7dff",
        mist: "#eef5ff",
        cloud: "#f8fbff"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(30, 85, 190, 0.09)",
        glow: "0 22px 50px rgba(45, 125, 255, 0.28)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
