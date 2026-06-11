// 临时验证脚本：contentSourceHash 加 specsWithoutKeys 剥 key 后，
// 存量产品（specs 均无 key）的指纹必须与旧口径完全一致，否则会全站误判译文过期。
// 逻辑与 src/lib/products.ts 保持同构（该文件带 server-only，脚本无法直接 import）。
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

function specsWithoutKeys(specs: unknown): unknown {
  if (!Array.isArray(specs)) return specs;
  return specs.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return row;
    const { key: _key, ...rest } = row as Record<string, unknown>;
    void _key;
    return rest;
  });
}

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function hash(p: Record<string, unknown>, stripKeys: boolean): string {
  return djb2(
    JSON.stringify([
      p.name,
      p.description,
      p.tagline,
      p.highlights,
      p.applications,
      p.faq,
      p.boxContents,
      p.install,
      p.dimensions,
      p.detailBlocks,
      stripKeys ? specsWithoutKeys(p.specs) : p.specs,
      p.sourceLocale,
    ]),
  );
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      modelNumber: true,
      name: true,
      description: true,
      tagline: true,
      highlights: true,
      applications: true,
      faq: true,
      boxContents: true,
      install: true,
      dimensions: true,
      detailBlocks: true,
      specs: true,
      sourceLocale: true,
      translationStamp: true,
    },
  });

  let mismatch = 0;
  let stampedOk = 0;
  let stamped = 0;
  for (const p of products) {
    const oldH = hash(p, false);
    const newH = hash(p, true);
    if (oldH !== newH) {
      mismatch++;
      console.log(`指纹漂移: ${p.modelNumber} old=${oldH} new=${newH}`);
    }
    if (p.translationStamp) {
      stamped++;
      if (p.translationStamp === newH) stampedOk++;
    }
  }
  console.log(
    `共 ${products.length} 个产品；新旧指纹不一致 ${mismatch} 个（预期 0）；` +
      `已翻译 ${stamped} 个，其中新口径下指纹仍吻合（非过期）${stampedOk} 个`,
  );
  if (mismatch > 0) process.exit(1);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
