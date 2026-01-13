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
        'hot-pink': '#DA62B0',
        'burgundy': '#823E50',
        'desert-sun': '#B28260',
        'rose-quartz': '#FADCDC',
        'bg-primary': '#FDF6F6',
        'bg-secondary': '#FFFFFF',
        'bg-card': '#FFF5F5',
        'text-primary': '#4A2A35',
        'text-secondary': '#8B6B75',
        'text-muted': '#B28260',
        'border': '#F0D0D0',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
