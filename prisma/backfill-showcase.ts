// 对既有库补写产品「展示内容」（卖点 / 亮点 / 图文详情），按 slug 定向更新。
// 只 update 产品的展示字段，绝不触碰 Factory / AdminUser，安全可重复运行。
// 运行：npm run db:backfill-showcase
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { SHOWCASE } from "./showcase-data.js";
import { applyFloodlightVariants } from "./variant-demo.js";

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

  // 投光灯变体组（演示「规格选择」）：给现有 100W 补系列、补建 50W / 150W。
  const main = await prisma.product.findFirst({
    where: { slug: "led-floodlight-100w" },
    select: { factoryId: true },
  });
  if (main) {
    await applyFloodlightVariants(prisma, main.factoryId);
    console.log("✓ 投光灯变体组已写入（50W / 100W / 150W）");
  } else {
    console.log("· 未找到 led-floodlight-100w，跳过变体演示");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
