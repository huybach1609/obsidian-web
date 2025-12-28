import { heroui } from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      prefix: "heroui", // prefix for themes variables
      addCommonColors: false, // override common colors (e.g. "blue", "green", "pink").
      defaultTheme: "light", // default theme from the themes object
      defaultExtendTheme: "light", // default theme to extend on custom themes
      layout: {}, // common layout tokens (applied to all themes)
      themes: {
        light: {
          layout: {}, // light theme layout tokens
          colors: {
            background: "#ede0d4",
            background1: "#f5f5f5",
            foreground: "#03071e",
            foreground1: "#333333",
            primary: "#d32f2f",
            secondary: "#ff7043",
            warning: "#ff9800",
            error: "#c62828",
            code: "#333333",
            codeBackground: "#ecd6c0",
            quote: "#666666",
            quoteBorder: "#bdbdbd",
            border: "#e0e0e0",
          }, // light theme colors
        },
        dark: {
          layout: {}, // dark theme layout tokens
          colors: {
            background: "#1e1e1e",
            background1: "#080807",
            foreground: "#f8f8f2",
            foreground1: "#cccccc",
            primary: "#ff6961",
            secondary: "#ffa07a",
            warning: "#ffb74d",
            error: "#ef5350",
            code: "#f8f8f2",
            codeBackground: "#333333",
            quote: "#cccccc",
            quoteBorder: "#555555",
            border: "#444444",
          }, // dark theme colors
        },
      },
    }),
  ],
}

export default config;