// 属性字典的纯类型 / 常量层：不依赖 prisma、不带 server-only，
// 供客户端组件（编辑器）与 prisma/ 脚本（backfill）共用。

/** 机器 key 约束：字母开头，字母/数字/下划线，≤40 字符（兼容存量 pcbWidth/voltage/watt）。 */
export const ATTR_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;

export const ATTR_TYPES = ["text", "number", "select"] as const;
export type AttrType = (typeof ATTR_TYPES)[number];

export function isAttrType(v: string | null | undefined): v is AttrType {
  return !!v && (ATTR_TYPES as readonly string[]).includes(v);
}

/** 字典项的运行时形状（DB 行解析后）。 */
export type AttrDef = {
  id: string;
  key: string;
  /** 源语言（es）显示名。 */
  name: string;
  /** { en, zh, ... } 译名，缺则回退 name。 */
  nameI18n: Record<string, string>;
  unit?: string;
  type: AttrType;
  /** type=select 时的候选值。 */
  options: string[];
  sortOrder: number;
};

/** 解析 options Json 列 → string[]。 */
export function parseAttrOptions(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  const out: string[] = [];
  for (const v of json) {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  }
  return out;
}

/** 取字典项某语言的显示名（客户端安全，不依赖 catalog.ts 的 server-only）。 */
export function attrLabel(def: Pick<AttrDef, "name" | "nameI18n">, locale: string): string {
  return def.nameI18n[locale] || def.name;
}

/**
 * 传给客户端编辑器的轻量字典形状：label 已按后台语言本地化；
 * srcName 为源语言（es）名——规格行挂 key 时 label 统一写入源名，保证源 specs 语言一致。
 */
export type AttrDefLite = {
  key: string;
  label: string;
  srcName: string;
  unit: string;
  type: AttrType;
  options: string[];
};

/**
 * 预置常用 LED 属性（确定术语，9 语硬编码译名，不花 AI 钱）。
 * name 为 es 源语言；nameI18n 不含 es。
 * 同一份数据喂 prisma/backfill-attributes.ts 与后台「预置常用属性」按钮，均幂等。
 */
export const DEFAULT_ATTRIBUTES: Array<{
  key: string;
  name: string;
  nameI18n: Record<string, string>;
  unit?: string;
  type: AttrType;
  options?: string[];
}> = [
  {
    key: "pcbWidth",
    name: "Ancho de PCB",
    nameI18n: {
      en: "PCB width",
      zh: "PCB宽度",
      fr: "Largeur PCB",
      de: "PCB-Breite",
      it: "Larghezza PCB",
      pt: "Largura da PCB",
      nl: "PCB-breedte",
      pl: "Szerokość PCB",
    },
    unit: "mm",
    type: "text",
  },
  {
    key: "voltage",
    name: "Voltaje",
    nameI18n: {
      en: "Voltage",
      zh: "电压",
      fr: "Tension",
      de: "Spannung",
      it: "Tensione",
      pt: "Tensão",
      nl: "Spanning",
      pl: "Napięcie",
    },
    type: "select",
    options: ["DC5V", "DC12V", "DC24V", "DC48V", "AC100-240V", "AC220-240V"],
  },
  {
    key: "watt",
    name: "Potencia",
    nameI18n: {
      en: "Power",
      zh: "功率",
      fr: "Puissance",
      de: "Leistung",
      it: "Potenza",
      pt: "Potência",
      nl: "Vermogen",
      pl: "Moc",
    },
    unit: "W",
    type: "number",
  },
  {
    key: "cct",
    name: "Temperatura de color",
    nameI18n: {
      en: "Color temperature",
      zh: "色温",
      fr: "Température de couleur",
      de: "Farbtemperatur",
      it: "Temperatura di colore",
      pt: "Temperatura de cor",
      nl: "Kleurtemperatuur",
      pl: "Temperatura barwowa",
    },
    unit: "K",
    type: "select",
    options: ["2700K", "3000K", "4000K", "5000K", "6500K"],
  },
  {
    key: "cri",
    name: "CRI",
    nameI18n: {
      en: "CRI",
      zh: "显色指数",
      fr: "IRC",
      de: "CRI",
      it: "CRI",
      pt: "CRI",
      nl: "CRI",
      pl: "CRI",
    },
    unit: "Ra",
    type: "number",
  },
  {
    key: "ip",
    name: "Grado de protección",
    nameI18n: {
      en: "IP rating",
      zh: "防护等级",
      fr: "Indice de protection",
      de: "Schutzart",
      it: "Grado di protezione",
      pt: "Grau de proteção",
      nl: "Beschermingsgraad",
      pl: "Stopień ochrony",
    },
    type: "select",
    options: ["IP20", "IP44", "IP54", "IP65", "IP67", "IP68"],
  },
  {
    key: "beamAngle",
    name: "Ángulo de haz",
    nameI18n: {
      en: "Beam angle",
      zh: "光束角",
      fr: "Angle de faisceau",
      de: "Abstrahlwinkel",
      it: "Angolo del fascio",
      pt: "Ângulo de feixe",
      nl: "Stralingshoek",
      pl: "Kąt świecenia",
    },
    unit: "°",
    type: "number",
  },
  {
    key: "lumen",
    name: "Flujo luminoso",
    nameI18n: {
      en: "Luminous flux",
      zh: "光通量",
      fr: "Flux lumineux",
      de: "Lichtstrom",
      it: "Flusso luminoso",
      pt: "Fluxo luminoso",
      nl: "Lichtstroom",
      pl: "Strumień świetlny",
    },
    unit: "lm",
    type: "number",
  },
];
