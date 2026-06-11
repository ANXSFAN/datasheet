"use client";

import { useState } from "react";
import { LOCALE_LABELS, LOCALE_ORDER, type AppLocale } from "@/i18n/routing";
import { MarkdownInput } from "@/components/markdown-input";

const SRC: AppLocale = "es"; // 源语言（与产品源语言一致）

const inputCls =
  "w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-ink)]";

/** 9 语言可切换的单值编辑：源语言(es)编辑 source，其余编辑 i18n[loc]。 */
export function MultiLang({
  source,
  setSource,
  i18n,
  setI18n,
  placeholder,
  multiline,
}: {
  source: string;
  setSource: (v: string) => void;
  i18n: Record<string, string>;
  setI18n: (m: Record<string, string>) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [loc, setLoc] = useState<AppLocale>(SRC);
  const isSrc = loc === SRC;
  const value = isSrc ? source : i18n[loc] ?? "";
  const onChange = (v: string) => {
    if (isSrc) setSource(v);
    else setI18n({ ...i18n, [loc]: v });
  };
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1">
        {LOCALE_ORDER.map((l) => {
          const has = l === SRC ? !!source.trim() : !!(i18n[l] ?? "").trim();
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLoc(l)}
              className={`rounded-full border px-2 py-0.5 text-sm transition ${
                loc === l
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]"
                  : has
                    ? "border-[var(--color-rule-strong)] text-[var(--color-ink-soft)]"
                    : "border-[var(--color-rule)] text-[var(--color-ink-faint)]"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          );
        })}
      </div>
      {multiline ? (
        <MarkdownInput
          value={value}
          onChange={onChange}
          placeholder={isSrc ? placeholder : LOCALE_LABELS[loc]}
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSrc ? placeholder : LOCALE_LABELS[loc]}
          className={inputCls}
        />
      )}
    </div>
  );
}
