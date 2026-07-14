import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddCustomerTable1720000000000 implements MigrationInterface {
  name = 'AddCustomerTable1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'customerCode',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'fullName',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true
          },
          {
            name: 'notes',
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
      'customers',
      new TableIndex({
        name: 'idx_customers_customerCode',
        columnNames: ['customerCode'],
        isUnique: true
      })
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'idx_customers_fullName',
        columnNames: ['fullName']
      })
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'idx_customers_phoneNumber',
        columnNames: ['phoneNumber'],
        isUnique: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('customers', 'idx_customers_phoneNumber');
    await queryRunner.dropIndex('customers', 'idx_customers_fullName');
    await queryRunner.dropIndex('customers', 'idx_customers_customerCode');
    await queryRunner.dropTable('customers');
  }
}
