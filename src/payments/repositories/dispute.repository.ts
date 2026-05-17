import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute } from '../entities/dispute.entity';

@Injectable()
export class DisputeRepository {
  constructor(
    @InjectRepository(Dispute)
    private readonly repository: Repository<Dispute>,
  ) {}

  create(data: Partial<Dispute>): Dispute {
    return this.repository.create(data);
  }

  save(dispute: Dispute): Promise<Dispute> {
    return this.repository.save(dispute);
  }
}
