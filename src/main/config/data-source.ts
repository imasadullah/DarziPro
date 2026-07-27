import { DataSource } from 'typeorm';
import { app } from 'electron';
import * as path from 'path';
import { User } from '../database/entities/user.entity';
import { Setting } from '../database/entities/setting.entity';
import { Customer } from '../database/entities/customer.entity';
import { Measurement } from '../database/entities/measurement.entity';
import { MeasurementValue } from '../database/entities/measurement-value.entity';
import { Order } from '../database/entities/order.entity';
import { Payment } from '../database/entities/payment.entity';
import { InitialMigration1710000000000 } from '../database/migrations/1710000000000-InitialMigration';
import { AddCustomerTable1720000000000 } from '../database/migrations/1720000000000-AddCustomerTable';
import { AddMeasurementTables1730000000000 } from '../database/migrations/1730000000000-AddMeasurementTables';
import { AddOrderTable1740000000000 } from '../database/migrations/1740000000000-AddOrderTable';
import { AddPaymentTable1750000000000 } from '../database/migrations/1750000000000-AddPaymentTable';

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
  entities: [User, Setting, Customer, Measurement, MeasurementValue, Order, Payment],
  migrations: [
    InitialMigration1710000000000,
    AddCustomerTable1720000000000,
    AddMeasurementTables1730000000000,
    AddOrderTable1740000000000,
    AddPaymentTable1750000000000
  ],
  migrationsRun: true,
  logging: false
});
