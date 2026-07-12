"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type SimplePeerType from "simple-peer";
import { API_URL, getAccessToken } from "@/lib/api";

type CallState = "connecting" | "waiting" | "in-call" | "ended" | "error";

export function VideoRoom({ sessionId }: { sessionId: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeerType.Instance | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CallState>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { default: SimplePeer } = await import("simple-peer");
      if (cancelled) return;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        setState("error");
        setErrorMessage("Impossible d'accéder à la caméra/micro. Vérifie les permissions du navigateur.");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setState("waiting");

      const socket = io(API_URL, {
        path: "/socket.io",
        auth: { token: getAccessToken(), sessionId },
      });
      socketRef.current = socket;

      function createPeer(initiator: boolean) {
        const peer = new SimplePeer({ initiator, trickle: true, stream: stream });
        peerRef.current = peer;

        peer.on("signal", (data) => socket.emit("signal", data));
        peer.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          setState("in-call");
        });
        peer.on("close", () => teardownPeer());
        peer.on("error", () => teardownPeer());
      }

      function teardownPeer() {
        peerRef.current?.destroy();
        peerRef.current = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setState((prev) => (prev === "error" ? prev : "waiting"));
      }

      socket.on("peer-joined", () => {
        if (!peerRef.current) createPeer(true);
      });

      socket.on("signal", (data: SimplePeerType.SignalData) => {
        if (!peerRef.current) createPeer(false);
        peerRef.current?.signal(data);
      });

      socket.on("peer-left", () => teardownPeer());

      socket.on("connect_error", () => {
        setState("error");
        setErrorMessage("Connexion à la salle refusée.");
      });
    }

    start();

    return () => {
      cancelled = true;
      peerRef.current?.destroy();
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [sessionId]);

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }

  function hangUp() {
    peerRef.current?.destroy();
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setState("ended");
  }

  return (
    <div className="border border-ink bg-ink">
      <div className="relative aspect-video w-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full bg-ink object-cover"
        />
        {state !== "in-call" && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-semibold uppercase tracking-wide text-paper/70">
            {state === "connecting" && "Démarrage de la caméra…"}
            {state === "waiting" && "En attente de l'autre participant…"}
            {state === "ended" && "Appel terminé."}
            {state === "error" && (errorMessage ?? "Erreur de connexion.")}
          </div>
        )}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-3 right-3 h-24 w-32 border border-signal bg-ink object-cover sm:h-32 sm:w-44"
        />
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-paper/20 bg-ink p-3">
        <button
          onClick={toggleMic}
          className="border border-paper/40 px-3 py-2 text-xs font-bold uppercase tracking-wide text-paper transition-colors hover:bg-signal hover:text-ink"
        >
          {micOn ? "Couper le micro" : "Activer le micro"}
        </button>
        <button
          onClick={toggleCam}
          className="border border-paper/40 px-3 py-2 text-xs font-bold uppercase tracking-wide text-paper transition-colors hover:bg-signal hover:text-ink"
        >
          {camOn ? "Couper la caméra" : "Activer la caméra"}
        </button>
        <button
          onClick={hangUp}
          className="bg-signal px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-paper"
        >
          Raccrocher
        </button>
      </div>
    </div>
  );
}
