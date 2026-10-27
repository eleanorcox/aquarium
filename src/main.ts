// The page is either the operator window, which runs the tank and has the controls, or a display window,
// opened with ?display, which only draws what the operator window sends it: for a projector.
import './style.css';

if (new URLSearchParams(location.search).has('display')) {
  const { runDisplay } = await import('./display/displayApp');
  runDisplay(document.querySelector<HTMLCanvasElement>('#tank')!);
} else {
  await import('./operator');
}
