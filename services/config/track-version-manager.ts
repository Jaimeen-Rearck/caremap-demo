import { useDB } from "@/services/database/db";
import { TrackConfigVersion } from "@/services/database/migrations/v1/schema_v1";


/**
 * Get stored version for a module (default 0 if not found).
 */
export async function getStoredVersion(module: string): Promise<number> {
    return useDB(async (db) => {
        const res = await db.getFirstAsync<TrackConfigVersion>(
            `SELECT version FROM TRACK_CONFIG_VERSION WHERE module = ?;`,
            [module]
        );
        return res?.version ?? 0;
    });
}

/**
 * Update stored version after successful sync.
 */
export async function updateStoredVersion(
    module: string,
    version: number
): Promise<void> {
    await useDB(async (db) => {
        await db.runAsync(
            `INSERT INTO TRACK_CONFIG_VERSION (module, version, last_synced_at)
       VALUES (?, ?, ?)
       ON CONFLICT(module) DO UPDATE SET version = excluded.version, last_synced_at = excluded.last_synced_at;`,
            [module, version, new Date().toISOString()]
        );
    });
}

/**
 * Check whether sync is required by comparing stored vs config version.
 */
export async function shouldSync(
    module: string,
    configVersion: number
): Promise<boolean> {
    const storedVersion = await getStoredVersion(module);
    return storedVersion < configVersion;
}
