import path from "node:path";

import { createApp } from "./app";
import { loadConfig } from "./config";
import { seedIfEmpty } from "./seed";
import { Store } from "./store";

const config = loadConfig();
const store = new Store(path.join(config.dataDir, "db.json"));

seedIfEmpty(store);

createApp(store, config).listen(config.port, "127.0.0.1", () => {
    console.log(`API запущен: http://127.0.0.1:${config.port}/api/v1`);
});
