import React from 'react';
import {calculateQuote,money,decimal} from '../pricing';
import {requestSummary} from '../request';

function Amount({field,label,value,change,unit,optional=false,disabled=false,error}){
  const visibleError=value[field]!==''?error:null;
  return <div className={`field cost-field${visibleError?' field-invalid':''}`}>
    <label htmlFor={`cost-${field}`}>{label}{optional&&<> <span>Доплата</span></>}</label>
    <div className="cost-input"><input id={`cost-${field}`} name={field} type="text" inputMode="decimal" value={value[field]} onChange={event=>change(field,event.target.value)} disabled={disabled} maxLength="15" placeholder={optional?'0':'Введите значение'} aria-invalid={!!visibleError} aria-describedby={visibleError?`cost-${field}-error`:undefined}/><span aria-hidden="true">{unit}</span></div>
    {visibleError&&<p className="field-error" id={`cost-${field}-error`}>{visibleError}</p>}
  </div>;
}

export default function Calculator({value,change}){
  const quote=calculateQuote(value);
  return <section className="content-section calculator-section" id="cost" aria-labelledby="cost-heading">
    <div className="section-heading"><h2 id="cost-heading">Из чего<br/>складывается цена?</h2><p>Километраж. Ставка. Доплаты.<br/>Каждая сумма — отдельной строкой.</p></div>
    <p className="pricing-basis">Расчёт по вашим условиям: укажите согласованные с перевозчиком ставку и доплаты. Тарифы GIDAVTO автоматически не подставляются.</p>
    <div className="calculator-layout">
      <div className="calculator-inputs">
        <p className="cost-context">{requestSummary(value)}</p>
        <div className="cost-fields">
          <Amount field="distanceKm" label="Протяжённость маршрута" unit="км" value={value} change={change} error={quote.errors.distanceKm}/>
          <Amount field="ratePerKm" label="Ставка перевозчика" unit="₽/км" value={value} change={change} error={quote.errors.ratePerKm}/>
          <Amount field="dispatchFee" label="Подача и подготовка" unit="₽" optional value={value} change={change} error={quote.errors.dispatchFee}/>
          <Amount field="categoryFee" label="За кузов или габариты" unit="₽" optional value={value} change={change} error={quote.errors.categoryFee}/>
          <Amount field="nonRunningFee" label="Погрузка: не на ходу" unit="₽" optional disabled={value.condition!=='not-running'} value={value} change={change} error={quote.errors.nonRunningFee}/>
          <Amount field="extraFee" label="Другие расходы" unit="₽" optional value={value} change={change} error={quote.errors.extraFee}/>
        </div>
        <p className="cost-input-note">Километраж вводится вручную: по названиям городов расстояние не рассчитывается. Неприменимые доплаты оставьте равными нулю. При смене транспорта проверьте введённую ставку.</p>
      </div>
      <div className="cost-result" aria-live="polite" aria-atomic="true">
        <p className="cost-result-label">Предварительный итог</p>
        {quote.ready?<>
          <p className="cost-total">{money(quote.totalKopecks)}</p>
          <p className="cost-equation">{quote.rows.map(row=>money(row.amount)).join(' + ')} = {money(quote.totalKopecks)}</p>
          <ol className="cost-breakdown">{quote.rows.map(row=><li key={row.id} className={row.amount===0?'zero-charge':''}><div><h3>{row.label}</h3><strong>{money(row.amount)}</strong></div><p className="cost-formula">{row.formula}</p><p>{row.reason}</p></li>)}</ol>
          <p className="cost-verification">Итого: {decimal(quote.distanceKm)} км по введённой ставке плюс перечисленные фиксированные доплаты. Другие суммы калькулятор не добавляет. Окончательные условия нужно согласовать с перевозчиком.</p>
          <a className="button" href="#request" data-cursor="primary">Включить расчёт в заявку<span aria-hidden="true">↗</span></a>
        </>:<div className="cost-empty"><span aria-hidden="true">— ₽</span><p>Укажите километраж и ставку.<br/>Сумма и подробная расшифровка появятся сразу.</p><small>Без этих данных цена не рассчитывается.</small></div>}
      </div>
    </div>
  </section>;
}
