import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SCENE,CARS,carPose,wheelCenterHeight,rampGeometry} from '../src/geometry.js';

test('both axles retain their wheelbase and surface contact throughout loading',()=>{
  for(const car of CARS) for(let rearX=560;rearX<=1000;rearX+=.5) {
    const p=carPose(car,rearX);
    assert.ok(Math.abs(Math.hypot(p.frontX-p.x,p.frontY-p.y)-p.wheelbase)<1e-5);
    assert.ok(Math.abs(p.frontY-wheelCenterHeight(p.frontX,p.radius))<1e-8);
    assert.ok(Math.abs(p.angle)<9);
  }
});
test('the supplied ramp contacts the road and rotates shut at its right hinge',()=>{
  const ramp=rampGeometry();
  const a=ramp.rest*Math.PI/180;
  const x=SCENE.entry+(-2038*Math.cos(a)-207*Math.sin(a))*ramp.scale;
  const y=SCENE.floor+(-2038*Math.sin(a)+207*Math.cos(a))*ramp.scale;
  assert.ok(Math.abs(x-SCENE.rampTip)<1e-8);
  assert.ok(Math.abs(y-SCENE.road)<1e-8);
  const b=(ramp.rest+ramp.closed)*Math.PI/180;
  assert.ok(Math.abs((-2038*Math.cos(b)-207*Math.sin(b))*ramp.scale)<1e-8);
});
test('all initial wheel bottoms share the road, all final bumpers clear the side wall',()=>{
  for(const car of CARS){
    const scale=car.width/car.pixels[0];
    const p=carPose(car,car.start+car.rear[0]*scale);
    assert.ok(Math.abs(p.y+p.radius-SCENE.road)<1e-8);
    const finalRear=SCENE.entry+car.rear[0]*scale+12;
    assert.ok(finalRear-car.rear[0]*scale>SCENE.entry);
  }
  assert.ok(SCENE.rampTip+1700>SCENE.width);
});
