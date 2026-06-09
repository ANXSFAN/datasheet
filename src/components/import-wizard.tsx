"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PreviewSummary {
  totalProducts: number;
  create: number;
  update: number;
  errorRows: number;
  specRows: number;
  imageRows: number;
  linkRows: number;
}
interface PreviewProduct {
  model: string;
  name: string;
  action: "create" | "update";
  specCount: number;
  imageCount: number;
}
interface RowError {
  sheet: string;
  row: number;
  model: string;
  message: string;
}
interface PreviewResponse {
  factory: { id: string; name: string };
  summary: PreviewSummary;
  products: PreviewProduct[];
  errors: RowError[];
}

type Phase = "idle" | "previewing" | "preview" | "committing";

export function ImportWizard({ factoryName }: { factoryName: string | null }) {
  const router = useRouter();
  const t = useTranslations("more");
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [plan, setPlan] = useState<PreviewResponse | null>(null);

  function reset() {
    setPhase("idle");
    setFile(null);
    setPlan(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPlan(null);
    setPhase("previewing");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("previewFail"));
        reset();
        return;
      }
      setPlan(data as PreviewResponse);
      setPhase("preview");
    } catch {
      toast.error(t("previewFail"));
      reset();
    }
  }

  async function handleCommit() {
    if (!file) return;
    setPhase("committing");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/commit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("importFail"));
        setPhase("preview");
        return;
      }
      toast.success(
        t("impDone", {
          created: data.created,
          updated: data.updated,
          linkRows: data.linkRows,
        }) + (data.errorRows ? t("impDoneSkip", { n: data.errorRows }) : ""),
      );
      router.refresh();
      reset();
    } catch {
      toast.error(t("importFail"));
      setPhase("preview");
    }
  }

  function downloadErrors() {
    if (!plan?.errors.length) return;
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = plan.errors.map((e) =>
      [e.sheet, String(e.row), e.model, e.message].map(esc).join(","),
    );
    const csv = "﻿" + [t("impCsvHeader"), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const busy = phase === "previewing" || phase === "committing";
  const s = plan?.summary;

  return (
    <div className="mt-8 space-y-6">
      {/* Step 1 — 模板 + 上传 */}
      <section className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink)]">
          {t("impStep1")}
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {t("impStep1Hint")}{" "}
          <span className="font-medium text-[var(--color-ink)]">
            {factoryName ?? t("impNotSel")}
          </span>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API 下载端点，非页面路由 */}
          <a
            href="/api/import/template"
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] px-4 py-2 text-xs text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)]"
          >
            <Download className="h-3.5 w-3.5" />
            {t("downloadTpl")}
          </a>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs text-white transition hover:bg-[#424245] disabled:opacity-50"
          >
            {phase === "previewing" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {phase === "previewing" ? t("parsing") : t("pickFile")}
          </button>
          {file && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {file.name}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={handlePick}
          />
        </div>
      </section>

      {/* Step 2 — 预览 diff */}
      {plan && s && (
        <section className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
          <div className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink)]">
              {t("impStep2")}
            </p>
            <button
              onClick={reset}
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
            >
              <RotateCcw className="h-3 w-3" />
              {t("reselect")}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label={t("create")} value={s.create} tone="good" />
            <Stat label={t("update")} value={s.update} tone="info" />
            <Stat label={t("errorRows")} value={s.errorRows} tone={s.errorRows ? "bad" : "muted"} />
            <Stat label={t("linkRows")} value={s.linkRows} tone="muted" />
          </div>
          <p className="mt-3 font-mono text-[11px] text-[var(--color-ink-muted)]">
            {t("specN", { n: s.specRows })} · {t("imageN", { n: s.imageRows })} ·{" "}
            {t("totalProd", { n: s.totalProducts })}
          </p>

          {/* 产品明细 */}
          {plan.products.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-rule)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-rule)] bg-[var(--color-surface-sunken)] text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                    <th className="px-3 py-2 font-medium">{t("action")}</th>
                    <th className="px-3 py-2 font-medium">{t("model")}</th>
                    <th className="px-3 py-2 font-medium">{t("name")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("specImg")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)]">
                  {plan.products.map((p) => (
                    <tr key={p.model}>
                      <td className="px-3 py-2">
                        <ActionChip action={p.action} />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--color-ink)]">
                        {p.model}
                      </td>
                      <td className="px-3 py-2 text-[var(--color-ink)]">{p.name}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-[var(--color-ink-muted)]">
                        {p.specCount} / {p.imageCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 错误明细 */}
          {plan.errors.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#b4232a]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t("errorsSkip", { n: plan.errors.length })}
                </p>
                <button
                  onClick={downloadErrors}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  <Download className="h-3 w-3" />
                  {t("errorReport")}
                </button>
              </div>
              <ul className="space-y-1 rounded-xl border border-dashed border-[var(--color-rule)] p-3">
                {plan.errors.slice(0, 50).map((e, i) => (
                  <li key={i} className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                    <span className="text-[var(--color-ink)]">
                      {t("impRowLabel", { sheet: e.sheet, row: e.row })}
                    </span>{" "}
                    {e.model && <span className="text-[var(--color-ink)]">{e.model} · </span>}
                    {e.message}
                  </li>
                ))}
                {plan.errors.length > 50 && (
                  <li className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                    {t("moreRows", { n: plan.errors.length - 50 })}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* 确认 */}
          <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-rule)] pt-5">
            <button
              onClick={handleCommit}
              disabled={phase === "committing" || s.create + s.update === 0}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-xs text-white transition hover:bg-[#424245] disabled:opacity-50"
            >
              {phase === "committing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {phase === "committing"
                ? t("importing")
                : t("confirmImport", { n: s.create + s.update })}
            </button>
            {s.create + s.update === 0 && (
              <span className="text-xs text-[var(--color-ink-muted)]">
                {t("noValid")}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "info" | "bad" | "muted";
}) {
  const color =
    tone === "good"
      ? "text-[#1f7a3d]"
      : tone === "bad"
        ? "text-[#b4232a]"
        : tone === "info"
          ? "text-[var(--color-ink)]"
          : "text-[var(--color-ink-muted)]";
  return (
    <div>
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className={`mt-1 font-mono text-[28px] font-medium tabular-nums leading-none ${color}`}>
        {value}
      </p>
    </div>
  );
}

function ActionChip({ action }: { action: "create" | "update" }) {
  const t = useTranslations("more");
  return action === "create" ? (
    <span className="rounded-full bg-[#e7f4ec] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1f7a3d]">
      {t("create")}
    </span>
  ) : (
    <span className="rounded-full bg-[var(--color-surface-sunken)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
      {t("update")}
    </span>
  );
}
