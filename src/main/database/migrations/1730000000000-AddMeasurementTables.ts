import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey
} from 'typeorm';

export class AddMeasurementTables1730000000000 implements MigrationInterface {
  name = 'AddMeasurementTables1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── measurements table ─────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'measurements',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'customerId',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'measurementType',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'fabricNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'stitchingInstructions',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    await queryRunner.createIndex(
      'measurements',
      new TableIndex({
        name: 'idx_measurements_customerId',
        columnNames: ['customerId']
      })
    );

    await queryRunner.createIndex(
      'measurements',
      new TableIndex({
        name: 'idx_measurements_measurementType',
        columnNames: ['measurementType']
      })
    );

    await queryRunner.createForeignKey(
      'measurements',
      new TableForeignKey({
        name: 'fk_measurements_customerId',
        columnNames: ['customerId'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    // ── measurement_values table ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'measurement_values',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'measurementId',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'fieldName',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'fieldValue',
            type: 'varchar',
            isNullable: true
          }
        ]
      }),
      true
    );

    await queryRunner.createIndex(
      'measurement_values',
      new TableIndex({
        name: 'idx_measurement_values_measurementId',
        columnNames: ['measurementId']
      })
    );

    await queryRunner.createForeignKey(
      'measurement_values',
      new TableForeignKey({
        name: 'fk_measurement_values_measurementId',
        columnNames: ['measurementId'],
        referencedTableName: 'measurements',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('measurement_values', 'fk_measurement_values_measurementId');
    await queryRunner.dropIndex('measurement_values', 'idx_measurement_values_measurementId');
    await queryRunner.dropTable('measurement_values');

    await queryRunner.dropForeignKey('measurements', 'fk_measurements_customerId');
    await queryRunner.dropIndex('measurements', 'idx_measurements_measurementType');
    await queryRunner.dropIndex('measurements', 'idx_measurements_customerId');
    await queryRunner.dropTable('measurements');
  }
}
