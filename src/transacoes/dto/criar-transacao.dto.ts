import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TIPOS_TRANSACAO } from '../schemas/transacao.schema.js';
import type { TipoTransacao } from '../schemas/transacao.schema.js';

export class CriarTransacaoDto {
  @IsString({ message: 'descricao deve ser um texto' })
  @IsNotEmpty({ message: 'descricao é obrigatória' })
  descricao!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor deve ser numérico (até 2 casas decimais)' })
  @IsPositive({ message: 'valor deve ser maior que zero' })
  valor!: number;

  @IsIn(TIPOS_TRANSACAO, { message: 'tipo deve ser "receita" ou "despesa"' })
  tipo!: TipoTransacao;

  @IsString({ message: 'categoria deve ser um texto' })
  @IsNotEmpty({ message: 'categoria é obrigatória' })
  categoria!: string;

  @IsOptional()
  @IsBoolean({ message: 'consumoConsciente deve ser true ou false' })
  consumoConsciente?: boolean;
}
