const WebSocket = require("ws");
const path = require("path");
const express = require("express");
const app = express();

// Configurando os arquivos estáticos no servidor
app.use("/", express.static(path.join(__dirname, "../client")));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log("Express está ouvindo na porta: " + PORT),
);

// Criando o servidor WebSocket
const wss = new WebSocket.Server({ server }, () => {
  console.log("WebSocket está em execução.......");
});

const allclients = [];
const messages = [];
const typingusers = [];

function getTime() {
  return Date.now();
}

function AddMessage(msg, userName, userTime, userColor) {
  if (messages.length >= 20) {
    messages.shift();
  }

  messages.push({
    message: msg,
    user: userName,
    time: userTime,
    color: userColor,
  });
}

// Enviando as informações dos usuários para todos os clientes
function updateAllUsers() {
  allclients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client._userdetails) {
      client.send(
        JSON.stringify({
          event: "UserInfo",
          data: allclients
            .filter((user) => user._userdetails)
            .map((user) => ({
              user: user._userdetails.user,
              onlineStatus: user._userdetails.onlineStatus,
              color: user._userdetails.color,
            })),
        }),
      );
    }
  });
}

function broadCastNewMessage(user, msg, msgtime, clr) {
  allclients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: "Message",
          data: { user, msg, time: msgtime, color: clr },
        }),
      );
    }
  });
}

// Enviando a lista atualizada de usuários que estão digitando
function broadCastTypingUser() {
  const activeTypingUsers = typingusers
    .filter((user) => user.readyState === WebSocket.OPEN && user._userdetails)
    .map((user) => ({
      user: user._userdetails.user,
    }));

  allclients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: "Typinguser",
          data: activeTypingUsers,
        }),
      );
    }
  });
}

// Remove um usuário da lista de pessoas digitando
function removeTypingUser(ws) {
  const index = typingusers.indexOf(ws);

  if (index !== -1) {
    typingusers.splice(index, 1);
    return true;
  }

  return false;
}

// Trata a saída do usuário, evitando processá-la duas vezes
function removeClient(ws) {
  const index = allclients.indexOf(ws);

  if (index === -1) {
    return;
  }

  const userDetails = ws._userdetails;

  allclients.splice(index, 1);

  const wasTyping = removeTypingUser(ws);

  if (userDetails) {
    const leftTime = getTime();
    const leftUserDetail = `-------- Usuário ${userDetails.user} saiu ---------`;

    AddMessage(leftUserDetail, "xxxx", leftTime, userDetails.color);

    broadCastNewMessage("xxxx", leftUserDetail, leftTime, userDetails.color);
  }

  updateAllUsers();

  if (wasTyping) {
    broadCastTypingUser();
  } else {
    // Também atualiza o indicador após uma desconexão.
    broadCastTypingUser();
  }
}

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  ws.on("message", (objdata) => {
    let eventData;

    try {
      eventData = JSON.parse(objdata.toString());
    } catch {
      return;
    }

    const { event, data } = eventData;

    switch (event) {
      case "UserInfo": {
        if (ws._userdetails) {
          break;
        }

        const joinedTime = getTime();

        // Adicionando os dados ao objeto personalizado do WebSocket
        ws._userdetails = data;
        allclients.push(ws);

        updateAllUsers();

        // Enviando as mensagens atuais para o novo cliente
        if (messages.length !== 0) {
          ws.send(
            JSON.stringify({
              event: "Message",
              data: messages.map((msgobj) => ({
                msg: msgobj.message,
                user: msgobj.user,
                time: msgobj.time,
                color: msgobj.color,
              })),
            }),
          );
        }

        const joinedUser = `------ Usuário ${ws._userdetails.user} entrou ----------`;

        AddMessage(joinedUser, ">>>>", joinedTime, ws._userdetails.color);

        broadCastNewMessage(
          ">>>>",
          joinedUser,
          joinedTime,
          ws._userdetails.color,
        );

        break;
      }

      case "Userstatus": {
        if (!ws._userdetails) {
          break;
        }

        ws._userdetails.onlineStatus = data;
        updateAllUsers();

        break;
      }

      case "Message": {
        if (!ws._userdetails) {
          break;
        }

        const time = getTime();

        // Encerra o estado de digitação ao enviar uma mensagem.
        removeTypingUser(ws);
        broadCastTypingUser();

        AddMessage(data.msg, ws._userdetails.user, time, ws._userdetails.color);

        broadCastNewMessage(
          ws._userdetails.user,
          data.msg,
          time,
          ws._userdetails.color,
        );

        break;
      }

      case "AddUserTyping": {
        if (!ws._userdetails) {
          break;
        }

        if (!typingusers.includes(ws)) {
          typingusers.push(ws);
          broadCastTypingUser();
        }

        break;
      }

      case "RemoveUserTyping": {
        if (removeTypingUser(ws)) {
          broadCastTypingUser();
        }

        break;
      }

      case "userleft": {
        removeClient(ws);
        break;
      }
    }
  });

  // Limpa o estado de digitação e registra a saída por desconexão.
  ws.on("close", () => {
    removeClient(ws);
  });

  ws.on("error", (error) => {
    console.error("Erro na conexão WebSocket:", error.message);
    removeClient(ws);
  });
});
