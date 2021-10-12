import { db, Record } from "./db.ts";
import { Application, Router, Context } from "https://deno.land/x/oak@v9.0.0/mod.ts";
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

app.use(async (ctx, next) => {
    var ok = false;
    if (ctx.request.headers.get('Authorization') == authValue) {
        ok = true;
    } else if (await ctx.cookies.get('admin-auth') == authValue) {
        ok = true;
    } else if (ctx.request.url.pathname == '/admin/login' && ctx.request.method == 'POST') {
        return handleLogin(ctx);
    }
    if (ok) {
        return next();
    } else {
        ctx.response.headers.set('WWW-Authenticate', 'Basic realm="Login"');
        ctx.response.status = 401;
        ctx.respond = true;
        return ctx.send({
            root: 'wwwroot/',
            path: 'login.html'
        }) as Promise<void>;
    }
});

async function handleLogin(ctx: Context) {
    const form = await ctx.request.body({ type: 'form' }).value;
    const username = form.get('username');
    const password = form.get('password');
    if (username == config.username && password == config.password) {
        ctx.cookies.set('admin-auth', authValue, { sameSite: 'strict' })
    }
    ctx.response.redirect('/admin/');
    ctx.respond = true;
}

app.use(router.routes());

app.use(async (ctx) => {
    if (ctx.request.url.pathname.startsWith('/admin/')) {
        await ctx.send({
            path: ctx.request.url.pathname.substr(6),
            root: 'wwwroot/',
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
        const after = params.has('after') ? parseInt(params.get('after')!) : undefined;
        const [records, total] = await Promise.all([
            db.getRecords(100, after),
            after ? null : db.getCount()
        ]);
        ctx.response.body = { records, total };
    })
    .get(API_PREFIX + '/records.csv', async ctx => {
        var records = await db.getRecords();
        console.log(`csv: ${records.length} records`);
        ctx.response.type = 'text/csv';
        var keys = Object.keys(records[0]) as (keyof Record)[];
        var csv = keys.join(',') + '\r\n';
        for (const r of records) {
            //@ts-ignore
            r.ctime = new Date(r.ctime * 1000).toISOString();
            csv += keys.map(k => '"' + r[k]?.toString().replace(/"/g, '""') + '"').join(',') + '\r\n';
        }
        ctx.response.body = csv;
        ctx.respond = true;
    })
    .get(API_PREFIX + '/records-2.csv', async ctx => {
        var records = await db.getRecords2();
        console.log(`csv: ${records.length} records`);
        ctx.response.type = 'text/csv';
        var keys = Object.keys(records[0]) as (keyof Record)[];
        var csv = keys.join(',') + '\r\n';
        for (const r of records) {
            csv += keys.map(k => '"' + r[k]?.toString().replace(/"/g, '""') + '"').join(',') + '\r\n';
        }
        ctx.response.body = csv;
        ctx.respond = true;
    })
    ;

app.addEventListener('error', ev => console.error(ev.error));
app.addEventListener('listen', ev => console.info(`listening on ${ev.hostname} port ${ev.port}`));

db.init().then(async () => {
    const [records, total] = await Promise.all([db.getRecords(1), db.getCount()])
    console.log('test query:', { records, total });
});

app.listen(config.listener);
