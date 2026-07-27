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
import { Order } from './order.entity';
import { Customer } from './customer.entity';

// ── Enums ─────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'bank_transfer',
  'easypaisa',
  'jazzcash'
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash'
};

// ── Entity ────────────────────────────────────────────────────────────────────

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Index()
  paymentNumber!: string;

  @Column()
  @Index()
  orderId!: number;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column()
  @Index()
  customerId!: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  paymentDate!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
