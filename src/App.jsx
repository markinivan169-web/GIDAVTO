import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Hero from './Hero';
import Content,{Navigation} from './components/Content';
import Cursor from './components/Cursor';
import {EMPTY_REQUEST,STORAGE_KEY,restoreRequest,validateRequest} from './request';
import './style.css';
import './continuation.css';
import './calculator.css';

function App(){
  const [value,setValue]=useState(()=>{try{return restoreRequest(sessionStorage)}catch{return {...EMPTY_REQUEST}}});
  const [errors,setErrors]=useState({}),[generated,setGenerated]=useState(false);
  useEffect(()=>{
    const prepareAnchor=event=>{if(!event.defaultPrevented&&event.target.closest?.('a[href^="#"]'))ScrollTrigger.refresh()};
    document.addEventListener('click',prepareAnchor);
    return ()=>document.removeEventListener('click',prepareAnchor);
  },[]);
  useEffect(()=>{try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value))}catch{/* Form remains usable if browser storage is unavailable. */}},[value]);
  const change=(key,text)=>{setValue(current=>({...current,[key]:text}));setErrors(current=>{const next={...current};delete next[key];return next});};
  const swap=()=>{setValue(current=>({...current,from:current.to,to:current.from}));setErrors(current=>{const next={...current};delete next.from;delete next.to;return next});};
  const submit=event=>{
    event.preventDefault();const nextErrors=validateRequest(value);setErrors(nextErrors);
    if(Object.keys(nextErrors).length){const ids={from:'route-from',to:'route-to',date:'route-date',name:'contact-name',phone:'contact-phone'};const key=['from','to','date','name','phone'].find(item=>nextErrors[item]);const field=document.getElementById(ids[key]);field?.focus({preventScroll:true});field?.scrollIntoView({block:'center',behavior:'instant'});return;}
    setGenerated(true);
  };
  return <><a className="skip-link" href="#transport">Перейти к подбору перевозки</a><Navigation/><main id="top"><Hero/><Content value={value} change={change} errors={errors} swap={swap} submit={submit} generated={generated}/></main><Cursor/></>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
