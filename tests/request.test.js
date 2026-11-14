import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY_REQUEST,STORAGE_KEY,restoreRequest,validateRequest,formatRequest,requestSummary} from '../src/request.js';

const valid={...EMPTY_REQUEST,category:'crossover',transport:'flatbed',model:'Тестовый автомобиль',condition:'not-running',from:'Саратов',to:'Москва',name:'Тест',phone:'+7 (900) 123-45-67',date:'2026-12-01',vehicleNote:'Не вращается колесо',comment:'Желаемая погрузка утром'};
test('request includes selected transport, condition, route, contact and optional details',()=>{
  assert.deepEqual(validateRequest(valid,'2026-11-10'),{});
  const text=formatRequest(valid);
  for(const expected of ['Кроссовер','Эвакуатор с платформой','Не на ходу','Саратов → Москва','01.12.2026',valid.phone,valid.vehicleNote,valid.comment])assert.ok(text.includes(expected));
  assert.ok(!text.includes('undefined'));
});
test('invalid or incomplete contact and route produce field errors, never a price',()=>{
  assert.deepEqual(Object.keys(validateRequest(EMPTY_REQUEST)),['from','to','name','phone']);
  for(const phone of ['123','+7 test 9001234567','00000000000','1234567890123456'])assert.ok(validateRequest({...valid,phone},'2026-11-10').phone);
  assert.ok(validateRequest({...valid,name:'12'},'2026-11-10').name);
  assert.ok(validateRequest({...valid,date:'2026-02-30'},'2026-11-10').date);
  assert.ok(validateRequest({...valid,date:'2026-10-01'},'2026-11-10').date);
  assert.equal(validateRequest({...valid,date:''},'2026-11-10').date,undefined);
});
test('restoring draft rejects corrupt data and disabled or unknown options',()=>{
  const restored=restoreRequest({getItem:key=>key===STORAGE_KEY?JSON.stringify({...valid,category:'unknown',transport:'unknown',from:42}):null});
  assert.equal(restored.category,EMPTY_REQUEST.category);
  assert.notEqual(restored.transport,'unknown');assert.equal(restored.from,'');assert.equal(restored.phone,valid.phone);
  assert.deepEqual(restoreRequest({getItem:()=>'{broken'}),EMPTY_REQUEST);
});
test('summary follows swapped cities and prompts for missing fields',()=>{
  assert.ok(requestSummary({...valid,from:valid.to,to:valid.from}).includes('Москва → Саратов'));
  assert.ok(requestSummary({...valid,to:''}).includes('Укажите город назначения'));
  assert.ok(requestSummary(EMPTY_REQUEST).includes('Укажите города маршрута'));
});
