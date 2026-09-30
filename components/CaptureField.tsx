"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Kind = "photo" | "video";
type Stage = "choose" | "camera" | "done";

const MAX_BYTES: Record<Kind, number> = {
  photo: 5 * 1024 * 1024, // 5 MB — matches /api/experts
  video: 25 * 1024 * 1024, // 25 MB — matches /api/experts
};
const MAX_VIDEO_SECONDS = 60;
const VIDEO_STOP_BYTES = 24 * 1024 * 1024; // stop recording just under the limit

function formatMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// In-browser camera capture for the AI pro join form. Offers "Use camera"
// (live getUserMedia preview with photo snapshot or MediaRecorder video) and
// "Upload a file" as fallback. The chosen file is staged into a hidden
// <input type="file" name={name}> via DataTransfer so the surrounding form's
// FormData submit picks it up unchanged.
export default function CaptureField({
  name,
  label,
  hint,
  accept,
}: {
  name: Kind;
  label: string;
  hint: string;
  accept: string;
}) {
  const [stage, setStage] = useState<Stage>("choose");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const setPreview = useCallback((url: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [stopStream]);

  function stageFile(file: File) {
    if (file.size > MAX_BYTES[name]) {
      setError(
        `That ${name} is ${formatMB(file.size)} — the limit is ${formatMB(MAX_BYTES[name])}. ` +
          (name === "video" ? "Try a shorter recording." : "Try a smaller image.")
      );
      return false;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
    setPreview(URL.createObjectURL(file));
    setFileLabel(`${file.name} (${formatMB(file.size)})`);
    setError(null);
    return true;
  }

  async function openCamera(mode: "user" | "environment") {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't access the camera here — please upload a file instead.");
      return;
    }
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: name === "video",
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setStage("camera");
      // Attach after render — the <video> mounts with stage === "camera".
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError(
        "Couldn't open the camera (permission denied or no camera found). You can upload a file instead."
      );
    }
  }

  function closeCamera() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current = null;
    setRecording(false);
    setElapsed(0);
    stopStream();
    setStage(previewUrl ? "done" : "choose");
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      setError("Camera isn't ready yet — give it a second and try again.");
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Couldn't capture the photo — try again.");
          return;
        }
        const file = new File([blob], `profile-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        if (stageFile(file)) {
          closeCamera();
          setStage("done");
        }
      },
      "image/jpeg",
      0.92
    );
  }

  function pickMimeType(): string | undefined {
    const candidates = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return undefined;
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      setError("Video recording isn't supported in this browser — please upload a file instead.");
      return;
    }
    chunksRef.current = [];
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        const bytes = chunksRef.current.reduce((n, c) => n + c.size, 0);
        if (bytes >= VIDEO_STOP_BYTES) stopRecording();
      }
    };
    recorder.onstop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      const type = recorder.mimeType || "video/webm";
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type });
      const file = new File([blob], `intro-video-${Date.now()}.${ext}`, { type });
      setRecording(false);
      setElapsed(0);
      if (stageFile(file)) {
        closeCamera();
        setStage("done");
      } else {
        setStage("camera");
      }
    };
    recorder.start(500);
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= MAX_VIDEO_SECONDS) {
          stopRecording();
          return s;
        }
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && stageFile(file)) setStage("done");
  }

  function removeFile() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setFileLabel(null);
    setStage("choose");
  }

  return (
    <div className="capture-field">
      <span className="capture-label">{label}</span>
      {/* Hidden input carries the staged file into the form's FormData. */}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        onChange={onUploadChange}
        className="capture-hidden-input"
        tabIndex={-1}
        aria-hidden="true"
      />

      {stage === "choose" && (
        <div className="capture-actions">
          <button type="button" className="btn btn-orange" onClick={() => openCamera("user")}>
            {name === "photo" ? "Take a photo" : "Record video"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => inputRef.current?.click()}
          >
            Upload a file
          </button>
        </div>
      )}

      {stage === "camera" && (
        <div className="capture-camera">
          <video ref={videoRef} className="capture-video" playsInline muted aria-label="Camera preview" />
          <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />
          {recording && (
            <span className="capture-rec-indicator" role="status">
              ● REC {elapsed}s / {MAX_VIDEO_SECONDS}s
            </span>
          )}
          <div className="capture-actions">
            {name === "photo" ? (
              <button type="button" className="btn btn-orange" onClick={takePhoto}>
                Capture photo
              </button>
            ) : recording ? (
              <button type="button" className="btn btn-orange" onClick={stopRecording}>
                Stop recording
              </button>
            ) : (
              <button type="button" className="btn btn-orange" onClick={startRecording}>
                Start recording
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => openCamera(facingMode === "user" ? "environment" : "user")}
              disabled={recording}
            >
              Flip camera
            </button>
            <button type="button" className="btn btn-outline" onClick={closeCamera} disabled={recording}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === "done" && previewUrl && (
        <div className="capture-done">
          {name === "photo" ? (
            <img src={previewUrl} alt="Photo preview" className="join-photo-preview" />
          ) : (
            <video src={previewUrl} className="capture-video" controls playsInline aria-label="Recorded video preview" />
          )}
          {fileLabel && <span className="join-file-name">{fileLabel}</span>}
          <div className="capture-actions">
            <button type="button" className="btn btn-outline" onClick={() => openCamera("user")}>
              {name === "photo" ? "Retake" : "Re-record"}
            </button>
            <button type="button" className="btn btn-outline" onClick={removeFile}>
              Remove
            </button>
          </div>
        </div>
      )}

      <small className="join-hint">{hint}</small>
      {error && (
        <p className="form-error" role="alert" style={{ marginTop: "0.4rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
