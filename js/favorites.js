export function readStored(key,fallback) {try{return JSON.parse(localStorage.getItem('hairmatch:'+key))??fallback;}catch{return fallback;}}
export function saveStored(key,value) {try{localStorage.setItem('hairmatch:'+key,JSON.stringify(value));return true;}catch{return false;}}
export function toggleId(list,id,limit=Infinity) {if(list.includes(id))return list.filter(x=>x!==id);return list.length<limit?[...list,id]:list;}
