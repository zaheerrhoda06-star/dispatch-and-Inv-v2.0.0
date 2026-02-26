import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigrations() {
    try {
        const migrationsDir = join(process.cwd(), 'migrations');
        const files = readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`Found ${files.length} migration(s)`);

        for (const file of files) {
            const filePath = join(migrationsDir, file);
            const sql = readFileSync(filePath, 'utf-8');

            console.log(`Running migration: ${file}`);
            await query(sql);
            console.log(`✓ Migration completed: ${file}`);
        }

        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
