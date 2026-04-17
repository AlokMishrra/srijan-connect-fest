import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Camera, StopCircle,
  RefreshCw, UserCheck, AlertTriangle, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Html5Qrcode } from "html5-qrcode";

interface ScannedData {
  id: string;
  name: string;
  email: string;
  event: string;
}

interface RegistrationRecord {
  id: string;
  registration_id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  event: string;
  checked_in: boolean | null;
  checked_in_at: string | null;
  custom_fields: any;
}

type LookupState =
  | { status: "idle" }
  | { status: "looking_up"; scanned: ScannedData }
  | { status: "found"; scanned: ScannedData; record: RegistrationRecord }
  | { status: "not_found"; scanned: ScannedData; reason: string }
  | { status: "checked_in"; record: RegistrationRecord };

const SCANNER_ID = "qr-scanner-viewport";

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraLabel, setCameraLabel] = useState<string>("");
  const [state, setState] = useState<LookupState>({ status: "idle" });
  const [checkingIn, setCheckingIn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraLabel("");
  }, []);

  const lookupRegistration = async (data: ScannedData) => {
    setState({ status: "looking_up", scanned: data });
    const { data: rows, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("registration_id", data.id)
      .maybeSingle();

    if (error) {
      toast.error("Lookup failed: " + error.message);
      setState({ status: "not_found", scanned: data, reason: "Database error during lookup" });
      return;
    }
    if (!rows) {
      toast.error("No registration found");
      setState({ status: "not_found", scanned: data, reason: "No registration found with this ID" });
      return;
    }
    toast.success(`Found: ${rows.name}`);
    setState({ status: "found", scanned: data, record: rows as RegistrationRecord });
  };

  const handleDecode = useCallback(async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    await stopScanner();

    let parsed: ScannedData | null = null;
    try {
      parsed = JSON.parse(decodedText);
    } catch {
      parsed = { id: decodedText.trim(), name: "", email: "", event: "" };
    }
    if (!parsed?.id) {
      toast.error("Invalid QR code");
      setState({ status: "idle" });
      processingRef.current = false;
      return;
    }
    await lookupRegistration(parsed);
    processingRef.current = false;
  }, [stopScanner]);

  const startScanning = useCallback(async (mode: "environment" | "user" = facingMode) => {
    processingRef.current = false;
    setState({ status: "idle" });
    setStarting(true);

    // Small delay to ensure DOM element is rendered and visible
    await new Promise(r => setTimeout(r, 100));

    try {
      // Get camera devices to show label
      const devices = await Html5Qrcode.getCameras();
      let deviceId: string | undefined;
      let label = mode === "environment" ? "Back Camera" : "Front Camera";

      if (devices && devices.length > 0) {
        // Pick best matching camera
        if (mode === "environment") {
          const back = devices.find(d =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          deviceId = back?.id || devices[devices.length - 1]?.id;
          label = back?.label || devices[devices.length - 1]?.label || "Back Camera";
        } else {
          const front = devices.find(d =>
            d.label.toLowerCase().includes("front") ||
            d.label.toLowerCase().includes("user") ||
            d.label.toLowerCase().includes("face")
          );
          deviceId = front?.id || devices[0]?.id;
          label = front?.label || devices[0]?.label || "Front Camera";
        }
        setCameraLabel(label);
      }

      const html5QrCode = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = html5QrCode;

      const config = { fps: 15, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 };

      if (deviceId) {
        await html5QrCode.start({ deviceId: { exact: deviceId } }, config, handleDecode, () => {});
      } else {
        await html5QrCode.start({ facingMode: mode }, config, handleDecode, () => {});
      }

      setScanning(true);
      setFacingMode(mode);
    } catch (err: any) {
      console.error("Camera error:", err);
      const msg = err?.message || String(err);
      if (msg.includes("Permission") || msg.includes("permission")) {
        toast.error("Camera permission denied. Please allow camera access and try again.");
      } else {
        toast.error("Could not start camera. " + msg);
      }
      setScanning(false);
    } finally {
      setStarting(false);
    }
  }, [facingMode, handleDecode]);

  const switchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    await stopScanner();
    await startScanning(next);
  };

  const performCheckIn = async () => {
    if (state.status !== "found") return;
    setCheckingIn(true);
    const { data, error } = await supabase
      .from("registrations")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("registration_id", state.record.registration_id)
      .select()
      .single();
    setCheckingIn(false);
    if (error || !data) {
      toast.error("Check-in failed: " + (error?.message || "unknown error"));
      return;
    }
    toast.success(`${data.name} checked in!`);
    setState({ status: "checked_in", record: data as RegistrationRecord });
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {!scanning && !starting ? (
          <button
            onClick={() => startScanning("environment")}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Camera size={16} /> Start Scanner
          </button>
        ) : starting ? (
          <button disabled className="bg-primary/70 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-not-allowed">
            <Loader2 size={16} className="animate-spin" /> Starting camera…
          </button>
        ) : (
          <>
            <button
              onClick={stopScanner}
              className="bg-destructive text-destructive-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <StopCircle size={16} /> Stop
            </button>
            <button
              onClick={switchCamera}
              className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity border border-border"
            >
              <RefreshCw size={16} /> Switch to {facingMode === "environment" ? "Front" : "Back"} Camera
            </button>
          </>
        )}
      </div>

      {/* Camera viewport — always in DOM, visibility toggled via CSS */}
      <div style={{ display: scanning || starting ? "block" : "none" }} className="max-w-md mx-auto">
        {/* Camera label badge */}
        {cameraLabel && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg w-fit mx-auto">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-foreground">{cameraLabel}</span>
          </div>
        )}

        {/* Scanner container — html5-qrcode mounts the video feed here */}
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/40 bg-black" style={{ minHeight: 320 }}>
          <div id={SCANNER_ID} className="w-full" />

          {/* Scanning overlay with corner brackets */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-md" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-md" />
                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary/70 animate-scan-line" />
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Point the camera at an attendee's QR code
        </p>
      </div>

      {/* Looking up */}
      {state.status === "looking_up" && (
        <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-md mx-auto text-center">
          <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Looking up registration <span className="font-mono font-semibold">{state.scanned.id}</span>…</p>
        </div>
      )}

      {/* Not found */}
      {state.status === "not_found" && (
        <div className="bg-card rounded-xl p-6 shadow-card border-2 border-destructive/40 max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={24} className="text-destructive" />
            <h3 className="font-heading text-lg font-bold text-foreground">Not Registered</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{state.reason}</p>
          <p className="text-xs text-muted-foreground mb-4">Scanned ID: <span className="font-mono">{state.scanned.id}</span></p>
          <div className="flex gap-2">
            <button onClick={() => startScanning(facingMode)} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium">Scan Again</button>
            <button onClick={() => setState({ status: "idle" })} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg text-sm font-medium border border-border">Close</button>
          </div>
        </div>
      )}

      {/* Found */}
      {state.status === "found" && (
        <div className="bg-card rounded-xl p-6 shadow-card border-2 border-primary/30 max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={24} className="text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">Registration Found</h3>
          </div>
          {state.record.checked_in && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-yellow-800">Already checked in</p>
                <p className="text-yellow-700">{state.record.checked_in_at ? new Date(state.record.checked_in_at).toLocaleString() : ""}</p>
              </div>
            </div>
          )}
          <div className="space-y-2 text-sm mb-4">
            <Row label="Reg ID" value={state.record.registration_id} mono />
            <Row label="Name" value={state.record.name} />
            <Row label="Email" value={state.record.email} />
            <Row label="Event" value={state.record.event} highlight />
            {state.record.phone && <Row label="Phone" value={state.record.phone} />}
            {state.record.organization && <Row label="Org" value={state.record.organization} />}
          </div>
          <div className="flex gap-2">
            <button
              onClick={performCheckIn}
              disabled={checkingIn || !!state.record.checked_in}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {state.record.checked_in ? "Already Checked In" : checkingIn ? "Checking in…" : "Check In"}
            </button>
            <button onClick={() => startScanning(facingMode)} className="px-4 bg-secondary text-secondary-foreground py-2 rounded-lg text-sm font-medium border border-border">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Checked in */}
      {state.status === "checked_in" && (
        <div className="bg-card rounded-xl p-6 shadow-card border-2 border-primary/40 max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={24} className="text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">Check-in Successful</h3>
          </div>
          <div className="space-y-2 text-sm mb-4">
            <Row label="Name" value={state.record.name} />
            <Row label="Event" value={state.record.event} highlight />
            <Row label="Reg ID" value={state.record.registration_id} mono />
            <Row label="Time" value={state.record.checked_in_at ? new Date(state.record.checked_in_at).toLocaleTimeString() : ""} />
          </div>
          <button
            onClick={() => startScanning(facingMode)}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold"
          >
            Scan Next
          </button>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className={`text-right break-all ${mono ? "font-mono text-xs" : "font-medium"} ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
  </div>
);

export default QRScanner;
