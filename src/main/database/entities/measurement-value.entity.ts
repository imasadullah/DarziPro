import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Measurement } from './measurement.entity';

@Entity('measurement_values')
export class MeasurementValue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  measurementId!: number;

  @ManyToOne(() => Measurement, (m) => m.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measurementId' })
  measurement!: Measurement;

  @Column({ type: 'varchar' })
  fieldName!: string;

  @Column({ type: 'varchar', nullable: true })
  fieldValue?: string;
}
