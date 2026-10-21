const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const x = new Date(d + "T00:00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};
const dayCount = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5) + 1;
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#f0f0f0"/><text x="300" y="210" font-family="sans-serif" font-size="22" fill="#b0b0b0" text-anchor="middle">No photo</text></svg>',
  );

function toast(msg, bad = false) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

function openModal(id) {
  $(id).classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModals() {
  document
    .querySelectorAll(".modal.open")
    .forEach((m) => m.classList.remove("open"));
  document.body.style.overflow = "";
}
document.addEventListener("click", (e) => {
  if (e.target.matches(".modal") || e.target.closest("[data-close]"))
    closeModals();
});
document.addEventListener(
  "keydown",
  (e) => e.key === "Escape" && closeModals(),
);

// Active + upcoming bookings (used by both pages)
async function fetchBookings() {
  const { data, error } = await db
    .from("bookings")
    .select("*, cars(*)")
    .gte("end_date", today())
    .order("start_date");
  if (error) throw error;
  return data;
}

// Show "Dashboard" in the nav when an admin session exists
db.auth.getSession().then(({ data }) => {
  const a = $("#adminLink");
  if (a && data.session) a.textContent = "Dashboard";
});
