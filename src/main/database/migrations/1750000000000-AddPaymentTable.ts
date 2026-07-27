import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey
} from 'typeorm';

export class AddPaymentTable1750000000000 implements MigrationInterface {
  name = 'AddPaymentTable1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'paymentNumber',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'orderId',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'customerId',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'paymentDate',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'createdBy',
            type: 'varchar',
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

    // Indexes
    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'idx_payments_paymentNumber', columnNames: ['paymentNumber'] })
    );
    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'idx_payments_orderId', columnNames: ['orderId'] })
    );
    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'idx_payments_customerId', columnNames: ['customerId'] })
    );
    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'idx_payments_paymentDate', columnNames: ['paymentDate'] })
    );

    // FK: payments.orderId → orders.id (RESTRICT on delete — prevent order deletion with payments)
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        name: 'fk_payments_orderId',
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    // FK: payments.customerId → customers.id (RESTRICT on delete)
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        name: 'fk_payments_customerId',
        columnNames: ['customerId'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('payments', 'fk_payments_customerId');
    await queryRunner.dropForeignKey('payments', 'fk_payments_orderId');
    await queryRunner.dropIndex('payments', 'idx_payments_paymentDate');
    await queryRunner.dropIndex('payments', 'idx_payments_customerId');
    await queryRunner.dropIndex('payments', 'idx_payments_orderId');
    await queryRunner.dropIndex('payments', 'idx_payments_paymentNumber');
    await queryRunner.dropTable('payments');
  }
}
