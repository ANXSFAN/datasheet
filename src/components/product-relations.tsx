"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Save, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  saveProductMeta,
  adoptSuggestion,
  addAccessoryByModel,
  removeLink,
} from "@/app/admin/products/actions";
import type { AttrDefLite } from "@/lib/attribute-defaults";

// label 走 misc 命名空间的 i18n key；value 仍是入库的类目代码
const CATEGORY_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "", labelKey: "catNone" },
  { value: "strip", labelKey: "catStrip" },
  { value: "channel", labelKey: "catChannel" },
  { value: "power", labelKey: "catPower" },
  { value: "connector", labelKey: "catConnector" },
  { value: "accessory", labelKey: "catAccessory" },
];

const CAT_KEY: Record<string, string> = {
  strip: "catStrip",
  channel: "catChannel",
  power: "catPower",
  connector: "catConnector",
  accessory: "catAccessory",
};

const REL_KEY: Record<string, string> = {
  accessory: "relAccessory",
  alternative: "relAlternative",
};

interface LinkItem {
  linkId: string;
  toId: string;
  relation: string;
  modelNumber: string;
  name: string;
  category: string | null;
}
interface SuggestionItem {
  toId: string;
  modelNumber: string;
  name: string;
  category: string | null;
  relation: string;
  reason: string;
}

interface Props {
  productId: string;
  category: string | null;
  series: string | null;
  attributes: Record<string, string | number>;
  attrDefs: AttrDefLite[];
  links: LinkItem[];
  suggestions: SuggestionItem[];
  candidateModels: string[];
}

function CatChip({ category }: { category: string | null }) {
  const t = useTranslations("misc");
  if (!category || !CAT_KEY[category]) return null;
  return (
    <span className="rounded-full border border-[var(--color-rule)] px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
      {t(CAT_KEY[category])}
    </span>
  );
}

export function ProductRelations({
  productId,
  category,
  series,
  attributes,
  attrDefs,
  links,
  suggestions,
  candidateModels,
}: Props) {
  const router = useRouter();
  const t = useTranslations("misc");
  const tc = useTranslations("admin.common");
  const [pending, startTransition] = useTransition();

  // 属性表单：行集合 = 字典 key ∪ 产品已存 key（字典删项后旧数据不静默丢失）
  const attrRows: { key: string; def?: AttrDefLite }[] = [
    ...attrDefs.map((d) => ({ key: d.key, def: d })),
    ...Object.keys(attributes)
      .filter((k) => !attrDefs.some((d) => d.key === k))
      .map((k) => ({ key: k })),
  ];
  const [cat, setCat] = useState(category ?? "");
  const [ser, setSer] = useState(series ?? "");
  const [attrVals, setAttrVals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const r of attrRows)
      init[r.key] = attributes[r.key] != null ? String(attributes[r.key]) : "";
    return init;
  });

  // 手动关联表单
  const [addModel, setAddModel] = useState("");
  const [addRel, setAddRel] = useState("accessory");

  function run(fn: () => Promise<void>, okMsg: string, onOk?: () => void) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(okMsg);
        onOk?.();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tc("opFail"));
      }
    });
  }

  return (
    <div className="mt-10 space-y-10">
      {/* 属性 & 分类 */}
      <section>
        <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
          {t("relTitle")}
        </h2>
        <div className="space-y-4 rounded-xl border border-[var(--color-rule)] p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("category")}>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="form-input"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value ? `${t(o.labelKey)} ${o.value}` : t(o.labelKey)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("series")}>
              <input
                value={ser}
                onChange={(e) => setSer(e.target.value)}
                placeholder={t("seriesPh")}
                className="form-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {attrRows.map(({ key, def }) => (
              <Field
                key={key}
                label={
                  def ? (
                    <>
                      {def.label}
                      {def.unit ? (
                        <span className="ml-1 text-[var(--color-ink-faint)]">({def.unit})</span>
                      ) : null}
                      <span className="ml-1.5 font-mono text-[10px] text-[var(--color-ink-faint)]">
                        {key}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono">{key}</span>
                  )
                }
              >
                <input
                  value={attrVals[key] ?? ""}
                  onChange={(e) =>
                    setAttrVals((m) => ({ ...m, [key]: e.target.value }))
                  }
                  inputMode={def?.type === "number" ? "decimal" : undefined}
                  list={
                    def?.type === "select" && def.options.length
                      ? `attr-opt-${key}`
                      : undefined
                  }
                  className="form-input font-mono"
                />
                {def?.type === "select" && def.options.length > 0 && (
                  <datalist id={`attr-opt-${key}`}>
                    {def.options.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                )}
              </Field>
            ))}
          </div>
          <button
            onClick={() =>
              run(
                () =>
                  saveProductMeta({
                    productId,
                    category: cat,
                    series: ser,
                    attributes: attrVals,
                  }),
                t("saveAttr"),
              )
            }
            disabled={pending}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs text-white transition hover:bg-[#424245] disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t("saveAttr")}
          </button>
        </div>
      </section>

      {/* 自动匹配建议 */}
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
          <Sparkles className="h-3.5 w-3.5" />
          {t("suggestions")}
        </h2>
        {suggestions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-rule)] p-5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
            {t("suggestEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-rule)] overflow-hidden rounded-xl border border-[var(--color-rule)]">
            {suggestions.map((s) => (
              <li key={s.toId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CatChip category={s.category} />
                    <span className="font-mono text-xs text-[var(--color-ink)]">{s.modelNumber}</span>
                    <span className="truncate text-sm text-[var(--color-ink-soft)]">{s.name}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">{s.reason}</p>
                </div>
                <button
                  onClick={() =>
                    run(() => adoptSuggestion(productId, s.toId, s.relation), t("adopt"))
                  }
                  disabled={pending}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-rule)] px-3 py-1.5 text-xs text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)] disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("adopt")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 现有配件关系 */}
      <section>
        <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
          {t("linksTitle")}
        </h2>

        {links.length > 0 && (
          <ul className="mb-4 divide-y divide-[var(--color-rule)] overflow-hidden rounded-xl border border-[var(--color-rule)]">
            {links.map((l) => (
              <li key={l.linkId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <CatChip category={l.category} />
                  <span className="font-mono text-xs text-[var(--color-ink)]">{l.modelNumber}</span>
                  <span className="truncate text-sm text-[var(--color-ink-soft)]">{l.name}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
                    {REL_KEY[l.relation] ? t(REL_KEY[l.relation]) : l.relation}
                  </span>
                </div>
                <button
                  onClick={() => run(() => removeLink(l.linkId, productId), t("relTitle"))}
                  disabled={pending}
                  className="shrink-0 text-[var(--color-ink-muted)] transition hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-rule)] p-4">
          <input
            value={addModel}
            onChange={(e) => setAddModel(e.target.value)}
            placeholder={t("addModelPh")}
            list="candidate-models"
            className="form-input min-w-0 flex-1 font-mono"
          />
          <datalist id="candidate-models">
            {candidateModels.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <select
            value={addRel}
            onChange={(e) => setAddRel(e.target.value)}
            className="form-input w-auto"
          >
            <option value="accessory">{t("relAccessory")}</option>
            <option value="alternative">{t("relAlternative")}</option>
          </select>
          <button
            onClick={() => {
              if (!addModel.trim()) {
                toast.error(t("addModelPh"));
                return;
              }
              run(() => addAccessoryByModel(productId, addModel, addRel), t("adopt"), () =>
                setAddModel(""),
              );
            }}
            disabled={pending}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs text-white transition hover:bg-[#424245] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addModelPh")}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[var(--color-ink)]">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
