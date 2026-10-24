import test from 'node:test';
import assert from 'node:assert/strict';
import { customerDocumentHtml } from './customer-document';
import { newQuote, makeLine, quoteText } from './quote-core';
import { officialHtml } from './team-format';

test('customer document renders the quoted items, agreed notes, separate deposit and totals in a printable table',()=>{
 const q=newQuote();q.lines=[makeLine('equipment','pc-screen')];
 Object.assign(q.lines[0],{override:'1500',overrideReason:'專案',scope:'交付前完成測試。\n含指定軟體設定。'});
 Object.assign(q.inquiry,{customer:'王先生',start:'2026-10-30',end:'2026-10-31',tax:'included',depositMode:'collect',deposit:'4000',payment:'交付前付款',delivery:'客戶自取自還'});
 const text=quoteText(q),html=customerDocumentHtml(text),standalone=officialHtml(text);
 assert.match(html,/<table>/);assert.match(html,/<th scope="col">金額/);assert.match(html,/1台 × 1天/);assert.match(html,/NT\$ 1,500/);
 for(const expected of ['王先生','交付前完成測試。','含指定軟體設定。','押金另計：NT$ 4,000','付款：交付前付款','報價合計：NT$ 1,500（含稅）'])assert.ok(html.includes(expected),expected);
 assert.ok(standalone.includes(html));assert.match(standalone,/@page\{size:A4/);assert.doesNotMatch(html,/請確認|尚有待確認項目|不要重複加價/);
});
test('all customer text including item names, metadata and notes is escaped in printable markup',()=>{
 const q=newQuote();const l=makeLine('custom');Object.assign(l,{name:'<img src=x onerror=alert(1)>',price:'100',scope:'<script>alert(1)</script> & "測試"'});q.lines=[l];q.inquiry.customer='<svg onload=alert(1)>';
 const html=officialHtml(quoteText(q));assert.doesNotMatch(html,/<img |<svg |<script>/);assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&amp;/);
});
