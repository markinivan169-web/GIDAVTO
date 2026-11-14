import React,{useId} from 'react';
import {CAR_PHOTOS} from '../photo-assets';
import {TRANSPORT_PHOTOS} from '../transport-photos';

function Photo({photo,className='',decorative=false,kind}){
  const uid=useId().replace(/:/g,'');
  return <svg className={className} viewBox={`0 0 ${photo.width} ${photo.height}`} preserveAspectRatio="xMidYMax meet" role={decorative?undefined:'img'} aria-hidden={decorative||undefined} aria-label={decorative?undefined:photo.alt} data-photo={kind}>
    <defs><clipPath id={uid+'photo'}><polygon points={photo.clip}/></clipPath></defs>
    <image href={photo.src} width={photo.width} height={photo.height} clipPath={`url(#${uid}photo)`}/>
  </svg>;
}
export function CarArt({type,className='',decorative=false}){
  return <Photo photo={CAR_PHOTOS[type]||CAR_PHOTOS.sedan} className={`vehicle-art photo-art ${className}`} decorative={decorative} kind={type}/>;
}
export function TransportArt({type}){
  if(type==='help')return <div className="transport-art transport-assist" role="img" aria-label="Открытый автовоз, закрытая фура и эвакуатор — варианты для подбора">
    {['open','closed','flatbed'].map(id=><Photo key={id} photo={TRANSPORT_PHOTOS[id]} className={`assist-${id}`} decorative kind={id}/>)}
  </div>;
  return <Photo photo={TRANSPORT_PHOTOS[type]||TRANSPORT_PHOTOS.closed} className="transport-art transport-photo" kind={type}/>;
}
