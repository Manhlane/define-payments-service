import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<DataSourceOptions> => {
    const dbUrl = configService.get<string>('DATABASE_URL');

    return {
      type: 'postgres',
      url: dbUrl,
      ssl: dbUrl ? { rejectUnauthorized: false } : undefined,
      synchronize: false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    };
  },
  inject: [ConfigService],
};
