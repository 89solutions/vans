// Reads barcodes with the phone's camera. Uses the browser's own reader where there is one (Chrome on
// Android), otherwise the bundled ZXing library, which is only loaded the first time it is needed.
(function (global) {
  'use strict';

  const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code', 'data_matrix'];
  const ZXING_FORMATS = ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128', 'CODE_39', 'ITF', 'QR_CODE', 'DATA_MATRIX'];

  let zxingLoad = null;

  function loadZxing() {
    if (global.ZXing) return Promise.resolve(global.ZXing);
    if (!zxingLoad) {
      zxingLoad = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/zxing.min.js';
        script.onload = () => resolve(global.ZXing);
        script.onerror = () => {
          zxingLoad = null;
          reject(new Error('The barcode reader could not load. Type the number instead.'));
        };
        document.head.append(script);
      });
    }
    return zxingLoad;
  }

  async function nativeReader() {
    if (!('BarcodeDetector' in global)) return null;
    try {
      const supported = await global.BarcodeDetector.getSupportedFormats();
      const formats = NATIVE_FORMATS.filter((format) => supported.includes(format));
      if (formats.length === 0) return null;
      const detector = new global.BarcodeDetector({ formats: formats });
      return async (video) => {
        const codes = await detector.detect(video);
        return codes.length > 0 ? codes[0].rawValue : null;
      };
    } catch (err) {
      return null;
    }
  }

  async function zxingReader() {
    const Z = await loadZxing();
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS.map((name) => Z.BarcodeFormat[name]));
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    const reader = new Z.MultiFormatReader();
    reader.setHints(hints);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    return async (video) => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return null;
      // Only the middle of the picture, where the guide box is, scaled down so each try is quick.
      const cropWidth = width * 0.9;
      const cropHeight = height * 0.6;
      const scale = Math.min(1, 960 / cropWidth);
      canvas.width = Math.round(cropWidth * scale);
      canvas.height = Math.round(cropHeight * scale);
      context.drawImage(video, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height);
      try {
        const source = new Z.HTMLCanvasElementLuminanceSource(canvas);
        return reader.decodeWithState(new Z.BinaryBitmap(new Z.HybridBinarizer(source))).getText();
      } catch (err) {
        // Nothing readable in this frame. Try the next one.
        return null;
      }
    };
  }

  function cameraMessage(err) {
    if (err && err.name === 'NotAllowedError') return 'Camera access is blocked. Allow it in your browser’s settings, or type the number below.';
    if (err && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) return 'No camera found. Type the number below.';
    return (err && err.message) || 'The camera could not start. Type the number below.';
  }

  // Shows the camera in the video element until a code is read twice in a row, which stops a
  // half-seen barcode being misread. Returns { stop } straight away; call it when the scan is closed.
  function start(video, { onCode, onReady, onError }) {
    let stream = null;
    let stopped = false;

    function stop() {
      stopped = true;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('The camera needs the app to be opened over https. Type the number below.');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (stopped) {
        stop();
        return;
      }
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.srcObject = stream;
      await video.play();
      const read = (await nativeReader()) || (await zxingReader());
      if (stopped) return;
      onReady();

      let last = null;
      let lastAt = 0;
      const tick = async () => {
        if (stopped) return;
        let code = null;
        try {
          code = await read(video);
        } catch (err) {
          code = null;
        }
        if (stopped) return;
        if (code) {
          if (code === last && Date.now() - lastAt < 1500) {
            stop();
            onCode(code);
            return;
          }
          last = code;
          lastAt = Date.now();
        }
        setTimeout(tick, 100);
      };
      tick();
    })().catch((err) => {
      const wasStopped = stopped;
      stop();
      if (!wasStopped) onError(cameraMessage(err));
    });

    return { stop: stop };
  }

  global.VanScanner = { start: start };
})(window);
