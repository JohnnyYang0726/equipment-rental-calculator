import {readFileSync,writeFileSync} from 'node:fs';
import {PLANS} from '../src/quote-core.ts';
const path=new URL('../supabase/rental_workspace.sql',import.meta.url);
const sql=readFileSync(path,'utf8');
const values=PLANS.map(p=>`('${p.id}', '${JSON.stringify(p).replaceAll("'","''")}'::jsonb)`).join(',\n');
writeFileSync(path,sql.replace(/-- CATALOGUE_SEED[\s\S]*?(?=\ncreate table public\.yj_rental_quotes)/,`-- CATALOGUE_SEED\ninsert into yj_private.rental_catalogue(id,plan) values\n${values};\n`));
