# Hand tracking files

`hand_landmarker.task` is Google's MediaPipe hand landmarker model, downloaded from
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task

Its model card ("Hand Tracking (Lite/Full) with Fairness", October 2021,
https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20(Lite_Full)%20with%20Fairness%20Oct%202021.pdf)
says it is licensed under the Apache License, Version 2.0, a copy of which is in `LICENSE-2.0.txt`.
Copyright Google LLC. It is used unchanged.

`wasm/` is copied from the `@mediapipe/tasks-vision` package, also Apache 2.0, by `npm install`.
