"use client";

import React, { useEffect, useRef, useState } from "react";

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(true);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 2. Check Save-Data header / connection api
    const hasSaveData = (navigator as any).connection?.saveData === true;

    if (prefersReducedMotion || hasSaveData) {
      setShouldPlayVideo(false);
      return;
    }

    // Lazy load observer: only trigger video play when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {
            // Autoplay blocked by browser policy
          });
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Ambient neon gradient backdrops */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-neon-purple/20 via-neon-cyan/20 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-neon-blue/15 blur-[150px] rounded-full pointer-events-none" />

      {shouldPlayVideo ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/hero-poster.svg"
          className="absolute inset-0 h-full w-full object-cover opacity-20 filter contrast-125 brightness-90 mix-blend-screen"
        >
          <source src="/hero-video.webm" type="video/webm" />
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      ) : (
        /* Reduced motion / Save-Data fallback */
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      )}

      {/* Grid overlay for futuristic vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Dark gradient fade to bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
    </div>
  );
}
