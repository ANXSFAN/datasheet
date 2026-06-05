"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { saveProductShowcase } from "@/app/admin/products/actions";

type Highlight = { icon: string; label: string; value: string };
type Block =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption: string };

const ICONS: { key: string; label: string }[] = [
  { key: "shield", label: "防护 / 认证" },
  { key: "droplet", label: "防水" },
  { key: "zap", label: "功率 / 电气" },
  { key: "clock", label: "寿命" },
  { key: "award", label: "质保 / 奖项" },
  { key: "sun", label: "亮度 / 光效" },
  { key: "temp", label: "温度" },
  { key: "ruler", label: "尺寸" },
  { key: "gauge", label: "性能指标" },
  { key: "bulb", label: "光源 / 显色" },
  { key: "battery", label: "电池 / 续航" },
  { key: "dot", label: "通用" },
];

const inputCls =
  "w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-ink)]";
const labelCls =
  "font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-muted)]";

export function ShowcaseEditor({
  productId,
  initialTagline,
  initialHighlights,
  initialBlocks,
}: {
  productId: string;
  initialTagline: string;
  initialHighlights: Highlight[];
  initialBlocks: Block[];
}) {
  const [tagline, setTagline] = useState(initialTagline);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [pending, start] = useTransition();

  function addHighlight() {
    setHighlights((h) => [...h, { icon: "dot", label: "", value: "" }]);
  }
  function updateHighlight(i: number, patch: Partial<Highlight>) {
    setHighlights((h) => h.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function removeHighlight(i: number) {
    setHighlights((h) => h.filter((_, j) => j !== i));
  }

  function addBlock(kind: Block["kind"]) {
    setBlocks((b) => [
      ...b,
      kind === "image"
        ? { kind: "image", url: "", caption: "" }
        : { kind, text: "" },
    ]);
  }
  function updateBlock(i: number, patch: Partial<Block>) {
    setBlocks((b) =>
      b.map((x, j) => (j === i ? ({ ...x, ...patch } as Block) : x))
    );
  }
  function removeBlock(i: number) {
    setBlocks((b) => b.filter((_, j) => j !== i));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const next = [...b];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    const cleanHighlights = highlights
      .map((h) => ({
        icon: h.icon,
        label: h.label.trim(),
        value: h.value.trim() || undefined,
      }))
      .filter((h) => h.label);
    const cleanBlocks = blocks
      .map((b) =>
        b.kind === "image"
          ? {
              kind: "image" as const,
              url: b.url.trim(),
              caption: b.caption.trim() || undefined,
            }
          : { kind: b.kind, text: b.text.trim() }
      )
      .filter((b) => (b.kind === "image" ? b.url : b.text));

    start(async () => {
      try {
        await saveProductShowcase({
          productId,
          tagline,
          highlights: cleanHighlights,
          detailBlocks: cleanBlocks,
        });
        toast.success("展示内容已保存");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "保存失败");
      }
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
      <div className="flex items-baseline justify-between border-b border-[var(--color-rule)] pb-3">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink)]">
          Showcase · 展示内容
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
          卖点 · 亮点 · 图文详情
        </span>
      </div>

      {/* Tagline */}
      <div className="mt-5">
        <label className={labelCls}>卖点短语带（用 · 或 、 分隔多个短语）</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="如：IP65 防水 · 五年质保 · 高显指 Ra90"
          className={`${inputCls} mt-2`}
        />
      </div>

      {/* Highlights */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label className={labelCls}>亮点图标排</label>
          <button
            type="button"
            onClick={addHighlight}
            className="flex items-center gap-1 font-mono text-[11px] text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
          >
            <Plus className="h-3.5 w-3.5" /> 添加亮点
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {highlights.length === 0 && (
            <p className="text-[12px] text-[var(--color-ink-faint)]">
              暂无亮点。建议加 3–4 个，如「防水 IP65」「质保 5 年」。
            </p>
          )}
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={h.icon}
                onChange={(e) => updateHighlight(i, { icon: e.target.value })}
                className={`${inputCls} w-32 shrink-0`}
              >
                {ICONS.map((ic) => (
                  <option key={ic.key} value={ic.key}>
                    {ic.label}
                  </option>
                ))}
              </select>
              <input
                value={h.value}
                onChange={(e) => updateHighlight(i, { value: e.target.value })}
                placeholder="数值（可选）如 IP65"
                className={`${inputCls} w-36 shrink-0`}
              />
              <input
                value={h.label}
                onChange={(e) => updateHighlight(i, { label: e.target.value })}
                placeholder="说明，如 防水防尘"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => removeHighlight(i)}
                aria-label="删除"
                className="shrink-0 p-2 text-[var(--color-ink-faint)] transition hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detail blocks */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label className={labelCls}>图文长详情（京东式，自上而下铺陈）</label>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--color-ink-muted)]">
            <button
              type="button"
              onClick={() => addBlock("heading")}
              className="flex items-center gap-1 transition hover:text-[var(--color-ink)]"
            >
              <Plus className="h-3.5 w-3.5" /> 标题
            </button>
            <button
              type="button"
              onClick={() => addBlock("text")}
              className="flex items-center gap-1 transition hover:text-[var(--color-ink)]"
            >
              <Plus className="h-3.5 w-3.5" /> 段落
            </button>
            <button
              type="button"
              onClick={() => addBlock("image")}
              className="flex items-center gap-1 transition hover:text-[var(--color-ink)]"
            >
              <Plus className="h-3.5 w-3.5" /> 图片
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {blocks.length === 0 && (
            <p className="text-[12px] text-[var(--color-ink-faint)]">
              暂无详情。可交替添加「标题 / 段落 / 图片」拼出长详情页。
            </p>
          )}
          {blocks.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-surface-sunken)] p-2.5"
            >
              <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                <GripVertical className="h-4 w-4 text-[var(--color-ink-faint)]" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {b.kind === "heading"
                    ? "标题"
                    : b.kind === "text"
                      ? "段落"
                      : "图片"}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {b.kind === "image" ? (
                  <>
                    <input
                      value={b.url}
                      onChange={(e) => updateBlock(i, { url: e.target.value })}
                      placeholder="图片 URL（https://…）"
                      className={inputCls}
                    />
                    <input
                      value={b.caption}
                      onChange={(e) =>
                        updateBlock(i, { caption: e.target.value })
                      }
                      placeholder="图注（可选）"
                      className={inputCls}
                    />
                    {b.url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={b.url}
                        alt=""
                        className="max-h-32 rounded-md border border-[var(--color-rule)] object-cover"
                      />
                    )}
                  </>
                ) : (
                  <textarea
                    value={b.text}
                    onChange={(e) => updateBlock(i, { text: e.target.value })}
                    placeholder={
                      b.kind === "heading" ? "小标题文字" : "段落正文…"
                    }
                    rows={b.kind === "heading" ? 1 : 3}
                    className={`${inputCls} resize-y`}
                  />
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveBlock(i, -1)}
                  disabled={i === 0}
                  aria-label="上移"
                  className="p-1 text-[var(--color-ink-faint)] transition hover:text-[var(--color-ink)] disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(i, 1)}
                  disabled={i === blocks.length - 1}
                  aria-label="下移"
                  className="p-1 text-[var(--color-ink-faint)] transition hover:text-[var(--color-ink)] disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  aria-label="删除"
                  className="p-1 text-[var(--color-ink-faint)] transition hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t border-[var(--color-rule)] pt-4">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-[var(--color-surface)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存展示内容"}
        </button>
      </div>
    </section>
  );
}
