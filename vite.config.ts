import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// production或watch模式
const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // 开发服务器配置
  server: {
    port: 3000,
    host: "localhost",
    open: true,
    cors: true,
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: "localhost",
  },

  // 构建配置 - 专门用于WebView的React应用
  build: {
    outDir: "dist/web",
    rollupOptions: {
      input: {
        // 只构建WebView应用，extension仍然由esbuild处理
        webview: resolve(__dirname, "src/web/webview/index.tsx"),
      },
      external: ["vscode"],
      output: {
        // WebView输出为ES模块，可以在浏览器中直接运行
        entryFileNames: "webview.js",
        chunkFileNames: "webview-[name].js",
        assetFileNames: "webview-[name].[ext]",
        format: "es",
      },
    },
    sourcemap: !isProduction,
    minify: isProduction ? "terser" : false,
    emptyOutDir: false, // 不清空输出目录，因为还有其他文件
  },

  // TypeScript配置
  esbuild: {
    target: "ES2020",
  },

  // 路径解析
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/web": resolve(__dirname, "src/web"),
      "@/components": resolve(__dirname, "src/web/components"),
      "@/utils": resolve(__dirname, "src/web/utils"),
      "@web": resolve(__dirname, "src/web"),
      "@components": resolve(__dirname, "src/web/components"),
      "@utils": resolve(__dirname, "src/web/utils"),
    },
  },

  // 定义全局变量
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isProduction ? "production" : "development"
    ),
    global: "globalThis",
  },

  // 环境变量前缀
  envPrefix: "VITE_",

  // CSS处理
  css: {
    // 确保CSS变量正确处理
    preprocessorOptions: {},
  },
});
