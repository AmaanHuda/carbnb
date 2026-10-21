let cars = [],
  bookings = [],
  current = null;

async function load() {
  try {
    const [c, b] = await Promise.all([
      db.from("cars").select("*").order("created_at", { ascending: false }),
      fetchBookings(),
    ]);
    if (c.error) throw c.error;
    cars = c.data;
    bookings = b;
    render();
  } catch (e) {
    $("#grid").innerHTML =
      '<div class="empty" style="grid-column:1/-1"><h2>Could not load cars</h2><p>Check js/config.js and that supabase/schema.sql was run.<br>' +
      esc(e.message) +
      "</p></div>";
  }
}

const carBookings = (id) => bookings.filter((b) => b.car_id === id);
const rentedNow = (id) => carBookings(id).find((b) => b.start_date <= today());

function render() {
  const q = $("#q").value.toLowerCase(),
    fuel = $("#fFuel").value,
    tr = $("#fTrans").value,
    sort = $("#fSort").value;
  let list = cars.filter(
    (c) =>
      (!q ||
        [c.brand, c.model, c.title, c.location]
          .join(" ")
          .toLowerCase()
          .includes(q)) &&
      (!fuel || c.fuel === fuel) &&
      (!tr || c.transmission === tr),
  );
  if (sort === "low") list.sort((a, b) => a.price_per_day - b.price_per_day);
  if (sort === "high") list.sort((a, b) => b.price_per_day - a.price_per_day);
  if (!list.length) {
    $("#grid").innerHTML =
      '<div class="empty" style="grid-column:1/-1"><h2>' +
      (cars.length ? "No cars match your search" : "No cars listed yet") +
      "</h2><p>" +
      (cars.length
        ? "Try changing the filters."
        : "Be the first to list a car.") +
      '</p><button class="btn" onclick="openModal(\'#listModal\')">List your car</button></div>';
    return;
  }
  $("#grid").innerHTML = list
    .map((c) => {
      const r = rentedNow(c.id);
      return `<button class="card" data-id="${c.id}">
      <div class="ph"><img src="${esc((c.images || [])[0] || PLACEHOLDER)}" alt="${esc(c.title)}" loading="lazy">
      <span class="badge ${r ? "rented" : ""}">${r ? "Rented till " + fmtDate(r.end_date) : "Available"}</span></div>
      <h3>${esc(c.year)} ${esc(c.brand)} ${esc(c.model)}</h3>
      <div class="sub">${esc(c.location)} · ${esc(c.transmission)} · ${esc(c.fuel)}</div>
      <div class="price"><b>${money(c.price_per_day)}</b> / day</div></button>`;
    })
    .join("");
}

function showCar(id) {
  current = cars.find((c) => c.id === id);
  const c = current,
    imgs = c.images && c.images.length ? c.images : [PLACEHOLDER],
    r = rentedNow(id),
    bl = carBookings(id);
  const spec = [
    ["Brand", c.brand],
    ["Model", c.model],
    ["Year", c.year],
    ["Transmission", c.transmission],
    ["Fuel", c.fuel],
    ["Seats", c.seats],
    [
      "Kilometres driven",
      c.mileage != null
        ? Number(c.mileage).toLocaleString("en-IN") + " km"
        : null,
    ],
    ["Colour", c.color],
    ["Pickup city", c.location],
  ]
    .filter((s) => s[1] !== null && s[1] !== "" && s[1] !== undefined)
    .map((s) => `<tr><th>${s[0]}</th><td>${esc(s[1])}</td></tr>`)
    .join("");
  const minStart = r ? addDays(r.end_date, 1) : today();
  $("#carSheet").innerHTML =
    `<button class="x" data-close aria-label="Close">✕</button>
  <div class="pd">
    <div class="thumbs">${imgs.map((u, i) => `<img src="${esc(u)}" class="${i ? "" : "on"}" alt="">`).join("")}</div>
    <div><img class="main-img" id="mainImg" src="${esc(imgs[0])}" alt=""></div>
    <div class="info">
      <h2>${esc(c.title)}</h2><div class="by">Listed by ${esc(c.owner_name)}${c.owner_phone ? " · " + esc(c.owner_phone) : ""}</div>
      <div class="big-price">${money(c.price_per_day)} <small>per day</small></div>
      <table class="specs">${spec}</table>
      <div class="about"><h4>About this car</h4><p>${esc(c.description || "No description provided.")}</p></div>
    </div>
    <form class="buybox" id="bookForm">
      <div class="status ${r ? "rented" : ""}">${r ? "Rented until " + fmtDate(r.end_date) : "Available now"}</div>
      <label>Your name<input name="renter_name" required></label>
      <label>Phone<input name="renter_phone" type="tel" required></label>
      <label>Pick-up date<input name="start" type="date" min="${minStart}" value="${minStart}" required></label>
      <label>Return date<input name="end" type="date" min="${minStart}" value="${minStart}" required></label>
      <div class="total"><span id="tDays">1 day</span><span id="tPrice">${money(c.price_per_day)}</span></div>
      <button class="btn block" id="bookBtn">Rent this car</button>
      ${bl.length ? `<div class="booked-list">Already booked:<br>${bl.map((b) => fmtDate(b.start_date) + " – " + fmtDate(b.end_date)).join("<br>")}</div>` : ""}
    </form>
  </div>`;
  const f = $("#bookForm");
  const upd = () => {
    if (f.end.value < f.start.value) f.end.value = f.start.value;
    f.end.min = f.start.value;
    const n = dayCount(f.start.value, f.end.value);
    $("#tDays").textContent = n + (n > 1 ? " days" : " day");
    $("#tPrice").textContent = money(n * c.price_per_day);
  };
  f.start.onchange = f.end.onchange = upd;
  f.onsubmit = book;
  document.querySelectorAll(".thumbs img").forEach(
    (t) =>
      (t.onclick = () => {
        $("#mainImg").src = t.src;
        document
          .querySelectorAll(".thumbs img")
          .forEach((x) => x.classList.toggle("on", x === t));
      }),
  );
  openModal("#carModal");
}

async function book(e) {
  e.preventDefault();
  const f = e.target,
    s = f.start.value,
    en = f.end.value;
  if (
    carBookings(current.id).some((b) => s <= b.end_date && en >= b.start_date)
  )
    return toast("Those dates overlap an existing booking.", true);
  $("#bookBtn").disabled = true;
  const { error } = await db.from("bookings").insert({
    car_id: current.id,
    renter_name: f.renter_name.value.trim(),
    renter_phone: f.renter_phone.value.trim(),
    start_date: s,
    end_date: en,
    total_price: dayCount(s, en) * current.price_per_day,
  });
  $("#bookBtn").disabled = false;
  if (error) return toast(error.message, true);
  closeModals();
  toast("Car rented. See it under Rented cars.");
  load();
}

async function listCar(e) {
  e.preventDefault();
  const f = e.target,
    btn = $("#listSubmit");
  btn.disabled = true;
  btn.textContent = "Publishing…";
  try {
    const urls = [];
    for (const file of [...$("#photos").files].slice(0, 6)) {
      const path =
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2) +
        "-" +
        file.name.replace(/[^\w.]/g, "_");
      const { error } = await db.storage.from("car-images").upload(path, file);
      if (error) throw error;
      urls.push(
        db.storage.from("car-images").getPublicUrl(path).data.publicUrl,
      );
    }
    const d = Object.fromEntries(new FormData(f));
    ["year", "seats", "mileage", "price_per_day"].forEach(
      (k) => (d[k] = d[k] === "" ? null : Number(d[k])),
    );
    delete d.photos;
    d.images = urls;
    const { error } = await db.from("cars").insert(d);
    if (error) throw error;
    f.reset();
    $("#previews").innerHTML = "";
    closeModals();
    toast("Your car is listed.");
    load();
  } catch (err) {
    toast(err.message, true);
  }
  btn.disabled = false;
  btn.textContent = "Publish listing";
}

$("#listBtn").onclick = () => openModal("#listModal");
$("#listForm").onsubmit = listCar;
$("#photos").onchange = (e) => {
  $("#previews").innerHTML = [...e.target.files]
    .slice(0, 6)
    .map((f) => `<img src="${URL.createObjectURL(f)}" alt="">`)
    .join("");
};
$("#grid").onclick = (e) => {
  const c = e.target.closest(".card");
  if (c) showCar(Number(c.dataset.id));
};
["#q", "#fFuel", "#fTrans", "#fSort"].forEach((s) =>
  $(s).addEventListener("input", render),
);
load();
