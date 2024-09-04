/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT_URL: string;
}

interface Importmeta {
  readonly env: ImportMetaEnv;
}
