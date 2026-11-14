import {CATEGORIES,TRANSPORTS} from './config.js';
import {calculateQuote,money} from './pricing.js';

export const EMPTY_REQUEST={category:'sport',transport:'closed',model:'',condition:'running',vehicleNote:'',from:'',to:'',date:'',name:'',phone:'',comment:'',distanceKm:'',ratePerKm:'',dispatchFee:'0',categoryFee:'0',nonRunningFee:'0',extraFee:'0'};
export const STORAGE_KEY='gidavto-request-v2';
export function restoreRequest(storage){
  try{
    const raw=JSON.parse(storage.getItem(STORAGE_KEY));
    if(!raw||typeof raw!=='object')return {...EMPTY_REQUEST};
    const result={...EMPTY_REQUEST};
    for(const key of Object.keys(result))if(typeof raw[key]==='string')result[key]=raw[key].slice(0,2000);
    if(!CATEGORIES.some(c=>c.id===result.category))result.category=EMPTY_REQUEST.category;
    if(!TRANSPORTS.some(t=>t.id===result.transport))result.transport=TRANSPORTS[0]?.id||'';
    if(!['running','not-running'].includes(result.condition))result.condition='running';
    return result;
  }catch{return {...EMPTY_REQUEST};}
}
export function localDate(){
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function validateRequest(value,today=localDate()){
  const errors={};
  if(value.from.trim().length<2)errors.from='Укажите город отправления.';
  if(value.to.trim().length<2)errors.to='Укажите город назначения.';
  if(!/\p{L}.*\p{L}/u.test(value.name.trim()))errors.name='Укажите имя: не менее двух букв.';
  const digits=value.phone.replace(/\D/g,'');
  if(!/^[+\d\s().-]+$/.test(value.phone)||digits.length<10||digits.length>15||/^(\d)\1+$/.test(digits))errors.phone='Укажите телефон: от 10 до 15 цифр с кодом страны.';
  if(value.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||!Number.isFinite(Date.parse(value.date))||new Date(value.date).toISOString().slice(0,10)!==value.date||value.date<today))errors.date='Выберите сегодняшнюю или будущую дату.';
  return errors;
}
export function requestSummary(value){
  const category=CATEGORIES.find(c=>c.id===value.category)?.label||'Выберите автомобиль';
  const transport=TRANSPORTS.find(t=>t.id===value.transport)?.label||'Выберите транспорт';
  const route=value.from.trim()&&value.to.trim()?`${value.from.trim()} → ${value.to.trim()}`:!value.from.trim()&&!value.to.trim()?'Укажите города маршрута':!value.from.trim()?'Укажите город отправления':'Укажите город назначения';
  return `${category} · ${transport} · ${route}`;
}
export function formatRequest(value){
  const date=value.date?value.date.split('-').reverse().join('.'):'';
  const quote=calculateQuote(value);
  const quoteAttempted=!!(value.distanceKm?.trim()||value.ratePerKm?.trim());
  return [
    'ЗАЯВКА НА ПЕРЕВОЗКУ · GIDAVTO',
    '',
    `Автомобиль: ${CATEGORIES.find(c=>c.id===value.category)?.label||'Не выбран'}`,
    value.model.trim()&&`Марка и модель: ${value.model.trim()}`,
    `Состояние: ${value.condition==='running'?'На ходу':'Не на ходу'}`,
    value.vehicleNote.trim()&&`Особенности автомобиля: ${value.vehicleNote.trim()}`,
    `Транспорт: ${TRANSPORTS.find(t=>t.id===value.transport)?.label||'Не выбран'}`,
    `Маршрут: ${value.from.trim()||'Не указан'} → ${value.to.trim()||'Не указан'}`,
    date&&`Желаемая дата: ${date}`,
    ...(quote.ready?['','Расчёт по введённым условиям:',...quote.rows.map(row=>`${row.label}: ${row.id==='distance'?row.formula+' = ':''}${money(row.amount)}. ${row.reason}`),`Предварительный итог: ${money(quote.totalKopecks)}`,'Километраж, ставка и доплаты введены вручную. Условия требуют согласования.']:quoteAttempted?['','Расчёт не сформирован: километраж, ставку и доплаты нужно уточнить.']:[]),
    '',
    `Имя: ${value.name.trim()}`,
    `Телефон: ${value.phone.trim()}`,
    value.comment.trim()&&`Комментарий: ${value.comment.trim()}`,
  ].filter(line=>line!==false).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
