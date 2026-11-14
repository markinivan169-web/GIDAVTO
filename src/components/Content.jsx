import React,{useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import Wordmark from './Wordmark';
import {CarArt,TransportArt} from './VehicleArt';
import {CATEGORIES,TRANSPORTS,STEPS,FAQ} from '../config';
import {formatRequest,localDate,requestSummary,validateRequest} from '../request';
import Calculator from './Calculator';
import {calculateQuote,money} from '../pricing';

export function Arrow({direction='right'}){
  return <svg className="arrow-icon" viewBox="0 0 32 24" aria-hidden="true" style={direction==='left'?{transform:'rotate(180deg)'}:undefined}><path d="M2 12H29M19 2L29 12L19 22" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>;
}

export function Navigation(){
  const ref=useRef(null);
  useEffect(()=>{
    const node=ref.current;
    let boundary=window.innerHeight,previous;
    const update=()=>{const visible=window.scrollY>=boundary-1;if(visible!==previous){node.dataset.visible=String(visible);previous=visible}};
    const measure=()=>{boundary=ScrollTrigger.getById('gidavto-loading')?.end||document.querySelector('.hero')?.offsetHeight||window.innerHeight;update()};
    measure();
    ScrollTrigger.addEventListener('refresh',measure);
    window.addEventListener('scroll',update,{passive:true});
    return ()=>{ScrollTrigger.removeEventListener('refresh',measure);window.removeEventListener('scroll',update)};
  },[]);
  return <header className="site-nav" ref={ref} data-visible="false">
    <a className="compact-brand" href="#top" aria-label="GIDAVTO — в начало"><Wordmark/></a>
    <nav aria-label="Основная навигация"><a href="#transport">Перевозка</a><a href="#cost">Расчёт</a><a href="#how-it-works">Как работаем</a><a href="#contacts">Контакты</a></nav>
    <a className="button button-small" data-cursor="primary" href="#request">Оставить заявку<Arrow/></a>
  </header>;
}

function ChoiceGroup({options,value,onChange,label,id,className=''}){
  const refs=useRef([]);
  const selectByKey=(event,index)=>{
    let next;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%options.length;
    if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index-1+options.length)%options.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=options.length-1;
    if(next!==undefined){event.preventDefault();onChange(options[next].id);refs.current[next]?.focus();}
  };
  return <div id={id} role="radiogroup" aria-label={label} className={`choice-group ${className}`}>
    {options.map((option,index)=><button type="button" role="radio" aria-checked={value===option.id} tabIndex={value===option.id?0:-1} ref={el=>refs.current[index]=el} key={option.id} onClick={()=>onChange(option.id)} onKeyDown={event=>selectByKey(event,index)} data-cursor-label="Выбрать" className={value===option.id?'choice active':'choice'}>{option.label}</button>)}
  </div>;
}

function Field({label,id,error,optional=false,children,className=''}){
  return <div className={`field ${className}${error?' field-invalid':''}`}><label htmlFor={id}>{label}{optional&&<> <span>Необязательно</span></>}</label>{children}{error&&<p className="field-error" id={`${id}-error`} role="alert">{error}</p>}</div>;
}

function CategorySection({value,change}){
  const root=useRef(null),art=useRef(null),touch=useRef(null);
  const index=CATEGORIES.findIndex(c=>c.id===value.category);
  const previous=CATEGORIES[(index-1+CATEGORIES.length)%CATEGORIES.length],next=CATEGORIES[(index+1)%CATEGORIES.length];
  useGSAP(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;gsap.fromTo(art.current,{autoAlpha:.25,x:20},{autoAlpha:1,x:0,duration:.35,ease:'power2.out'});},{scope:root,dependencies:[value.category],revertOnUpdate:true});
  const move=direction=>change('category',CATEGORIES[(index+direction+CATEGORIES.length)%CATEGORIES.length].id);
  return <section id="transport" className="content-section category-section" ref={root} aria-labelledby="category-heading">
    <div className="section-heading category-heading"><h2 id="category-heading">Что<br/>перевозим?</h2><p>Начнём с вашего автомобиля.<br/>Выберите кузов и расскажите о нём.</p></div>
    <div className="vehicle-window" onPointerDown={event=>{if(event.pointerType==='touch')touch.current={x:event.clientX,y:event.clientY}}} onPointerUp={event=>{const start=touch.current;touch.current=null;if(start&&Math.abs(event.clientX-start.x)>45&&Math.abs(event.clientY-start.y)<45)move(event.clientX<start.x?1:-1)}} onPointerCancel={()=>{touch.current=null}}>
      <div className="neighbor neighbor-left" aria-hidden="true"><CarArt type={previous.id} decorative/></div>
      <div className="neighbor neighbor-right" aria-hidden="true"><CarArt type={next.id} decorative/></div>
      <div ref={art} className="vehicle-selected"><p className="category-name" aria-live="polite">{CATEGORIES[index].label}</p><CarArt type={value.category}/></div>
      <button type="button" className="arrow-button previous" onClick={()=>move(-1)} aria-label={`Предыдущий кузов: ${previous.label}`}><Arrow direction="left"/></button>
      <button type="button" className="arrow-button next" onClick={()=>move(1)} aria-label={`Следующий кузов: ${next.label}`}><Arrow/></button>
      <span className="selection-count">{String(index+1).padStart(2,'0')}<i/>07</span>
    </div>
    <ChoiceGroup options={CATEGORIES} value={value.category} onChange={id=>change('category',id)} label="Тип кузова" className="category-choices"/>
    <div className="vehicle-fields">
      <Field id="car-model" label="Марка и модель"><input id="car-model" name="model" value={value.model} onChange={e=>change('model',e.target.value)} placeholder="Например, Porsche 911" maxLength="120" autoComplete="off"/></Field>
      <div className="field condition-field"><span className="field-label">Состояние автомобиля</span><ChoiceGroup options={[{id:'running',label:'На ходу'},{id:'not-running',label:'Не на ходу'}]} value={value.condition} onChange={id=>change('condition',id)} label="Состояние автомобиля" className="condition-choices"/></div>
      <Field id="vehicle-note" label="Особенности автомобиля" optional className="vehicle-note"><input id="vehicle-note" name="vehicleNote" value={value.vehicleNote} onChange={e=>change('vehicleNote',e.target.value)} placeholder="Низкий клиренс, заблокированные колёса, другие детали" maxLength="500"/></Field>
    </div>
  </section>;
}

function TransportSection({value,change}){
  const root=useRef(null),visual=useRef(null);
  const selected=TRANSPORTS.find(t=>t.id===value.transport)||TRANSPORTS[0],index=TRANSPORTS.indexOf(selected);
  useGSAP(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;gsap.fromTo(visual.current,{autoAlpha:.2,y:8},{autoAlpha:1,y:0,duration:.35,ease:'power2.out'});},{scope:root,dependencies:[value.transport],revertOnUpdate:true});
  return <section className="content-section transport-section" aria-labelledby="transport-heading" ref={root}>
    <div className="section-heading"><h2 id="transport-heading">Как повезём?</h2><p>Открыто. Закрыто. Индивидуально.<br/>Выбор — под ваш маршрут.</p></div>
    <div className="transport-window"><div ref={visual} className="transport-selected"><span className="transport-backdrop" aria-hidden="true">{selected.background}</span><TransportArt type={selected.id}/></div><div className="transport-road"/></div>
    <div className="transport-caption" aria-live="polite"><span className="option-number">{String(index+1).padStart(2,'0')} / {String(TRANSPORTS.length).padStart(2,'0')}</span><h3>{selected.label}</h3><p>{selected.description}</p></div>
    <ChoiceGroup options={TRANSPORTS} value={value.transport} onChange={id=>change('transport',id)} label="Способ перевозки" className="transport-choices"/>
    <p className="demo-note">Варианты для подбора. Доступность транспорта и условия согласуем по заявке.</p>
  </section>;
}

function RouteSection({value,change,errors,swap}){
  return <section className="content-section route-section" aria-labelledby="route-heading">
    <div className="section-heading"><h2 id="route-heading">Откуда —<br/>куда?</h2><p>Два города.<br/>Один согласованный маршрут.</p></div>
    <div className="route-fields">
      <Field id="route-from" label="Город отправления" error={errors.from}><input id="route-from" name="from" placeholder="Откуда забрать" value={value.from} onChange={e=>change('from',e.target.value)} maxLength="100" required aria-invalid={!!errors.from} aria-describedby={errors.from?'route-from-error':undefined} autoComplete="off"/></Field>
      <button type="button" className="swap-button" onClick={swap} aria-label="Обменять города отправления и назначения"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 11H28L21 4M28 21H4L11 28" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>
      <Field id="route-to" label="Город назначения" error={errors.to}><input id="route-to" name="to" placeholder="Куда доставить" value={value.to} onChange={e=>change('to',e.target.value)} maxLength="100" required aria-invalid={!!errors.to} aria-describedby={errors.to?'route-to-error':undefined} autoComplete="off"/></Field>
      <div className="route-connection" aria-hidden="true"><span/><i/><b/></div>
    </div>
    <div className="date-row"><p>Дата — ориентир для согласования.<br/>Точные условия обсудим отдельно.</p><Field id="route-date" label="Желаемая дата" optional error={errors.date}><input type="date" id="route-date" name="date" value={value.date} min={localDate()} onInput={e=>change('date',e.target.value)} onChange={e=>change('date',e.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date?'route-date-error':undefined}/></Field></div>
    <div className="selection-summary"><span>Ваша перевозка</span><p aria-live="polite">{requestSummary(value)}</p><a href="#cost" aria-label="Перейти к расчёту стоимости" data-cursor="primary"><Arrow/></a></div>
  </section>;
}

function ProcessSection(){
  const root=useRef(null),line=useRef(null);
  useGSAP(()=>{
    const media=gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)',()=>{const steps=[...root.current.querySelectorAll('.process-step')];gsap.fromTo(line.current,{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:root.current,start:'top 55%',end:'bottom 70%',scrub:.3,onUpdate:self=>{steps.forEach((step,index)=>{step.dataset.current=String(index===Math.min(3,Math.floor(self.progress*4)));step.dataset.passed=String(index<Math.floor(self.progress*4))})}}});});
    return ()=>media.revert();
  },{scope:root});
  return <section className="content-section process-section" id="how-it-works" ref={root} aria-labelledby="process-heading">
    <div className="process-intro"><h2 id="process-heading">Автомобиль<br/>в пути.<br/><span>Вы в курсе.</span></h2><p>От первого уточнения<br/>до передачи автомобиля.</p></div>
    <div className="process-route"><div className="process-track" aria-hidden="true"><i ref={line}/></div><ol className="process-list">{STEPS.map((step,index)=><li key={step.title} className="process-step" data-current={index===0?'true':'false'}><span className="process-dot" aria-hidden="true"/><span className="step-number">0{index+1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></div>
  </section>;
}

function Questions(){
  const [open,setOpen]=useState(null);
  return <section className="content-section questions-section" aria-labelledby="questions-heading"><h2 id="questions-heading">Перед стартом</h2><div className="faq-list">{FAQ.map((item,index)=><div className={`faq-item${open===index?' open':''}`} key={item.question}>
    <h3><button type="button" aria-expanded={open===index} aria-controls={`answer-${index}`} id={`question-${index}`} onClick={()=>setOpen(open===index?null:index)}>{item.question}<span aria-hidden="true">{open===index?'−':'+'}</span></button></h3>
    <div className="faq-answer" id={`answer-${index}`} role="region" aria-labelledby={`question-${index}`} inert={open!==index?true:undefined}><div><p>{item.answer}</p></div></div>
  </div>)}</div></section>;
}

function ContactSection({value,change,errors,submit,generated}){
  const [copyStatus,setCopyStatus]=useState('');
  const preview=useRef(null),heading=useRef(null);
  const text=formatRequest(value),canCopy=Object.keys(validateRequest(value)).length===0;
  const quote=calculateQuote(value);
  useEffect(()=>{setCopyStatus('')},[value]);
  useEffect(()=>{if(generated){heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'center',behavior:'instant'})}},[generated]);
  const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopyStatus('Заявка скопирована. Передайте её удобным вам способом.');}catch{preview.current?.focus();preview.current?.select();setCopyStatus('Автоматическое копирование недоступно. Скопируйте выделенный текст вручную.');}};
  return <section className="content-section contact-section" id="contacts" aria-labelledby="contact-heading">
    <div className="contact-top"><p>Ваш автомобиль. Наш маршрут.</p><span className="service-mark" aria-hidden="true"/></div>
    <h2 id="contact-heading">Обсудим<br/>ваш маршрут<span className="heading-period">.</span></h2>
    <div className="contact-layout"><div className="contact-aside"><Wordmark/><p>Расскажите, что и куда нужно перевезти.<br/>Соберём всё в одну заявку.</p><p className="honest-note">Онлайн-отправка пока не подключена. Здесь можно сформировать и скопировать текст заявки.</p></div>
      <div id="request" className="request-area"><form onSubmit={submit} noValidate aria-label="Заявка на перевозку">
        <div className="contact-fields">
          <Field id="contact-name" label="Ваше имя" error={errors.name}><input id="contact-name" name="name" autoComplete="name" placeholder="Как к вам обращаться" value={value.name} onChange={e=>change('name',e.target.value)} required maxLength="80" aria-invalid={!!errors.name} aria-describedby={errors.name?'contact-name-error':undefined}/></Field>
          <Field id="contact-phone" label="Телефон" error={errors.phone}><input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={value.phone} onChange={e=>change('phone',e.target.value)} required maxLength="30" aria-invalid={!!errors.phone} aria-describedby={errors.phone?'contact-phone-error':undefined}/></Field>
        </div>
        <Field id="request-comment" label="Комментарий" optional><textarea id="request-comment" name="comment" rows="2" value={value.comment} onChange={e=>change('comment',e.target.value)} placeholder="Что ещё нужно учесть?" maxLength="1500"/></Field>
        <div className="request-summary"><span>Вы выбрали</span><p aria-live="polite">{requestSummary(value)}</p>{quote.ready&&<p>По введённым условиям: <strong>{money(quote.totalKopecks)}</strong></p>}</div>
        <button className="button request-button" type="submit" data-cursor="primary">Запросить стоимость<Arrow/></button><p className="form-note">Кнопка сформирует текст заявки. Данные никуда не отправляются; черновик сохраняется в этой вкладке.</p>
      </form>
      {generated&&<div className="request-preview"><h3 tabIndex="-1" ref={heading}>Заявка сформирована</h3><p>Проверьте текст. Он ещё не отправлен.</p><label htmlFor="request-text" className="sr-only">Текст заявки для копирования</label><textarea id="request-text" readOnly value={text} ref={preview} rows="12"/><button type="button" className="button button-outline" onClick={copy} disabled={!canCopy} data-cursor="primary">Скопировать заявку<Arrow/></button>{!canCopy&&<p className="field-error">Заполните обязательные поля перед копированием.</p>}<p role="status" className="copy-status">{copyStatus}</p></div>}
      </div>
    </div>
    <footer className="page-footer"><span>GIDAVTO</span><span>Перевозка автомобилей</span><a href="#top">В начало ↑</a></footer>
  </section>;
}

export default function Content({value,change,errors,swap,submit,generated}){
  return <div className="continuation"><CategorySection value={value} change={change}/><TransportSection value={value} change={change}/><RouteSection value={value} change={change} errors={errors} swap={swap}/><Calculator value={value} change={change}/><ProcessSection/><Questions/><ContactSection value={value} change={change} errors={errors} submit={submit} generated={generated}/></div>;
}
