import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        // В dev-режиме запросы /api уходят на бэкенд, поэтому CORS не нужен
        proxy: {
            "/api": "http://127.0.0.1:4000",
        },
    },
});
