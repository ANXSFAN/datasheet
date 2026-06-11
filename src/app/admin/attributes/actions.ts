"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveFactory } from "@/lib/active-factory";
import { adminErr } from "@/lib/admin-err";
import { openRouterJSON, type ChatMessage } from "@/lib/ai";
import { routing } from "@/i18n/routing";
import {
  ATTR_KEY_RE,
  DEFAULT_ATTRIBUTES,
  isAttrType,
} from "@/lib/attribute-defaults";

async function authedFactory() {
  const session = await auth();
  if (!session) throw await adminErr("unauthorized");
  const factory = await getActiveFactory();
  if (!factory) throw await adminErr("noFactory");
  return factory;
}

function revalidate() {
  revalidatePath("/admin/attributes");
  revalidatePath("/admin/products");
}

async function assertAttrOwned(id: string, factoryId: string) {
  const a = await prisma.attributeDefinition.findUnique({ where: { id } });
  if (!a || a.factoryId !== factoryId) throw await adminErr("attrNotFound");
  return a;
}

function cleanNameI18n(input: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(input))
    if (routing.locales.includes(k as never) && v.trim()) clean[k] = v.trim();
  return clean;
}

function cleanOptions(input: string[] | undefined): string[] {
  if (!input) return [];
  const out: string[] = [];
  for (const v of input) {
    const t = v.trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 60);
}

/** 新建属性。key 创建后不可改（产品 Json / 规则条件 / 规格行都按 key 引用）。 */
export async function createAttribute(input: {
  key: string;
  name: string;
  unit?: string;
  type: string;
  options?: string[];
}) {
  const factory = await authedFactory();
  const key = input.key.trim();
  if (!key) throw await adminErr("attrKeyRequired");
  if (!ATTR_KEY_RE.test(key)) throw await adminErr("attrKeyInvalid");
  const name = input.name.trim();
  if (!name) throw await adminErr("attrNameRequired");
  const type = isAttrType(input.type) ? input.type : "text";
  const count = await prisma.attributeDefinition.count({
    where: { factoryId: factory.id },
  });
  try {
    const created = await prisma.attributeDefinition.create({
      data: {
        factoryId: factory.id,
        key,
        name,
        unit: input.unit?.trim() || null,
        type,
        options: type === "select" ? cleanOptions(input.options) : undefined,
        sortOrder: count,
      },
    });
    revalidate();
    return created.id;
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      throw await adminErr("attrKeyTaken", { key });
    }
    throw e;
  }
}

export async function updateAttribute(
  id: string,
  input: {
    name?: string;
    nameI18n?: Record<string, string>;
    unit?: string;
    type?: string;
    options?: string[];
  },
) {
  const factory = await authedFactory();
  await assertAttrOwned(id, factory.id);
  const data: {
    name?: string;
    nameI18n?: Record<string, string>;
    unit?: string | null;
    type?: string;
    options?: string[];
  } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw await adminErr("attrNameRequired");
    data.name = name;
  }
  if (input.nameI18n !== undefined) data.nameI18n = cleanNameI18n(input.nameI18n);
  if (input.unit !== undefined) data.unit = input.unit.trim() || null;
  if (input.type !== undefined && isAttrType(input.type)) data.type = input.type;
  if (input.options !== undefined) data.options = cleanOptions(input.options);
  await prisma.attributeDefinition.update({ where: { id }, data });
  revalidate();
}

/**
 * 删除属性定义。产品已存的 attributes Json / 规格行 key / 规则条件不受影响
 * （运行时安全降级：规则条件读不到值即不成立，规格 label 走 contentI18n 回退），
 * 仅影响之后的候选列表与译名解析。
 */
export async function deleteAttribute(id: string) {
  const factory = await authedFactory();
  await assertAttrOwned(id, factory.id);
  await prisma.attributeDefinition.delete({ where: { id } });
  revalidate();
}

export async function reorderAttributes(orderedIds: string[]) {
  const factory = await authedFactory();
  const own = await prisma.attributeDefinition.findMany({
    where: { factoryId: factory.id },
    select: { id: true },
  });
  const ownSet = new Set(own.map((a) => a.id));
  const ids = orderedIds.filter((i) => ownSet.has(i));
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.attributeDefinition.update({
        where: { id },
        data: { sortOrder: i },
      }),
    ),
  );
  revalidate();
}

/** AI 把属性名（源语言 es）翻译到其余 8 种语言，写入 nameI18n。操作员按钮触发。 */
export async function translateAttribute(id: string) {
  const factory = await authedFactory();
  const attr = await assertAttrOwned(id, factory.id);
  const targets = routing.locales.filter((l) => l !== "es");
  const sys: ChatMessage = {
    role: "system",
    content:
      "You translate a technical spec-attribute name for LED lighting products " +
      "(e.g. PCB width, color temperature, IP rating). " +
      "Output ONLY a JSON object mapping locale code to the translated name. " +
      "Keep it short and technical, as it appears in a spec table. No extra text.",
  };
  const user: ChatMessage = {
    role: "user",
    content: `Source (Spanish) attribute name: "${attr.name}"${attr.unit ? ` (unit: ${attr.unit})` : ""}. Translate to: ${targets.join(", ")}. Return e.g. {"en":"...","zh":"..."}`,
  };
  const raw = (await openRouterJSON([sys, user])) as Record<string, unknown>;
  const nameI18n: Record<string, string> = {};
  for (const l of targets) if (typeof raw[l] === "string") nameI18n[l] = raw[l] as string;
  await prisma.attributeDefinition.update({ where: { id }, data: { nameI18n } });
  revalidate();
  return nameI18n;
}

/** 一键预置常用 LED 属性（幂等，已存在的 key 跳过）。 */
export async function seedDefaultAttributes() {
  const factory = await authedFactory();
  const count = await prisma.attributeDefinition.count({
    where: { factoryId: factory.id },
  });
  const res = await prisma.attributeDefinition.createMany({
    data: DEFAULT_ATTRIBUTES.map((d, i) => ({
      factoryId: factory.id,
      key: d.key,
      name: d.name,
      nameI18n: d.nameI18n,
      unit: d.unit ?? null,
      type: d.type,
      options: d.options ?? undefined,
      sortOrder: count + i,
    })),
    skipDuplicates: true,
  });
  revalidate();
  return res.count;
}
