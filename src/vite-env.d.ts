/// <reference types="vite/client" />

/**
 * Global stylesheets (Tailwind / index.css) — side-effect imports in main.tsx.
 * Required for TypeScript 5.6+ / 6.x module resolution with Vite.
 */
declare module '*.css' {}
declare module '*.scss' {}
declare module '*.sass' {}
declare module '*.less' {}
