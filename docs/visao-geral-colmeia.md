# Colmeia - Visao Geral do Produto

## O que e o Colmeia

Colmeia e um app para organizar uma casa compartilhada. Ele conecta estoque, listas de compras, tarefas e historico para que todos saibam o que existe em casa, o que esta faltando, o que esta vencendo e quem fez cada movimentacao.

Ele serve tanto para familias e casais quanto para pessoas que moram sozinhas e querem centralizar a rotina da casa.

## Como a navegação funciona

O app parte da Home e usa um menu principal para acessar as areas:

- Home
- Estoque
- Lista de compras
- Tarefas da casa
- Casa
- Perfil

A pessoa pode participar de mais de uma casa e trocar a casa ativa diretamente na Home. Todas as telas passam a mostrar os dados da casa selecionada.

## 1. Home

A Home e o painel rapido da casa ativa.

### O que mostra

- Casa selecionada e possibilidade de trocar de casa.
- Quantidade de itens no estoque.
- Quantidade de listas pendentes.
- Atalho para adicionar um item ao estoque.
- Atalho para criar uma lista de compras.
- Listas marcadas como urgentes.
- Produtos proximos do vencimento.
- Sino de atividades recentes do estoque.
- Botao de ajuda com explicacao do funcionamento do Colmeia.

### O que resolve

Em poucos segundos, a pessoa entende se falta algo, se existe uma compra urgente ou se algum produto precisa ser usado antes de vencer.

## 2. Estoque

Estoque representa tudo que a casa possui, nao apenas alimentos. Cada casa pode ter compartimentos como Geladeira, Freezer, Despensa, Limpeza, Banheiro e Lavanderia.

### Visao de estoques

- Exibe os compartimentos visiveis da casa.
- Cada compartimento mostra seus itens e suas categorias.
- A pessoa pode criar compartimentos adicionais conforme a realidade da casa.
- Estoques que nao sao usados podem ser ocultados sem apagar itens ou categorias.

### Dentro de um estoque

- Lista itens agrupados por categoria.
- Filtra por todas as categorias ou por uma categoria especifica.
- Mostra nome, quantidade, unidade, validade e responsavel pelo cadastro quando aplicavel.
- Permite adicionar um novo item.
- Permite abrir o detalhe de qualquer item.
- Permite indicar rapidamente que um item acabou.

### Adicionar item ao estoque

Ao cadastrar um item, a pessoa informa:

- Nome.
- Quantidade e unidade: unidade, kg, g, L ou ml.
- Estoque onde o item sera guardado.
- Categoria compativel com aquele estoque.
- Data de validade, quando fizer sentido.

As categorias mudam conforme o estoque selecionado. Por exemplo, uma categoria de Banheiro nao aparece ao adicionar algo na Geladeira.

### Detalhe do item

- Edita nome, quantidade, unidade, categoria e validade.
- Registra alteracoes no historico do estoque.
- Permite remover somente do estoque.
- Permite remover e mandar para uma lista de compras.

Quando alguem informa que o item acabou, o app confirma a acao antes de excluir. A pessoa pode simplesmente remover ou remover e mandar para uma lista especifica.

### Validade

- Itens com validade proxima aparecem na Home.
- O sistema possui notificacoes progressivas: itens distantes da validade nao incomodam; avisos aumentam conforme a data se aproxima.
- A intencao e evitar repeticao excessiva da mesma notificacao.

## 3. Lista de compras

As listas sao compartilhadas entre os membros da casa e podem representar uma compra geral, uma ida ao mercado, farmácia ou qualquer necessidade especifica.

### Visao geral de listas

- Mostra todas as listas da casa ativa.
- Cada card mostra nome, data de criacao, local, categoria, quantidade de itens e situacao de urgencia.
- Permite editar ou excluir uma lista diretamente pelo card.
- Possui sino proprio para atividades de lista.
- Possui ajuda contextual para explicar o fluxo de compra.

### Criar ou editar uma lista

- Nome da lista.
- Local de compra opcional, como supermercado ou farmacia.
- Categoria/objetivo opcional.
- Marcacao de lista urgente.

Uma lista urgente fica destacada na Home e na visão geral das listas. A urgência pode ser criada ou alterada na edição; ela não é um botão de ação solto.

### Dentro de uma lista

- Itens agrupados por categoria.
- Progresso de itens comprados.
- Marcacao de item comprado com um toque.
- Itens comprados ficam separados dos itens pendentes.
- Adicao rapida por campo na parte inferior.
- Adicao detalhada com quantidade, unidade, estoque de destino e categoria opcional.
- Compartilhamento da lista como texto.
- Edicao da lista e da urgencia.

### Guardar compras no estoque

Depois de marcar algo como comprado, e possivel enviar o item para um estoque.

Nesse momento a pessoa escolhe o destino, como Geladeira, Despensa, Limpeza ou Banheiro, e completa categoria, quantidade e validade. Isso evita assumir que todo item comprado vai para a geladeira ou usa a mesma unidade.

## 4. Casa

Esta e a area administrativa da casa compartilhada.

### Membros

- Lista todos os moradores da casa.
- Mostra papel de administrador ou membro.
- Permite visualizar detalhes de cada membro.
- Administradores podem promover ou remover membros.
- Uma pessoa pode sair da casa; administradores podem excluir a casa.

### Convites

- Gera codigo de convite para entrar na casa.
- Permite copiar ou compartilhar o convite.
- Tambem existe fluxo para entrar usando um codigo recebido.

### Estoques e categorias

- Renomear estoques.
- Ocultar ou reexibir estoques.
- Criar novos compartimentos.
- Criar e excluir categorias por estoque.

Essa configuracao deixa a casa pronta desde o inicio, sem obrigar todo mundo a usar a mesma organizacao.

### Configuracao inicial

Ao criar uma casa, o onboarding ajuda a:

- Escolher os estoques que a casa usa.
- Convidar quem mora junto.
- Adicionar os primeiros itens.
- Criar a primeira lista de compras.

## 5. Tarefas da casa

Hoje esta area funciona como um checklist para rotinas domesticas.

### O que ja existe

- Criar tarefa com titulo.
- Definir categoria: Limpeza, Banheiro, Lavanderia, Manutencao ou Compras.
- Definir prazo: sem data, hoje, amanha ou sete dias.
- Filtrar por pendentes, atrasadas, concluidas ou todas.
- Filtrar por categoria.
- Marcar tarefa como concluida.
- Mostrar quem concluiu a tarefa.
- Excluir tarefa.
- Resumo de pendentes, atrasadas e feitas.

### O que ainda nao existe

- Recorrencia, por exemplo "lavar toalhas toda semana".
- Pessoa responsavel.
- Notificacao de tarefa ou atraso.
- Historico de criacao e conclusao no sino.
- Modelos de rotina prontos.

Essa e a proxima grande area de evolucao do produto.

## 6. Atividades e notificacoes

O Colmeia registra o que acontece para gerar confianca entre os moradores.

### Historico de estoque

Registra:

- Item adicionado.
- Item editado.
- Item removido.
- Item removido e mandado para uma lista.
- Item enviado da lista para um estoque.
- Usuario responsavel, item, estoque e horario.

O sino da Home mostra as novidades do estoque. Eventos novos aparecem com contador e marcador visual; ao abrir, deixam de ser novos. O evento feito pela propria pessoa nao vira uma notificacao para ela.

### Historico de listas

Registra:

- Lista criada.
- Lista excluida.
- Item adicionado.
- Item removido.
- Item comprado ou desmarcado.
- Item enviado para o estoque.
- Usuario responsavel, lista e horario.

Cada lista possui sua propria area de atividade, tambem com indicador de novidades para os demais membros.

### Atualizacao em tempo real

Quando alguem altera estoque ou lista em outro celular, o app recebe uma atualizacao pela casa e atualiza os dados abertos. Ha tambem atualizacao periodica como apoio para manter os dados consistentes.

### Push notifications

O app possui notificacoes para:

- Item adicionado a uma lista de compras, para os outros membros da casa.
- Avisos de vencimento com frequencia progressiva.
- Movimentacoes importantes entre estoque e lista, conforme o fluxo definido.

O dispositivo de quem realizou a acao e excluido das notificacoes daquela mesma acao.

## 7. Perfil e seguranca

- Alterar nome.
- Alterar senha.
- Sair da conta.
- Excluir conta.
- Sessao protegida com tokens armazenados de forma segura no aparelho.

## Fluxo principal da casa

1. Uma pessoa cria ou entra em uma casa.
2. Configura os estoques que fazem sentido para aquele lar.
3. Adiciona o que ja possui em casa.
4. Quando algo acaba, remove do estoque e manda para uma lista.
5. Outra pessoa ve a lista atualizada e recebe notificacao quando aplicavel.
6. No mercado, marca os itens comprados.
7. Ao chegar em casa, manda cada compra para o estoque correto.
8. O historico deixa claro quem fez cada acao.

## Direcao de produto

O Colmeia ja resolve tres necessidades conectadas: saber o que tem, saber o que comprar e coordenar quem mora junto. A evolucao mais natural agora e fazer as Tarefas fecharem esse ciclo com rotinas, responsaveis, recorrencia e lembretes.
