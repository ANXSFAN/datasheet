import "server-only";
import { prisma } from "@/lib/prisma";
import { parseNameI18n } from "@/lib/catalog";
import {
  type AttrDef,
  isAttrType,
  parseAttrOptions,
} from "@/lib/attribute-defaults";

export type { AttrDef };

/** 取某工厂的完整属性字典（按 sortOrder），DB 行 → 运行时形状。 */
export async function listAttributes(factoryId: string): Promise<AttrDef[]> {
  const rows = await prisma.attributeDefinition.findMany({
    where: { factoryId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    nameI18n: parseNameI18n(r.nameI18n),
    unit: r.unit ?? undefined,
    type: isAttrType(r.type) ? r.type : "text",
    options: parseAttrOptions(r.options),
    sortOrder: r.sortOrder,
  }));
}
