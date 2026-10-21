let tab = "cars",
  cars = [],
  bookings = [];
const show = (id) =>
  ["#login", "#denied", "#dash"].forEach((s) => ($(s).hidden = s !== id));

async function start() {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    show("#login");
    $("#logout").hidden = true;
    return;
  }
  $("#logout").hidden = false;
  const { data: ok, error } = await db.rpc("is_admin");
  if (error || !ok) return show("#denied");
  show("#dash");
  await refresh();
}

async function refresh() {
  const [c, b] = await Promise.all([
    db.from("cars").select("*").order("created_at", { ascending: false }),
    db
      .from("bookings")
      .select("*, cars(title, brand, model, year)")
      .order("start_date", { ascending: false }),
  ]);
  if (c.error || b.error) return toast((c.error || b.error).message, true);
  cars = c.data;
  bookings = b.data;
  render();
}

function render() {
  document
    .querySelectorAll("#tabs a")
    .forEach((a) => a.classList.toggle("on", a.dataset.t === tab));
  if (tab === "cars") {
    $("#thead").innerHTML =
      "<tr><th>Car</th><th>Owner</th><th>City</th><th>Rent / day</th><th>Listed</th><th></th></tr>";
    $("#tbody").innerHTML =
      cars
        .map(
          (c) => `<tr>
      <td><div class="car"><img src="${esc((c.images || [])[0] || PLACEHOLDER)}" alt=""><span>${esc(c.year)} ${esc(c.brand)} ${esc(c.model)}<br><small style="font-weight:400;color:var(--grey)">${esc(c.title)}</small></span></div></td>
      <td>${esc(c.owner_name)}<br><span style="color:var(--grey)">${esc(c.owner_phone || "")}</span></td>
      <td>${esc(c.location)}</td><td>${money(c.price_per_day)}</td><td>${fmtDate(c.created_at.slice(0, 10))}</td>
      <td><button class="btn ghost" data-del="${c.id}">Delete</button></td></tr>`,
        )
        .join("") || '<tr><td colspan="6">No cars listed.</td></tr>';
  } else {
    $("#thead").innerHTML =
      "<tr><th>Car</th><th>Renter</th><th>From</th><th>Until</th><th>Total</th><th></th></tr>";
    $("#tbody").innerHTML =
      bookings
        .map(
          (b) => `<tr>
      <td>${esc(b.cars.year)} ${esc(b.cars.brand)} ${esc(b.cars.model)}</td>
      <td>${esc(b.renter_name)}<br><span style="color:var(--grey)">${esc(b.renter_phone || "")}</span></td>
      <td>${fmtDate(b.start_date)}</td><td>${fmtDate(b.end_date)}</td><td>${money(b.total_price)}</td>
      <td><button class="btn ghost" data-del="${b.id}">Delete</button></td></tr>`,
        )
        .join("") || '<tr><td colspan="6">No bookings.</td></tr>';
  }
}

async function del(id) {
  if (tab === "cars") {
    const c = cars.find((x) => x.id === id);
    if (
      !confirm(
        `Delete "${c.title}" and all its bookings? This cannot be undone.`,
      )
    )
      return;
    const { error } = await db.from("cars").delete().eq("id", id);
    if (error) return toast(error.message, true);
    const paths = (c.images || [])
      .map((u) => decodeURIComponent(u.split("/car-images/")[1] || ""))
      .filter(Boolean);
    if (paths.length) await db.storage.from("car-images").remove(paths);
  } else {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    const { error } = await db.from("bookings").delete().eq("id", id);
    if (error) return toast(error.message, true);
  }
  toast("Deleted.");
  refresh();
}

$("#loginForm").onsubmit = async (e) => {
  e.preventDefault();
  $("#loginBtn").disabled = true;
  const { error } = await db.auth.signInWithPassword({
    email: e.target.email.value,
    password: e.target.password.value,
  });
  $("#loginBtn").disabled = false;
  if (error) return toast(error.message, true);
  start();
};
$("#logout").onclick = async () => {
  await db.auth.signOut();
  start();
};
$("#tabs").onclick = (e) => {
  const a = e.target.closest("a");
  if (a) {
    e.preventDefault();
    tab = a.dataset.t;
    render();
  }
};
$("#tbody").onclick = (e) => {
  const b = e.target.closest("[data-del]");
  if (b) del(Number(b.dataset.del));
};
start();
