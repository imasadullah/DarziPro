import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialMigration1710000000000 implements MigrationInterface {
  name = 'InitialMigration1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'username',
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
            name: 'passwordHash',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'pinHash',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'active'",
            isNullable: false
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
      'users',
      new TableIndex({
        name: 'idx_users_username',
        columnNames: ['username']
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'settings',
        columns: [
          {
            name: 'key',
            type: 'varchar',
            isPrimary: true,
            isNullable: false
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings');
    await queryRunner.dropIndex('users', 'idx_users_username');
    await queryRunner.dropTable('users');
  }
}
