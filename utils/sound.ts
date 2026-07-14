let sharedContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;

  if (!sharedContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        sharedContext = new AudioContextClass();
      } catch (error) {
        console.warn("Failed to create AudioContext:", error);
      }
    }
  }
  return sharedContext;
};

export const playSound = (type: "happy" | "sad"): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Try to resume if suspended
  if (ctx.state === "suspended") {
    ctx.resume().catch((err) => {
      console.warn("AudioContext resume failed:", err);
    });
  }

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === "happy") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.start();
      osc.stop(now + 0.2);
    }

    // Clean up nodes when the sound finishes playing to avoid leaks
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch (error) {
    console.warn("Error playing sound:", error);
  }
};