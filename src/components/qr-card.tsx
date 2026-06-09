"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function QrCard({ url, fileBase }: { url: string; fileBase: string }) {
  const t = useTranslations("more");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    toast.success(t("copied"));
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileBase}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-[var(--color-rule)] p-4">
      <div className="shrink-0 rounded-xl bg-white p-2">
        <QRCodeCanvas ref={canvasRef} value={url} size={120} level="M" marginSize={1} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          {t("qrTitle")}
        </p>
        <code className="mt-1.5 block truncate rounded-lg bg-[var(--color-surface-sunken)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-ink-soft)]">
          {url}
        </code>
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] px-3 py-1 text-xs transition hover:bg-[var(--color-surface-sunken)]"
          >
            <Copy className="h-3.5 w-3.5" />
            {t("copyLink")}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs text-white transition hover:bg-[#424245]"
          >
            <Download className="h-3.5 w-3.5" />
            {t("downloadQr")}
          </button>
        </div>
      </div>
    </div>
  );
}
