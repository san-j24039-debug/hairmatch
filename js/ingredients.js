/** Ingredient records accept { name, purpose, category, sourceUrl } after verification. */
export const ingredientCategories=['主要洗浄成分','補修成分','保湿成分','オイル','シリコーン','セラミド','ケラチン','シルク','熱補修成分'];
export function ingredientRecords(product,category){return ['shampoo','treatment'].flatMap(kind=>(product[kind]?.ingredients||[]).filter(i=>i&&typeof i==='object'&&i.category===category).map(i=>({...i,kind:kind==='shampoo'?'シャンプー':'トリートメント'})));}
