import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntent } from '../entities/payment-intent.entity';

@Injectable()
export class PaymentIntentRepository {
  constructor(
    @InjectRepository(PaymentIntent)
    private readonly repository: Repository<PaymentIntent>,
  ) {}

  create(data: Partial<PaymentIntent>): PaymentIntent {
    return this.repository.create(data);
  }

  save(intent: PaymentIntent): Promise<PaymentIntent> {
    return this.repository.save(intent);
  }

  async findById(id: string): Promise<PaymentIntent | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'schedules',
        'transactions',
        'payouts',
        'deliverables',
        'disputes',
      ],
      order: { schedules: { dueDate: 'ASC' } },
    });
  }

  async findByPublicId(publicId: string): Promise<PaymentIntent | null> {
    return this.repository.findOne({
      where: { publicId },
      relations: [
        'schedules',
        'transactions',
        'payouts',
        'deliverables',
        'disputes',
      ],
      order: { schedules: { dueDate: 'ASC' } },
    });
  }

  async findByIdOrPublicId(identifier: string): Promise<PaymentIntent | null> {
    const byId = await this.findById(identifier);
    if (byId) return byId;
    return this.findByPublicId(identifier);
  }
}
