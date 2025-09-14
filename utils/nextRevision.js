// utils/nextRevision.js
export default function normalizeNextRevision(input) {
  if (input === null || typeof input === "undefined") return null;
  // empty string or purely whitespace -> null
  if (typeof input === "string") {
    if (input.trim() === "") return null;
    // try to parse "1-10" or Arabic "سورة يس 1-10" (best-effort)
    const numMatch = input.match(/(\d+)\s*[-–]\s*(\d+)/);
    const surahMatch = input.match(/(?:سورة\s*)?([\u0621-\u064A\u0660-\u0669\-\sءآأؤئ]+)/u);
    if (numMatch) {
      const fromAyah = Number(numMatch[1]);
      const toAyah   = Number(numMatch[2]);
      const surah    = surahMatch ? (surahMatch[1]||"").trim() : "";
      if (surah && Number.isFinite(fromAyah) && Number.isFinite(toAyah)) {
        return { surah, fromAyah, toAyah, count: toAyah - fromAyah + 1 };
      }
    }
    // If parsing failed, return null (we don't allow raw strings in DB)
    return null;
  }

  if (typeof input === "object") {
    // coerce common field names to our shape
    const surah = (input.surah || input.name || input.sura || "").toString().trim();
    const f = input.fromAyah ?? input.from  ?? input.start ?? input.from_aayah ?? undefined;
    const t = input.toAyah   ?? input.to    ?? input.end   ?? input.to_aayah   ?? undefined;
    if (!surah) return null;
    const fromAyah = (f === "" || typeof f === "undefined") ? undefined : Number(f);
    const toAyah   = (t === "" || typeof t === "undefined") ? undefined : Number(t);
    if (!Number.isFinite(fromAyah) || !Number.isFinite(toAyah)) return null;
    const obj = { surah, fromAyah, toAyah };
    const count = input.count ?? (toAyah - fromAyah + 1);
    if (Number.isFinite(Number(count))) obj.count = Number(count);
    return obj;
  }

  // anything else -> null
  return null;
}
