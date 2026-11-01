import { f as get, i as notify, l as state, m as set, r as c } from './shell-DuKJJrzf.js';

const MEASUREMENTS = [
  ['Face width', 234, 454],
  ['Face height', 10, 152],
  ['Interocular', 33, 263],
  ['Nose width', 129, 358],
  ['Mouth width', 61, 291],
  ['Jaw width', 172, 397],
];

function distance(points, left, right) {
  const a = points[left];
  const b = points[right];
  if (!a || !b) return null;
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 1000) / 1000;
}

function faceProfile(result) {
  const points = result.faceLandmarks?.[0] ?? [];
  const measurements = Object.fromEntries(MEASUREMENTS.map(([label, left, right]) => [label, distance(points, left, right)]));
  const blendshapes = (result.faceBlendshapes?.[0]?.categories ?? []).map(category => category.categoryName);
  return {
    savedAt: new Date().toISOString(),
    landmarkPoints: points.length,
    measurements,
    blendshapes,
    points: points.map(point => [Math.round(point.x * 10000) / 10000, Math.round(point.y * 10000) / 10000, Math.round((point.z ?? 0) * 10000) / 10000]),
  };
}

function drawLandmarks(canvas, points) {
  const context = canvas.getContext('2d');
  if (!context || !points.length) return;
  context.save();
  context.fillStyle = '#ffcf4a';
  for (const point of points) {
    const x = point.x * canvas.width;
    const y = point.y * canvas.height;
    context.beginPath();
    context.arc(x, y, 1.3, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

export const FaceScanView = {
  async render({ root }) {
    const video = c('video', {
      class: 'video',
      playsinline: true,
      autoplay: true,
      muted: true,
      'aria-label': 'Live camera preview for the on-device face scan. Video is processed locally and never uploaded.',
    });
    const canvas = c('canvas', {
      class: 'canvas',
      width: 640,
      height: 640,
      role: 'img',
      'aria-label': 'Face-scan frame with landmark points analysed on this device.',
    });
    const status = c('p', { class: 'muted', role: 'status', 'aria-live': 'polite' });
    const profileText = c('div', { class: 'muted' });
    const back = get(state.faceBack);
    if (back) status.textContent = `Returning to ${back} when you are done.`;

    let stream = null;
    let landmarker = null;
    let latest = null;

    const startCamera = c('button', { class: 'btn primary', type: 'button', text: 'Start camera' });
    const run = c('button', { class: 'btn', type: 'button', text: 'Run face landmarker', disabled: true });
    const keep = c('button', { class: 'btn', type: 'button', text: 'Keep this scan on this device', disabled: true });
    const download = c('button', { class: 'btn', type: 'button', text: 'Download face profile', disabled: true });
    const photo = c('input', { type: 'file', accept: 'image/*', capture: 'user', 'aria-label': 'Choose a face photo', hidden: true });
    const photoLabel = c('label', { class: 'btn', for: 'facePhoto' }, 'Use a photo');
    photo.id = 'facePhoto';
    const drop = c('div', { class: 'muted', text: 'Or drop a photo here. The photo is read in this tab and never uploaded.' });

    async function getLandmarker() {
      if (landmarker) return landmarker;
      status.textContent = 'Loading the on-device model…';
      const vision = await import('/face-scan/lib/vision_bundle.mjs');
      const fileset = await vision.FilesetResolver?.forVisionTasks('/face-scan/wasm');
      landmarker = await vision.FaceLandmarker?.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/face-scan/models/face_landmarker.task', delegate: 'GPU' },
        runningMode: 'IMAGE',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
      if (!fileset || !landmarker) throw new Error('vision bundle did not expose the landmarker');
      return landmarker;
    }

    async function analyse(source, label) {
      try {
        const detector = await getLandmarker();
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        const image = new Image();
        image.src = canvas.toDataURL('image/png');
        await image.decode();
        const result = detector.detect(image);
        const points = result.faceLandmarks?.[0] ?? [];
        if (!points.length) throw new Error('no face found in that image');
        drawLandmarks(canvas, points);
        latest = faceProfile(result);
        keep.disabled = false;
        download.disabled = false;
        const values = MEASUREMENTS.map(([name]) => `${name} ${latest.measurements[name] ?? '—'}`);
        profileText.replaceChildren(
          c('p', { text: `${label}: ${latest.landmarkPoints} landmarks, ${latest.blendshapes.length} blendshape channels. Nothing was uploaded.` }),
          c('p', { class: 'muted', text: values.join(' · ') }),
        );
        status.textContent = 'Model ran on-device. Review the points and keep the profile if it looks right.';
      } catch (error) {
        status.textContent = `Face model unavailable in this build: ${error instanceof Error ? error.message : 'unknown error'}`;
      }
    }

    startCamera.addEventListener('click', async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 720, height: 720 }, audio: false });
        video.srcObject = stream;
        await video.play();
        run.disabled = false;
        status.textContent = 'Camera ready. Nothing leaves your device.';
      } catch (error) {
        status.textContent = `Camera unavailable: ${error instanceof Error ? error.message : 'permission denied'}`;
      }
    });

    run.addEventListener('click', async () => {
      if (!video.videoWidth) {
        status.textContent = 'Start the camera first, or use a photo.';
        return;
      }
      await analyse(video, 'Camera frame');
    });

    photo.addEventListener('change', async () => {
      const file = photo.files?.[0];
      if (!file) return;
      try {
        const bitmap = await createImageBitmap(file);
        await analyse(bitmap, file.name || 'Photo');
      } catch (error) {
        status.textContent = `Could not read that photo: ${error instanceof Error ? error.message : 'unknown error'}`;
      }
    });

    drop.addEventListener('dragover', event => {
      event.preventDefault();
      drop.classList.add('warn');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('warn'));
    drop.addEventListener('drop', async event => {
      event.preventDefault();
      drop.classList.remove('warn');
      const file = event.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        status.textContent = 'Drop an image file.';
        return;
      }
      try {
        const bitmap = await createImageBitmap(file);
        await analyse(bitmap, file.name || 'Dropped photo');
      } catch (error) {
        status.textContent = `Could not read that photo: ${error instanceof Error ? error.message : 'unknown error'}`;
      }
    });

    keep.addEventListener('click', () => {
      if (!latest) return;
      set(state.faceScan, JSON.stringify(latest));
      set(state.faceStay, '1');
      notify('Face profile kept locally. There is no account and no cloud copy.');
    });

    download.addEventListener('click', () => {
      if (!latest) return;
      const blob = new Blob([JSON.stringify(latest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'free-builder-face-profile.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    root.append(
      c('div', { class: 'panel' }, [
        c('h2', { text: 'Face scan (beta)' }),
        c('p', { class: 'muted', text: 'Use a photo or the camera. The stock MediaPipe landmark task runs in this browser; the photo and profile stay on this device unless you download the profile.' }),
        c('div', { class: 'fieldset' }, [startCamera, run, keep, download, photoLabel, photo]),
        drop,
        c('div', { class: 'face-grid' }, [video, canvas]),
        status,
        profileText,
      ]),
      c('p', { class: 'muted', text: 'Desktop-shell guard: in the native app build this tab is removed at runtime (`/FreeBuilderApp/` user-agent test), matching the original behaviour.' }),
    );
  },
};
