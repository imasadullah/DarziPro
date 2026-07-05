import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Index()
  username!: string;

  @Column()
  fullName!: string;

  @Column()
  passwordHash!: string;

  @Column({ nullable: true })
  pinHash?: string;

  @Column({ type: 'varchar' })
  role!: 'owner' | 'staff';

  @Column({ type: 'varchar', default: 'active' })
  status!: 'active' | 'inactive';

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
