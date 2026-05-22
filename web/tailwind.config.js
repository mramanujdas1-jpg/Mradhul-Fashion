/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#701122",      // Royal Maroon (Mapped to Primary)
          primaryDark: "#A91B33",  // Deep Crimson (Mapped to PrimaryDark)
          maroon: "#701122",       // Royal Maroon
          crimson: "#A91B33",      // Deep Crimson
          gold: "#C5A059",         // Antique Gold
          goldLight: "#EAD6B0",    // Soft Gold
          cream: "#FAF7F2",        // Ivory (Mapped to Cream)
          ivory: "#FAF7F2",        // Pure Ivory
          beige: "#F5EFE6",        // Sand Beige
          pink: "#D24D69",         // Jaipur Pink
          softPink: "#F8D8DC",     // Pastel Pink
          obsidian: "#1E1617",     // Deep Royal Dark
          charcoal: "#2B1D20",     // Container Royal Dark
          silver: "#E5E5E5"
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
