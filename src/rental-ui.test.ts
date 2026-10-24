import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as core from './quote-core';
const compiled=transformSync(readFileSync(new URL('./App.tsx',import.meta.url),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code;
function harness(){
 let cursor=0,tree:any;const hooks:any[]=[],clipboard:string[]=[],saved=new Map<string,string>();let printed=0;
 const TeamStub=()=>null;
 const fakeReact={...React,lazy:()=>TeamStub,useState(initial:any){const index=cursor++;if(!(index in hooks))hooks[index]=typeof initial==='function'?initial():initial;return [hooks[index],(v:any)=>{hooks[index]=typeof v==='function'?v(hooks[index]):v;}];},useRef(initial:any){const index=cursor++;return hooks[index]??={current:initial};},useCallback(fn:any){return fn;}};
 const context:any={module:{exports:{}},console,crypto:globalThis.crypto,structuredClone,setTimeout,clearTimeout,localStorage:{setItem:(k:string,v:string)=>saved.set(k,v),getItem:(k:string)=>saved.get(k)??null},navigator:{clipboard:{writeText:async(t:string)=>clipboard.push(t)}},window:{print:()=>printed++},require:(name:string)=>name==='react'?fakeReact:name==='./quote-core'?core:new Proxy({},{get:()=>()=>null})};context.exports=context.module.exports;
 vm.runInNewContext(compiled,context);const App=context.module.exports.default;
 function render(){cursor=0;tree=App();return tree;}
 const walk=(node:any):any[]=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(walk):[node,...walk(typeof node.type==='function'&&['Field','Check','PricingChoice'].includes(node.type.name)?node.type(node.props):node.props?.children)];
 const text=(node:any):string=>node==null?'':Array.isArray(node)?node.map(text).join(''):typeof node==='object'?text(node.props?.children):String(node);
 const nodes=(scope=tree)=>walk(scope);
 const click=(label:string,scope=tree)=>{const el=nodes(scope).find(n=>n.type==='button'&&text(n).startsWith(label));assert.ok(el,'button '+label);el.props.onClick();render();};
 const field=(label:string,value:string,scope=tree)=>{const parent=nodes(scope).find(n=>n.type==='label'&&text(n).startsWith(label));assert.ok(parent,'field '+label);const input=nodes(parent).find(n=>['input','select','textarea'].includes(n.type));assert.ok(input,'control '+label);input.props.onChange({target:{value}});render();};
 render();nodes().find(n=>n.type===TeamStub).props.onAccess(true);render();
 return {render,nodes,text,click,field,clipboard,get printed(){return printed;},get q(){return hooks[0] as core.Quote;},card:()=>nodes().find(n=>n.type==='article'&&n.props.className==='line-card'),markup:()=>renderToStaticMarkup(tree)};
}
test('actual rental form selects one price, restores public price, and exports the displayed amount',async()=>{
 const h=harness();h.field('選公版設備方案','pc-screen');h.click('加入本張報價');h.field('數量（設備台數','3');h.field('計費期數','15');assert.equal(core.calculateQuote(h.q).subtotal,9000);
 h.click('客製化報價',h.card());assert.equal(core.calculateQuote(h.q).pending,1);assert.ok(!h.markup().includes('原價計費說明'));
 h.field('每台整段基本租金','1800');h.field('客製化報價說明','十五天方案');assert.equal(core.calculateQuote(h.q).subtotal,5400);assert.equal(core.calculateQuote(h.q).discountBase,0);
 h.click('複製客戶報價');await Promise.resolve();assert.match(h.clipboard[0],/NT\$ 5,400/);const preview=h.nodes().find(n=>n.type==='details'&&n.props.className.includes('customer-preview'));assert.equal(h.text(h.nodes(preview).find(n=>n.type==='pre')),h.clipboard[0]);assert.equal(h.text(h.nodes().find(n=>n.type==='section'&&n.props.className==='print-only').props.children[1]),h.clipboard[0]);h.click('列印客戶報價');assert.equal(h.printed,1);
 h.click('公版計價',h.card());assert.equal(h.q.lines[0].override,'');assert.equal(core.calculateQuote(h.q).subtotal,9000);assert.ok(!h.markup().includes('每台整段基本租金（不含超印）'));
});
test('delivery shortcuts do not duplicate charges and deposit does not change rental total',()=>{
 const h=harness();h.click('加入本張報價');h.field('交付方式','專人送裝及回收');h.click('＋ 送裝費');h.click('＋ 送裝費');assert.equal(h.q.lines.filter(l=>l.kind==='delivery').length,1);h.click('＋ 回收費');assert.equal(core.calculateQuote(h.q).pending,1);
 const rows=()=>h.nodes().filter(n=>n.type==='article'&&n.props.className==='delivery-row');h.field('每次收送費','300',rows()[1]);assert.equal(core.calculateQuote(h.q).subtotal,1200);
 h.field('本案押金方式','collect');h.click('帶入參考總額');assert.equal(core.calculateQuote(h.q).deposit,2000);assert.equal(core.calculateQuote(h.q).total,1200);
 h.field('本案押金方式','waive');h.field('免押金原因','長期客戶');assert.equal(core.calculateQuote(h.q).deposit,0);h.field('本案押金方式','pending');assert.equal(core.calculateQuote(h.q).deposit,null);
 h.field('交付方式','客戶自取自還');assert.match(h.text(h.render()),/目前仍有收送費品項/);assert.equal(h.q.lines.length,3);
});
test('new custom line starts pending, manual services remain manual, and layout fixtures render',()=>{
 const h=harness();h.click('客製化報價');h.field('選設備規格','pc-screen');h.click('加入本張報價');assert.equal(core.pricingMode(h.q.lines[0]),'custom');assert.equal(core.calculateQuote(h.q).pending,1);h.field('每台整段基本租金','1800');h.field('客製化報價說明','專案價');h.field('數量（設備台數','3');h.field('計費期數','15');h.field('交付方式','專人送裝及回收');h.click('＋ 送裝費');h.click('＋ 回收費');h.field('本案押金方式','collect');h.click('帶入參考總額');
 if(process.env.WRITE_LAYOUT_FIXTURE){mkdirSync('.qa',{recursive:true});writeFileSync('.qa/layout-body.html',h.markup());}
 h.click('軟體／安裝');h.click('加入本張報價');assert.equal(h.q.lines.at(-1)?.planId,'');assert.ok(h.markup().includes('人工單價（未知留空）'));
});
