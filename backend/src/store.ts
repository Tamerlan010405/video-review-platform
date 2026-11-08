import fs from "node:fs";
import path from "node:path";

import type { Database } from "./types";

// Простое файловое хранилище: вся база в одном JSON, запись атомарная (tmp-файл + rename)
export class Store{
    data: Database;
    private file: string | null;

    constructor(file: string | null){
        this.file = file;
        this.data = { projects: [], comments: [] };

        if (file && fs.existsSync(file)){
            this.data = JSON.parse(fs.readFileSync(file, "utf-8")) as Database;
        }
    }

    save(): void {
        if (!this.file){
            return;
        }

        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        const tmp = `${this.file}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
        fs.renameSync(tmp, this.file);
    }
}
