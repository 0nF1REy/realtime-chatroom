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
  const time = Date.now();
  return time;
}

function AddMessage(msg, userName, userTime, userColor) {
  // Se o número de mensagens for maior que 20, remove uma do início
  if (messages.length == 20) {
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
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: "UserInfo",
          data: allclients.map((user) => ({
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

function broadCastTypingUser() {
  allclients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: "Typinguser",
          data: typingusers.map((userob) => ({
            user: userob._userdetails.user,
          })),
        }),
      );
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  ws.on("message", (objdata) => {
    const { event, data } = JSON.parse(objdata.toString());

    // Verificando cada evento individualmente
    switch (event) {
      case "UserInfo": {
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
        ws._userdetails.onlineStatus = data;
        updateAllUsers();
        break;
      }

      case "Message": {
        const time = getTime();

        AddMessage(data.msg, ws._userdetails.user, time, ws._userdetails.color);

        broadCastNewMessage(
          ws._userdetails.user,
          data.msg,
          time,
          ws._userdetails.color,
        );

        break;
      }

      // Adicionando o usuário atual à lista de usuários digitando, caso ele ainda não exista
      case "AddUserTyping": {
        const user = typingusers.findIndex((user) => user === ws);

        if (user === -1) {
          typingusers.push(ws);
        }

        broadCastTypingUser();
        break;
      }

      case "RemoveUserTyping": {
        const user = typingusers.findIndex((user) => user === ws);

        if (user !== -1) {
          typingusers.splice(user, 1);
        }

        broadCastTypingUser();
        break;
      }

      // Transmitindo uma mensagem quando o usuário sai da sala de chat
      case "userleft": {
        const lefttime = getTime();

        const leftUserDetail = `-------- Usuário ${ws._userdetails.user} saiu ---------`;

        AddMessage(leftUserDetail, "xxxx", lefttime, ws._userdetails.color);

        // Removendo o usuário da lista de clientes conectados
        const user = allclients.findIndex((user) => user === ws);

        if (user !== -1) {
          broadCastNewMessage(
            "xxxx",
            leftUserDetail,
            lefttime,
            ws._userdetails.color,
          );

          allclients.splice(user, 1);

          updateAllUsers();
        }

        break;
      }
    }
  });
});
