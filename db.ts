import { Client } from "./dep.ts";
import { dbConfig } from "./config.ts";

export interface Record {
    id: number;
    student_id: any;
    student_name: string;
    why_join: string;
    self_intro: string;
    ctime: number;
}

class Db {
    client = new Client();
    async init() {
        await this.client.connect({ poolSize: 3, ...dbConfig, idleTimeout: 3600000 });
    }
    async getRecords(limit?: number, after?: number) {
        console.log({ limit, next: after });
        const sql = `SELECT id, student_id, student_name, why_join, self_intro, UNIX_TIMESTAMP(ctime) as ctime
            FROM t_signup_user
            ${after ? 'WHERE id < ?' : ''}
            ORDER BY id DESC
            ${limit != null ? 'LIMIT ?' : ''};`;
        const args = [];
        if (after) {
            args.push(after);
        }
        if (limit != null) args.push(limit);
        var resp = await this.client.query(sql, args) as Record[];
        return resp;
    }
    async getCount() {
        const result = await this.client.query('SELECT count(*) as count FROM t_signup_user;');
        return result[0]['count'] as number;
    }
}

export const db = new Db();
