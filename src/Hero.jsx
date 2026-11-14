import React, {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import {SCENE, CARS, carPose, rampGeometry} from './geometry';
import Wordmark from './components/Wordmark';

gsap.registerPlugin(ScrollTrigger, useGSAP);


const ramp=rampGeometry();
const truckHeight=SCENE.truckWidth*507/2086;
const initialRear=(car)=>car.start+car.rear[0]*car.width/car.pixels[0];

function Vehicle({car, bind}) {
  const scale=car.width/car.pixels[0];
  const pose=carPose(car,initialRear(car));
  return <g ref={bind} className="car" data-car={car.id} transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle})`}>
    <image href={`/assets/${car.id}.webp`} width={car.width} height={car.pixels[1]*scale} x={-car.rear[0]*scale} y={-car.rear[1]*scale} />
  </g>;
}

export default function Hero() {
  const root=useRef(null), scene=useRef(null), convoy=useRef(null), platform=useRef(null);
  const cars=useRef({}), shadows=useRef({}), hint=useRef(null), status=useRef(null), progress=useRef(null);
  const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);

  useEffect(()=>{
    let active=true;
    const images=['orange','silver','blue','truck','ramp'].map(name=>new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>img.decode().then(resolve).catch(resolve);
      img.onerror=()=>reject(new Error(name));
      img.src=`/assets/${name}.webp`;
    }));
    Promise.all([...images,document.fonts.ready]).then(()=>{if(active)setLoaded(true)}).catch(()=>{if(active)setFailed(true)});
    return ()=>{active=false};
  },[]);

  useGSAP(()=>{
    if(!loaded)return;
    const media=gsap.matchMedia();
    media.add({normal:'(prefers-reduced-motion: no-preference)',reduced:'(prefers-reduced-motion: reduce)'},context=>{
      const state={orange:0,silver:0,blue:0,closed:0,departure:0,time:0};
      let previousPhase='';
      const draw=()=>{
        CARS.forEach(car=>{
          const from=initialRear(car);
          // The back bumper clears the clipping plane before loading is complete.
          const to=SCENE.entry+car.rear[0]*car.width/car.pixels[0]+12;
          const rearX=from+(to-from)*state[car.id];
          const pose=carPose(car,rearX);
          cars.current[car.id].setAttribute('transform',`translate(${pose.x.toFixed(4)} ${pose.y.toFixed(4)}) rotate(${pose.angle.toFixed(4)})`);
          const lift=Math.max(0,(SCENE.road-pose.radius-pose.y)/(SCENE.road-SCENE.floor));
          const shadow=shadows.current[car.id];
          const center=pose.x+(pose.frontX-pose.x)*0.5;
          shadow.setAttribute('transform',`translate(${center.toFixed(3)} ${SCENE.road+1}) scale(${1-lift*.16} ${1-lift*.25})`);
          shadow.style.opacity=String(.67-lift*.2);
        });
        platform.current.setAttribute('transform',`translate(${SCENE.entry} ${SCENE.floor}) rotate(${ramp.rest+state.closed*ramp.closed})`);
        // Ramp, side wall, clipping plane, shadows and rear lights share this parent.
        convoy.current.setAttribute('transform',`translate(${state.departure*1700} 0)`);
        progress.current.style.transform=`scaleX(${state.time/100})`;
        scene.current.dataset.progress=state.time.toFixed(3);
        const phase=state.time<8?'00 / 03':state.time<30?'01 / 03':state.time<50?'02 / 03':state.time<70?'03 / 03':state.time<82?'Закрываем платформу':state.time<99.9?'В путь':'Ваш автомобиль. Наш маршрут.';
        if(phase!==previousPhase){status.current.textContent=phase;previousPhase=phase;}
      };
      draw();
      if(context.conditions.reduced) return;

      const timeline=gsap.timeline({
        defaults:{ease:'none'},
        onUpdate:draw,
        scrollTrigger:{id:'gidavto-loading',trigger:root.current,start:'top top',end:()=>`+=${window.innerHeight*5}`,pin:true,scrub:.45,invalidateOnRefresh:true,anticipatePin:1,refreshPriority:10},
      });
      timeline.addLabel('intro',0).addLabel('orange',8).addLabel('silver',30).addLabel('blue',50).addLabel('close',70).addLabel('departure',82).addLabel('finish',100);
      timeline.to(state,{time:100,duration:100},0);
      timeline.to(hint.current,{autoAlpha:0,duration:7},0);
      timeline.to('.brand',{scale:.91,y:-18,duration:8,ease:'sine.inOut'},0);
      CARS.forEach(car=>timeline.to(state,{[car.id]:1,duration:car.end-car.begin,ease:'sine.inOut'},car.begin));
      timeline.to(state,{closed:1,duration:10,ease:'power2.inOut'},'close');
      timeline.to(state,{departure:1,duration:18,ease:'power2.in'},'departure');
      timeline.to('.brand',{autoAlpha:0,scale:.7,y:-50,duration:5,ease:'power1.inOut'},94);
      timeline.to('.masthead, .scene-footer',{autoAlpha:0,duration:4},93);
      ScrollTrigger.refresh();
      // Restore a deep link only after the pin spacer has its final dimensions.
      let anchorFrame=0;
      if(location.hash&&location.hash!=='#top')anchorFrame=requestAnimationFrame(()=>{
        const target=document.getElementById(location.hash.slice(1));
        target?.scrollIntoView({block:'start',behavior:'instant'});
      });
      return ()=>cancelAnimationFrame(anchorFrame);
    });
    return ()=>media.revert();
  },{scope:root,dependencies:[loaded],revertOnUpdate:true});

  return <section className="hero" ref={root} aria-label="GIDAVTO — перевозка автомобилей">
      <header className="masthead">
        <p className="service"><span className="service-mark" aria-hidden="true" />Перевозка автомобилей</p>
        <p className="promise">Бережно. Точно. Вовремя.</p>
      </header>
      <div className="brand">
        <h1 aria-label="GIDAVTO"><Wordmark/></h1>
        <p className="tagline">Ваш автомобиль. <span>Наш маршрут.</span></p>
      </div>
      <div className="atmosphere" aria-hidden="true" />
      <div className="road" aria-hidden="true" />
      <div className="stage" ref={scene} data-ready={loaded} data-progress="0">
        <svg className="transport-scene" viewBox="0 0 1600 480" role="img" aria-label="Три автомобиля по очереди заезжают в закрытый автовоз при прокрутке страницы">
          <defs>
            <clipPath id="trailer-entry"><rect x="-20000" y="-2000" width={20000+SCENE.entry} height="4000" /></clipPath>
            <radialGradient id="contact-shadow"><stop offset="0" stopColor="#000" stopOpacity=".9"/><stop offset=".5" stopColor="#000" stopOpacity=".5"/><stop offset="1" stopColor="#000" stopOpacity="0"/></radialGradient>
            <linearGradient id="rear-frame" x1="0" x2="1"><stop stopColor="#515356"/><stop offset=".3" stopColor="#292c2e"/><stop offset="1" stopColor="#101214"/></linearGradient>
          </defs>
          <g ref={convoy}>
            <ellipse cx="1160" cy="352" rx="397" ry="16" fill="url(#contact-shadow)" opacity=".9" />
            <g ref={platform} className="ramp" transform={`translate(${SCENE.entry} ${SCENE.floor}) rotate(${ramp.rest})`}>
              <image href="/assets/ramp.webp" x={-2040*ramp.scale} y={-18*ramp.scale} width={2075*ramp.scale} height={231*ramp.scale}/>
            </g>
            <g clipPath="url(#trailer-entry)">
              {CARS.map(car=><ellipse key={car.id} ref={el=>shadows.current[car.id]=el} rx="86" ry="8" fill="url(#contact-shadow)" transform={`translate(${car.start+90} 351)`} opacity=".67"/>)}
              {CARS.map(car=><Vehicle key={car.id} car={car} bind={el=>cars.current[car.id]=el} />)}
            </g>
            <image className="truck" href="/assets/truck.webp" x={SCENE.truckX} y={SCENE.road-truckHeight} width={SCENE.truckWidth} height={truckHeight}/>
            <path d={`M${SCENE.entry+.3} 183V326`} stroke="url(#rear-frame)" strokeWidth="2.4"/>
          </g>
        </svg>
      </div>
      <footer className="scene-footer">
        <div className="footer-line"><span ref={progress}/></div>
        <p className="scroll-hint" ref={hint}><span className="scroll-arrow" aria-hidden="true">↓</span>Прокрутите — начнём погрузку</p>
        <p className="scene-status" ref={status}>00 / 03</p>
        <p className="reduced-note">Ваш автомобиль. Наш маршрут.</p>
      </footer>
      {failed&&<p className="asset-error" role="alert">Не удалось загрузить транспорт. Обновите страницу.</p>}
    </section>;
}
