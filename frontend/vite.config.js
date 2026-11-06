// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3000,
//     strictPort: true,
//     open: true,
//     proxy: {
//       '/api': {
//         target: 'http://127.0.0.1:3001',
//         changeOrigin: true,
//       }
//     }
//   }
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    allowedHosts: true, // <--- ESTA ES LA LÍNEA NUEVA QUE DEBES AGREGAR
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    }
  }
})