import { DataSource } from 'typeorm';
import { app } from 'electron';
import * as path from 'path';
import { User } from '../database/entities/user.entity';
import { Setting } from '../database/entities/setting.entity';
import { InitialMigration1710000000000 } from '../database/migrations/1710000000000-InitialMigration';

const getDatabasePath = () => {
  try {
    if (app && app.getPath) {
      return path.join(app.getPath('userData'), 'database.sqlite');
    }
  } catch (e) {
    // Safe catch if Electron context is missing (like during Vitest execution)
  }
  return path.join(process.cwd(), 'database.sqlite');
};

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: getDatabasePath(),
  synchronize: false,
  entities: [User, Setting],
  migrations: [InitialMigration1710000000000],
  migrationsRun: true,
  logging: false
});
