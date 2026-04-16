#!/usr/bin/env node
// ding.js - Play a notification sound when Claude Code finishes
// https://github.com/YOUR_USERNAME/claude-ding

const { execSync } = require("child_process");
const os = require("os");

// --- Configuration (via environment variables) ---
const FREQUENCY = parseInt(process.env.DING_FREQ || "880", 10); // Hz
const DURATION = parseInt(process.env.DING_DURATION || "200", 10); // ms
const COOLDOWN = parseInt(process.env.DING_COOLDOWN || "0", 10); // ms (0 = disabled)

if (COOLDOWN > 0) {
  const fs = require("fs");
  const tmpFile = os.tmpdir() + "/.claude-ding-last";
  try {
    const last = fs.existsSync(tmpFile)
      ? parseInt(fs.readFileSync(tmpFile, "utf8"), 10)
      : 0;
    if (Date.now() - last < COOLDOWN) {
      process.exit(0); // still in cooldown, skip
    }
  } catch {}
  try {
    fs.writeFileSync(tmpFile, String(Date.now()));
  } catch {}
}

// --- Platform-specific ding ---
function ding() {
  const platform = os.platform();

  if (platform === "win32") {
    dingWindows();
  } else if (platform === "darwin") {
    dingMacOS();
  } else {
    dingLinux();
  }
}

function dingWindows() {
  // Method 1: Try PowerShell console beep (works on most systems)
  try {
    execSync(
      `powershell -NoProfile -Command "[console]::beep(${FREQUENCY}, ${DURATION})"`,
      { stdio: "ignore", timeout: 3000 }
    );
    return;
  } catch {}

  // Method 2: Fallback - generate a beep WAV and play it
  try {
    const tmpWav = os.tmpdir() + "/claude-ding-beep.wav";
    const fs = require("fs");
    const buf = generateBeepWav(FREQUENCY, DURATION);
    fs.writeFileSync(tmpWav, buf);
    execSync(
      `powershell -NoProfile -Command "(New-Object Media.SoundPlayer '${tmpWav}').PlaySync()"`,
      { stdio: "ignore", timeout: 3000 }
    );
  } catch {
    // Last resort: terminal bell
    process.stdout.write("\x07");
  }
}

function dingMacOS() {
  // Try macOS afplay with a generated tone first
  // Fallback to terminal bell which works on most Mac terminals
  try {
    process.stdout.write("\x07");
    // Also try osascript notification sound
    execSync(
      `osascript -e "beep" 2>/dev/null || true`,
      { stdio: "ignore", timeout: 1000 }
    );
  } catch {
    process.stdout.write("\x07");
  }
}

function dingLinux() {
  // Try paplay with a generated WAV, fallback to terminal bell
  try {
    const tmpWav = os.tmpdir() + "/claude-ding-beep.wav";
    const fs = require("fs");
    const buf = generateBeepWav(FREQUENCY, DURATION);
    fs.writeFileSync(tmpWav, buf);
    execSync(`paplay "${tmpWav}" 2>/dev/null`, {
      stdio: "ignore",
      timeout: 3000,
    });
  } catch {
    // Fallback: try aplay
    try {
      const tmpWav = os.tmpdir() + "/claude-ding-beep.wav";
      const fs = require("fs");
      const buf = generateBeepWav(FREQUENCY, DURATION);
      fs.writeFileSync(tmpWav, buf);
      execSync(`aplay "${tmpWav}" 2>/dev/null`, {
        stdio: "ignore",
        timeout: 3000,
      });
    } catch {
      // Ultimate fallback: terminal bell
      process.stdout.write("\x07");
    }
  }
}

// --- Generate a minimal WAV beep ---
function generateBeepWav(frequency, durationMs) {
  const sampleRate = 44100;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);
  let offset = 0;

  // WAV header
  buf.write("RIFF", offset, 4, "ascii");
  offset += 4;
  buf.writeUInt32LE(fileSize - 8, offset);
  offset += 4;
  buf.write("WAVE", offset, 4, "ascii");
  offset += 4;

  // fmt chunk
  buf.write("fmt ", offset, 4, "ascii");
  offset += 4;
  buf.writeUInt32LE(16, offset);
  offset += 4;
  buf.writeUInt16LE(1, offset); // PCM
  offset += 2;
  buf.writeUInt16LE(1, offset); // mono
  offset += 2;
  buf.writeUInt32LE(sampleRate, offset);
  offset += 4;
  buf.writeUInt32LE(sampleRate * 2, offset); // byte rate
  offset += 4;
  buf.writeUInt16LE(2, offset); // block align
  offset += 2;
  buf.writeUInt16LE(16, offset); // bits per sample
  offset += 4;

  // data chunk
  buf.write("data", offset, 4, "ascii");
  offset += 4;
  buf.writeUInt32LE(dataSize, offset);
  offset += 4;

  // Generate sine wave
  const amplitude = 0.5;
  const period = sampleRate / frequency;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * i) / period) * amplitude * 32767;
    buf.writeInt16LE(Math.round(sample), offset);
    offset += 2;
  }

  return buf;
}

// --- Run ---
ding();
