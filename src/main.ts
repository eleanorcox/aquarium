// The page is either the operator window, which runs the tank and has the controls, or a display window,
// opened with ?display, which only draws what the operator window sends it: for a projector.
// Both are loaded up front. Loading the operator on demand stalled the built site for good in Chrome,
// apparently because of the maths library it uses (decision 31).
import './style.css';
import { runDisplay } from './display/displayApp';
import { startOperator } from './operator';

const canvas = document.querySelector<HTMLCanvasElement>('#tank')!;
if (new URLSearchParams(location.search).has('display')) runDisplay(canvas);
else void startOperator();
