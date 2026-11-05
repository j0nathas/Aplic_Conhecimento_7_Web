import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CriarTransacaoDto } from './dto/criar-transacao.dto.js';
import { Transacao } from './schemas/transacao.schema.js';

export interface Metricas {
  saldoTotal: number;
  totalDespesas: number;
  totalGastoImpulso: number;
}

export interface ResumoTransacoes {
  historico: Transacao[];
  metricas: Metricas;
}

@Injectable()
export class TransacoesService {
  constructor(
    @InjectModel(Transacao.name) private readonly transacaoModel: Model<Transacao>,
  ) { }

  async criar(dto: CriarTransacaoDto) {
    const criada = await this.transacaoModel.create({
      ...dto,
      consumoConsciente: dto.consumoConsciente ?? true,
    });
    return criada.toObject();
  }

  async listarComMetricas(): Promise<ResumoTransacoes> {
    const historico = (await this.transacaoModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as Transacao[];

    return {
      historico,
      metricas: this.calcularMetricas(historico),
    };
  }

  calcularMetricas(
    transacoes: Pick<Transacao, 'valor' | 'tipo' | 'consumoConsciente'>[],
  ): Metricas {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalGastoImpulso = 0;

    for (const t of transacoes) {
      if (t.tipo === 'receita') {
        totalReceitas += t.valor;
      } else if (t.tipo === 'despesa') {
        totalDespesas += t.valor;
        if (t.consumoConsciente === false) {
          totalGastoImpulso += t.valor;
        }
      }
    }

    return {
      saldoTotal: this.arredondar(totalReceitas - totalDespesas),
      totalDespesas: this.arredondar(totalDespesas),
      totalGastoImpulso: this.arredondar(totalGastoImpulso),
    };
  }

  private arredondar(valor: number, casas = 2): number {
    const fator = Math.pow(10, casas);
    return Math.round((valor + Number.EPSILON) * fator) / fator;
  }
}
