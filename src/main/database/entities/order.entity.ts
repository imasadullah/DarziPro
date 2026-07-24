import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Customer } from './customer.entity';
import { Measurement } from './measurement.entity';

// ── Enums ─────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'Pending'
  | 'Cutting'
  | 'Stitching'
  | 'Quality Check'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Cutting',
  'Stitching',
  'Quality Check',
  'Ready',
  'Delivered',
  'Cancelled'
];

export type GarmentType =
  | 'shirt'
  | 'pant'
  | 'shalwar_kameez'
  | 'kurta'
  | 'coat'
  | 'waistcoat'
  | 'sherwani'
  | 'ladies_suit'
  | 'custom';

export const GARMENT_TYPES: { value: GarmentType; label: string }[] = [
  { value: 'shalwar_kameez', label: 'Shalwar Kameez' },
  { value: 'kurta', label: 'Kurta' },
  { value: 'shirt', label: 'Shirt' },
  { value: 'pant', label: 'Pant' },
  { value: 'coat', label: 'Coat' },
  { value: 'waistcoat', label: 'Waistcoat' },
  { value: 'sherwani', label: 'Sherwani' },
  { value: 'ladies_suit', label: 'Ladies Suit' },
  { value: 'custom', label: 'Custom' }
];

export type OrderPriority = 'normal' | 'urgent' | 'express';

// ── Entity ────────────────────────────────────────────────────────────────────

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Index()
  orderNumber!: string;

  @Column()
  @Index()
  customerId!: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ nullable: true, type: 'integer' })
  measurementId?: number | null;

  @ManyToOne(() => Measurement, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'measurementId' })
  measurement?: Measurement | null;

  @Column({ type: 'varchar' })
  garmentType!: GarmentType;

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  @Column({ type: 'varchar', default: 'Pending' })
  @Index()
  status!: OrderStatus;

  @Column({ type: 'varchar', default: 'normal' })
  priority!: OrderPriority;

  @Column({ type: 'date' })
  orderDate!: string;

  @Column({ type: 'date' })
  @Index()
  deliveryDate!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advanceAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount!: number;

  @Column({ type: 'text', nullable: true })
  stitchingNotes?: string;

  @Column({ type: 'text', nullable: true })
  fabricNotes?: string;

  @Column({ type: 'text', nullable: true })
  specialInstructions?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
