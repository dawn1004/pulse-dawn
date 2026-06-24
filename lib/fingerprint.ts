"use client";

let cachedFingerprint: string | null = null;
let fingerprintPromise: Promise<string> | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  if (!fingerprintPromise) {
    fingerprintPromise = loadFingerprint().catch((err) => {
      fingerprintPromise = null;
      throw err;
    });
  }
  return fingerprintPromise;
}

async function loadFingerprint(): Promise<string> {
  const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
  const agent = await FingerprintJS.load();
  const result = await agent.get();
  cachedFingerprint = result.visitorId;
  return cachedFingerprint;
}
