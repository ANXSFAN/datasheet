"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { autofillMissingShowcase } from "@/app/admin/products/actions";

/**
 * 导入后流水线：对"缺展示内容"的产品批量 AI 生成展示文案并翻译多语言。
 * 每次最多处理 5 个（避免单次过长），剩余可继续点。需配置 OPENROUTER_API_KEY。
 */
export function AutofillShowcasePanel({
  missingCount,
}: {
  missingCount: number;
}) {
  const router = useRouter();
  const t = useTranslations("more");
  const [remaining, setRemaining] = useState(missingCount);
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      try {
        const r = await autofillMissingShowcase();
        setRemaining(r.remaining);
        toast.success(
          t("autofillDone", { done: r.done, translated: r.translated, remaining: r.remaining })
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("autofillFail"));
      }
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-[var(--color-rule-strong)] bg-[var(--color-surface-sunken)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink)]">
            {t("autofillTitle")}
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            {t("autofillDesc")}：
            <span className="font-medium text-[var(--color-ink)]">{remaining}</span> {t("pcs")}
          </p>
          <p className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
            {t("autofillNote")}
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending || remaining === 0}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-xs text-white transition hover:bg-[#424245] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {pending
            ? t("autofilling")
            : remaining === 0
              ? t("autofillNone")
              : `${t("autofillBtn")}（${Math.min(5, remaining)}）`}
        </button>
      </div>
    </section>
  );
}
