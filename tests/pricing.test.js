import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateQuote,parseHundredths,money} from '../src/pricing.js';
import {EMPTY_REQUEST,formatRequest,restoreRequest} from '../src/request.js';
const inputs={...EMPTY_REQUEST,distanceKm:'1000',ratePerKm:'30',dispatchFee:'1500',categoryFee:'500',nonRunningFee:'1000',extraFee:'250',condition:'not-running'};
test('manual amount equals distance times rate plus every explicit fee',()=>{
  const q=calculateQuote(inputs);assert.equal(q.ready,true);assert.equal(q.totalKopecks,3325000);assert.equal(q.rows.length,5);assert.equal(q.rows.reduce((s,r)=>s+r.amount,0),q.totalKopecks);assert.ok(q.rows[0].formula.includes('1 000'));
});
test('non-running fee is excluded for a running car without losing the entered fee',()=>{
  const q=calculateQuote({...inputs,condition:'running'});assert.equal(q.totalKopecks,3225000);assert.equal(q.rows[3].amount,0);assert.ok(q.rows[3].reason.includes('На ходу'));
});
test('missing or invalid rates never turn into a zero-price quote',()=>{
  assert.equal(calculateQuote(EMPTY_REQUEST).ready,false);
  for(const ratePerKm of ['0','-20','Infinity','1e3','abc'])assert.equal(calculateQuote({...inputs,ratePerKm}).ready,false);
  assert.equal(calculateQuote({...inputs,dispatchFee:'-5'}).ready,false);
  assert.equal(calculateQuote({...inputs,distanceKm:'50001'}).ready,false);
});
test('decimal commas, grouped input and kopeck rounding are deterministic',()=>{
  assert.equal(parseHundredths('1 234,56'),123456);assert.equal(parseHundredths('1.234'),null);
  const q=calculateQuote({...EMPTY_REQUEST,distanceKm:'0,1',ratePerKm:'0,05'});assert.equal(q.totalKopecks,1);assert.ok(money(q.totalKopecks).includes('0,01'));
});
test('request text includes complete manual calculation and its basis',()=>{
  const text=formatRequest(inputs);assert.ok(text.includes('Предварительный итог:'));assert.ok(text.includes('33 250'));assert.ok(text.includes('введены вручную'));
  const restored=restoreRequest({getItem:()=>JSON.stringify(inputs)});assert.equal(restored.ratePerKm,'30');assert.equal(calculateQuote(restored).totalKopecks,3325000);
});
test('an incomplete calculation is identified in the request without inventing a price',()=>{
  const text=formatRequest({...EMPTY_REQUEST,distanceKm:'1000'});
  assert.ok(text.includes('Расчёт не сформирован'));
  assert.equal(text.includes('Предварительный итог:'),false);
});
