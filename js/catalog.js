// Series records remain the source of verified facts; the UI uses individual items.
// Sort within each brand by product line, then shampoo, conditioner and intensive care.
export function sortCatalog(products) {
  const brands=[...new Set(products.map(p=>p.brand))];
  const careOrder=p=>p.kind==='shampoo'?0:/マスク|ヘアパック|ブースター|ホームケア|コンサントレ/.test(p.name)?2:1;
  return [...products].sort((a,b)=>brands.indexOf(a.brand)-brands.indexOf(b.brand)
    ||(a.catalogOrder??100)-(b.catalogOrder??100)
    ||(a.catalogGroup||a.series).localeCompare(b.catalogGroup||b.series,'ja',{numeric:true})
    ||careOrder(a)-careOrder(b)
    ||a.name.localeCompare(b.name,'ja',{numeric:true}));
}
export function expandProducts(series) {
  return series.flatMap(p => p.kind ? [p] : ['shampoo','treatment'].filter(kind => p[kind]).map(kind => {
    const item=p[kind];
    const image=item.image||p.images?.[kind==='shampoo'?0:1]||p.image;
    const fragrance=item.fragrance||p.fragrance;
    const label=kind==='shampoo'?'シャンプー':'トリートメント';
    const name=item.name.includes(p.name)?item.name:`${p.name} ${label}`;
    return {...p,id:`${p.id}-${kind}`,seriesId:p.id,kind,name,image,images:[image],
      shampoo:kind==='shampoo'?item:null,treatment:kind==='treatment'?item:null,
      scores:item.scores||p.scores,fragrance,
      sources:(p.sources||[]).filter(s=>s.url===item.sourceUrl)};
  }));
}

export function migrateCollections(favorites,compare,products) {
  const expand=ids=>[...new Set((Array.isArray(ids)?ids:[]).flatMap(id=>
    products.some(p=>p.id===id)?[id]:products.filter(p=>p.seriesId===id).map(p=>p.id)))];
  const allCompare=expand(compare);
  const nextFavorites=[...new Set([...expand(favorites),...allCompare.slice(3)])];
  const nextCompare=allCompare.slice(0,3);
  return {favorites:nextFavorites,compare:nextCompare,
    changed:JSON.stringify(favorites)!==JSON.stringify(nextFavorites)||JSON.stringify(compare)!==JSON.stringify(nextCompare),
    overflow:allCompare.length>3};
}
