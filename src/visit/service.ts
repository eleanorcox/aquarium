// Where the visitor service is. Set VITE_VISITOR_SERVICE when building for a real tank.
const DEV_PORT = 8787;

/** The configured address, or the development service on the machine that served this page. */
export function serviceAddress(
  configured: string | undefined = import.meta.env.VITE_VISITOR_SERVICE,
  here: { protocol: string; hostname: string } = location,
): string {
  if (configured) return configured.replace(/\/+$/, '');
  return `${here.protocol}//${here.hostname}:${DEV_PORT}`;
}
