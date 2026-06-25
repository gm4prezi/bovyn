/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOVYN_API_URL?: string;
  readonly VITE_BOVYN_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
