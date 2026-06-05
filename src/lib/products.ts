import "server-only";
import { prisma } from "@/lib/prisma";

export type ProductSpec = {
  /** Optional group label, e.g. "Electrical" / "Photometric" */
  group?: string;
  label: string;
  value: string;
  unit?: string;
};

export function findPublicProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      factory: true,
      documents: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export type PublicProduct = NonNullable<
  Awaited<ReturnType<typeof findPublicProductBySlug>>
>;

/** Safe runtime parse for the Json `specs` column. */
export function parseSpecs(json: unknown): ProductSpec[] {
  if (!Array.isArray(json)) return [];
  const out: ProductSpec[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.label !== "string" || typeof r.value !== "string") continue;
    out.push({
      group: typeof r.group === "string" ? r.group : undefined,
      label: r.label,
      value: r.value,
      unit: typeof r.unit === "string" ? r.unit : undefined,
    });
  }
  return out;
}

/** 自动匹配用的产品属性（PCB 宽度决定铝槽，电压 + 功率决定电源）。 */
export type ProductAttributes = {
  pcbWidth?: string;
  voltage?: string;
  watt?: number;
};

/** Safe runtime parse for the Json `attributes` column. */
export function parseAttributes(json: unknown): ProductAttributes {
  if (!json || typeof json !== "object") return {};
  const r = json as Record<string, unknown>;
  const out: ProductAttributes = {};
  if (typeof r.pcbWidth === "string" && r.pcbWidth.trim()) out.pcbWidth = r.pcbWidth.trim();
  if (typeof r.voltage === "string" && r.voltage.trim()) out.voltage = r.voltage.trim();
  if (typeof r.watt === "number" && Number.isFinite(r.watt)) out.watt = r.watt;
  else if (typeof r.watt === "string" && r.watt.trim() && Number.isFinite(Number(r.watt))) {
    out.watt = Number(r.watt);
  }
  return out;
}

/** Group a flat ProductSpec[] by `.group` while preserving insertion order. */
export function groupSpecs(specs: ProductSpec[]) {
  const groups: { name: string; items: ProductSpec[] }[] = [];
  const index = new Map<string, number>();
  for (const s of specs) {
    const key = s.group ?? "";
    let i = index.get(key);
    if (i === undefined) {
      i = groups.length;
      index.set(key, i);
      groups.push({ name: key, items: [] });
    }
    groups[i].items.push(s);
  }
  return groups;
}

/** 亮点图标排：京东详情页标题下的"卖点 + 图标"短排。icon 为白名单 key（见前端映射）。 */
export type ProductHighlight = {
  icon: string;
  label: string;
  value?: string;
};

/** Safe runtime parse for the Json `highlights` column. */
export function parseHighlights(json: unknown): ProductHighlight[] {
  if (!Array.isArray(json)) return [];
  const out: ProductHighlight[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.label !== "string" || !r.label.trim()) continue;
    out.push({
      icon: typeof r.icon === "string" ? r.icon : "dot",
      label: r.label,
      value:
        typeof r.value === "string" && r.value.trim() ? r.value : undefined,
    });
  }
  return out;
}

/** 京东式图文长详情的一段。image 走 URL（v1 与导入一致），text/heading 走纯文本。 */
export type DetailBlock =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption?: string };

/** Safe runtime parse for the Json `detailBlocks` column. */
export function parseDetailBlocks(json: unknown): DetailBlock[] {
  if (!Array.isArray(json)) return [];
  const out: DetailBlock[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (r.kind === "image") {
      if (typeof r.url !== "string" || !r.url.trim()) continue;
      out.push({
        kind: "image",
        url: r.url,
        caption:
          typeof r.caption === "string" && r.caption.trim()
            ? r.caption
            : undefined,
      });
    } else if (r.kind === "heading" || r.kind === "text") {
      if (typeof r.text !== "string" || !r.text.trim()) continue;
      out.push({ kind: r.kind, text: r.text });
    }
  }
  return out;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(
    /\/$/,
    ""
  );
}

export type RelatedItem = {
  id: string;
  slug: string;
  name: string;
  modelNumber: string;
  coverImage: string | null;
  category: string | null;
};

export type RelatedAccessory = RelatedItem & { relation: string };

export type VariantOption = {
  id: string;
  slug: string;
  modelNumber: string;
  variantLabel: string | null;
};

/**
 * 同系列规格变体（京东式「选规格」）：同 `series`、同租户的所有型号（含当前自己）。
 * 仅当组内 >1 个型号时才返回，单品不显示选择器。运营在后台填 variantLabel 作为
 * 短标签（如「100W」「暖光 3000K」），未填则前台回退展示 modelNumber。
 */
export async function findVariants(product: {
  factoryId: string;
  series: string | null;
}): Promise<VariantOption[]> {
  if (!product.series) return [];
  const rows = await prisma.product.findMany({
    where: { factoryId: product.factoryId, series: product.series },
    orderBy: [{ variantLabel: "asc" }, { modelNumber: "asc" }],
    select: { id: true, slug: true, modelNumber: true, variantLabel: true },
  });
  return rows.length > 1 ? rows : [];
}

/**
 * 相关产品（同租户内）：
 * - siblings：同 `series` 的兄弟产品（零授权成本，纯聚合）
 * - accessories：手动 / 导入的 ProductLink（权威，优先展示）
 * 属性自动匹配兜底属于 M9，这里只取手动关系，保证展示确定、不乱推荐。
 */
export async function findRelatedProducts(product: {
  id: string;
  factoryId: string;
  series: string | null;
}): Promise<{ siblings: RelatedItem[]; accessories: RelatedAccessory[] }> {
  const select = {
    id: true,
    slug: true,
    name: true,
    modelNumber: true,
    coverImage: true,
    category: true,
  } as const;

  const [siblings, links] = await Promise.all([
    product.series
      ? prisma.product.findMany({
          where: {
            factoryId: product.factoryId,
            series: product.series,
            id: { not: product.id },
          },
          orderBy: { name: "asc" },
          take: 8,
          select,
        })
      : Promise.resolve([] as RelatedItem[]),
    prisma.productLink.findMany({
      where: { fromId: product.id },
      orderBy: { sortOrder: "asc" },
      take: 12,
      select: { relation: true, to: { select } },
    }),
  ]);

  return {
    siblings,
    accessories: links.map((l) => ({ ...l.to, relation: l.relation })),
  };
}
