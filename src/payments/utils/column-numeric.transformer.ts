export class ColumnNumericTransformer {
  to(value?: number | null): number | null {
    if (value === null || value === undefined) return null;
    return Number(value);
  }

  from(value?: string | number | null): number | null {
    if (value === null || value === undefined) return null;
    return Number(value);
  }
}
