import React,{useEffect,useRef} from 'react';

export default function Cursor(){
  const ref=useRef(null);
  useEffect(()=>{
    const query=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const node=ref.current,label=node.querySelector('span');
    let frame=0,x=0,y=0;
    const hide=()=>{cancelAnimationFrame(frame);frame=0;node.dataset.visible='false';document.documentElement.classList.remove('custom-cursor-active')};
    const decorate=element=>{
      if(element?.closest?.('input,textarea,select,[contenteditable="true"]')){hide();return false;}
      const target=element?.closest?.('a,button,summary,[role="radio"]');
      node.dataset.interactive=String(!!target&&!target.disabled);
      node.dataset.primary=String(!!target?.matches('[data-cursor="primary"]'));
      label.textContent=target?.dataset.cursorLabel||'';
      return true;
    };
    const move=event=>{
      if(!query.matches||event.pointerType!=='mouse'){hide();return;}
      x=event.clientX;y=event.clientY;
      if(!decorate(event.target))return;
      if(!frame)frame=requestAnimationFrame(()=>{
        frame=0;
        node.style.transform=`translate3d(${x}px,${y}px,0)`;
        node.dataset.visible='true';
        document.documentElement.classList.add('custom-cursor-active');
      });
    };
    const scroll=()=>{if(node.dataset.visible==='true')decorate(document.elementFromPoint(x,y))};
    const keyboard=event=>{if(event.key==='Tab')hide();};
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerover',move,{passive:true});
    window.addEventListener('scroll',scroll,{passive:true});
    document.addEventListener('pointerleave',hide);
    window.addEventListener('blur',hide);
    window.addEventListener('keydown',keyboard);
    query.addEventListener('change',hide);
    return ()=>{
      cancelAnimationFrame(frame);hide();
      window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',hide);
      window.removeEventListener('pointerover',move);window.removeEventListener('scroll',scroll);
      window.removeEventListener('blur',hide);window.removeEventListener('keydown',keyboard);query.removeEventListener('change',hide);
    };
  },[]);
  return <div className="custom-cursor" ref={ref} data-visible="false" aria-hidden="true">
    <i/>
    <svg viewBox="0 0 44 44"><path d="M10 2H34L42 10V34L34 42H10L2 34V10Z"/></svg>
    <span/>
  </div>;
}
