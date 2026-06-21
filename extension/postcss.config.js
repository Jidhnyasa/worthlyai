// Stops postcss-load-config from climbing up to the root app's
// postcss.config.js (which requires tailwindcss/autoprefixer — deps this
// extension doesn't have and doesn't need; its CSS is plain).
export default {
  plugins: {},
}
