export const PAGE_SIZE=12;
export const seriesLabel=(brand,series)=>brand==='plus eau'&&series==='メルティ'?'メルティ（ピンク）':series;
export function seriesOptions(products,brand,kind='both') {
 const matching=products.filter(p=>p.brand===brand&&(kind==='both'||!!p[kind]));
 return [...new Set(matching.map(p=>p.series))].map(series=>({value:series,label:seriesLabel(brand,series),count:matching.filter(p=>p.series===series).length,image:matching.find(p=>p.series===series).image}));
}
export function reconcileSeries(products,filters,kind) {
 if(!filters.series||seriesOptions(products,filters.brand,kind).some(o=>o.value===filters.series))return filters;
 const next={...filters};delete next.series;return next;
}
export function brandGroups(products){return [...new Set(products.map(p=>p.brand))].map(brand=>({brand,products:products.filter(p=>p.brand===brand)}));}
export function pageProducts(products,page=1){const pages=Math.max(1,Math.ceil(products.length/PAGE_SIZE));page=Math.max(1,Math.min(pages,Number(page)||1));return {items:products.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),page,pages,total:products.length};}
