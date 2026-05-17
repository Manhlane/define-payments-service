import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSchedule } from '../entities/payment-schedule.entity';

@Injectable()
export class PaymentScheduleRepository {
  constructor(
    @InjectRepository(PaymentSchedule)
    private readonly repository: Repository<PaymentSchedule>,
  ) {}

  create(data: Partial<PaymentSchedule>): PaymentSchedule {
    return this.repository.create(data);
  }

  save(schedule: PaymentSchedule): Promise<PaymentSchedule> {
    return this.repository.save(schedule);
  }

  saveMany(schedules: PaymentSchedule[]): Promise<PaymentSchedule[]> {
    return this.repository.save(schedules);
  }

  async findById(id: string): Promise<PaymentSchedule | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['paymentIntent'],
    });
  }

  async findByReference(reference: string): Promise<PaymentSchedule | null> {
    return this.repository.findOne({
      where: { paystackReference: reference },
      relations: ['paymentIntent'],
    });
  }

  findByIntentId(paymentIntentId: string): Promise<PaymentSchedule[]> {
    return this.repository.find({
      where: { paymentIntentId },
      order: { dueDate: 'ASC' },
    });
  }
}
