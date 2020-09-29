import { db, Record } from "./db.ts";
import { Application, Router, helpers } from "https://deno.land/x/oak@v6.2.0/mod.ts";
import * as config from "./config.ts";

const API_PREFIX = '/admin/api';

const app = new Application({ proxy: true });
const router = new Router();

// request logging
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const timeUsed = Date.now() - start;
    console.info(`(${timeUsed} ms) ${ctx.request.ip} ${ctx.response.status} ${ctx.request.method} ${ctx.request.url}`);
});

app.use((ctx, next) => {
    if (!ctx.request.url.pathname.startsWith('/admin/')) {
        ctx.response.redirect('/admin/');
        ctx.respond = true;
        return;
    }
    return next();
});

const authValue = 'Basic ' + btoa(config.username + ':' + config.password);

app.use((ctx, next) => {
    if (ctx.request.headers.get('Authorization') !== authValue) {
        ctx.response.headers.set('WWW-Authenticate', 'Basic realm="Login"');
        ctx.response.status = 401;
        ctx.response.body = "HTTP Basic 认证失败";
        ctx.respond = true;
        return;
    }
    return next();
});

app.use(router.routes());

app.use(async (ctx) => {
    if (ctx.request.url.pathname.startsWith('/admin/')) {
        await ctx.send({
            path: ctx.request.url.pathname.substr(6),
            root: Deno.cwd() + '/wwwroot/',
            index: 'index.html',
            gzip: true,
            extensions: ['html']
        })
    }
});

router
    .get(API_PREFIX + '/records', async ctx => {
        const req = ctx.request;
        const params = req.url.searchParams;
        const before = params.has('beforeTime') ? parseInt(params.get('beforeTime')!) : null;
        const afterSno = params.has('afterSno') ? parseInt(params.get('afterSno')!) : null;
        ctx.response.body = {
            records: await db.getRecords(50, before ? { time: before!, sno: afterSno! } : undefined),
            total: before ? null : await db.getCount()
        };
    })
    .get(API_PREFIX + '/records.csv', async ctx => {
        var records = await db.getRecords();
        console.log(`csv: ${records.length} records`);
        ctx.response.type = 'text/csv';
        var keys = Object.keys(records[0]) as (keyof Record)[];
        var csv = keys.join(',') + '\r\n';
        for (const r of records) {
            //@ts-ignore
            r.timestamp = new Date(r.timestamp * 1000).toISOString();
            csv += keys.map(k => '"' + r[k].toString().replace(/"/g, '""') + '"').join(',') + '\r\n';
        }
        ctx.response.body = csv;
        ctx.respond = true;
    })
    ;

app.addEventListener('error', ev => console.error(ev.error));
app.addEventListener('listen', ev => console.info(`listening on ${ev.hostname} port ${ev.port}`));

db.init().then(async () => {
    console.log('test query:', {
        records: await db.getRecords(1),
        total: await db.getCount()
    });
});

app.listen({ hostname: '127.0.0.1', port: 5012 });
