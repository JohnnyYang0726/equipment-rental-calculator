import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import App from './App';

test('initial rental page renders employee entry without customer quotation or inquiry inputs',()=>{
 const page=renderToStaticMarkup(React.createElement(App));
 assert.match(page,/請先使用員工帳號登入/);
 assert.match(page,/公開保固與驅動查詢/);
 assert.doesNotMatch(page,/class="workspace"|class="print-only"|class="text-preview customer-preview"/);
 assert.doesNotMatch(page,/<button[^>]*>(?:(?!<\/button>)[\s\S])*(?:複製客戶報價|列印客戶報價)<\/button>/);
 assert.match(page,/<button disabled="">[\s\S]*?保存草稿<\/button>/);
});
