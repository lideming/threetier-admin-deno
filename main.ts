import { db } from "./db.ts";
import { Application, Router, helpers } from "https://deno.land/x/oak@v6.2.0/mod.ts";
import * as config from "./config.ts";

const API_PREFIX = '/admin/api';

const app = new Application();
const router = new Router();

// request logging
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const timeUsed = Date.now() - start;
    console.info(`(${timeUsed} ms) ${ctx.response.status} ${ctx.request.method} ${ctx.request.url}`);
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
        ctx.response.headers.set('WWW-Authenticate', 'Basic realm="User Visible Realm"');
        ctx.response.status = 401;
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
    ;

app.addEventListener('error', ev => console.error(ev.error));
app.addEventListener('listen', ev => console.info(`listening on ${ev.hostname} port ${ev.port}`));

db.init().then(async () => {
    console.log({
        records: await db.getRecords(1),
        total: await db.getCount()
    });
});

app.listen({ hostname: '127.0.0.1', port: 5012 });
