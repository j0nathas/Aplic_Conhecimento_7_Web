import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { TransacoesController } from '../src/transacoes/transacoes.controller.js';
import { TransacoesService } from '../src/transacoes/transacoes.service.js';
import { Transacao } from '../src/transacoes/schemas/transacao.schema.js';

function criarModelFake() {
  const dados: any[] = [];
  return {
    create: async (doc: any) => {
      const salvo = { _id: String(dados.length + 1), ...doc, createdAt: new Date() };
      dados.push(salvo);
      return { toObject: () => salvo };
    },
    find: () => ({
      sort: () => ({
        lean: () => ({ exec: async () => [...dados].reverse() }),
      }),
    }),
  };
}

describe('Transações (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TransacoesController],
      providers: [
        TransacoesService,
        { provide: getModelToken(Transacao.name), useValue: criarModelFake() },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /transacoes cadastra uma despesa e retorna 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/transacoes')
      .send({
        descricao: 'Conta de Luz',
        valor: 150.75,
        tipo: 'despesa',
        categoria: 'Moradia',
        consumoConsciente: true,
      })
      .expect(201);

    expect(res.body).toMatchObject({ descricao: 'Conta de Luz', tipo: 'despesa' });
  });

  it('POST /transacoes assume consumoConsciente=true quando omitido', async () => {
    const res = await request(app.getHttpServer())
      .post('/transacoes')
      .send({ descricao: 'Salário', valor: 2000, tipo: 'receita', categoria: 'Trabalho' })
      .expect(201);

    expect(res.body.consumoConsciente).toBe(true);
  });

  it('POST /transacoes rejeita tipo diferente de receita/despesa', async () => {
    await request(app.getHttpServer())
      .post('/transacoes')
      .send({ descricao: 'X', valor: 10, tipo: 'investimento', categoria: 'Y' })
      .expect(400);
  });

  it('POST /transacoes rejeita valor negativo e campos obrigatórios ausentes', async () => {
    await request(app.getHttpServer())
      .post('/transacoes')
      .send({ descricao: 'X', valor: -5, tipo: 'despesa', categoria: 'Y' })
      .expect(400);

    await request(app.getHttpServer()).post('/transacoes').send({}).expect(400);
  });

  it('GET /transacoes devolve { historico, metricas } consolidado', async () => {
    const http = app.getHttpServer();
    const enviar = (b: object) => request(http).post('/transacoes').send(b).expect(201);

    await enviar({ descricao: 'Salário', valor: 3000, tipo: 'receita', categoria: 'Trabalho' });
    await enviar({ descricao: 'Aluguel', valor: 1000, tipo: 'despesa', categoria: 'Moradia', consumoConsciente: true });
    await enviar({ descricao: 'Tênis', valor: 300, tipo: 'despesa', categoria: 'Lazer', consumoConsciente: false });

    const res = await request(http).get('/transacoes').expect(200);

    expect(res.body.historico).toHaveLength(3);
    expect(res.body.metricas).toEqual({
      saldoTotal: 1700,
      totalDespesas: 1300,
      totalGastoImpulso: 300,
    });
  });
});
