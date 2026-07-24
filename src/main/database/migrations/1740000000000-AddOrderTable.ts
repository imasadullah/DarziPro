import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey
} from 'typeorm';

export class AddOrderTable1740000000000 implements MigrationInterface {
  name = 'AddOrderTable1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'orderNumber',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'customerId',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'measurementId',
            type: 'integer',
            isNullable: true
          },
          {
            name: 'garmentType',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'quantity',
            type: 'integer',
            default: 1
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'Pending'"
          },
          {
            name: 'priority',
            type: 'varchar',
            default: "'normal'"
          },
          {
            name: 'orderDate',
            type: 'date',
            isNullable: false
          },
          {
            name: 'deliveryDate',
            type: 'date',
            isNullable: false
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'advanceAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'remainingAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'stitchingNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'fabricNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'specialInstructions',
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

    // Indexes
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_orderNumber', columnNames: ['orderNumber'] })
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_customerId', columnNames: ['customerId'] })
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_deliveryDate', columnNames: ['deliveryDate'] })
    );
    await queryRunner.createIndex(
      'orders',
      new TableIndex({ name: 'idx_orders_status', columnNames: ['status'] })
    );

    // FK: orders.customerId → customers.id (RESTRICT on delete)
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_customerId',
        columnNames: ['customerId'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    // FK: orders.measurementId → measurements.id (SET NULL on delete)
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_measurementId',
        columnNames: ['measurementId'],
        referencedTableName: 'measurements',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('orders', 'fk_orders_measurementId');
    await queryRunner.dropForeignKey('orders', 'fk_orders_customerId');
    await queryRunner.dropIndex('orders', 'idx_orders_status');
    await queryRunner.dropIndex('orders', 'idx_orders_deliveryDate');
    await queryRunner.dropIndex('orders', 'idx_orders_customerId');
    await queryRunner.dropIndex('orders', 'idx_orders_orderNumber');
    await queryRunner.dropTable('orders');
  }
}
