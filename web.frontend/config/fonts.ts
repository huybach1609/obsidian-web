import localFont from "next/font/local";

export const fontSans = localFont({
  src: [
    {
      path: "./fonts/inter/InterDisplay-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/inter/InterDisplay-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/inter/InterDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/inter/InterDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/inter/InterDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/inter/InterDisplay-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const fontMono = localFont({
  src: [
    {
      path: "./fonts/jetBrains_mono/JetBrainsMono-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/jetBrains_mono/JetBrainsMono-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/jetBrains_mono/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/jetBrains_mono/JetBrainsMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/jetBrains_mono/JetBrainsMono-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});
