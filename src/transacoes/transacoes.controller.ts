import { Body, Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import { CriarTransacaoDto } from './dto/criar-transacao.dto.js';
import { TransacoesService } from './transacoes.service.js';

@Controller('transacoes')
export class TransacoesController {
  constructor(
    @Inject(TransacoesService) private readonly transacoesService: TransacoesService,
  ) { }

  @Post()
  @HttpCode(201)
  criar(@Body() dto: CriarTransacaoDto) {
    return this.transacoesService.criar(dto);
  }

  @Get()
  listar() {
    return this.transacoesService.listarComMetricas();
  }
}
