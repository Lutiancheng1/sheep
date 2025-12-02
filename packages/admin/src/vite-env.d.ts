/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_KEY?: string; // 可选,开发环境可不设置
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
