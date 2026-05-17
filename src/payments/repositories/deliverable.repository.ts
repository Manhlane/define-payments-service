import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deliverable } from '../entities/deliverable.entity';

@Injectable()
export class DeliverableRepository {
  constructor(
    @InjectRepository(Deliverable)
    private readonly repository: Repository<Deliverable>,
  ) {}

  create(data: Partial<Deliverable>): Deliverable {
    return this.repository.create(data);
  }

  saveMany(items: Deliverable[]): Promise<Deliverable[]> {
    return this.repository.save(items);
  }
}
