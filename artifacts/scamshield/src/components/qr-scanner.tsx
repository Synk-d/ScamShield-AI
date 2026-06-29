import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, ScanLine, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onDetected: (url: string) => void;
  disabled?: boolean;
}

type ScannerState = "idle" | "requesting" | "scanning" | "detected" | "denied";

export function QrScanner({ onDetected, disabled }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScannerState>("idle");
  const [detectedUrl, setDetectedUrl] = useState<string>("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      stopCamera();
      setDetectedUrl(code.data);
      setState("detected");
      onDetected(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera, onDetected]);

  const startCamera = useCallback(async () => {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setState("denied");
    }
  }, [scanFrame]);

  const reset = useCallback(() => {
    stopCamera();
    setDetectedUrl("");
    setState("idle");
  }, [stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Camera viewport */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-border">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${state === "scanning" ? "block" : "hidden"}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Idle state */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium">Camera is off</p>
          </div>
        )}

        {/* Requesting permission */}
        {state === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium">Requesting camera access…</p>
          </div>
        )}

        {/* Scanning overlay */}
        {state === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Viewfinder corners */}
            <div className="relative w-52 h-52">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br" />
              {/* Scan line */}
              <div className="absolute inset-x-0 top-0 flex justify-center animate-bounce mt-1">
                <ScanLine className="w-48 text-primary/70" />
              </div>
            </div>
            <p className="mt-4 text-xs text-white/70 font-mono tracking-wide drop-shadow">
              Point camera at a QR code
            </p>
          </div>
        )}

        {/* Detected state */}
        {state === "detected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm font-semibold text-white">QR Code Detected</p>
            <p className="text-xs text-white/60 font-mono max-w-xs truncate px-4 text-center">
              {detectedUrl}
            </p>
          </div>
        )}

        {/* Denied state */}
        {state === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <CameraOff className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-sm font-medium">Camera access denied</p>
            <p className="text-xs text-center px-8 opacity-70">
              Allow camera access in your browser settings, then try again.
            </p>
          </div>
        )}
      </div>

      {/* Hint when detected */}
      {state === "detected" && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            URL extracted from QR code and ready to scan.{" "}
            <button onClick={reset} className="underline underline-offset-2 hover:opacity-80">
              Scan another
            </button>
          </span>
        </div>
      )}

      {/* Warning: non-URL QR content */}
      {state === "detected" && !detectedUrl.startsWith("http") && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>QR code contains non-URL content. Analyzing as text instead.</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {state === "idle" || state === "denied" ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={startCamera}
            disabled={disabled}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        ) : state === "scanning" || state === "requesting" ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={reset}
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Camera
          </Button>
        ) : (
          <Button type="button" variant="outline" className="flex-1" onClick={reset} disabled={disabled}>
            <Camera className="w-4 h-4 mr-2" />
            Scan Another
          </Button>
        )}
      </div>
    </div>
  );
}
