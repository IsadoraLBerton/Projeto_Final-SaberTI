# SCP - Sistema de Controle de Produtos e Orçamentos

## Descrição

Projeto desenvolvido para simular um sistema comercial de controle de produtos e orçamentos, contemplando autenticação de usuários, gerenciamento de clientes, categorias e produtos, além da geração de orçamentos com cálculo automático de valores.

O sistema foi construído com foco na aplicação prática de conceitos de desenvolvimento web, lógica de programação, manipulação de dados, validações de formulários e operações CRUD.

## Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript
* Supabase
* Supabase JavaScript Client via CDN
* SessionStorage
* Font Awesome

## Funcionalidades

### Login

* Autenticação de usuário.
* Validação de credenciais.
* Recuperação/redefinição de senha.
* Armazenamento temporário do nome do usuário logado com SessionStorage.
* Redirecionamento para o menu principal.

### Clientes

* Cadastro de clientes.
* Edição de registros.
* Exclusão de registros.
* Validação de campos obrigatórios.

### Categorias

* Cadastro de categorias de produtos.
* Edição de registros.
* Exclusão de registros.
* Validação de descrição obrigatória.

### Produtos

* Cadastro de produtos vinculados às categorias.
* Controle de status (Ativo/Inativo).
* Edição e exclusão de registros.
* Validação dos campos obrigatórios.

### Orçamentos

* Seleção de clientes.
* Inclusão de produtos.
* Controle de quantidade e valor unitário.
* Cálculo automático dos itens.
* Cálculo automático do valor total do orçamento.
* Validação para impedir o salvamento de orçamentos sem itens.
* Listagem, visualização, impressão e exclusão de orçamentos.

## Regras de Negócio

### Clientes

* Não permite cadastro sem Nome e CPF/CNPJ.

### Categorias

* Não permite cadastro sem descrição.

### Produtos

* Não permite cadastro sem categoria, descrição, valor de venda ou status.

### Orçamentos

* Não permite criar orçamento sem cliente.
* Não permite adicionar itens sem produto selecionado.
* Não permite adicionar itens com quantidade inválida.
* Não permite salvar orçamento sem itens cadastrados.

### Cálculos

Valor Total do Item = Quantidade x Valor Unitário

Valor Total do Orçamento = Soma dos valores totais dos itens cadastrados

## Estrutura do Projeto

```text
SCP_final
|-- CSS
|   `-- styles.css
|-- HTML
|   |-- login.html
|   |-- esqueci-senha.html
|   |-- menu.html
|   |-- clientes.html
|   |-- categorias.html
|   |-- produtos.html
|   |-- orcamentos.html
|   |-- lista-orcamentos.html
|   `-- usuarios.html
`-- JS
    |-- login.js
    |-- esqueci-senha.js
    |-- menu.js
    |-- cadastro-clientes.js
    |-- cadastro-categorias.js
    |-- cadastro-produtos.js
    |-- cadastro-usuarios.js
    |-- movimentacao-orcamentos.js
    `-- lista-orcamentos.js
```

## Objetivos de Aprendizagem

Durante o desenvolvimento deste projeto foram aplicados conceitos relacionados a:

* Estruturas de dados.
* Manipulação do DOM.
* Eventos JavaScript.
* Validação de formulários.
* Operações CRUD.
* Persistência de dados com Supabase.
* Uso de armazenamento de sessão no navegador.
* Organização de código.
* Desenvolvimento de interfaces web.

## Como Executar

1. Faça o download ou clone o repositório.
2. Abra o arquivo `HTML/login.html` no navegador.
3. Realize o acesso ao sistema.
4. Navegue entre as funcionalidades utilizando o menu principal.

## Autora

Isadora L. Berton.