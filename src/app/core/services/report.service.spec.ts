import { TestBed } from '@angular/core/testing';
import { ReportService } from './report.service';
import { SupabaseService } from './supabase.service';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportService, SupabaseService]
    });
    service = TestBed.inject(ReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('calculates monthly summary correctly in demo mode', async () => {
    const summary = await service.getMonthlySummary(2026, 9);
    expect(summary).toBeDefined();
    expect(summary.month).toBe(9);
    expect(summary.year).toBe(2026);
    expect(summary.total_expense).toBeGreaterThan(0);
  });

  it('calculates month comparison correctly', async () => {
    const comp = await service.getMonthlyComparison(2026, 8, 2026, 9);
    expect(comp).toBeDefined();
    expect(comp.month1_total).toBeDefined();
    expect(comp.month2_total).toBeDefined();
  });
});
