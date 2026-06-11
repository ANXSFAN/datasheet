// 为每个工厂预置常用 LED 属性字典（pcbWidth/voltage/watt/cct/cri/ip/beamAngle/lumen）。
// 安全、幂等、可重复运行（createMany skipDuplicates）；不触碰产品数据。
// 运行：npm run db:backfill-attributes
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_ATTRIBUTES } from "../src/lib/attribute-defaults";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const factories = await prisma.factory.findMany({
    select: { id: true, name: true },
  });

  for (const f of factories) {
    const res = await prisma.attributeDefinition.createMany({
      data: DEFAULT_ATTRIBUTES.map((d, i) => ({
        factoryId: f.id,
        key: d.key,
        name: d.name,
        nameI18n: d.nameI18n,
        unit: d.unit ?? null,
        type: d.type,
        options: d.options ?? undefined,
        sortOrder: i,
      })),
      skipDuplicates: true,
    });
    console.log(`工厂「${f.name}」：新增属性 ${res.count} 条（已存在的跳过）`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
