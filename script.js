/* =========================================
   Битва Старр | Новости
   Здесь хранятся ВСЕ посты сайта.

   Как добавить новый пост:
   1. Скопируйте любой объект из массива POSTS.
   2. Измените id, title, description, content, image, tags.
   3. Дополнительные картинки можно разместить прямо в content:
      [[img:png/example-2.png|Подпись под картинкой]]
   4. Для карточки можно оставить image: null.

   Поддерживаемая разметка content:
   *курсив*
   **жирный**
   #текст#                -> копируемый моно-фрагмент
   "цитата"              -> цитата
   %(a/b) (c/d)%          -> таблица
   [[img:path|alt]]       -> картинка внутри полного поста
   ========================================= */

const POSTS = [
  {
    id: 1,
    title: "Большое обновление уже близко",
    description: "Краткий обзор главных изменений и новой информации, которая появится в следующем обновлении.",
    image: "png/example-1.png",
    content: "Команда готовит *крупное обновление* с новыми механиками. **Главная особенность** — изменения затронут прогресс и награды.\n\nДля быстрого копирования используйте #UPDATE_23#.\n\n\"Мы хотим сделать обновление заметным, но понятным для каждого игрока.\"\n\n[[img:png/example-3.png|Первый дополнительный скриншот обновления]]\n\n[[img:png/example-4.png|Второй дополнительный скриншот обновления]]\n\nНа изображениях показаны дополнительные варианты интерфейса. Здесь можно размещать дополнительные фотографии прямо между абзацами.",
    tags: ["#новости", "#обновление", "#битва"]
  },
  {
    id: 2,
    title: "Новые награды за прогресс",
    description: "Разбираем новую систему наград и показываем, как будет меняться ценность призов по мере прогресса.",
    image: "png/example-2.png",
    content: "В новой системе наград появятся несколько ступеней. *Чем выше прогресс, тем ценнее награда*.\n\n%(Уровень/Награда) (1/Монеты) (2/Очки силы) (3/Блинги) (4/Скин)%\n\n**Пример:** максимальная награда открывается только после большого количества очков.\n\n[[img:png/example-4.png|Пример экрана наград]]",
    tags: ["#награды", "#прогресс", "#новости"]
  },
  {
    id: 3,
    title: "Как работает поиск на сайте",
    description: "Небольшое руководство по поиску публикаций, хештегам и копированию отдельных фрагментов текста.",
    image: null,
    content: "Поиск учитывает **заголовок**, текст публикации и все хештеги.\n\nНапример, запрос #новости# найдёт публикации с этим тегом, а запрос *обновление* — все подходящие тексты.\n\n\"Нажатие на хештег автоматически подставляет его в поле поиска.\"\n\nДля демонстрации копирования нажмите на #COPY_ME#.",
    tags: ["#поиск", "#функции", "#сайт"]
  },
  {
    id: 4,
    title: "Статистика fighters",
    description: "Пример публикации с таблицей характеристик и форматированием данных по уровням.",
    image: "png/example-3.png",
    content: "Ниже пример таблицы со статистикой. **Первая пара** задаёт заголовок таблицы, остальные пары становятся строками.\n\n%(Уровень/Здоровье) (1/5500) (2/6050) (3/6600) (4/7150)%\n\n*Такая таблица автоматически получает оформление сайта* и прокрутку на маленьких экранах.",
    tags: ["#таблица", "#статистика", "#обновление"]
  },
  {
    id: 5,
    title: "Изображения внутри публикации",
    description: "Показываем, как размещать несколько изображений прямо внутри одной полноценной публикации.",
    image: "png/example-4.png",
    content: "Изображение можно разместить не только сверху карточки. Полный пост поддерживает **внутренние изображения** между абзацами.\n\n[[img:png/example-1.png|Первое внутреннее изображение]]\n\nПосле картинки текст продолжается как обычно.\n\n[[img:png/example-5.png|Второе внутреннее изображение]]\n\nТаким способом удобно делать полноценные новостные статьи с несколькими скриншотами.",
    tags: ["#картинки", "#статья", "#новости"]
  },
  {
    id: 6,
    title: "Форматирование текста",
    description: "Пример комбинирования жирного, курсива, цитат и копируемых фрагментов в одной новости.",
    image: "png/example-5.png",
    content: "В одном посте можно использовать **жирный**, *курсив*, \"цитаты\" и #моно-фрагменты# одновременно.\n\n\"А внутри цитаты тоже работает **жирный** и *курсив*.\"\n\nЭто позволяет создавать структурированные новости без сторонних редакторов.\n\n[[img:png/example-2.png|Финальная иллюстрация примера]]",
    tags: ["#разметка", "#форматирование", "#пример"]
  }
];

const elements = {
  root: document.documentElement,
  feedView: document.getElementById("feedView"),
  postView: document.getElementById("postView"),
  postDetail: document.getElementById("postDetail"),
  backButton: document.getElementById("backButton"),
  posts: document.getElementById("posts"),
  emptyState: document.getElementById("emptyState"),
  postsCount: document.getElementById("postsCount"),
  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  searchForm: document.getElementById("searchForm"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  toast: document.getElementById("toast")
};

let toastTimer = null;
let copyFlashTimer = null;

/* Экранируем текст перед вставкой в innerHTML. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
  Разбирает мини-разметку.
  Порядок: таблицы → изображения → цитаты → жирный → курсив → моно.
  Готовые HTML-фрагменты временно прячутся в токены, чтобы последующие
  регулярные выражения не ломали уже созданный HTML.
*/
function parseMiniMarkup(source, options = {}) {
  const {
    allowImages = true,
    paragraphMode = true
  } = options;

  const tokens = [];
  let html = escapeHtml(source);

  const stash = (markup) => {
    const index = tokens.push(markup) - 1;
    return `\uE000TOKEN_${index}\uE001`;
  };

  // Таблицы: %(Заголовок 1/Заголовок 2) (Ячейка 1/Ячейка 2)%
  html = html.replace(/%((?:\([^\n%]*\))+)%/g, (full, pairsText) => {
    const pairRegex = /\(([^)\n]*)\)/g;
    const pairs = [];
    let match;

    while ((match = pairRegex.exec(pairsText)) !== null) {
      const pair = match[1].split("/");
      if (pair.length === 2) {
        pairs.push([pair[0].trim(), pair[1].trim()]);
      }
    }

    if (!pairs.length) return full;

    const [header, ...rows] = pairs;
    const body = rows.length
      ? `<tbody>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody>`
      : "";

    return stash(
      `<div class="table-wrap"><table><thead><tr><th>${header[0]}</th><th>${header[1]}</th></tr></thead>${body}</table></div>`
    );
  });

  // Изображение внутри полного поста:
  // [[img:png/example.png|Описание]]
  if (allowImages) {
    html = html.replace(/\[\[img:([^|\]\n]+)\|([^\]\n]*)\]\]/g, (_, src, alt) => {
      const safeSrc = escapeHtml(src.trim());
      const safeAlt = escapeHtml(alt.trim() || "Изображение публикации");
      return stash(
        `<figure class="inside-image"><img src="${safeSrc}" alt="${safeAlt}" loading="lazy"><figcaption>${safeAlt}</figcaption></figure>`
      );
    });
  }

  // Цитаты. Внутри цитаты запускаем этот же парсер повторно,
  // поэтому комбинации **жирного**, *курсива* и #моно# работают.
  html = html.replace(/&quot;([^\n]*?)&quot;/g, (_, quoteText) => {
    return stash(`<blockquote>${parseMiniMarkup(quoteText, { allowImages: false, paragraphMode: true })}</blockquote>`);
  });

  // Жирный.
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, (_, value) => {
    return stash(`<strong>${value}</strong>`);
  });

  // Курсив.
  html = html.replace(/\*([^*\n]+?)\*/g, (_, value) => {
    return stash(`<em>${value}</em>`);
  });

  // Моно-фрагмент #текст#.
  html = html.replace(/#([^#\n]+?)#/g, (_, value) => {
    const safe = escapeHtml(value);
    return stash(`<code class="copyable" tabindex="0" role="button" data-copy="${safe}">${safe}</code>`);
  });

  if (!paragraphMode) {
    return restoreTokens(html, tokens);
  }

  html = html
    .split(/\n{2,}/)
    .map((part) => part.trim() ? `<p>${part.replace(/\n/g, "<br>")}</p>` : "")
    .join("");

  return restoreTokens(html, tokens);
}

function restoreTokens(html, tokens) {
  // Повторяем восстановление, пока токены ещё встречаются.
  // Это нужно для вложенной разметки внутри цитат.
  let result = html;
  let guard = 0;

  while (/\uE000TOKEN_(\d+)\uE001/.test(result) && guard < 20) {
    result = result.replace(/\uE000TOKEN_(\d+)\uE001/g, (_, index) => tokens[Number(index)] ?? "");
    guard += 1;
  }

  return result;
}

function normalizeSearch(value) {
  return String(value).trim().toLocaleLowerCase("ru-RU");
}

function getSearchableText(post) {
  return [
    post.title,
    post.content,
    ...(Array.isArray(post.tags) ? post.tags : [])
  ].join(" ").toLocaleLowerCase("ru-RU");
}

function getFilteredPosts(query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return POSTS;
  return POSTS.filter((post) => getSearchableText(post).includes(normalized));
}

function makeImage(src, alt, className) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  if (className) img.className = className;
  img.addEventListener("error", () => {
    img.remove();
  });
  return img;
}

/* ---------- Карточка ---------- */
function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";
  article.dataset.postId = String(post.id);
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `Открыть пост: ${post.title}`);

  if (post.image) {
    article.appendChild(makeImage(post.image, post.title, "post-card__image"));
  }

  const body = document.createElement("div");
  body.className = "post-card__body";

  const heading = document.createElement("div");
  heading.className = "post-card__heading";

  const title = document.createElement("h2");
  title.className = "post-card__title";
  title.textContent = post.title;
  heading.appendChild(title);

  body.appendChild(heading);

  if (post.description) {
    const description = document.createElement("p");
    description.className = "post-card__description";
    description.textContent = post.description;
    body.appendChild(description);
  }

  // ❌ УДАЛИТЕ ЭТОТ БЛОК — он и выводит content на карточке
  // const content = document.createElement("div");
  // content.className = "post-card__content";
  // content.innerHTML = parseMiniMarkup(post.content, { allowImages: false });
  // body.appendChild(content);

  const tags = document.createElement("div");
  tags.className = "post-card__tags";
  tags.setAttribute("aria-label", "Хештеги");

  for (const tagText of Array.isArray(post.tags) ? post.tags.slice(0, 3) : []) {
    const tag = document.createElement("button");
    tag.className = "tag";
    tag.type = "button";
    tag.textContent = tagText;
    tag.dataset.tag = tagText;
    tag.title = `Найти ${tagText}`;
    tags.appendChild(tag);
  }

  body.appendChild(tags);
  article.appendChild(body);

  article.addEventListener("click", (event) => {
    if (event.target.closest(".tag") || event.target.closest(".copyable")) return;
    openPost(post.id);
  });

  article.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !event.target.closest(".tag") && !event.target.closest(".copyable")) {
      event.preventDefault();
      openPost(post.id);
    }
  });

  tags.querySelectorAll(".tag").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const tag = button.dataset.tag || "";
      elements.searchInput.value = tag;
      updateSearchControls();
      showFeed();
      renderPosts();
      elements.searchInput.focus();
      elements.searchInput.select();
    });
  });

  // bindCopyableElements(content); // ❌ тоже удалите, т.к. content больше нет
  return article;
}

function renderPosts() {
  const filtered = getFilteredPosts(elements.searchInput.value);

  elements.posts.replaceChildren();
  elements.emptyState.hidden = filtered.length !== 0;
  elements.postsCount.textContent = `${filtered.length} ${getPostWord(filtered.length)}`;

  if (!filtered.length) return;

  const fragment = document.createDocumentFragment();
  filtered.forEach((post) => fragment.appendChild(createPostCard(post)));
  elements.posts.appendChild(fragment);
}

function getPostWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "пост";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "поста";
  return "постов";
}

/* ---------- Полный пост ---------- */
function renderPost(post) {
  elements.postDetail.replaceChildren();

  if (post.image) {
    elements.postDetail.appendChild(makeImage(post.image, post.title, "post-detail__hero"));
  }

  const body = document.createElement("div");
  body.className = "post-detail__body";

  const heading = document.createElement("div");
  heading.className = "post-detail__heading";


  const title = document.createElement("h1");
  title.className = "post-detail__title";
  title.id = "detailTitle";
  title.textContent = post.title;
  heading.appendChild(title);
  body.appendChild(heading);

  const content = document.createElement("div");
  content.className = "post-detail__content";
  content.innerHTML = parseMiniMarkup(post.content, { allowImages: true });
  body.appendChild(content);

  const tags = document.createElement("div");
  tags.className = "post-detail__tags";
  tags.setAttribute("aria-label", "Хештеги");

  for (const tagText of Array.isArray(post.tags) ? post.tags.slice(0, 3) : []) {
    const tag = document.createElement("button");
    tag.className = "tag";
    tag.type = "button";
    tag.textContent = tagText;
    tag.dataset.tag = tagText;
    tag.title = `Найти ${tagText}`;
    tags.appendChild(tag);
  }

  body.appendChild(tags);
  elements.postDetail.appendChild(body);

  tags.querySelectorAll(".tag").forEach((button) => {
    button.addEventListener("click", () => {
      elements.searchInput.value = button.dataset.tag || "";
      updateSearchControls();
      showFeed();
      renderPosts();
      elements.searchInput.focus();
      elements.searchInput.select();
    });
  });

  bindCopyableElements(content);
}

function openPost(postId, replace = false) {
  const post = POSTS.find((item) => item.id === Number(postId));
  if (!post) {
    showFeed();
    return;
  }

  renderPost(post);
  elements.feedView.hidden = true;
  elements.postView.hidden = false;
  document.title = `${post.title} | Битва Старр`;
  window.scrollTo({ top: 0, behavior: "smooth" });

  const hash = `#post-${post.id}`;
  if (replace) {
    history.replaceState(null, "", hash);
  } else if (window.location.hash !== hash) {
    history.pushState(null, "", hash);
  }
}

function showFeed(updateUrl = true) {
  elements.postView.hidden = true;
  elements.feedView.hidden = false;
  document.title = "Битва Старр | Новости";

  if (updateUrl && window.location.hash) {
    history.pushState(null, "", window.location.pathname + window.location.search);
  }
}

function handleHash() {
  const match = window.location.hash.match(/^#post-(\d+)$/);
  if (match) {
    openPost(Number(match[1]), true);
  } else {
    showFeed(false);
  }
}

/* ---------- Копирование ---------- */
function bindCopyableElements(container) {
  container.querySelectorAll("code.copyable").forEach((code) => {
    const executeCopy = async () => {
      const text = code.dataset.copy || code.textContent || "";
      const copied = await copyText(text);

      if (copied) {
        code.classList.remove("is-copied");
        void code.offsetWidth;
        code.classList.add("is-copied");
        clearTimeout(copyFlashTimer);
        copyFlashTimer = setTimeout(() => code.classList.remove("is-copied"), 700);
        showToast("Скопировано!");
      } else {
        showToast("Не удалось скопировать");
      }
    };

    code.addEventListener("click", (event) => {
      event.stopPropagation();
      executeCopy();
    });

    code.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        executeCopy();
      }
    });
  });
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Используем резервный метод.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let result = false;
  try {
    result = document.execCommand("copy");
  } catch (error) {
    result = false;
  }

  textarea.remove();
  return result;
}

/* ---------- Уведомление ---------- */
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 1600);
}

/* ---------- Тема ---------- */
function setTheme(theme, save = true) {
  elements.root.dataset.theme = theme === "dark" ? "dark" : "light";
  const dark = theme === "dark";

  elements.themeIcon.textContent = dark ? "🌙" : "☀️";
  elements.themeToggle.setAttribute(
    "aria-label",
    dark ? "Включить светлую тему" : "Включить тёмную тему"
  );
  elements.themeToggle.title = dark ? "Включить светлую тему" : "Включить тёмную тему";

  if (save) localStorage.setItem("bstarr-theme", dark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem("bstarr-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    setTheme(savedTheme);
    return;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light", false);
}

/* ---------- События интерфейса ---------- */
elements.searchInput.addEventListener("input", () => {
  updateSearchControls();
  showFeed(false);
  renderPosts();
});

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

elements.clearSearch.addEventListener("click", () => {
  elements.searchInput.value = "";
  updateSearchControls();
  showFeed(false);
  renderPosts();
  elements.searchInput.focus();
});

elements.themeToggle.addEventListener("click", () => {
  const nextTheme = elements.root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

elements.backButton.addEventListener("click", () => {
  showFeed();
  renderPosts();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("popstate", handleHash);
window.addEventListener("hashchange", handleHash);

// Клик по логотипу возвращает на главную страницу.
document.querySelector(".logo").addEventListener("click", (event) => {
  event.preventDefault();
  showFeed();
  renderPosts();
});

function updateSearchControls() {
  elements.clearSearch.hidden = elements.searchInput.value.length === 0;
}

/* ---------- Запуск ---------- */
initTheme();
updateSearchControls();
renderPosts();
handleHash();
