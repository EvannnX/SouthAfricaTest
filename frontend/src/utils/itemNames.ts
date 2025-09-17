export type Lang = 'zh' | 'en'

// 货品编码到英文名称的简单映射（可按需扩充或从后端下发）
const codeToEnName: Record<string, string> = {
  AC001: 'GREE KFR-35GW/NhAa1BAj 1.5HP Inverter Air Conditioner',
  TV002: 'Hisense 65E3F 65-inch 4K Smart TV',
  WM003: 'Little Swan TG100V88WMUIADY5 10kg Inverter Washing Machine',
  RF004: 'Midea BCD-516WKPZM(E) 516L Side-by-Side Refrigerator',
}

// 可选：编码前缀推断中文品类
const prefixToCategoryZh: Record<string, string> = {
  AC: '空调',
  TV: '电视',
  WM: '洗衣机',
  RF: '冰箱',
  MW: '微波炉',
  DW: '洗碗机',
  SA: '小家电',
  ACC: '配件',
}

const brandEnToZh: Record<string, string> = {
  'Hisense': '海信',
  'Samsung': '三星',
  'GREE': '格力',
  'Little Swan': '小天鹅',
  'Midea': '美的',
  'LG': 'LG',
  'Sony': '索尼',
}

const containsChinese = (s: string) => /[\u4e00-\u9fa5]/.test(s || '')

function translateModelEnToZh(nameEn: string, code: string): string {
  let zh = nameEn || ''
  // 品牌
  Object.keys(brandEnToZh).forEach(en => {
    zh = zh.replace(new RegExp(`^${en}\b`, 'i'), brandEnToZh[en])
  })
  // 规格数字单位
  zh = zh
    .replace(/(\d+)\s*"/g, '$1英寸')
    .replace(/(\d+)\s*inch(es)?/gi, '$1英寸')
    .replace(/(\d+(?:\.\d+)?)\s*HP\b/gi, '$1匹')
    .replace(/(\d+)\s*kg\b/gi, '$1公斤')
    .replace(/(\d+)\s*L\b/gi, '$1升')
    .replace(/(\d+)\s*Sets?\b/gi, '$1套')
  // 关键词
  zh = zh
    .replace(/Air Conditioner/gi, '空调')
    .replace(/Refrigerator/gi, '冰箱')
    .replace(/Washing Machine/gi, '洗衣机')
    .replace(/Dishwasher/gi, '洗碗机')
    .replace(/Microwave( Oven)?/gi, '微波炉')
    .replace(/Smart TV|\bTV\b/gi, '电视')
    .replace(/Side[- ]by[- ]Side/gi, '对开门')
    .replace(/Inverter/gi, '变频')
  // 去掉残留英文单位符号
  zh = zh.replace(/"/g, '')
  // 若仍无品类词，依据前缀补充
  const prefix = (code || '').slice(0, 2)
  const cat = prefixToCategoryZh[prefix]
  if (cat && !zh.includes(cat)) zh = `${zh} ${cat}`.trim()
  return zh
}

export function getBilingualName(code: string, sourceName: string): { en: string; zh: string } {
  if (!sourceName) {
    const en = codeToEnName[code] || code
    const zh = translateModelEnToZh(en, code)
    return { en, zh }
  }
  // 若原始名称包含中文，则视为中文名
  if (containsChinese(sourceName)) {
    const en = codeToEnName[code] || sourceName
    return { en, zh: sourceName }
  }
  // 原始为英文名
  const en = sourceName
  const zh = translateModelEnToZh(sourceName, code)
  return { en, zh }
}

export const getItemDisplayName = (code: string, nameZh: string, lang: Lang): string => {
  if (lang === 'en') {
    return codeToEnName[code] || nameZh
  }
  return nameZh
} 