# Aplicativo de sala de bate-papo em tempo real usando Node.js e WebSocket

O repositório fornecido contém o código-fonte de um aplicativo web de sala de bate-papo. Para o desenvolvimento do front-end, utilizo HTML e CSS, sem Bootstrap ou qualquer outro framework CSS. Para o back-end, utilizo Node.js e Express, juntamente com WebSocket.

## Como iniciar a aplicação

### Pré-requisitos

Antes de iniciar a aplicação, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/), para executar o servidor.
- npm, gerenciador de pacotes incluído na instalação do Node.js.
- Um navegador web atualizado.

### 1. Instalar as dependências

No terminal, acesse o diretório do servidor:

```bash
cd apps/server
```

Instale as dependências necessárias:

```bash
npm install
```

### 2. Iniciar o servidor

Ainda no diretório `apps/server`, execute:

```bash
npm start
```

Por padrão, o servidor será iniciado na porta `5000`, disponibilizando a interface web e a comunicação em tempo real via WebSocket.

### 3. Acessar a aplicação

Com o servidor em execução, abra o navegador e acesse:

```text
http://localhost:5000
```

A página inicial da sala de bate-papo será exibida. Informe um nome de usuário e clique em **Entrar!** para acessar o chat.

### 4. Testar as funcionalidades da aplicação

Para verificar se tudo está funcionando corretamente:

1. Abra a aplicação em duas ou mais abas do navegador ou em diferentes navegadores no mesmo computador.
2. Entre na sala utilizando nomes de usuário diferentes.
3. Observe a lista de usuários online e os indicadores de status.
4. Envie mensagens e verifique se elas aparecem nas demais sessões conectadas.
5. Digite uma mensagem em uma sessão e verifique o indicador de digitação nas outras.
6. Teste os seletores de tema, clicando em cada opção e verificando se o plano de fundo é alterado corretamente.
7. Feche uma das abas e observe a notificação de saída e a atualização da lista de usuários.

### 5. Encerrar o servidor

Para interromper a execução da aplicação, volte ao terminal em que o servidor está sendo executado e pressione:

```text
Ctrl + C
```

**Observação:** o servidor utiliza a porta `5000` por padrão. Caso essa porta esteja ocupada, defina outra porta por meio da variável de ambiente `PORT`. Para que o chat funcione corretamente, o servidor deve permanecer em execução enquanto os clientes estiverem conectados.
