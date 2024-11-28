import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import autoprefixer from "autoprefixer"
import tailwind from "tailwindcss"
export default defineConfig({
    css:{
    postcss:{
        plugins:[tailwind(),autoprefixer()]
    }
    },
    root:'./src/renderer/',
    plugins:[
        vue(),
    ],
    server:{
        port: 3001
    },
})