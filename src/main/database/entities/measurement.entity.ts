import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { Customer } from './customer.entity';
import { MeasurementValue } from './measurement-value.entity';

export type MeasurementType =
  | 'shirt'
  | 'pant'
  | 'shalwar_kameez'
  | 'coat'
  | 'waistcoat'
  | 'custom';

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  customerId!: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'varchar' })
  @Index()
  measurementType!: MeasurementType;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  fabricNotes?: string;

  @Column({ type: 'text', nullable: true })
  stitchingInstructions?: string;

  @OneToMany(() => MeasurementValue, (value) => value.measurement, {
    cascade: true,
    eager: true
  })
  values!: MeasurementValue[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
