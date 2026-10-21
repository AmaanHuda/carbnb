(async function () {
  const body = $("#rows");
  try {
    const list = await fetchBookings();
    if (!list.length) {
      $(".table-wrap").outerHTML =
        '<div class="empty"><h2>No cars are rented right now</h2><p>Bookings will show up here.</p><a class="btn" href="index.html">Browse cars</a></div>';
      return;
    }
    const t = today();
    body.innerHTML = list
      .map((b) => {
        const c = b.cars,
          active = b.start_date <= t;
        return `<tr>
        <td><div class="car"><img src="${esc((c.images || [])[0] || PLACEHOLDER)}" alt=""><span>${esc(c.year)} ${esc(c.brand)} ${esc(c.model)}</span></div></td>
        <td>${esc(c.owner_name)}<br><span style="color:var(--grey)">${esc(c.owner_phone || "")}</span></td>
        <td>${esc(b.renter_name)}<br><span style="color:var(--grey)">${esc(b.renter_phone || "")}</span></td>
        <td>${fmtDate(b.start_date)}</td><td>${fmtDate(b.end_date)}</td>
        <td>${dayCount(b.start_date, b.end_date)}</td><td>${money(b.total_price)}</td>
        <td><span class="pill-tag ${active ? "" : "up"}">${active ? "On rent" : "Upcoming"}</span></td>
        <td><b>${fmtDate(addDays(b.end_date, 1))}</b></td></tr>`;
      })
      .join("");
  } catch (e) {
    $(".table-wrap").outerHTML =
      '<div class="empty"><h2>Could not load bookings</h2><p>Check js/config.js and that schema.sql was run.<br>' +
      esc(e.message) +
      "</p></div>";
  }
})();
