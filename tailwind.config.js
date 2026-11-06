/** Tokens mirror the original Webflow :root variables (src/styles/webflow.css). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Webflow ships its own normalize; Tailwind's preflight would override it.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        'brand-primary': 'var(--brand-primary)',     // #ff5400
        'brand-secondary': 'var(--brand-secondary)', // #f8eee8
        'brand-accent': 'var(--brand-accent)',       // #f9e2e1
        'brand-white': 'var(--brand-white)',         // #fdf8f5
        'brand-black': 'var(--brand-black)',         // #000
      },
      fontFamily: {
        primary: ['Mdnichrometest', 'Arial', 'sans-serif'],
        'primary-dark': ['"Mdnichrometest Dark"', 'Arial', 'sans-serif'],
        secondary: ['Neuemontreal', 'Arial', 'sans-serif'],
      },
    },
  },
}
