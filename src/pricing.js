import {CATEGORIES,TRANSPORTS} from './config.js';

// No invented company tariffs: every monetary input is supplied by the visitor.
// Values are evaluated in integer kopecks, with distance in hundredths of a km.
export function parseHundredths(value){
  if(typeof value!=='string')return null;
  const text=value.trim().replace(/\s/g,'').replace(',','.');
  if(!/^\d+(?:\.\d{1,2})?$/.test(text))return null;
  const [whole,fraction='']=text.split('.');
  const units=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(units)?units:null;
}
export const money=kopecks=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0,maximumFractionDigits:2}).format(kopecks/100);
export const decimal=number=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(number);

export function calculateQuote(value){
  const errors={};
  const distance=parseHundredths(value.distanceKm),rate=parseHundredths(value.ratePerKm);
  if(distance===null||distance<=0||distance>5000000)errors.distanceKm='Введите расстояние от 0,01 до 50 000 км.';
  if(rate===null||rate<=0||rate>10000000)errors.ratePerKm='Введите положительную ставку, не более 100 000 ₽/км.';
  const fees={};
  for(const key of ['dispatchFee','categoryFee','nonRunningFee','extraFee']){
    if(key==='nonRunningFee'&&value.condition!=='not-running'){fees[key]=0;continue;}
    fees[key]=parseHundredths(value[key]??'0');
    if(fees[key]===null||fees[key]<0||fees[key]>10000000000)errors[key]='Введите сумму от 0 до 100 000 000 ₽, до двух знаков после запятой.';
  }
  if(Object.keys(errors).length)return {ready:false,errors,rows:[],totalKopecks:null};
  const transport=TRANSPORTS.find(t=>t.id===value.transport)?.label||'Выбранный транспорт';
  const category=CATEGORIES.find(c=>c.id===value.category)?.label||'Выбранный кузов';
  const rows=[
    {id:'distance',label:'Перевозка по маршруту',amount:Math.round(distance*rate/100),formula:`${decimal(distance/100)} км × ${money(rate)}/км`,reason:`Ставка введена вручную для варианта «${transport}».`},
    {id:'dispatch',label:'Подача и подготовка',amount:fees.dispatchFee,formula:money(fees.dispatchFee),reason:'Фиксированная сумма из введённых условий.'},
    {id:'category',label:`Доплата за кузов: ${category}`,amount:fees.categoryFee,formula:money(fees.categoryFee),reason:'Указанная вручную доплата за размер или особенности автомобиля.'},
    {id:'condition',label:'Погрузка автомобиля не на ходу',amount:fees.nonRunningFee,formula:money(fees.nonRunningFee),reason:value.condition==='not-running'?'Включена введённая доплата: выбран режим «Не на ходу».':'Не включается: выбран режим «На ходу».'},
    {id:'extra',label:'Прочие согласованные расходы',amount:fees.extraFee,formula:money(fees.extraFee),reason:'Дополнительная сумма из ваших условий; при отсутствии — 0 ₽.'},
  ];
  return {ready:true,errors:{},rows,totalKopecks:rows.reduce((sum,row)=>sum+row.amount,0),distanceKm:distance/100,rateKopecks:rate,manual:true};
}
