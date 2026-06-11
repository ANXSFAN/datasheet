import type { ProductAttributes } from "@/lib/products";

/** 类目枚举（与导入 / 展示共用）。 */
export const CATEGORIES = ["strip", "channel", "power", "connector", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS_ZH: Record<Category, string> = {
  strip: "灯带",
  channel: "铝槽",
  power: "电源",
  connector: "连接件",
  accessory: "配件",
};

export function isCategory(v: string | null | undefined): v is Category {
  return !!v && (CATEGORIES as readonly string[]).includes(v);
}

/** 取值里的第一个数字，用于把 "10mm" / "24V" / 14.4 归一成可比较的数值串。 */
function normNum(v?: string | number): string | null {
  if (v === undefined || v === null) return null;
  const m = String(v).match(/[\d.]+/);
  return m ? m[0] : null;
}

/** 属性值 → 有限数字；非数字 → null（attributes 通用化后值可能是字符串）。 */
function numOf(v?: string | number): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = normNum(v);
  return s !== null && Number.isFinite(Number(s)) ? Number(s) : null;
}

export interface MatchCandidate {
  id: string;
  modelNumber: string;
  name: string;
  category: string | null;
  attributes: ProductAttributes;
}

export interface Suggestion {
  toId: string;
  modelNumber: string;
  name: string;
  category: string | null;
  relation: "accessory";
  basis: "pcbWidth" | "voltage";
  reason: string;
}

/**
 * 属性自动匹配：只对灯带(strip)产品，按属性在同工厂内找适配的铝槽 / 电源。
 * - PCB 宽度相同 → 铝槽(channel)
 * - 电压相同 → 电源(power)（功率仅作为提示，不强约束）
 * 只产出"建议"，由后台确认后才写 ProductLink，绝不静默写库。
 * excludeIds 用于过滤已手动关联 / 自身，避免重复建议。
 */
export function suggestAccessories(
  current: { category: string | null; attributes: ProductAttributes },
  candidates: MatchCandidate[],
  excludeIds: Set<string>,
): Suggestion[] {
  if (current.category !== "strip") return [];

  const width = normNum(current.attributes.pcbWidth);
  const volt = normNum(current.attributes.voltage);
  const out: Suggestion[] = [];

  for (const c of candidates) {
    if (excludeIds.has(c.id)) continue;

    if (c.category === "channel" && width && normNum(c.attributes.pcbWidth) === width) {
      out.push({
        toId: c.id,
        modelNumber: c.modelNumber,
        name: c.name,
        category: c.category,
        relation: "accessory",
        basis: "pcbWidth",
        reason: `PCB 宽度 ${current.attributes.pcbWidth} 匹配`,
      });
    } else if (c.category === "power" && volt && normNum(c.attributes.voltage) === volt) {
      const curWatt = numOf(current.attributes.watt);
      const candWatt = numOf(c.attributes.watt);
      const wattHint =
        curWatt !== null && candWatt !== null
          ? `；电源 ${candWatt}W ${candWatt >= curWatt ? "≥" : "<"} 灯带 ${curWatt}W/m`
          : "";
      out.push({
        toId: c.id,
        modelNumber: c.modelNumber,
        name: c.name,
        category: c.category,
        relation: "accessory",
        basis: "voltage",
        reason: `电压 ${current.attributes.voltage} 匹配${wattHint}`,
      });
    }
  }
  return out;
}
