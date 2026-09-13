/* =========================================
   Битва Старр | Новости
   Здесь хранятся ВСЕ посты сайта.

   Поддерживаемая разметка content:
   *курсив*
   **жирный**
   #текст#                         -> копируемый моно-фрагмент
   "Цитата"                       -> цитата
   %(a/b) (c/d)%                  -> таблица
   [[img:logo.png|тест]]          -> одна картинка
   [[img:logo.png;logo2.png|тест]] -> от 1 до 3 картинок
   [[img:logo.png|тест|50]]       -> ширина картинки в процентах
   @текст (https://example.com)@   -> ссылка
   ========================================= */

const POSTS = [
  {
    id: 1,
    title: "Тест",
    description: "Шрифты",
    image: "png/example-1.png",
    content: "Шрифты:\n\n*Курсивный*\n\n**Жирный**\n\n#Моно#\n\n \"Цитата\" \n\nТаблица\n %(столбик1/столбик2) (тест/тест)%\n\n@ссылка (https://example.com)@\n\n[[img:png/example.png|Упоминание картинки|50]]",
    tags: ["#новости", "#обновление", "#битва"]
  },
  {
    id: 2,
    title: "Новые награды за прогресс",
    description: "Разбираем новую систему наград и показываем, как будет меняться ценность призов по мере прогресса.",
    image: "png/example-2.png",
    content: "В новой системе наград появятся несколько ступеней. *Чем выше прогресс, тем ценнее награда*.\n\n%(Уровень/Награда) (1/Монеты) (2/Очки силы) (3/Блинги) (4/Скин)%\n\n**Пример:** максимальная награда открывается только после большого количества очков.\n\n[[img:png/logo.png;png/example-5.png|Примеры экранов|50]]",
    tags: ["#награды", "#прогресс", "#новости"]
  }
];

const elements = {
  root: document.documentElement,
  body: document.body,
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
  toast: document.getElementById("toast"),
  imageModal: document.getElementById("imageModal"),
  imageModalImage: document.getElementById("imageModalImage"),
  imageModalClose: document.getElementById("imageModalClose")
};

let toastTimer = null;
let copyFlashTimer = null;
let modalPreviousOverflow = "";

/* Экранируем текст перед вставкой в innerHTML. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Разрешаем только безопасные URL для ссылок из пользовательской разметки. */
function sanitizeUrl(value) {
  const raw = String(value).trim();
  try {
    const url = new URL(raw, window.location.href);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
      return url.href;
    }
  } catch (error) {
    // Некорректный URL просто превращаем в обычный текст.
  }
  return "";
}

function parseImageMarkup(source, stash) {
  const parts = source
    .split("|")
    .map((part) => part.trim());

  const rawSources = parts.shift() || "";
  const caption = parts.shift() || "";
  const rawWidth = parts.shift() || "100";

  const sources = rawSources
    .split(";")
    .map((src) => src.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!sources.length) return source;

  const parsedWidth = Number(rawWidth);
  const width = Number.isFinite(parsedWidth)
    ? Math.min(100, Math.max(1, parsedWidth))
    : 100;

  const safeCaption = escapeHtml(caption || "Изображение публикации");
  const imagesHtml = sources
    .map((src) => {
      const safeSrc = escapeHtml(src);
      return `<button class="inside-image__item" type="button" aria-label="Открыть изображение"><img src="${safeSrc}" alt="${safeCaption}" loading="lazy" data-lightbox-src="${safeSrc}"></button>`;
    })
    .join("");

  return stash(
    `<figure class="inside-image" style="--inside-image-width:${width}%"><div class="inside-image__grid">${imagesHtml}</div><figcaption>${safeCaption}</figcaption></figure>`
  );
}

/*
  Разбирает мини-разметку.
  Порядок: таблицы → изображения → ссылки → цитаты → жирный → курсив → моно.
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

  // Таблицы: %(Заголовок 1/Заголовок 2/...) (Ячейка 1/Ячейка 2/...)%
  html = html.replace(/%((?:\([^\n%]*\))+)%/g, (full, pairsText) => {
    const pairRegex = /\(([^)\n]*)\)/g;
    const rows = [];
    let match;

    while ((match = pairRegex.exec(pairsText)) !== null) {
      const cells = match[1].split("/").map((cell) => cell.trim());
      if (cells.length) rows.push(cells);
    }

    if (!rows.length) return full;

    const columnCount = Math.max(...rows.map((row) => row.length));
    const [header, ...body] = rows;

    const normalizeRow = (cells) => {
      const result = cells.slice(0, columnCount);
      while (result.length < columnCount) result.push("");
      return result;
    };

    const headerHtml = normalizeRow(header)
      .map((cell) => `<th>${cell}</th>`)
      .join("");

    const bodyHtml = body.length
      ? `<tbody>${body
          .map((row) => `<tr>${normalizeRow(row).map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
          .join("")}</tbody>`
      : "";

    return stash(
      `<div class="table-wrap"><table><thead><tr>${headerHtml}</tr></thead>${bodyHtml}</table></div>`
    );
  });

  // Изображения внутри полного поста:
  // [[img:png/example.png|Описание]]
  // [[img:png/a.png;png/b.png;png/c.png|Описание|50]]
  if (allowImages) {
    html = html.replace(/\[\[img:([^\]\n]+)\]\]/g, (_, payload) => parseImageMarkup(payload, stash));
  }

  // Ссылки:
  // @текст (https://example.com)@
  // \@текст\ (https://example.com)@
  html = html.replace(/\\?@([^@\n]+?)\s*\(([^)\n]+)\)@/g, (full, text, href) => {
    const safeHref = sanitizeUrl(href);
    if (!safeHref) return full;

    const safeText = text.trim().replace(/\\$/g, "").trim();
    return stash(
      `<a class="inline-link" href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeText)}</a>`
    );
  });

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
    post.description,
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

  // Обложка карточки специально не показывается в полном посте.
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

  if (post.description) {
    const description = document.createElement("p");
    description.className = "post-detail__description";
    description.textContent = post.description;
    body.appendChild(description);
  }

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
  bindLightboxElements(content);
}

function setPostMode(active) {
  elements.body.classList.toggle("post-mode", active);
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
  setPostMode(true);
  document.title = `${post.title} | Битва Старр`;
  window.scrollTo({ top: 0, behavior: "auto" });

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
  setPostMode(false);
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

/* ---------- Полноэкранный просмотр изображений ---------- */
function bindLightboxElements(container) {
  container.querySelectorAll(".inside-image__item").forEach((button) => {
    const image = button.querySelector("img[data-lightbox-src]");
    if (!image) return;

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openImageModal(image.dataset.lightboxSrc || image.src, image.alt);
    });
  });
}

function openImageModal(src, alt = "Изображение") {
  if (!src) return;

  elements.imageModalImage.src = src;
  elements.imageModalImage.alt = alt;
  elements.imageModal.hidden = false;
  modalPreviousOverflow = elements.body.style.overflow;
  elements.body.style.overflow = "hidden";
  requestAnimationFrame(() => elements.imageModal.classList.add("is-visible"));
  elements.imageModalClose.focus();
}

function closeImageModal() {
  if (elements.imageModal.hidden) return;

  elements.imageModal.classList.remove("is-visible");
  elements.body.style.overflow = modalPreviousOverflow;

  setTimeout(() => {
    if (!elements.imageModal.classList.contains("is-visible")) {
      elements.imageModal.hidden = true;
      elements.imageModalImage.removeAttribute("src");
    }
  }, 180);
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
  window.scrollTo({ top: 0, behavior: "auto" });
});

elements.imageModalClose.addEventListener("click", closeImageModal);
elements.imageModal.addEventListener("click", (event) => {
  if (event.target === elements.imageModal) closeImageModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.imageModal.hidden) {
    closeImageModal();
  }
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
