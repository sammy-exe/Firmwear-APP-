import React, { useEffect, useRef } from 'react';

/**
 * MjpegStream — renders ESP32 MJPEG stream on canvas.
 * Properly parses multipart/x-mixed-replace with JPEG boundary detection.
 */
export default function MjpegStream({ ip, style, onLoad, onError }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    if (!ip) return;
    activeRef.current = true;
    let reader;

    async function startStream() {
      try {
        const res = await fetch(`http://${ip}:81/stream`);
        if (!res.ok || !res.body) throw new Error('no stream');

        reader = res.body.getReader();
        let buffer = new Uint8Array(0);
        let firstFrame = true;

        const JPEG_START = [0xFF, 0xD8];
        const JPEG_END   = [0xFF, 0xD9];

        while (activeRef.current) {
          const { done, value } = await reader.read();
          if (done || !activeRef.current) break;

          // Append new chunk to buffer
          const next = new Uint8Array(buffer.length + value.length);
          next.set(buffer);
          next.set(value, buffer.length);
          buffer = next;

          // Find JPEG start
          const start = findSeq(buffer, JPEG_START);
          if (start === -1) continue;

          // Find JPEG end after start
          const end = findSeq(buffer, JPEG_END, start + 2);
          if (end === -1) continue;

          // Extract complete JPEG frame
          const frame = buffer.slice(start, end + 2);
          buffer = buffer.slice(end + 2);

          drawFrame(frame);
          if (firstFrame) { firstFrame = false; onLoad?.(); }
        }
      } catch {
        if (activeRef.current) onError?.();
      }
    }

    function findSeq(buf, seq, from = 0) {
      outer: for (let i = from; i <= buf.length - seq.length; i++) {
        for (let j = 0; j < seq.length; j++) {
          if (buf[i + j] !== seq[j]) continue outer;
        }
        return i;
      }
      return -1;
    }

    function drawFrame(jpegData) {
      const blob = new Blob([jpegData], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) { URL.revokeObjectURL(url); return; }
        const ctx = canvas.getContext('2d');
        if (canvas.width !== img.width)  canvas.width  = img.width;
        if (canvas.height !== img.height) canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    startStream();
    return () => {
      activeRef.current = false;
      reader?.cancel?.();
    };
  }, [ip]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover',
        ...style,
      }}
    />
  );
}
