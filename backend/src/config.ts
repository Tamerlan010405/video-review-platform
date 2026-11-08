import path from "node:path";

export interface Config {
    port: number;
    dataDir: string;
    uploadsDir: string;
    maxUploadBytes: number;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
    const dataDir = path.resolve(process.env.DATA_DIR ?? "./data");
    const maxUploadMb = Number(process.env.MAX_UPLOAD_MB ?? 500);

    return {
        port: Number(process.env.PORT ?? 4000),
        dataDir,
        uploadsDir: path.join(dataDir, "uploads"),
        maxUploadBytes: maxUploadMb * 1024 * 1024,
        ...overrides,
    };
}
