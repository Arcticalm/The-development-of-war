'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {Battle,STEP}=require('../src/battle');const {BattleAnimation}=require('../src/animation');
test('presentation follows real movement, attack, damage and death without changing combat state',()=>{
  const b=new Battle(),a=new BattleAnimation(),u=b.spawn(0,'age1_melee');a.update(b);
  b.tick(STEP,false);const before=b.snapshot();a.update(b);assert.equal(a.pose(u).moving,true);assert.deepEqual(b.snapshot(),before);
  const enemy=b.spawn(1,'age1_melee');u.x=490;enemy.x=510;u.clock=0;a.reset(b);a.update(b);b.tick(STEP,false);a.update(b);
  assert.equal(a.pose(u).moving,false);assert.equal(a.pose(u).flash,true);assert.ok(a.pose(u).hurt>0);
  const hp=u.hp;b.units=b.units.filter(v=>v!==u);b.time+=STEP;a.update(b);assert.equal(a.units.has(u.id),false);assert.equal(a.fallen.length,1);assert.equal(a.fallen[0].hp,hp);
  b.time+=0.7;a.update(b);assert.equal(a.fallen.length,0);
});
test('paused simulation freezes all visual poses and camera; new battles discard previous actors',()=>{
  const b=new Battle(),a=new BattleAnimation(),u=b.spawn(0,'age4_heavy');a.update(b);b.tick(STEP,false);a.update(b);
  const pose=a.pose(u),camera=a.camera();for(let i=0;i<10;i++)a.update(b);assert.deepEqual(a.pose(u),pose);assert.deepEqual(a.camera(),camera);
  a.update(new Battle());assert.equal(a.units.size,0);assert.equal(a.fallen.length,0);assert.equal(a.camera().zoom,1);
});
test('healing and mechanical gait use their own visual responses',()=>{
  const b=new Battle(),a=new BattleAnimation(),u=b.spawn(0,'age4_vehicle');u.hp-=10;a.update(b);b.time+=STEP;u.hp+=5;a.update(b);
  assert.ok(a.pose(u).healing>0);assert.equal(a.pose(u).machine,true);assert.equal(a.pose(u).stride,0);
});
