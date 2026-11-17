// The invitation shown on the tank: the address of the phone page for this tank's room, as a QR code.
import qrcode from 'qrcode-generator';

/** The phone page beside the page at `pageHref`, for the room `room`. */
export function visitAddress(pageHref: string, room: string): string {
  const address = new URL('visit.html', pageHref);
  address.search = `?room=${encodeURIComponent(room)}`;
  address.hash = '';
  return address.href;
}

/** The QR code for `text`, as rows of dark (true) and light modules. Medium error correction survives a fuzzy projection. */
export function qrPattern(text: string): boolean[][] {
  const code = qrcode(0, 'M');
  code.addData(text);
  code.make();
  const n = code.getModuleCount();
  return Array.from({ length: n }, (_, row) => Array.from({ length: n }, (_, col) => code.isDark(row, col)));
}
