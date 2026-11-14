// One coordinate system for the floor, truck, ramp, clipping plane and wheel path.
export const SCENE = Object.freeze({ width:1600, height:480, road:350, entry:802, floor:328, rampTip:650, truckX:800, truckWidth:736 });
export const CARS = [
  { id:'orange', name:'Оранжевый суперкар', width:180, pixels:[2053,579], rear:[354,405], front:[1600,405], radius:171, start:462, begin:8, end:30 },
  { id:'silver', name:'Серебристое спортивное купе', width:180, pixels:[2054,644], rear:[499,452], front:[1640,452], radius:187, start:260, begin:30, end:50 },
  { id:'blue', name:'Кобальтовое купе', width:180, pixels:[2060,623], rear:[426,435], front:[1713,435], radius:184, start:58, begin:50, end:70 },
];

export function surfaceHeight(x) {
  const {rampTip,entry,road,floor}=SCENE;
  if(x<=rampTip) return road;
  if(x>=entry) return floor;
  return road+(floor-road)*(x-rampTip)/(entry-rampTip);
}

// The wheel center follows the offset of the actual surface by the tire radius.
// The max of the neighboring segments is the circular tire's support envelope.
export function wheelCenterHeight(x,radius) {
  const {rampTip,entry,road,floor}=SCENE;
  let y=Infinity;
  for(const [ax,ay,bx,by] of [[-1e5,road,rampTip,road],[rampTip,road,entry,floor],[entry,floor,1e5,floor]]) {
    const slope=(by-ay)/(bx-ax);
    const contactX=x-radius*slope/Math.sqrt(1+slope*slope);
    if(contactX>=ax && contactX<=bx) y=Math.min(y,ay+slope*(x-ax)-radius*Math.sqrt(1+slope*slope));
    for(const [px,py] of [[ax,ay],[bx,by]]) {
      if(Math.abs(px-x)<=radius) y=Math.min(y,py-Math.sqrt(radius*radius-(px-x)**2));
    }
  }
  return y;
}

// Rigid wheelbase: solve the front axle position on the radius-offset surface.
// This keeps both tires touching the path through the two ramp transitions.
export function carPose(car,rearX) {
  const scale=car.width/car.pixels[0];
  const radius=car.radius*scale;
  const wheelbase=(car.front[0]-car.rear[0])*scale;
  const rearY=wheelCenterHeight(rearX,radius);
  let lo=rearX,hi=rearX+wheelbase;
  for(let i=0;i<30;i++) {
    const x=(lo+hi)/2,y=wheelCenterHeight(x,radius);
    if(Math.hypot(x-rearX,y-rearY)>wheelbase) hi=x; else lo=x;
  }
  const frontX=(lo+hi)/2,frontY=wheelCenterHeight(frontX,radius);
  return {x:rearX,y:rearY,angle:Math.atan2(frontY-rearY,frontX-rearX)*180/Math.PI,frontX,frontY,radius,wheelbase};
}

export function rampGeometry() {
  const dx=SCENE.entry-SCENE.rampTip,dy=SCENE.road-SCENE.floor;
  const nativeLength=Math.hypot(2038,207);
  const scale=Math.hypot(dx,dy)/nativeLength;
  const rest=Math.atan2(dy,-dx)*180/Math.PI-Math.atan2(207,-2038)*180/Math.PI;
  const closed=270-Math.atan2(dy,-dx)*180/Math.PI;
  return {scale,rest,closed};
}
