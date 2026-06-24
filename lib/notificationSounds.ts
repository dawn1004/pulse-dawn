function playToneBurst(
  ctx: AudioContext,
  notes: { freq: number; at: number; duration: number }[],
  volume = 0.12
) {
  const start = ctx.currentTime;

  for (const { freq, at, duration } of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(volume, start + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start + at);
    osc.stop(start + at + duration);
  }
}

export function playConnectionRequestSound() {
  const ctx = new AudioContext();

  void ctx.resume().then(() => {
    playToneBurst(ctx, [
      { freq: 523.25, at: 0, duration: 0.14 },
      { freq: 659.25, at: 0.1, duration: 0.18 },
      { freq: 783.99, at: 0.22, duration: 0.24 },
    ]);

    window.setTimeout(() => {
      void ctx.close();
    }, 600);
  });
}
