// The phone page's entry. The room comes from the address the tank's QR code opens: visit.html?room=CODE.
import './visit.css';
import { startVisitApp } from './visitApp';

const root = document.getElementById('app')!;
const room = new URLSearchParams(location.search).get('room')?.trim() ?? '';

if (room === '') {
  root.innerHTML = '<section class="message"><h1>Make a fish</h1><p>Scan the code on the tank to make a fish for it.</p></section>';
} else {
  startVisitApp(root, room);
}
