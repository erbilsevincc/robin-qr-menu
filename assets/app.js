function getTableFromUrl(){
  var p = new URLSearchParams(location.search);
  return p.get("masa") || p.get("table") || "";
}

function uniq(arr){
  var s = {};
  var out = [];
  for (var i=0;i<arr.length;i++){
    var k = String(arr[i]);
    if(!s[k]){ s[k]=1; out.push(arr[i]); }
  }
  return out;
}

function formatPrice(n, currency){
  if (typeof n !== "number") return "";
  return n + " " + (currency || "₺");
}

function tagChip(t){
  var span = document.createElement("span");
  span.className = "tag";
  if(t==="hot"){ span.classList.add("hot"); span.textContent="Yeni"; }
  else if(t==="pop"){ span.classList.add("pop"); span.textContent="Popüler"; }
  else { span.textContent = t; }
  return span;
}

function itemCard(item, currency){
  var wrap = document.createElement("div");
  wrap.className = "item";

  var thumb = document.createElement("div");
  thumb.className = "thumb";

  var fallbackLetter = ((item.name || "").trim().charAt(0) || "•").toUpperCase();

  if (item.image) {
    var imgEl = document.createElement("img");
    imgEl.src = item.image;
    imgEl.alt = item.name || "Ürün";
    imgEl.loading = "lazy";
    imgEl.decoding = "async";
    imgEl.onerror = function(){
      try { imgEl.remove(); } catch(e){}
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
  name.textContent = item.name || "";

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
  (item.tags || []).forEach(function(t){ tags.appendChild(tagChip(t)); });

  meta.appendChild(titleRow);
  if(item.desc) meta.appendChild(desc);
  if((item.tags||[]).length) meta.appendChild(tags);

  wrap.appendChild(thumb);
  wrap.appendChild(meta);

  return wrap;
}

function renderCategoriesScroller(categories){
  var catsEl = document.getElementById("cats");
  catsEl.innerHTML = "";

  var allBtn = document.createElement("button");
  allBtn.className = "cat-btn";
  allBtn.textContent = "Tümü";
  allBtn.dataset.cat = "__ALL__";
  catsEl.appendChild(allBtn);

  categories.forEach(function(c){
    var b = document.createElement("button");
    b.className = "cat-btn";
    b.textContent = c;
    b.dataset.cat = c;
    catsEl.appendChild(b);
  });
}

function setActiveCatButton(cat){
  document.querySelectorAll(".cat-btn").forEach(function(b){
    b.classList.toggle("active", b.dataset.cat===cat);
  });
}

function renderMenu(menu, settings, state){
  var content = document.getElementById("content");
  var empty = document.getElementById("empty");
  content.innerHTML = "";

  var q = (state.query || "").trim().toLowerCase();
  var activeCat = state.activeCat || "__ALL__";

  var filtered = menu.filter(function(x){
    var byCat = (activeCat==="__ALL__") ? true : (x.cat===activeCat);
    var hay = ((x.name||"") + " " + (x.desc||"") + " " + (x.cat||"")).toLowerCase();
    var byQ = q ? hay.indexOf(q) !== -1 : true;
    return byCat && byQ;
  });

  empty.style.display = filtered.length ? "none" : "block";

  function renderSection(title, items){
    var section = document.createElement("div");
    section.className = "section";

    var h2 = document.createElement("h2");
    h2.textContent = title;

    var count = document.createElement("span");
    count.className = "badge";
    count.textContent = items.length + " ürün";
    h2.appendChild(count);

    var grid = document.createElement("div");
    grid.className = "grid";
    items.forEach(function(item){
      grid.appendChild(itemCard(item, settings.currency));
    });

    section.appendChild(h2);
    section.appendChild(grid);
    content.appendChild(section);
  }

  if(activeCat==="__ALL__"){
    uniq(filtered.map(function(x){ return x.cat; })).forEach(function(cat){
      renderSection(cat, filtered.filter(function(x){ return x.cat===cat; }));
    });
  } else {
    renderSection(activeCat, filtered);
  }
}

/* ✅ YENİ: Landing kategori kartları */
function renderLanding(categories){
  var grid = document.getElementById("catGrid");
  if(!grid) return;
  grid.innerHTML = "";

  categories.forEach(function(cat){
    var btn = document.createElement("button");
    btn.className = "cat-tile";
    btn.type = "button";
    btn.dataset.cat = cat;

    var title = document.createElement("div");
    title.className = "cat-tile-title";
    title.textContent = cat;

    var hint = document.createElement("div");
    hint.className = "cat-tile-hint";
    hint.textContent = "Görüntüle";

    btn.appendChild(title);
    btn.appendChild(hint);
    grid.appendChild(btn);
  });
}

function showLanding(){
  var landing = document.getElementById("landing");
  var menuView = document.getElementById("menuView");
  if(landing) landing.style.display = "";
  if(menuView) menuView.style.display = "none";
}

function showMenuView(){
  var landing = document.getElementById("landing");
  var menuView = document.getElementById("menuView");
  if(landing) landing.style.display = "none";
  if(menuView) menuView.style.display = "";
  window.scrollTo({top: 0, behavior: "smooth"});
}

function loadMenuJson(){
  return fetch("data/menu.json?v=" + Date.now(), { cache: "no-store" })
    .then(function(r){
      if(!r.ok) throw new Error("menu.json okunamadı (" + r.status + ")");
      return r.json();
    });
}

function toLanding(push){
  showLanding();
  // URL temizle (masa kalsın)
  var p = new URLSearchParams(location.search);
  p.delete("cat");
  var newUrl = location.pathname + (p.toString() ? ("?" + p.toString()) : "");
  if (push) history.pushState({view:"landing"}, "", newUrl);
  else history.replaceState({view:"landing"}, "", newUrl);
}

function toMenu(cat, push){
  showMenuView();
  // URL'e cat yaz (masa kalsın)
  var p = new URLSearchParams(location.search);
  if(cat && cat !== "__ALL__") p.set("cat", cat);
  else p.delete("cat");

  var newUrl = location.pathname + (p.toString() ? ("?" + p.toString()) : "");
  if (push) history.pushState({view:"menu", cat:cat||"__ALL__"}, "", newUrl);
  else history.replaceState({view:"menu", cat:cat||"__ALL__"}, "", newUrl);
}


function init(){
  loadMenuJson().then(function(data){
    var settings = data.settings || {};
    var menu = data.menu || [];

    document.getElementById("placeName").textContent = settings.placeName || "Robin Kafe";
    document.getElementById("placeInfo").textContent = settings.placeInfo || "";
    document.getElementById("legalNote").textContent = settings.legalNote || "";

    var table = getTableFromUrl();
    document.getElementById("tableNo").textContent = settings.defaultTableLabel || "Masa";
    document.getElementById("tableVal").textContent = table ? ("#" + table) : "—";

    document.getElementById("callBtn").addEventListener("click", function(){
      if(!settings.phone) return;
      location.href = "tel:" + settings.phone;
    });

    var waText = table
      ? ("Merhaba, Masa " + table + " için sipariş vermek istiyorum.")
      : "Merhaba, sipariş vermek istiyorum.";

    var waBtn = document.getElementById("waBtn");
    if(settings.whatsappPhone){
      waBtn.href = "https://wa.me/" + settings.whatsappPhone + "?text=" + encodeURIComponent(waText);
    } else {
      waBtn.style.display = "none";
    }

    var categories = uniq(menu.map(function(x){ return x.cat; }));

    renderLanding(categories);
renderCategoriesScroller(categories);

var state = { activeCat:"__ALL__", query:"" };

// İlk açılış: URL'de cat varsa direkt menüye, yoksa landing
var p0 = new URLSearchParams(location.search);
var urlCat = p0.get("cat");
if (urlCat && categories.indexOf(urlCat) !== -1) {
  state.activeCat = urlCat;
  state.query = "";
  document.getElementById("q").value = "";
  setActiveCatButton(state.activeCat);
  renderMenu(menu, settings, state);
  toMenu(state.activeCat, false); // replaceState
} else {
  toLanding(false); // replaceState
}

document.getElementById("catGrid").addEventListener("click", function(e){
  var tile = e.target.closest(".cat-tile");
  if(!tile) return;

  state.activeCat = tile.dataset.cat;
  state.query = "";
  document.getElementById("q").value = "";

  setActiveCatButton(state.activeCat);
  renderMenu(menu, settings, state);
  toMenu(state.activeCat, true); // pushState
});


document.getElementById("cats").addEventListener("click", function(e){
  var btn = e.target.closest(".cat-btn");
  if(!btn) return;

  state.activeCat = btn.dataset.cat;
  setActiveCatButton(state.activeCat);
  renderMenu(menu, settings, state);
  toMenu(state.activeCat, true); // pushState
  window.scrollTo({top: 0, behavior: "smooth"});
});


    // Arama
    document.getElementById("q").addEventListener("input", function(e){
      state.query = e.target.value;
      renderMenu(menu, settings, state);
    });

    window.addEventListener("popstate", function(ev){
  var st = ev.state;

  // Bazı tarayıcılar state'i null getirebilir; URL'den tekrar oku
  var p = new URLSearchParams(location.search);
  var cat = p.get("cat");

  if (!cat) {
    toLanding(false);
    return;
  }

  // cat varsa menü görünümü
  state.activeCat = cat;
  state.query = "";
  document.getElementById("q").value = "";
  setActiveCatButton(state.activeCat);
  renderMenu(menu, settings, state);
  showMenuView();
});


  }).catch(function(err){
    document.body.innerHTML =
      '<div style="min-height:100vh;background:#070a10;color:#eaf2ff;padding:24px;font:16px/1.45 -apple-system,system-ui">' +
      '<b>Menü yüklenemedi.</b><br>' + (err && err.message ? err.message : "Bilinmeyen hata") +
      '</div>';
  });
}

document.addEventListener("DOMContentLoaded", init);
