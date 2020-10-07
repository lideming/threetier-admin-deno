import { Client } from "./dep.ts";
import { dbConfig } from "./config.ts";

export interface Record {
    sname: string;
    sno: number;
    sphone: string;
    semail: string;
    squestion1: string;
    squestion2: string;
    timestamp: number;
}

class Db {
    client = new Client();
    async init() {
        await this.client.connect({ poolSize: 3, ...dbConfig, idleTimeout: 3600000 });
    }
    async getRecords(limit?: number, after?: { time: number, sno: number }) {
        console.log({ limit, next: after });
        const sql = `SELECT sname, sno, sphone, semail, squestion1, squestion2, UNIX_TIMESTAMP(ctime) as timestamp
            FROM threetier
            ${after ? 'WHERE ctime < FROM_UNIXTIME(?) OR (ctime = FROM_UNIXTIME(?) AND sno > ?)' : ''}
            ORDER BY ctime DESC, sno
            ${limit != null ? 'LIMIT ?' : ''};`;
        const args = [];
        if (after) {
            args.push(after.time);
            args.push(after.time);
            args.push(after.sno);
        }
        if (limit != null) args.push(limit);
        var resp = await this.client.query(sql, args) as Record[];
        return resp;
    }
    async getCount() {
        const result = await this.client.query('SELECT count(*) as count FROM threetier;');
        return result[0]['count'];
    }
}

export const db = new Db();
