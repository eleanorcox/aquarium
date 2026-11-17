/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the visitor service is, for a real tank. Unset, the page looks for the development service. */
  readonly VITE_VISITOR_SERVICE?: string;
}
