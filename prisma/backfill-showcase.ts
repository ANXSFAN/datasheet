// 对既有库补写产品「展示内容」（卖点 / 亮点 / 图文详情），按 slug 定向更新。
// 只 update 产品的展示字段，绝不触碰 Factory / AdminUser，安全可重复运行。
// 运行：npm run db:backfill-showcase
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { SHOWCASE } from "./showcase-data.js";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  let updated = 0;
  const slugs = Object.keys(SHOWCASE);
  for (const slug of slugs) {
    const sc = SHOWCASE[slug];
    const res = await prisma.product.updateMany({
      where: { slug },
      data: {
        tagline: sc.tagline,
        highlights: sc.highlights,
        detailBlocks: sc.detailBlocks,
      },
    });
    if (res.count > 0) updated++;
    console.log(`${res.count > 0 ? "✓" : "·（未找到）"} ${slug}`);
  }
  console.log(`Backfill done — ${updated}/${slugs.length} products updated.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
