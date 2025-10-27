interface ImportMetaEnv {
  readonly VITE_TMA_MIGRATION_ENABLED?: string;
  readonly VITE_TMA_MIGRATION_SAFE_AREA?: string;
  readonly VITE_TMA_MIGRATION_THEME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
