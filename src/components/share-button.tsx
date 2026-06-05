"use client";

import { useState } from "react";
import { Share2, X, Copy, Check, Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";

type Locale = "zh-CN" | "en";

const T: Record<
  Locale,
  {
    share: string;
    title: string;
    generating: string;
    save: string;
    copy: string;
    copied: string;
    system: string;
    scanHint: string;
    longPress: string;
  }
> = {
  "zh-CN": {
    share: "分享",
    title: "分享产品",
    generating: "正在生成海报…",
    save: "保存图片",
    copy: "复制链接",
    copied: "已复制",
    system: "系统分享",
    scanHint: "扫码查看产品",
    longPress: "长按图片可保存到相册",
  },
  en: {
    share: "Share",
    title: "Share product",
    generating: "Generating poster…",
    save: "Save image",
    copy: "Copy link",
    copied: "Copied",
    system: "Share",
    scanHint: "Scan to view product",
    longPress: "Long-press the image to save it",
  },
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// 中文无空格：逐字符测量换行。
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines - 1) break;
    } else {
      line += ch;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r;
  const sh = h / r;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function generatePoster(opts: {
  name: string;
  modelNumber: string;
  tagline: string;
  brand: string;
  coverImage: string | null;
  url: string;
  scanHint: string;
}): Promise<string> {
  const W = 750;
  const H = 1180;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // 产品主图
  if (opts.coverImage) {
    const img = await loadImage(opts.coverImage);
    if (img) drawCover(ctx, img, 0, 0, W, 560);
    else {
      ctx.fillStyle = "#f5f5f7";
      ctx.fillRect(0, 0, W, 560);
    }
  } else {
    ctx.fillStyle = "#f5f5f7";
    ctx.fillRect(0, 0, W, 560);
  }

  const pad = 56;
  let y = 648;

  // 品牌
  ctx.fillStyle = "#86868b";
  ctx.font = "500 22px sans-serif";
  ctx.fillText(opts.brand.toUpperCase(), pad, y);
  y += 50;

  // 产品名
  ctx.fillStyle = "#1d1d1f";
  ctx.font = "600 48px sans-serif";
  for (const ln of wrapText(ctx, opts.name, W - pad * 2, 2)) {
    ctx.fillText(ln, pad, y);
    y += 60;
  }

  // 型号
  ctx.fillStyle = "#1d1d1f";
  ctx.font = "500 26px monospace";
  ctx.fillText(opts.modelNumber, pad, y + 6);
  y += 52;

  // 卖点
  if (opts.tagline) {
    ctx.fillStyle = "#6e6e73";
    ctx.font = "400 25px sans-serif";
    for (const ln of wrapText(ctx, opts.tagline, W - pad * 2, 2)) {
      ctx.fillText(ln, pad, y + 12);
      y += 36;
    }
  }

  // 分隔线
  ctx.strokeStyle = "#e8e8ed";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, H - 250);
  ctx.lineTo(W - pad, H - 250);
  ctx.stroke();

  // 二维码
  const qrData = await QRCode.toDataURL(opts.url, { margin: 1, width: 200 });
  const qrImg = await loadImage(qrData);
  const qrY = H - 210;
  if (qrImg) ctx.drawImage(qrImg, pad, qrY, 170, 170);

  // 扫码提示
  ctx.fillStyle = "#1d1d1f";
  ctx.font = "600 30px sans-serif";
  ctx.fillText(opts.scanHint, pad + 200, qrY + 70);
  ctx.fillStyle = "#86868b";
  ctx.font = "400 22px sans-serif";
  ctx.fillText(opts.url.replace(/^https?:\/\//, ""), pad + 200, qrY + 110);

  return canvas.toDataURL("image/png");
}

export function ShareButton({
  locale,
  name,
  modelNumber,
  tagline,
  brand,
  coverImage,
}: {
  locale: string;
  name: string;
  modelNumber: string;
  tagline: string;
  brand: string;
  coverImage: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [poster, setPoster] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = T[(locale as Locale) in T ? (locale as Locale) : "zh-CN"];

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  async function openShare() {
    setOpen(true);
    if (!poster && !loading) {
      setLoading(true);
      try {
        const img = await generatePoster({
          name,
          modelNumber,
          tagline,
          brand,
          coverImage,
          url: shareUrl,
          scanHint: t.scanHint,
        });
        setPoster(img || null);
      } finally {
        setLoading(false);
      }
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  }

  async function systemShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator
        .share({ title: name, text: `${name} · ${modelNumber}`, url: shareUrl })
        .catch(() => undefined);
    }
  }

  function savePoster() {
    if (!poster) return;
    const a = document.createElement("a");
    a.href = poster;
    a.download = `${modelNumber}.png`;
    a.click();
  }

  const canSystemShare =
    typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
      <button
        type="button"
        onClick={openShare}
        aria-label={t.share}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-rule-strong)] text-[var(--color-ink-muted)] transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      >
        <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-rule)] px-5 py-3.5">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink)]">
                {t.title}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-surface-sunken)]">
                {loading || !poster ? (
                  <div className="flex flex-col items-center gap-2 text-[var(--color-ink-muted)]">
                    <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                    <span className="text-[12px]">{t.generating}</span>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={poster}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                )}
              </div>

              {poster && (
                <p className="mt-2 text-center text-[11px] text-[var(--color-ink-faint)]">
                  {t.longPress}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={savePoster}
                  disabled={!poster}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3 py-2.5 text-[13px] font-medium text-[var(--color-surface)] transition hover:opacity-90 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-rule-strong)] px-3 py-2.5 text-[13px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-ink)]"
                >
                  {copied ? (
                    <Check className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={1.75} />
                  )}
                  {copied ? t.copied : t.copy}
                </button>
              </div>

              {canSystemShare && (
                <button
                  type="button"
                  onClick={systemShare}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-rule)] px-3 py-2.5 text-[13px] text-[var(--color-ink-soft)] transition hover:border-[var(--color-rule-strong)]"
                >
                  <Share2 className="h-4 w-4" strokeWidth={1.75} />
                  {t.system}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
