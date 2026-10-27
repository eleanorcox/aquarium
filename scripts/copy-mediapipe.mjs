// Copies the hand-tracking runtime out of the installed package into public/, so the page loads it from
// this project instead of the internet. Runs after npm install. The model file is kept in the repository.
import { cpSync } from 'node:fs';

cpSync('node_modules/@mediapipe/tasks-vision/wasm', 'public/mediapipe/wasm', { recursive: true });
