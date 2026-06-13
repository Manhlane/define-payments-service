import { PaymentIntentRepository } from './payment-intent.repository';

describe('PaymentIntentRepository', () => {
  let repository: PaymentIntentRepository;
  let typeOrmRepository: { findOne: jest.Mock };

  beforeEach(() => {
    typeOrmRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    repository = new PaymentIntentRepository(typeOrmRepository as any);
  });

  it('skips uuid id lookup when identifier is a slug', async () => {
    const findByIdSpy = jest.spyOn(repository, 'findById');
    const findByPublicIdSpy = jest.spyOn(repository, 'findByPublicId');
    const findBySlugSpy = jest.spyOn(repository, 'findBySlug');

    await repository.findByIdOrPublicId('achfia');

    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(findByPublicIdSpy).toHaveBeenCalledWith('achfia');
    expect(findBySlugSpy).toHaveBeenCalledWith('achfia');
  });

  it('uses uuid id lookup when identifier is a uuid', async () => {
    const uuid = '28cf2f59-e528-4d74-8f5d-4a8f5a31bb01';
    const findByIdSpy = jest.spyOn(repository, 'findById');

    await repository.findByIdOrPublicId(uuid);

    expect(findByIdSpy).toHaveBeenCalledWith(uuid);
  });
});
