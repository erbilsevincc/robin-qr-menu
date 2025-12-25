function getTableFromUrl(){
  const p = new URLSearchParams(location.search);
  return p.get("masa") || p.get("table") || "";
}

function uniq(arr){ return [...new Set(arr)]; }

function formatPrice(n, currency){
  if (typeof n !== "number") return ""; // price null ise boş bırak
  return `${n} ${currency || "₺"}`;
}

function tagChip(t){
  const span = document.createElement("span");
  span.className = "tag";
  if(t==="hot"){ span.classList.add("hot"); span.textContent="Yeni"; }
  else if(t==="pop"){ span.classList.add("pop"); span.textContent="Popüler"; }
  else { span.textContent = t; }
  return span;
}

function itemCard(item, currency){
  const wrap = document.createElement("div");
  wrap.className = "item";

  const thumb = document.createElement("div");
  thumb.className = "thumb";

  const fallbackLetter = (item.name?.trim()?.[0]?.toUpperCase() || "•");

  if (item.image) {
    const imgEl = document.createElement("img");
    imgEl.src = item.image;
    imgEl.alt = item.name || "Ürün";
    imgEl.loading = "lazy";
    imgEl.decoding = "async";

    imgEl.onerror = () => {
      imgEl.remove();
      thumb.textContent = fallbackLetter;
    };

    thumb.appendChild(imgEl);
  } else {
    thumb.textContent = fallbackLetter;
  }

  const meta = document.createElement("div");
  meta.className = "meta";

  const titleRow = document.createElement("div");
  titleRow.className = "title-row";

  const name = document.createElement("p");
  name.className = "name";
  name.textContent = item.name;

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = formatPrice(item.price, currency);

  titleRow.appendChild(name);
  titleRow.appendChild(price);

  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = item.desc || "";

  const tags = document.createElement("div");
  tags.className = "tags";
  (item.tags || []).forEach(t => tags.appendChild(tagChip(t)));

  meta.appendChild(titleRow);
  if(item.desc) meta.appendChild(desc);
  if((item.tags||[]).length) meta.appendChild(tags);

  wrap.appendChild(thumb);
  wrap.appendChild(meta);

  return wrap;
}

function renderCategories(categories){
  const catsEl = document.getElementById("cats");
  catsEl.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "cat-btn active";
  allBtn.textContent = "Tümü";
  allBtn.dataset.cat = "__ALL__";
  catsEl.appendChild(allBtn);

  categories.forEach(c=>{
    const b = document.createElement("button");
    b.className = "cat-btn";
    b.textContent = c;
    b.dataset.cat = c;
    catsEl.appendChild(b);
  });
}

function setActiveCatButton(cat){
  document.querySelectorAll(".cat-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.cat===cat);
  });
}

function renderMenu(menu, settings, state){
  const content = document.getElementById("content");
  const empty = document.getElementById("empty");
  content.innerHTML = "";

  const q = (state.query || "").trim().toLowerCase();
  const activeCat = state.activeCat || "__ALL__";

  const filtered = menu.filter(x=>{
    const byCat = activeCat==="__ALL__" ? true : x.cat===activeCat;
    const hay = `${x.name} ${x.desc} ${x.cat}`.toLowerCase();
    const byQ = q ? hay.includes(q) : true;
    return byCat && byQ;
  });

  empty.style.display = filtered.length ? "none" : "block";

  const renderSection = (title, items) => {
    const section = document.createElement("div");
    section.className = "section";

    const h2 = document.createElement("h2");
    h2.textContent = title;

    const count = document.createElement("span");
    count.className = "badge";
    count.textContent = `${items.length} ürün`;
    h2.appendChild(count);

    const grid = document.createElement("div");
    grid.className = "grid";

    items.forEach(item => grid.appendChild(itemCard(item, settings.currency)));

    section.appendChild(h2);
    section.appendChild(grid);
    content.appendChild(section);
  };

  if(activeCat==="__ALL__"){
    uniq(filtered.map(x=>x.cat)).forEach(cat=>{
      renderSection(cat, filtered.filter(x=>x.cat===cat));
    });
  } else {
    renderSection(activeCat, filtered);
  }
}

async function loadMenuData(){
  const res = await fetch("data/menu.json", { cache: "no-store" });
  if(!res.ok) throw new Error("data/menu.json okunamadı.");
  return await res.json();
}

async function init(){
  let data;
  try {
    data = await loadMenuData();
  } catch (e) {
    console.error(e);
    alert("Menü yüklenemedi. data/menu.json yolunu kontrol edin.");
    return;
  }

  const settings = data.settings || {};
  const menu = data.menu || [];

  document.getElementById("placeName").textContent = settings.placeName || "Robin Kafe";
  document.getElementById("placeInfo").textContent = settings.placeInfo || "";
  document.getElementById("legalNote").textContent = settings.legalNote || "";

  // title’ı da data’ya göre güncelle (PHP’dekiyle aynı etki)
  document.title = `${settings.placeName || "Robin Kafe"} | QR Menü`;

  const table = getTableFromUrl();
  document.getElementById("tableNo").textContent = settings.defaultTableLabel || "Masa";
  document.getElementById("tableVal").textContent = table ? `#${table}` : "—";

  document.getElementById("callBtn").addEventListener("click", ()=>{
    if(!settings.phone) return;
    location.href = `tel:${settings.phone}`;
  });

  const waText = table
    ? `Merhaba, Masa ${table} için sipariş vermek istiyorum.`
    : `Merhaba, sipariş vermek istiyorum.`;

  const waBtn = document.getElementById("waBtn");
  if(settings.whatsappPhone){
    waBtn.href = `https://wa.me/${settings.whatsappPhone}?text=${encodeURIComponent(waText)}`;
  } else {
    waBtn.style.display = "none";
  }

  renderCategories(uniq(menu.map(x=>x.cat)));

  const state = { activeCat:"__ALL__", query:"" };
  renderMenu(menu, settings, state);

  document.getElementById("cats").addEventListener("click", (e)=>{
    const btn = e.target.closest(".cat-btn");
    if(!btn) return;
    state.activeCat = btn.dataset.cat;
    setActiveCatButton(state.activeCat);
    renderMenu(menu, settings, state);
    window.scrollTo({top: 0, behavior: "smooth"});
  });

  document.getElementById("q").addEventListener("input", (e)=>{
    state.query = e.target.value;
    renderMenu(menu, settings, state);
  });
}

document.addEventListener("DOMContentLoaded", init);
