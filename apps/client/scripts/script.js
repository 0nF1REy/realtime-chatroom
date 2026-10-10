const chatContainer = document.querySelector(".chat-container");
const OnlineUserCont = document.querySelector(".online-user");
const modelBox = document.querySelector(".model-box");
const mbinput = document.querySelector(".model-box input");
const joinbtn = document.querySelector("#join");
const error = document.querySelector(".error");

joinbtn.onclick = () => {
  const username = mbinput.value.replace(/(<([^>]+)>)/gi, "");

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

  const ws = new WebSocket("ws://localhost:5000");

  WebSocket.prototype.emit = function (event, data) {
    this.send(JSON.stringify({ event, data }));
  };

  WebSocket.prototype.listen = function (event, callback) {
    this._SocketListener = this._SocketListener || {};
    this._SocketListener[event] = callback;
  };

  sndbtn.disabled = true;

  ws.onopen = () => {
    sndbtn.disabled = false;

    const useColor = color[Math.floor(Math.random() * 12)];

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
      ws.emit("userleft", null);
    };
  };

  sndbtn.onclick = (e) => {
    let msg = iptxt.value.replace(/(<([^>]+)>)/gi, "");

    if (msg !== "") {
      ws.emit("Message", { msg });
    }

    iptxt.value = "";
    ws.emit("RemoveUserTyping", null);
  };

  iptxt.onkeyup = () => {
    if (iptxt.value !== "") {
      ws.emit("AddUserTyping", null);
    } else {
      ws.emit("RemoveUserTyping", null);
    }
  };

  ws.onmessage = (message) => {
    const { event, data } = JSON.parse(message.data);

    ws._SocketListener[event](data);
  };

  ws.listen("UserInfo", function (data) {
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

  ws.listen("Message", function (data) {
    console.log(data);

    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        chtarea.innerHTML += `
          <div class="msg-box">
            <span>
              <span id="username" style="color:${data[i].color}">${data[i].user}</span>
              ${data[i].msg}
            </span>
            <span id="time">${getMsgTime(data[i].time)}</span>
          </div>`;

        chtarea.scrollTop = chtarea.scrollHeight;
      }
    } else {
      chtarea.innerHTML += `
        <div class="msg-box">
          <span>
            <span id="username" style="color:${data.color}">${data.user}</span>
            ${data.msg}
          </span>
          <span id="time">${getMsgTime(data.time)}</span>
        </div>`;

      chtarea.scrollTop = chtarea.scrollHeight;
    }
  });

  ws.listen("Typinguser", function (data) {
    if (data.length > 0 && data[data.length - 1].user !== username) {
      typinguser.innerHTML = data[data.length - 1].user + " está digitando...";
    } else if (data.length > 1 && data[data.length - 1].user === username) {
      typinguser.innerHTML = data[data.length - 2].user + " está digitando...";
    } else {
      typinguser.innerHTML = "";
    }
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
