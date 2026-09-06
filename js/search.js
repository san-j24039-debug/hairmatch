export const PAGE_SIZE=12;
export function brandGroups(products){return [...new Set(products.map(p=>p.brand))].map(brand=>({brand,products:products.filter(p=>p.brand===brand)}));}
export function pageProducts(products,page=1){const pages=Math.max(1,Math.ceil(products.length/PAGE_SIZE));page=Math.max(1,Math.min(pages,Number(page)||1));return {items:products.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),page,pages,total:products.length};}
