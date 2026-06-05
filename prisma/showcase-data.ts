// 产品「展示内容」种子数据（卖点带 / 亮点图标排 / 京东式图文长详情）。
// 单一数据源：seed.ts 建库时写入，backfill-showcase.ts 对既有库补写。
// icon 取值见 src/components/showcase-editor.tsx 的 ICONS 白名单。

export type ShowcaseHighlight = { icon: string; label: string; value?: string };
export type ShowcaseBlock =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "image"; url: string; caption?: string };
export type Showcase = {
  tagline: string;
  highlights: ShowcaseHighlight[];
  detailBlocks: ShowcaseBlock[];
};

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

export const SHOWCASE: Record<string, Showcase> = {
  "led-strip-2835-ip65": {
    tagline: "IP65 防水灌封 · 120 灯/米高密度 · 现场可剪裁",
    highlights: [
      { icon: "droplet", label: "PU 灌封防水", value: "IP65" },
      { icon: "zap", label: "每米功率", value: "14.4W" },
      { icon: "bulb", label: "灯珠密度", value: "120/m" },
      { icon: "clock", label: "L70 寿命", value: "50,000h" },
    ],
    detailBlocks: [
      { kind: "heading", text: "为长距离连续布灯而生" },
      {
        kind: "text",
        text: "采用 2835 高亮灯珠，每米 120 颗密排，发光均匀无暗区。PU 二次灌封工艺让灯带在潮湿、多尘的户外环境下依然稳定工作，适合建筑轮廓、招牌标识与景观线条照明。",
      },
      {
        kind: "image",
        url: u("1565814329452-e1efa11c5b89"),
        caption: "建筑轮廓应用 · 均匀连续光线",
      },
      { kind: "heading", text: "现场施工友好" },
      {
        kind: "text",
        text: "每 50mm 设剪裁点，可按需断开；端接式接头免焊接快速连接，单段最长可串接 5 米。配合同系列铝槽散热，进一步延长寿命。",
      },
      {
        kind: "image",
        url: u("1513506003901-1e6a229e2d15"),
        caption: "可按剪裁点自由断开 · 端接快接",
      },
    ],
  },

  "led-downlight-9w": {
    tagline: "三色温一键切换 · 高显指 Ra85 · 75mm 标准开孔",
    highlights: [
      { icon: "sun", label: "三色温可调", value: "3CCT" },
      { icon: "bulb", label: "显色指数", value: "Ra≥85" },
      { icon: "ruler", label: "标准开孔", value: "Ø75" },
      { icon: "zap", label: "整灯功率", value: "9W" },
    ],
    detailBlocks: [
      { kind: "heading", text: "一盏灯，三种氛围" },
      {
        kind: "text",
        text: "灯体侧边拨动开关即可在 3000K 暖光、4000K 中性光、6500K 冷白之间切换，无需更换灯具即可适配客厅、商铺、办公等不同场景。",
      },
      {
        kind: "image",
        url: u("1513506003901-1e6a229e2d15"),
        caption: "暖光 / 中性 / 冷白 一键切换",
      },
      { kind: "heading", text: "无主灯设计首选" },
      {
        kind: "text",
        text: "Ø75mm 国标开孔，适配国内主流吊顶系统；压铸铝 + PC 面罩兼顾散热与柔和出光，Ra≥85 高显色还原物品真实质感。",
      },
    ],
  },

  "led-floodlight-100w": {
    tagline: "IP66 全防水 · IK08 抗冲击 · 130lm/W 高光效",
    highlights: [
      { icon: "droplet", label: "防水防尘", value: "IP66" },
      { icon: "shield", label: "抗冲击", value: "IK08" },
      { icon: "sun", label: "整灯光效", value: "130lm/W" },
      { icon: "gauge", label: "总光通量", value: "13,000lm" },
    ],
    detailBlocks: [
      { kind: "heading", text: "户外远投，全天候稳定" },
      {
        kind: "text",
        text: "压铸铝外壳 + 钢化玻璃，IP66 全防水加 IK08 抗冲击，可直面暴雨、扬尘与意外撞击。130lm/W 高光效在广告牌、体育场、建筑立面等大场景实现远距离均匀投射。",
      },
      {
        kind: "image",
        url: u("1518837695005-2083093ee35b"),
        caption: "建筑外立面泛光照明",
      },
      { kind: "heading", text: "宽压输入，全球适配" },
      {
        kind: "text",
        text: "AC 100–277V 宽电压输入，电网波动也能稳定点亮；可调支架便于现场对准投射角度，安装一次长期免维护。",
      },
      {
        kind: "image",
        url: u("1581094794329-c8112a89af12"),
        caption: "可调支架 · 现场快速对准",
      },
    ],
  },

  "led-streetlight-solar-60w": {
    tagline: "一体化免布线 · 雨天续航 3 天 · 磷酸铁锂长循环",
    highlights: [
      { icon: "battery", label: "雨天续航", value: "3 天" },
      { icon: "sun", label: "单晶光伏板", value: "80W" },
      { icon: "clock", label: "电池循环", value: "≥2000 次" },
      { icon: "droplet", label: "整灯防护", value: "IP65" },
    ],
    detailBlocks: [
      { kind: "heading", text: "无市电也能亮" },
      {
        kind: "text",
        text: "光伏板、锂电池、灯头、控制器一体集成，无需外部布线与开挖，特别适合乡村道路、园区与电网未覆盖区域。白天充电、夜晚自动点亮，光控 + 人体感应智能调光省电。",
      },
      {
        kind: "image",
        url: u("1545063328-c8e3faffa16f"),
        caption: "一体化灯头 · 免布线安装",
      },
      { kind: "heading", text: "续航有保障" },
      {
        kind: "text",
        text: "30Ah 磷酸铁锂电池循环寿命 ≥2000 次，连续阴雨天可续航 3 天，安全性与寿命远优于普通铅酸电池。",
      },
    ],
  },

  "led-highbay-200w": {
    tagline: "140lm/W 高光效 · 90°/120° 配光可选 · LM-80 认证",
    highlights: [
      { icon: "sun", label: "整灯光效", value: "140lm/W" },
      { icon: "gauge", label: "总光通量", value: "28,000lm" },
      { icon: "award", label: "光衰认证", value: "LM-80" },
      { icon: "ruler", label: "安装高度", value: "8–15m" },
    ],
    detailBlocks: [
      { kind: "heading", text: "高空大面积照明利器" },
      {
        kind: "text",
        text: "200W 大功率配合 140lm/W 高光效，单灯即可覆盖大面积作业区。圆形铝鳍片散热结构有效控温，保障光源长期稳定不衰减，适配 8–15 米安装高度。",
      },
      {
        kind: "image",
        url: u("1567502352061-a8b8f9d12068"),
        caption: "仓库 / 厂房高棚照明",
      },
      { kind: "heading", text: "配光可选，按场景定制" },
      {
        kind: "text",
        text: "提供 90° 与 120° 两种配光：90° 适合高货架仓库聚光下照，120° 适合厂房车间大范围铺光。已通过 LM-80 6,000 小时光衰测试。",
      },
      {
        kind: "image",
        url: u("1542736667-069246bdbc6d"),
        caption: "铝鳍片散热结构特写",
      },
    ],
  },

  "led-panel-36w-600": {
    tagline: "UGR<19 防眩光 · 超薄导光板 · DALI/0–10V 调光",
    highlights: [
      { icon: "shield", label: "防眩光", value: "UGR<19" },
      { icon: "sun", label: "整灯光效", value: "120lm/W" },
      { icon: "bulb", label: "显色指数", value: "Ra≥85" },
      { icon: "gauge", label: "可调光", value: "DALI" },
    ],
    detailBlocks: [
      { kind: "heading", text: "办公照明的舒适之选" },
      {
        kind: "text",
        text: "UGR<19 低眩光光学设计，长时间伏案也不刺眼；超薄导光板让整面发光均匀柔和，无频闪呵护视力，是办公室、医院、教室吊顶照明的理想方案。",
      },
      {
        kind: "image",
        url: u("1567502352061-a8b8f9d12068"),
        caption: "开放式办公区均匀照明",
      },
      { kind: "heading", text: "智能调光，灵活适配" },
      {
        kind: "text",
        text: "支持 DALI 与 0–10V 调光协议，可接入楼宇智能照明系统按需调节亮度；595×595×12mm 超薄机身适配主流硅钙板与轻钢龙骨吊顶，安装快捷。",
      },
    ],
  },
};
