import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token ${name} missing`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("design token contrast (SPEC Section 8: at least 4.5:1)", () => {
  const pairs: [string, string][] = [
    ["on-accent", "accent"],
    ["on-accent", "accent-hover"],
    ["accent", "surface"],
    ["accent", "canvas"],
    ["accent", "accent-muted"],
    ["ink", "surface"],
    ["ink-muted", "surface"],
    ["ink-muted", "canvas"],
    ["danger", "surface"],
  ];
  it.each(pairs)("%s on %s", (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
