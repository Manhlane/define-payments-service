import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
};

@Injectable()
export class AuthClient {
  private readonly logger = new Logger(AuthClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ??
      'http://localhost:3002';
  }

  async getCurrentUser(token?: string): Promise<AuthUser | null> {
    if (!token) return null;
    const url = `${this.normalizeBaseUrl(this.baseUrl)}/auth/me`;
    const fetchImpl = this.getFetch();

    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json().catch(() => null)) as AuthUser | null;
      if (!data || typeof data !== 'object') return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
      };
    } catch (error) {
      this.logger.warn(`Failed to reach auth service at ${url}`, error as Error);
      return null;
    }
  }

  private normalizeBaseUrl(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private getFetch(): typeof fetch {
    if (typeof fetch === 'function') {
      return fetch;
    }
    throw new Error('Fetch API is not available in this environment.');
  }
}
