import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  create(data: Partial<Transaction>): Transaction {
    return this.repository.create(data);
  }

  save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { reference } });
  }
}
