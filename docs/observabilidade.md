# Observabilidade

## Better Stack Logs

O backend envia logs estruturados para o Better Stack quando a variavel
`BETTER_STACK_SOURCE_TOKEN` estiver definida. Os logs continuam disponiveis
localmente via Docker Compose.

1. Crie uma fonte em **Better Stack > Logs > Sources** para JavaScript/Pino.
2. Copie o source token gerado.
3. Na VPS, abra `/opt/casa/deploy/.env` e adicione:

   ```env
   BETTER_STACK_SOURCE_TOKEN=seu_token
   ```

4. Reinicie pelo proximo deploy ou execute:

   ```bash
   cd /opt/casa
   docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
   ```

No Better Stack, filtre por `level`, `req.method`, `req.url`, `res.statusCode`
e `err.message`. Nunca use o header `Authorization` como campo de busca ou
compartilhe exportacoes de log que contenham credenciais.
