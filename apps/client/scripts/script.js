const chatContainer = document.querySelector(".chat-container");
const OnlineUserCont = document.querySelector(".online-user");
const modelBox = document.querySelector(".model-box");
const mbinput = document.querySelector(".model-box input");
const joinbtn = document.querySelector("#join");
const error = document.querySelector(".error");

joinbtn.onclick = () => {
  const username = mbinput.value.replace(/(<([^>]+)>)/gi, "").trim();

  if (username === "") {
    error.style.opacity = "100";

    setTimeout(() => {
      error.style.opacity = "0";
    }, 2000);

    return;
  }

  getData(username);
};

function getData(username) {
  modelBox.style.display = "none";

  OnlineUserCont.style.display = "flex";
  chatContainer.style.display = "flex";

  const onlineUsers = document.querySelector(".online-user ul");
  const onlineUserH4 = document.querySelector(".online-user h4");
  const chtarea = document.querySelector(".chat-area");
  const typinguser = document.querySelector("#typing-user");
  const iptxt = document.querySelector("#msgtxt");
  const sndbtn = document.querySelector("#sendbtn");

  const color = [
    "lime",
    "deeppink",
    "chartreuse",
    "turquoise",
    "greenyellow",
    "fuchsia",
    "cyan",
    "red",
    "crimson",
    "yellow",
    "springgreen",
    "tomato",
  ];

  const TYPING_TIMEOUT = 5000;

  let typingTimeout;
  let isTyping = false;

  const ws = new WebSocket("ws://localhost:5000");

  WebSocket.prototype.emit = function (event, data) {
    this.send(JSON.stringify({ event, data }));
  };

  WebSocket.prototype.listen = function (event, callback) {
    this._SocketListener = this._SocketListener || {};
    this._SocketListener[event] = callback;
  };

  // Remove o usuário do estado de digitação.
  function stopTyping() {
    clearTimeout(typingTimeout);
    typingTimeout = null;

    if (isTyping && ws.readyState === WebSocket.OPEN) {
      ws.emit("RemoveUserTyping", null);
    }

    isTyping = false;
  }

  sndbtn.disabled = true;

  ws.onopen = () => {
    sndbtn.disabled = false;

    const useColor = color[Math.floor(Math.random() * color.length)];

    ws.emit("UserInfo", {
      user: username,
      onlineStatus: "green",
      color: useColor,
    });

    window.onfocus = () => {
      ws.emit("Userstatus", "green");
    };

    window.onblur = () => {
      ws.emit("Userstatus", "yellow");
    };

    window.onbeforeunload = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.emit("userleft", null);
      }
    };
  };

  // Envio de mensagens
  sndbtn.onclick = () => {
    const msg = iptxt.value.replace(/(<([^>]+)>)/gi, "");

    if (msg.trim() !== "" && ws.readyState === WebSocket.OPEN) {
      ws.emit("Message", { msg });
    }

    iptxt.value = "";
    stopTyping();
  };

  // Detecta a digitação e encerra o estado após um período de inatividade.
  iptxt.addEventListener("input", () => {
    if (iptxt.value.trim() === "") {
      stopTyping();
      return;
    }

    if (!isTyping && ws.readyState === WebSocket.OPEN) {
      ws.emit("AddUserTyping", null);
      isTyping = true;
    }

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  });

  ws.onclose = () => {
    sndbtn.disabled = true;
    stopTyping();
  };

  ws.onmessage = (message) => {
    const { event, data } = JSON.parse(message.data);

    if (ws._SocketListener?.[event]) {
      ws._SocketListener[event](data);
    }
  };

  // Lista de usuários online
  ws.listen("UserInfo", (data) => {
    onlineUserH4.innerText = "Usuários online: " + data.length;
    onlineUsers.innerHTML = "";

    data.forEach((userObj) => {
      onlineUsers.innerHTML += `
        <li>
          <span>${userObj.user}</span>
          <span id="${userObj.onlineStatus}">●</span>
        </li>`;
    });
  });

  // Exibe mensagens recebidas e o histórico
  ws.listen("Message", (data) => {
    const messages = Array.isArray(data) ? data : [data];

    messages.forEach((message) => {
      chtarea.innerHTML += `
        <div class="msg-box">
          <span>
            <span id="username" style="color:${message.color}">${message.user}</span>
            ${message.msg}
          </span>
          <span id="time">${getMsgTime(message.time)}</span>
        </div>`;

      chtarea.scrollTop = chtarea.scrollHeight;
    });
  });

  // Exibe um indicador compacto para as outras pessoas que estão digitando.
  ws.listen("Typinguser", (data) => {
    const otherUsers = data
      .map((user) => user.user)
      .filter((user) => user !== username);

    if (otherUsers.length === 0) {
      typinguser.textContent = "";
      return;
    }

    const firstUser = otherUsers[0];

    if (otherUsers.length === 1) {
      typinguser.textContent = `${firstUser} está digitando...`;
      return;
    }

    if (otherUsers.length === 2) {
      typinguser.textContent = `${firstUser} e ${otherUsers[1]} estão digitando...`;
      return;
    }

    const additionalUsers = new Intl.NumberFormat("pt-BR").format(
      otherUsers.length - 1,
    );

    typinguser.textContent = `${firstUser} e mais ${additionalUsers} ${
      otherUsers.length - 1 === 1 ? "pessoa" : "pessoas"
    } estão digitando...`;
  });
}

function getMsgTime(milli) {
  const time = new Date(milli);
  const hr = time.getHours();
  const min = time.getMinutes();
  const sec = time.getSeconds();

  return `${hr}:${min}:${sec}`;
}

function changetheme(e) {
  const themeClass = e.classList.value;
  const themes = ["a1", "a2", "a3", "a4"];
  const images = ["bg-01.png", "bg-02.png", "bg-03.png", "bg-04.png"];

  const index = themes.indexOf(themeClass);

  if (index !== -1) {
    setTheme(images[index]);
  }
}

function setTheme(img) {
  const image = new Image();

  image.onload = () => {
    document.body.style.backgroundImage = `url("./assets/images/${img}")`;
  };

  image.onerror = () => {
    console.error("Não foi possível carregar a imagem:", img);
  };

  image.src = `./assets/images/${img}`;
}
