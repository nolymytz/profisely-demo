import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        "background":                "#f7f9fb",
        "surface":                   "#f7f9fb",
        "surface-bright":            "#f7f9fb",
        "surface-container-lowest":  "#ffffff",
        "surface-container-low":     "#f2f4f6",
        "surface-container":         "#eceef0",
        "surface-container-high":    "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "on-surface":                "#191c1e",
        "on-surface-variant":        "#45464d",
        "outline-variant":           "#c6c6cd",
        "outline":                   "#76777d",
        "primary-container":         "#111c2d",
        "on-primary-fixed":          "#111c2d",
        "tertiary-container":        "#002113",
        "on-tertiary-container":     "#009668",
        "error-container":           "#ffdad6",
        "on-error-container":        "#93000a",
        "secondary-container":       "#d5e3fd",
        "on-secondary-fixed-variant":"#3a485c",
        "inverse-surface":           "#2d3133",
        "inverse-on-surface":        "#eff1f3",
      },
      fontFamily: {
        sans:     ["var(--font-inter)", "system-ui", "sans-serif"],
        manrope:  ["var(--font-manrope)", "Manrope", "sans-serif"],
        headline: ["var(--font-manrope)", "Manrope", "sans-serif"],
        body:     ["var(--font-inter)", "Inter", "sans-serif"],
        label:    ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
