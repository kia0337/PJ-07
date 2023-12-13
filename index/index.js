function parseFromString(template) {
  var parser = new DOMParser();
  return parser.parseFromString(template, "text/html").body.firstChild;
}
var App = /** @class */ (function () {
  function App(users) {
    var _this = this;
    this.comments = {};
    this.commentID = 0;
    this.filter = "all";
    this.order = "likes";
    this.sortOrder = "ASC";
    this.usedElements = {
      input: document.getElementById("input"),
      counter: document.querySelector(".counter"),
      button: document.querySelector(".button"),
      userName: document.querySelector(".user-name"),
      avatar: document.querySelector(".avatar"),
      form: document.querySelector(".input-container"),
      commentContainer: document.querySelector(".comments-container"),
      favoritesNav: document.querySelector(".favorites"),
      commentsCounter: document.querySelector(".comments-counter"),
      dropdown: document.querySelector(".dropbox"),
      triangle: document.querySelector(".triangle"),
    };
    this.users = users;
    this.currentUser = users[0];
    this.load();
    this.renderAllComments();
    this.createUsersList();
    this.usedElements.input.oninput = this.setInputChangeHandler.bind(this);
    this.usedElements.form.onsubmit = this.handleSubmit.bind(this);
    this.usedElements.favoritesNav.onclick = this.showFavorites.bind(this);
    this.usedElements.commentsCounter.onclick = this.showAll.bind(this);
    this.usedElements.dropdown.onchange = this.setOrder.bind(this);
    this.usedElements.triangle.onclick = function () {
      _this.usedElements.triangle.classList.toggle("up");
      _this.sortOrder = _this.sortOrder === "ASC" ? "DESC" : "ASC";
      _this.renderAllComments();
    };
  }
  App.prototype.createUsersList = function () {
    var _this = this;
    var usersList = document.querySelector(".select-user");
    usersList.innerHTML = "";
    var _loop_1 = function (key, user) {
      var newUser = parseFromString(
        '\n                <div class="user '
          .concat(key, '" data-id="')
          .concat(key, '">\n                    <img src=')
          .concat(user.avatar, ' alt="">\n                    <span>')
          .concat(user.name, "</span>\n                </div>\n            ")
      );
      usersList.append(newUser);
      newUser.onclick = function () {
        _this.setCurrentUser(user);
      };
    };
    for (var _i = 0, _a = Object.entries(this.users); _i < _a.length; _i++) {
      var _b = _a[_i],
        key = _b[0],
        user = _b[1];
      _loop_1(key, user);
    }
  };
  App.prototype.setCurrentUser = function (user) {
    this.currentUser = user;
    this.usedElements.userName.innerHTML = "".concat(this.currentUser.name);
    this.usedElements.avatar.setAttribute(
      "src",
      "".concat(this.currentUser.avatar)
    );
    var subCommentForm = document.querySelector(".subcomment-input");
    if (subCommentForm) {
      subCommentForm.children[0].setAttribute("src", "".concat(user.avatar));
    }
    this.createUsersList();
    this.sendToLocalStorage();
  };
  App.prototype.setInputChangeHandler = function (e) {
    var errorMessage = document.querySelector(".error-message");
    var target = e.currentTarget;
    this.usedElements.counter.innerHTML = "".concat(
      target.value.length,
      "/1000"
    );
    if (target.value.length > 1000) {
      this.usedElements.counter.style.color = "#f4ff";
      errorMessage.style.display = "block";
      this.usedElements.button.setAttribute("disabled", "");
      this.usedElements.button.classList.remove("buttonActive");
    } else if (target.value.length > 0) {
      this.usedElements.counter.style.color = "#A1A1A1";
      errorMessage.style.display = "none";
      this.usedElements.button.removeAttribute("disabled");
      this.usedElements.button.classList.add("buttonActive");
    }
  };
  App.prototype.handleSubmit = function (e) {
    e.preventDefault();
    var newComment = new Commentary({
      author: this.currentUser,
      text: this.usedElements.input.value,
      app: this,
    });
    this.comments[newComment.id] = newComment;
    var newParsedComment = newComment.getNewHTML();
    this.usedElements.commentContainer.append(newParsedComment);
    this.sendToLocalStorage();
    this.usedElements.input.value = "";
    this.usedElements.commentsCounter.innerHTML =
      '<span class="comments-superscript">\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438</span> '.concat(
        !this.commentID ? "(0)" : "(".concat(this.commentID, ")")
      );
    this.usedElements.counter.innerHTML = "Максимум 1000 символов";
    this.usedElements.button.classList.remove("buttonActive");
    this.usedElements.commentContainer.scrollIntoView(false);
  };
  App.prototype.showFavorites = function () {
    this.filter = "favorites";
    this.renderAllComments();
  };
  App.prototype.showAll = function () {
    this.filter = "all";
    this.renderAllComments();
  };
  App.prototype.setOrder = function (e) {
    var target = e.currentTarget;
    this.order = target.value;
    this.renderAllComments();
  };
  App.prototype.sendToLocalStorage = function () {
    var commentsData = [];
    for (var _i = 0, _a = Object.values(this.comments); _i < _a.length; _i++) {
      var comment = _a[_i];
      commentsData.push(comment.getData());
    }
    localStorage.setItem(
      "comment_app",
      JSON.stringify({
        comments: commentsData,
        currentUser: this.currentUser.id,
        commentID: this.commentID,
      })
    );
  };
  App.prototype.load = function () {
    var stringData = localStorage.getItem("comment_app");
    if (!stringData) return;
    var rawData = JSON.parse(stringData);
    for (
      var _i = 0, _a = Object.values(rawData.comments);
      _i < _a.length;
      _i++
    ) {
      var commentData = _a[_i];
      var commentary = new Commentary({
        author: this.users[commentData.author],
        text: commentData.text,
        app: this,
      });
      this.comments[commentary.id] = commentary;
      this.comments[commentData.id].isFavorite = commentData.favorite;
      this.comments[commentData.id].likes = commentData.likes;
      this.comments[commentData.id].timestamp = new Date(commentData.timestamp);
    }
    for (
      var _b = 0, _c = Object.values(rawData.comments);
      _b < _c.length;
      _b++
    ) {
      var commentData = _c[_b];
      if (typeof commentData.parent === "number") {
        this.comments[commentData.id].setParent(
          this.comments[commentData.parent]
        );
      }
    }
    this.currentUser = this.users[rawData.currentUser];
    this.usedElements.commentsCounter.innerHTML =
      '\n                <span class="comments-superscript">\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438</span> ('.concat(
        rawData.comments.length,
        ")\n            "
      );
    for (var _d = 0, _e = Object.values(this.comments); _d < _e.length; _d++) {
      var comment = _e[_d];
      if (comment.parent) {
        comment.parent.children.push(comment);
      }
    }
  };
  App.prototype.sortByDate = function (a, b) {
    var x = this.sortOrder === "ASC" ? b : a;
    var y = this.sortOrder === "ASC" ? a : b;
    // @ts-ignore // Date arithmetics is a valid operation
    return x.timestamp - y.timestamp;
  };
  App.prototype.sortByLikes = function (a, b) {
    var x = this.sortOrder === "ASC" ? b : a;
    var y = this.sortOrder === "ASC" ? a : b;
    return x.likes - y.likes;
  };
  App.prototype.sortByResponses = function (a, b) {
    var x = this.sortOrder === "ASC" ? b : a;
    var y = this.sortOrder === "ASC" ? a : b;
    return x.children.length - y.children.length;
  };
  App.prototype.renderAllComments = function () {
    this.usedElements.commentContainer.innerHTML = "";
    var sorter;
    switch (this.order) {
      case "date":
        sorter = this.sortByDate.bind(this);
        break;
      case "likes":
        sorter = this.sortByLikes.bind(this);
        break;
      case "responses":
        sorter = this.sortByResponses.bind(this);
        break;
    }
    var sorted;
    if (this.order === "none") {
      sorted = Object.values(this.comments);
    } else {
      sorted = Object.values(this.comments).sort(sorter);
      for (var _i = 0, sorted_1 = sorted; _i < sorted_1.length; _i++) {
        var comment = sorted_1[_i];
        if (this.filter === "favorites" && !comment.isFavorite) {
          continue;
        }
        if (!comment.parent) {
          var el = comment.getNewHTML(false);
          this.usedElements.commentContainer.append(el);
        }
      }
      for (var _a = 0, sorted_2 = sorted; _a < sorted_2.length; _a++) {
        var comment = sorted_2[_a];
        if (this.filter === "favorites" && !comment.isFavorite) {
          continue;
        }
        if (comment.parent) {
          var el = comment.getNewHTML(true);
          var newCommentDiv = document.querySelector(
            '.comment[data-id="'.concat(comment.parent.id, '"]')
          );
          var parent_1 = newCommentDiv.closest(".newCommentDiv");
          parent_1.appendChild(el);
        }
      }
    }
  };
  return App;
})();
var User = /** @class */ (function () {
  function User(id, name, avatar) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
  }
  User.prototype.getData = function () {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
    };
  };
  return User;
})();
var Commentary = /** @class */ (function () {
  function Commentary(_a) {
    var author = _a.author,
      text = _a.text,
      app = _a.app,
      parent = _a.parent;
    this.isFavorite = false;
    this.likes = 0;
    this.children = [];
    this.author = author;
    this.text = text;
    this.app = app;
    this.parent = parent;
    this.id = app.commentID++;
    this.timestamp = new Date();
  }
  Commentary.prototype.setParent = function (parent) {
    this.parent = parent;
  };
  Commentary.prototype.setNewTemplate = function (isReply) {
    var _a;
    if (isReply === void 0) {
      isReply = false;
    }
    var date = this.timestamp.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
    var time = this.timestamp.toLocaleString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    var respondee = "";
    if (isReply) {
      respondee =
        '\n                <img src="./img/respond-icon.svg" alt="respond" width="26" height="25">\n                <span class="user-name responded">'.concat(
          (_a = this.parent) === null || _a === void 0
            ? void 0
            : _a.author.name,
          "</span>\n            "
        );
    }
    return '\n                <div class="newCommentDiv">\n                    <div class="comment '
      .concat(isReply ? "active" : "", '" data-id="')
      .concat(this.id, '">\n                        <img src="')
      .concat(
        this.author.avatar,
        '" alt="" width="61" height="61">\n                        <div class="user-comment">\n                        <div class='
      )
      .concat(
        isReply ? "respondee-container" : "",
        '>\n                            <span class="user-name">'
      )
      .concat(this.author.name, "</span>\n                            ")
      .concat(respondee, '\n                            <span class="date">')
      .concat(date, " ")
      .concat(
        time,
        "</span>\n                        </div>\n                        <p>"
      )
      .concat(
        this.text,
        '</p>\n                        <div class="reaction-container">\n                            <span class="respond">\n                            <img src="./img/respond-icon.svg" alt="respond" width="26" height="25">\n                            <span>\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C</span>\n                            </span>\n                            <span class="addToFav">\n                            '
      )
      .concat(
        this.isFavorite
          ? '<img src=\'./img/heart.svg\' alt="" width="30" height="28">'
          : '<img src=\'./img/likeHeart-not-filled.svg\' alt="" width="30" height="28">',
        "\n                            "
      )
      .concat(
        this.isFavorite
          ? "<span>\u0412 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u043C</span>"
          : "<span>\u0412 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435</span>",
        '\n                            </span>\n                            <div class="likes-counter">\n                            <div class="minus" style="cursor: pointer; user-select: none">-</div>\n                            <span class="initial">'
      )
      .concat(
        this.likes,
        '</span>\n                            <div class="plus" style="cursor: pointer; user-select: none">+</div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        '
      );
  };
  Commentary.prototype.getNewHTML = function (isReplyComment) {
    if (isReplyComment === void 0) {
      isReplyComment = false;
    }
    var newStringComment = this.setNewTemplate(isReplyComment);
    this.newComment = parseFromString(newStringComment);
    var replyButton = this.newComment.querySelector(".respond");
    var heart = this.newComment.querySelector(".addToFav");
    var favorites = document.querySelector(".favorites");
    replyButton.onclick = this.handleCommentReply.bind(this);
    heart.onclick = this.handleAddToFavorite.bind(this);
    var minus = this.newComment.querySelector(".minus");
    var plus = this.newComment.querySelector(".plus");
    minus.onclick = this.handleLikeClicks.bind(this);
    plus.onclick = this.handleLikeClicks.bind(this);
    return this.newComment;
  };
  Commentary.prototype.handleCommentReply = function () {
    var _this = this;
    var _a, _b, _c, _d;
    (_a = document.querySelector(".subcomment-input")) === null || _a === void 0
      ? void 0
      : _a.remove();
    var replyInput = parseFromString(
      '\n            <form class="input-container subcomment-input">\n                <img class="avatar" src='.concat(
        this.app.currentUser.avatar,
        ' width="30" height="30" alt=""/>\n                <input placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F..." id="input" name="replyInput">\n            </form>\n        '
      )
    );
    (_b = this.newComment) === null || _b === void 0
      ? void 0
      : _b.appendChild(replyInput);
    (_c = this.newComment) === null || _c === void 0
      ? void 0
      : _c.scrollIntoView(false);
    var input = replyInput.elements.namedItem("replyInput");
    replyInput.onsubmit = function () {
      var newReplyComment = new Commentary({
        author: _this.app.currentUser,
        text: input.value,
        app: _this.app,
        parent: _this,
      });
      _this.children.push(newReplyComment);
      _this.app.comments[newReplyComment.id] = newReplyComment;
      replyInput.replaceWith(newReplyComment.getNewHTML(true));
      _this.app.sendToLocalStorage();
    };
    (_d = this.newComment) === null || _d === void 0
      ? void 0
      : _d.scrollIntoView(false);
    return replyInput;
  };
  Commentary.prototype.handleAddToFavorite = function () {
    var favText = this.newComment.querySelector(".addToFav span");
    var heartImg = this.newComment.querySelector(".addToFav img");
    this.isFavorite = !this.isFavorite;
    this.isFavorite
      ? (favText.innerHTML = "В избранном")
      : (favText.innerHTML = "В избранное");
    this.isFavorite
      ? (heartImg.src = "./img/heart.svg")
      : (heartImg.src = "./img/likeHeart-not-filled.svg");
    this.app.sendToLocalStorage();
  };
  Commentary.prototype.handleLikeClicks = function (e) {
    var target = e.currentTarget;
    var likesCounter = this.newComment.querySelector(".initial");
    if (target.classList.contains("minus")) {
      likesCounter.innerHTML = String(Number(likesCounter.innerHTML) - 1);
    } else {
      likesCounter.innerHTML = String(Number(likesCounter.innerHTML) + 1);
    }
    this.likes = Number(likesCounter.innerHTML);
    this.app.sendToLocalStorage();
  };
  Commentary.prototype.getData = function () {
    return {
      id: this.id,
      author: this.author.id,
      timestamp: this.timestamp.toString(),
      text: this.text,
      parent: this.parent ? this.parent.id : null,
      children: this.getChildrenIds(),
      favorite: this.isFavorite,
      likes: this.likes,
    };
  };
  Commentary.prototype.getChildrenIds = function () {
    return this.children.map(function (child) {
      return child.id;
    });
  };
  return Commentary;
})();
