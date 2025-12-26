(function () {
  function getTableFromUrl() {
    var p = new URLSearchParams(location.search);
    return p.get("masa") || p.get("table") || "";
  }

  function uniq(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var k = String(arr[i]);
      if (!seen[k]) {
        seen[k] = true;
        out.push(arr[i]);
      }
    }
    return out;
  }

  function formatPrice(n, currency) {
    if (typeof n !== "number") return "";
    return String(n) + " " + (currency || "₺");
  }

  function tagChip(t) {
    var span = document.createElement("span");
    span.className = "tag";
    if (t === "hot") { span.className += " hot"; span.textContent = "Yeni"; }
    else if (t === "pop") { span.className += " pop"; span.textContent = "Popüler"; }
    else { span.textContent = t; }
    return span;
  }

  function itemCard(item, currency) {
    var wrap = document.createElement("div");
    wrap.className = "item";

    var thumb = document.createElement("div");
    thumb.className = "thumb";

    var safeName = (item && typeof item.name === "string") ? item.name.trim() : "";
    var fallbackLetter = safeName ? safeName.charAt(0).toUpperCase() : "•";

    if (item && item.image) {
      var imgEl = document.createElement("img");
      imgEl.src = item.image;
      imgEl.alt = item.name || "Ürün";
      imgEl.loading = "lazy";
      imgEl.decoding = "async";

      imgEl.onerror = function () {
        try { imgEl.parentNode && imgEl.parentNode.removeChild(imgEl); } catch (e) {}
        thumb.textContent = fallbackLetter;
      };

      thumb.appendChild(imgEl);
    } else {
      thumb.textContent = fallbackLetter;
    }

    var meta = document.createElement("div");
    meta.className = "meta";

    var titleRow = document.createElement("div");
    titleRow.className = "title-row";

    var name = document.createElement("p");
    name.className = "name";
    name.textContent = item.name;

    var price = document.createElement("div");
    price.className = "price";
    price.textContent = formatPrice(item.price, currency);

    titleRow.appendChild(name);
    titleRow.appendChild(price);

    var desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = item.desc || "";

    var tags = document.createElement("div");
    tags.className = "tags";
    var arr = (item.tags || []);
    for (var i = 0; i < arr.length; i++) tags.appendChild(tagChip(arr[i]));

    meta.appendChild(titleRow);
    if (item.desc) meta.appendChild(desc);
    if ((item.tags || []).length) meta.appendChild(tags);

    wrap.appendChild(thumb);
    wrap.appendChild(meta);

    return wrap;
  }

  function renderCategories(categories) {
    var catsEl = document.getElementById("cats");
    catsEl.innerHTML = "";

    var allBtn = document.createElement("button");
    allBtn.className = "cat-btn active";
    allBtn.textContent = "Tümü";
    allBtn.dataset.cat = "__ALL__";
    catsEl.appendChild(allBtn);

    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      var b = document.createElement("button");
      b.className = "cat-btn";
      b.textContent = c;
      b.dataset.cat = c;
      catsEl.appendChild(b);
    }
  }

  function setActiveCatButton(cat) {
    var btns = document.querySelectorAll(".cat-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("active", btns[i].dataset.cat === cat);
    }
  }

  function renderMenu(menu, settings, state) {
    var content = document.getElementById("content");
    var empty = document.getElementById("empty");
    content.innerHTML = "";

    var q = (state.query || "").trim().toLowerCase();
    var activeCat = state.activeCat || "__ALL__";

    var filtered = [];
    for (var i = 0; i < menu.length; i++) {
      var x = menu[i];
      var byCat = (activeCat === "__ALL__") ? true : (x.cat === activeCat);
      var hay = (String(x.name || "") + " " + String(x.desc || "") + " " + String(x.cat || "")).toLowerCase();
      var byQ = q ? (hay.indexOf(q) !== -1) : true;
      if (byCat && byQ) filtered.push(x);
    }

    empty.style.display = filtered.length ? "none" : "block";

    function renderSection(title, items) {
      var section = document.createElement("div");
      section.className = "section";

      var h2 = document.createElement("h2");
      h2.textContent = title;

      var count = document.createElement("span");
      count.className = "badge";
      count.textContent = String(items.length) + " ürün";
      h2.appendChild(count);

      var grid = document.createElement("div");
      grid.className = "grid";

      for (var j = 0; j < items.length; j++) {
        grid.appendChild(itemCard(items[j], settings.currency));
      }

      section.appendChild(h2);
      section.appendChild(grid);
      content.appendChild(section);
    }

    if (activeCat === "__ALL__") {
      var cats = uniq(filtered.map(function (x) { return x.cat; }));
      for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        var items = [];
        for (var k = 0; k < filtered.length; k++) if (filtered[k].cat === cat) items.push(filtered[k]);
        renderSection(cat, items);
      }
    } else {
      renderSection(activeCat, filtered);
    }
  }

  function closestButton(el) {
    while (el && el !== document) {
      if (el.classList && el.classList.contains("cat-btn")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function init() {
    // JSON'u statik olarak fetch ediyoruz
    fetch("data/menu.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var settings = data.settings || {};
        var menu = data.menu || [];

        document.getElementById("placeName").textContent = settings.placeName || "Robin Kafe";
        document.getElementById("placeInfo").textContent = settings.placeInfo || "";
        document.getElementById("legalNote").textContent = settings.legalNote || "";

        var table = getTableFromUrl();
        document.getElementById("tableNo").textContent = settings.defaultTableLabel || "Masa";
        document.getElementById("tableVal").textContent = table ? ("#" + table) : "—";

        document.getElementById("callBtn").addEventListener("click", function () {
          if (!settings.phone) return;
          location.href = "tel:" + settings.phone;
        });

        var waText = table
          ? ("Merhaba, Masa " + table + " için sipariş vermek istiyorum.")
          : "Merhaba, sipariş vermek istiyorum.";

        var waBtn = document.getElementById("waBtn");
        if (settings.whatsappPhone) {
          waBtn.href = "https://wa.me/" + settings.whatsappPhone + "?text=" + encodeURIComponent(waText);
        } else {
          waBtn.style.display = "none";
        }

        renderCategories(uniq(menu.map(function (x) { return x.cat; })));

        var state = { activeCat: "__ALL__", query: "" };
        renderMenu(menu, settings, state);

        document.getElementById("cats").addEventListener("click", function (e) {
          var btn = closestButton(e.target);
          if (!btn) return;
          state.activeCat = btn.dataset.cat;
          setActiveCatButton(state.activeCat);
          renderMenu(menu, settings, state);
          window.scrollTo(0, 0);
        });

        document.getElementById("q").addEventListener("input", function (e) {
          state.query = e.target.value;
          renderMenu(menu, settings, state);
        });
      })
      .catch(function () {
        // JSON/JS patlarsa beyaz ekran yerine mesaj
        document.body.innerHTML =
          '<div style="min-height:100vh;background:#070a10;color:#eef3ff;padding:24px;font:16px/1.45 system-ui;">' +
          '<b>Menü açılamadı.</b><br><br>' +
          'Lütfen sayfayı yenileyin veya “Safari/Chrome’da Aç” ile deneyin.' +
          '</div>';
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
