import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout } from '../entities/payout.entity';

@Injectable()
export class PayoutRepository {
  constructor(
    @InjectRepository(Payout)
    private readonly repository: Repository<Payout>,
  ) {}

  create(data: Partial<Payout>): Payout {
    return this.repository.create(data);
  }

  save(payout: Payout): Promise<Payout> {
    return this.repository.save(payout);
  }
}
