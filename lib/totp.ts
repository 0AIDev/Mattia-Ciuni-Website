const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(bytes: Uint8Array): string {
  let value = 0;
  let bits = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  const output: number[] = [];
  let value = 0;
  let bits = 0;
  for (const character of clean) {
    const index = ALPHABET.indexOf(character);
    if (index < 0) throw new Error("Invalid base32 secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

export function newTotpSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}

function counterBytes(counter: number): ArrayBuffer {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  return bytes;
}

export async function totpCode(secret: string, timestamp = Date.now()): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret).buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const counter = Math.floor(timestamp / 1000 / PERIOD_SECONDS);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes(counter)));
  const offset = digest[digest.length - 1] & 15;
  const binary =
    ((digest[offset] & 127) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 1_000_000).padStart(DIGITS, "0");
}

export async function verifyTotp(
  secret: string,
  given: string,
  timestamp = Date.now(),
): Promise<boolean> {
  const clean = given.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  // ±1 period compensates for normal clock drift without making an old code useful.
  for (const offset of [-1, 0, 1]) {
    const expected = await totpCode(secret, timestamp + offset * PERIOD_SECONDS * 1000);
    let difference = 0;
    for (let i = 0; i < DIGITS; i += 1) difference |= expected.charCodeAt(i) ^ clean.charCodeAt(i);
    if (difference === 0) return true;
  }
  return false;
}

export function otpauthUri(secret: string, issuer = "Mattia Ciuni", account = "admin"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD_SECONDS}`;
}
