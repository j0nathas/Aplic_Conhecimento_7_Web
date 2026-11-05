import { describe, expect, it } from 'vitest';
import { TransacoesService } from '../src/transacoes/transacoes.service.js';

describe('TransacoesService - métricas', () => {
  const service = new TransacoesService({} as never);

  it('lista vazia retorna tudo zerado', () => {
    expect(service.calcularMetricas([])).toEqual({
      saldoTotal: 0,
      totalDespesas: 0,
      totalGastoImpulso: 0,
    });
  });

  it('calcula saldo, total de despesas e gasto por impulso', () => {
    const r = service.calcularMetricas([
      { tipo: 'receita', valor: 3000, consumoConsciente: true },
      { tipo: 'despesa', valor: 1200, consumoConsciente: true }, 
      { tipo: 'despesa', valor: 350.5, consumoConsciente: true }, 
      { tipo: 'despesa', valor: 199.9, consumoConsciente: false }, 
      { tipo: 'despesa', valor: 80, consumoConsciente: false }, 
    ]);

    expect(r.totalDespesas).toBe(1830.4);
    expect(r.saldoTotal).toBe(1169.6);
    expect(r.totalGastoImpulso).toBe(279.9);
  });

  it('receitas nunca entram no gasto por impulso, mesmo com consumoConsciente=false', () => {
    const r = service.calcularMetricas([
      { tipo: 'receita', valor: 500, consumoConsciente: false },
    ]);
    expect(r.totalGastoImpulso).toBe(0);
    expect(r.totalDespesas).toBe(0);
    expect(r.saldoTotal).toBe(500);
  });

  it('saldo pode ficar negativo', () => {
    const r = service.calcularMetricas([
      { tipo: 'receita', valor: 100, consumoConsciente: true },
      { tipo: 'despesa', valor: 250, consumoConsciente: true },
    ]);
    expect(r.saldoTotal).toBe(-150);
  });

  it('evita erros de ponto flutuante (0.1 + 0.2)', () => {
    const r = service.calcularMetricas([
      { tipo: 'despesa', valor: 0.1, consumoConsciente: false },
      { tipo: 'despesa', valor: 0.2, consumoConsciente: false },
    ]);
    expect(r.totalDespesas).toBe(0.3);
    expect(r.totalGastoImpulso).toBe(0.3);
  });
});
