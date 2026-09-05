export const finishes = [['silky','サラサラ'],['moist','しっとり'],['soft','柔らかい'],['smooth','滑らか'],['manageable','まとまり'],['antiFrizz','広がりを抑える'],['curlyHair','うねりを抑える'],['light','軽い仕上がり'],['shine','ツヤ'],['fingerComb','指通り']];
export const scents = [['floral','フローラル'],['whiteFloral','ホワイトフローラル'],['fruity','フルーティ'],['pear','ペアー'],['soap','石けん'],['honey','ハニー'],['fresh','爽やか'],['citrus','シトラス'],['musk','ムスク'],['rose','ローズ'],['sweet','甘め'],['subtle','甘すぎない'],['any','香りは気にしない']];
const field = (key,label,options,multi=false,visual=false) => ({key,label,options:options.map(x=>Array.isArray(x)?x:[x,x]),multi,visual});
export const steps = [
 {title:'どの商品から探しますか？',description:'探したい商品の種類を選んでください。\nあとから変更することもできます。',fields:[field('target','探したいヘアケア',[['shampoo','シャンプー'],['treatment','トリートメント'],['both','両方']]),field('category','購入場所',[['drugstore','市販系'],['salon','サロン系'],['both','両方']])]},
 {title:'あなたの髪について\n教えてください',description:'より正確な提案のために、現在の髪の状態を選んでください。',fields:[field('thickness','髪の太さ',['細い','普通','太い']),field('hardness','髪の硬さ',['柔らかい','普通','硬い','かなり硬い・剛毛']),field('curl','くせ・うねり',['ほぼなし','少しうねる','うねりがある','強いくせ毛']),field('spread','広がりやすさ',['広がりにくい','普通','広がりやすい','かなり広がりやすい'])]},
 {title:'ダメージと頭皮の\n状態を教えてください',description:'毎日のケアや、気になることについて。',fields:[field('damage','ダメージ・普段のケア（複数選択可）',['ほぼなし','少しダメージ','カラー','頻繁なカラー','ブリーチ','アイロン・コテを頻繁に使用','かなり傷んでいる'],true),field('scalp','頭皮の状態',['乾燥しやすい','普通','皮脂が多い','敏感','フケが気になる','分からない'])]},
 {title:'仕上がりの好みを\n教えてください',description:'理想の髪を選んでください。（複数選択可）',fields:[field('finish','なりたい仕上がり',finishes,true,true)]},
 {title:'使用感の好みを\n教えてください',description:'洗っているときも、乾かしたあとも、心地よく。',fields:[field('squeak','シャンプーを流した後のキシ感',['絶対に嫌','ほとんど無い方がいい','少しなら許容できる','気にしない']),field('rinse','トリートメントを流した後',['かなり滑らか','滑らか','普通','少しさっぱり','気にしない']),field('weight','仕上がりの重さ',['かなり軽い','軽め','普通','しっとり','かなりしっとり']),field('foam','泡立ち',['かなり重要','ある程度重要','気にしない'])]},
 {title:'好きな香りの系統を\n教えてください',description:'毎日のバスタイムに、お気に入りの香りを。',fields:[field('scents','好きな香り（複数選択可）',scents,true,true),field('strength','香りの強さ',[['weak','弱め'],['medium','普通'],['strong','強め'],['any','気にしない']])]},
 {title:'ご希望の予算を\n教えてください',description:'シャンプー・トリートメント、それぞれ1本あたりの価格を目安に選んでください。',fields:[field('budget','1本あたりの予算',[['1500','1,500円以下'],['2000','2,000円以下'],['3000','3,000円以下'],['5000','5,000円以下'],['10000','10,000円以下'],['any','価格は気にしない']])]},
 {title:'あなたの好みを\n確認しましょう',description:'この条件で、あなたにぴったりのヘアケアを探します。',fields:[]}
];
export function visibleFields(index,a){return steps[index].fields.filter(f=>!(a.target==='treatment'&&['squeak','foam'].includes(f.key))&&!(a.target==='shampoo'&&f.key==='rinse'));}
export function isStepComplete(index,a) {return visibleFields(index,a).every(f=>f.multi?a[f.key]?.length:!!a[f.key]) && (index!==3 || a.finish?.includes(a.priority));}
export function updateAnswer(a,key,value,multi) {
 if(!multi) a[key]=value;
 else {const exclusive=key==='damage'?'ほぼなし':key==='scents'?'any':null;let list=a[key]||[];a[key]=list.includes(value)?list.filter(v=>v!==value):value===exclusive?[value]:[...list.filter(v=>v!==exclusive),value];}
 if(key==='finish' && !a.finish.includes(a.priority)) a.priority=a.finish[0]||null;
 return a;
}
