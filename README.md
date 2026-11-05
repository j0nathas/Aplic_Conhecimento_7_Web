# Controle Financeiro Pessoal — API

API RESTful (NestJS + MongoDB/Mongoose) que serve de motor para um aplicativo de **controle financeiro pessoal**.
Projeto do **componente extensionista**, com foco em letramento financeiro comunitário e alinhado aos
**ODS 1** (Erradicação da Pobreza) e **ODS 12** (Consumo e Produção Responsáveis).

Cada transação traz o marcador `consumoConsciente`, que convida a pessoa a refletir se a despesa foi essencial
(`true`) ou um gasto por impulso (`false`). O back-end consolida isso em métricas, mostrando o peso dos gastos
não essenciais no orçamento.

## Como rodar

```bash
npm install
cp .env.example .env     # preencha MONGODB_URI com a connection string do MongoDB Atlas
npm run start:dev        # http://localhost:4000
npm test                 # testes unitários e e2e (não precisam de banco)
```

> Se o `npm install` falhar com `Cannot read properties of null (reading 'edgesOut')`, use `npm install --legacy-peer-deps`.

## Schema `Transacao`

| Campo               | Tipo    | Regra                                   |
|---------------------|---------|-----------------------------------------|
| `descricao`         | String  | obrigatório (ex.: "Conta de Luz")       |
| `valor`             | Number  | obrigatório, maior que zero             |
| `tipo`              | String  | apenas `"receita"` ou `"despesa"`       |
| `categoria`         | String  | obrigatório (ex.: "Moradia", "Lazer")   |
| `consumoConsciente` | Boolean | opcional na API, padrão `true`          |

## Endpoints

### `POST /transacoes` → 201
```bash
curl -X POST http://localhost:4000/transacoes -H "Content-Type: application/json" -d '{
  "descricao": "Delivery de pizza",
  "valor": 69.9,
  "tipo": "despesa",
  "categoria": "Alimentação",
  "consumoConsciente": false
}'
```
Dados inválidos (tipo fora de `receita`/`despesa`, valor ≤ 0, campos ausentes) retornam **400** com as mensagens de validação.

### `GET /transacoes` → 200
```json
{
  "historico": [ { "descricao": "Delivery de pizza", "valor": 69.9, "tipo": "despesa", "...": "..." } ],
  "metricas": {
    "saldoTotal": 1700,
    "totalDespesas": 1300,
    "totalGastoImpulso": 300
  }
}
```
- `saldoTotal`: soma das receitas − soma das despesas
- `totalDespesas`: soma de todas as transações com `tipo = "despesa"`
- `totalGastoImpulso`: soma das despesas com `consumoConsciente = false`

As métricas são calculadas no Service (`TransacoesService.calcularMetricas`).
