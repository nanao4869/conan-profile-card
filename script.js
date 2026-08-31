(() => {
  const STORAGE_KEY = "conan-profile-card:v1";

  const textFields = [
    "name", "age", "gender", "xid", "location", "media",
    "history", "trigger",
    "oshi-name", "oshi-comment",
    "post-style",
    "movie-1", "movie-2", "movie-3",
    "episode-1", "episode-2", "episode-3",
    "free"
  ];
  const listFields = ["likes"];
  const allFields = textFields.concat(listFields);

  const MOVIE_TITLES = [
    "時計じかけの摩天楼", "14番目の標的", "世紀末の魔術師", "瞳の中の暗殺者",
    "天国へのカウントダウン", "ベイカー街の亡霊", "迷宮の十字路", "銀翼の奇術師",
    "水平線上の陰謀", "探偵たちの鎮魂歌", "紺碧の棺", "戦慄の楽譜",
    "漆黒の追跡者", "天空の難破船", "沈黙の15分", "11人目のストライカー",
    "絶海の探偵", "異次元の狙撃手", "業火の向日葵", "純黒の悪夢",
    "から紅の恋歌", "ゼロの執行人", "紺青の拳", "緋色の弾丸",
    "ハロウィンの花嫁", "黒鉄の魚影", "100万ドルの五稜星", "隻眼の残像",
    "ハイウェイの堕天使"
  ];
  const MOVIE_OTHER = "__other__";

  // Boxes that group more than one toggle-able field: shown in the live preview as long
  // as at least one member field is checked, hidden once every member is unchecked.
  const boxMembers = {
    "box-history": ["history", "trigger"],
    "box-oshi": ["oshi-name", "oshi-comment"],
    "box-post-style": ["post-style"],
    "box-likes": ["likes"],
    "box-movies": ["movie-1", "movie-2", "movie-3"],
    "box-episodes": ["episode-1", "episode-2", "episode-3"],
    "box-free": ["free"]
  };

  // Shown in the live preview whenever a checked field is still empty, so first-time
  // visitors immediately see what a filled-out card looks like. Never included in the
  // downloaded image — see setExportMode().
  const SAMPLE = {
    name: "江戸川コナン",
    age: "17（体は6歳）",
    gender: "♂",
    xid: "@example",
    location: "東京都",
    media: "TVアニメ・映画",
    history: "1年",
    trigger: "友達に勧められて見たのがきっかけです。",
    "oshi-name": "シャーロック・ホームズ",
    "oshi-comment": "コナンの推理の原点でもあるホームズが好きです。作中に出てくる小ネタやオマージュを見つけるのも楽しみの一つです。",
    "post-style": "考察や感想の投稿が中心です。",
    likes: "推理\nミステリー小説\nゲーム",
    "movie-1": "時計じかけの摩天楼",
    "movie-2": "14番目の標的",
    "movie-3": "世紀末の魔術師",
    "episode-1": "ジェットコースター殺人事件",
    "episode-2": "社長令嬢誘拐事件",
    "episode-3": "アイドル密室殺人事件",
    free: "フォローお気軽にどうぞ！"
  };

  const formEl = (id) => document.getElementById(`f-${id}`);
  const previewEl = (id) => document.getElementById(`v-${id}`);
  const checkEl = (id) => document.getElementById(`c-${id}`);
  const isChecked = (id) => checkEl(id).checked;

  function fieldContainer(id) {
    return previewEl(id).closest("[data-field]");
  }

  function updatePreview() {
    textFields.forEach((id) => {
      const checked = isChecked(id);
      const container = fieldContainer(id);
      const block = checkEl(id).closest(".field-block");
      if (block) block.classList.toggle("is-off", !checked);
      if (container) container.style.display = checked ? "" : "none";
      if (!checked) return;

      const real = formEl(id).value.trim();
      const el = previewEl(id);
      el.textContent = real !== "" ? real : SAMPLE[id];
      el.classList.toggle("is-sample", real === "");
    });

    listFields.forEach((id) => {
      const checked = isChecked(id);
      const block = checkEl(id).closest(".field-block");
      if (block) block.classList.toggle("is-off", !checked);

      const ul = previewEl(id);
      ul.innerHTML = "";
      if (!checked) return;

      const realLines = formEl(id).value.split("\n").map((s) => s.trim()).filter(Boolean);
      const usingSample = realLines.length === 0;
      const lines = usingSample ? SAMPLE[id].split("\n") : realLines;
      lines.forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        li.classList.toggle("is-sample", usingSample);
        ul.appendChild(li);
      });
    });

    Object.entries(boxMembers).forEach(([boxId, ids]) => {
      const visible = ids.some((id) => isChecked(id));
      document.getElementById(boxId).style.display = visible ? "" : "none";
    });
  }

  // Right before generating the downloaded image, temporarily hides anything that's only
  // showing sample placeholder text (checked but left empty by the user), so sample text
  // never appears in the saved PNG. Tracks exactly what it hid so it can restore only
  // that — fields/boxes already hidden because the user unchecked them are left alone.
  let exportHiddenEls = [];

  function setExportMode(hide) {
    if (!hide) {
      exportHiddenEls.forEach((el) => { el.style.display = ""; });
      exportHiddenEls = [];
      return;
    }

    exportHiddenEls = [];
    const hideEl = (el) => {
      if (el && el.style.display !== "none") {
        el.style.display = "none";
        exportHiddenEls.push(el);
      }
    };

    textFields.forEach((id) => {
      if (isChecked(id) && formEl(id).value.trim() === "") hideEl(fieldContainer(id));
    });
    listFields.forEach((id) => {
      if (isChecked(id) && formEl(id).value.trim() === "") hideEl(document.getElementById(`box-${id}`));
    });

    Object.entries(boxMembers).forEach(([boxId, ids]) => {
      const box = document.getElementById(boxId);
      if (box.style.display === "none") return; // already hidden (every field unchecked)
      const hasRealContent = ids.some((id) => {
        if (!isChecked(id)) return false;
        if (listFields.includes(id)) return formEl(id).value.trim() !== "";
        return formEl(id).value.trim() !== "";
      });
      if (!hasRealContent) hideEl(box);
    });
  }

  function updateDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    document.getElementById("v-date").textContent = `${y}/${m}/${day}`;
  }

  function saveToStorage() {
    const data = { values: {}, checks: {} };
    allFields.forEach((id) => {
      data.values[id] = formEl(id).value;
      data.checks[id] = isChecked(id);
    });
    data.media = [...document.querySelectorAll(".media-check:checked")].map((cb) => cb.value);
    data.theme = document.querySelector('input[name="theme"]:checked')?.value || "blue";
    data.icon = iconDataUrl || null;
    data.order = currentOrder();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      allFields.forEach((id) => {
        if (typeof data.values?.[id] === "string") formEl(id).value = data.values[id];
        if (typeof data.checks?.[id] === "boolean") checkEl(id).checked = data.checks[id];
      });
      ["movie-1", "movie-2", "movie-3"].forEach((target) => {
        const value = formEl(target).value;
        const select = document.querySelector(`.movie-select[data-target="${target}"]`);
        const other = document.querySelector(`.movie-other[data-target="${target}"]`);
        if (value === "") {
          select.value = "";
          other.style.display = "none";
          other.value = "";
        } else if (MOVIE_TITLES.includes(value)) {
          select.value = value;
          other.style.display = "none";
          other.value = "";
        } else {
          select.value = MOVIE_OTHER;
          other.style.display = "";
          other.value = value;
        }
      });
      if (Array.isArray(data.media)) {
        document.querySelectorAll(".media-check").forEach((cb) => {
          cb.checked = data.media.includes(cb.value);
        });
      }
      if (typeof data.theme === "string") {
        const radio = document.querySelector(`input[name="theme"][value="${data.theme}"]`);
        if (radio) {
          radio.checked = true;
          document.getElementById("card").dataset.theme = data.theme;
        }
      }
      if (data.icon) setIcon(data.icon);
      if (Array.isArray(data.order) && data.order.length === DEFAULT_ORDER.length) {
        setOrder(data.order);
      }
    } catch (e) {
      console.warn("failed to restore saved data", e);
    }
  }

  let iconDataUrl = null;
  const iconFrame = document.getElementById("icon-frame");
  const keyholeSvg = iconFrame.querySelector(".keyhole");
  const iconCaption = document.querySelector(".icon-caption");

  // Frame size follows the photo's own proportions (capped to fit the card) instead
  // of forcing every photo into a circle, which crops non-square photos awkwardly.
  function applyIconShape(naturalWidth, naturalHeight) {
    const ratio = naturalWidth / naturalHeight;
    const maxW = 128, maxH = 190, minSize = 90;
    let w, h;
    if (ratio >= 1) {
      w = maxW; h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
    } else {
      h = maxH; w = h * ratio;
      if (w > maxW) { w = maxW; h = w / ratio; }
    }
    w = Math.max(w, minSize);
    h = Math.max(h, minSize);
    iconFrame.style.width = `${Math.round(w)}px`;
    iconFrame.style.height = `${Math.round(h)}px`;
  }

  function setIcon(dataUrl) {
    iconDataUrl = dataUrl;
    let img = iconFrame.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      iconFrame.appendChild(img);
    }
    img.src = dataUrl;
    img.onload = () => applyIconShape(img.naturalWidth, img.naturalHeight);
    if (keyholeSvg) keyholeSvg.style.display = "none";
    iconFrame.classList.add("has-photo");
    if (iconCaption) iconCaption.classList.add("is-hidden");
  }

  function clearIcon() {
    iconDataUrl = null;
    const img = iconFrame.querySelector("img");
    if (img) img.remove();
    if (keyholeSvg) keyholeSvg.style.display = "";
    iconFrame.classList.remove("has-photo");
    iconFrame.style.width = "";
    iconFrame.style.height = "";
    if (iconCaption) iconCaption.classList.remove("is-hidden");
    document.getElementById("f-icon").value = "";
    saveToStorage();
  }

  const DEFAULT_ORDER = ["box-history", "box-oshi", "box-post-style", "box-likes", "box-movies", "box-episodes", "box-free"];
  const orderList = document.getElementById("order-list");
  const sectionGrid = document.getElementById("section-grid");

  function currentOrder() {
    return [...orderList.children].map((li) => li.dataset.box);
  }

  function updateOrderButtons() {
    const items = [...orderList.children];
    items.forEach((li, i) => {
      li.querySelector(".order-up").disabled = i === 0;
      li.querySelector(".order-down").disabled = i === items.length - 1;
    });
  }

  // Re-appends each card box into the grid in the order the sidebar list is currently
  // in; appendChild moves an existing element rather than cloning it, so content/state
  // on each box is preserved across reorders.
  function applyCardOrder() {
    currentOrder().forEach((boxId) => {
      const box = document.getElementById(boxId);
      if (box) sectionGrid.appendChild(box);
    });
    updateOrderButtons();
  }

  function setOrder(order) {
    order.forEach((boxId) => {
      const li = orderList.querySelector(`li[data-box="${boxId}"]`);
      if (li) orderList.appendChild(li);
    });
    applyCardOrder();
  }

  orderList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const li = btn.closest("li");
    if (btn.classList.contains("order-up")) {
      const prev = li.previousElementSibling;
      if (prev) orderList.insertBefore(li, prev);
    } else if (btn.classList.contains("order-down")) {
      const next = li.nextElementSibling;
      if (next) orderList.insertBefore(next, li);
    }
    applyCardOrder();
    saveToStorage();
  });

  // Populate the three movie <select> dropdowns once with the same title list, plus a
  // free-text fallback for anything not in the official 29 (e.g. TV specials).
  document.querySelectorAll(".movie-select").forEach((select) => {
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "選択してください";
    select.appendChild(blank);
    MOVIE_TITLES.forEach((title, i) => {
      const opt = document.createElement("option");
      opt.value = title;
      opt.textContent = `${i + 1}. ${title}`;
      select.appendChild(opt);
    });
    const other = document.createElement("option");
    other.value = MOVIE_OTHER;
    other.textContent = "その他（自由入力）";
    select.appendChild(other);
  });

  // The <select> (or its paired free-text fallback) writes into the hidden #f-movie-N
  // input, which is what the generic text-field pipeline (sample text, export, storage)
  // actually reads — same pattern as #f-media.
  function syncMovieField(target) {
    const select = document.querySelector(`.movie-select[data-target="${target}"]`);
    const other = document.querySelector(`.movie-other[data-target="${target}"]`);
    const hidden = document.getElementById(`f-${target}`);
    const isOther = select.value === MOVIE_OTHER;
    other.style.display = isOther ? "" : "none";
    hidden.value = isOther ? other.value.trim() : select.value;
  }

  document.getElementById("card-form").addEventListener("input", (e) => {
    if (e.target.classList.contains("movie-select") || e.target.classList.contains("movie-other")) {
      syncMovieField(e.target.dataset.target);
    }
  });

  document.getElementById("f-icon").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setIcon(reader.result);
      saveToStorage();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("icon-clear").addEventListener("click", clearIcon);

  document.getElementById("card-form").addEventListener("input", (e) => {
    if (e.target.name !== "theme") return;
    document.getElementById("card").dataset.theme = e.target.value;
    saveToStorage();
  });

  // "追っている媒体" isn't a single text input — it's a set of checkboxes whose selection
  // gets joined into the hidden #f-media input so it can flow through the same generic
  // text-field pipeline (sample text, export hiding, storage) as every other field.
  document.getElementById("card-form").addEventListener("input", (e) => {
    if (!e.target.classList.contains("media-check")) return;
    const selected = [...document.querySelectorAll(".media-check:checked")].map((cb) => cb.value);
    document.getElementById("f-media").value = selected.join("・");
  });

  document.getElementById("card-form").addEventListener("input", () => {
    updatePreview();
    saveToStorage();
  });

  document.getElementById("form-reset").addEventListener("click", () => {
    if (!confirm("入力内容をすべてリセットします。よろしいですか？")) return;
    document.getElementById("card-form").reset();
    clearIcon();
    ["movie-1", "movie-2", "movie-3"].forEach(syncMovieField);
    document.getElementById("card").dataset.theme = "blue";
    setOrder(DEFAULT_ORDER);
    updatePreview();
    localStorage.removeItem(STORAGE_KEY);
  });

  // Shared by both buttons: renders the card to PNG and triggers a browser download.
  // Returns true on success so callers (like the X button) know whether to continue.
  async function downloadCardImage() {
    const card = document.getElementById("card");
    try {
      setExportMode(true);
      const dataUrl = await htmlToImage.toPng(card, { pixelRatio: 2, cacheBust: true, skipFonts: true });
      const link = document.createElement("a");
      const safeName = formEl("name").value.trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_");
      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      link.download = safeName
        ? `conan_profile_card_${safeName}_${dateStr}.png`
        : `conan_profile_card_${dateStr}.png`;
      link.href = dataUrl;
      link.click();
      return true;
    } catch (err) {
      console.error(err);
      alert("画像の生成に失敗しました。もう一度お試しください。");
      return false;
    } finally {
      setExportMode(false);
    }
  }

  document.getElementById("download-btn").addEventListener("click", async () => {
    const btn = document.getElementById("download-btn");
    btn.disabled = true;
    btn.textContent = "画像を生成中...";
    await downloadCardImage();
    btn.disabled = false;
    btn.textContent = "画像として保存（PNG）";
  });

  document.getElementById("post-x-btn").addEventListener("click", async () => {
    const btn = document.getElementById("post-x-btn");
    btn.disabled = true;
    btn.textContent = "画像を生成中...";
    const ok = await downloadCardImage();
    btn.disabled = false;
    btn.textContent = "画像を保存してXの投稿画面を開く";
    if (!ok) return;
    const tweetText = "名探偵コナン自己紹介カードを作りました！ #コナン自己紹介カードメーカー #名探偵コナン好きな人と繋がりたい #コナクラさんと繋がりたい";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank", "noopener");
  });

  updateDate();
  loadFromStorage();
  applyCardOrder();
  updatePreview();
})();
