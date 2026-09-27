import { CurrencyInrPipe } from './currency-inr.pipe';

describe('CurrencyInrPipe', () => {
  let pipe: CurrencyInrPipe;

  beforeEach(() => {
    pipe = new CurrencyInrPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('formats numbers correctly with Indian Rupee symbol', () => {
    expect(pipe.transform(22850)).toBe('₹22,850.00');
    expect(pipe.transform(0)).toBe('₹0.00');
    expect(pipe.transform(30000, false)).toBe('₹30,000');
  });

  it('handles negative amounts correctly', () => {
    expect(pipe.transform(-2550)).toBe('-₹2,550.00');
  });
});
