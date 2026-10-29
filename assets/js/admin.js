/* Orvio Systems · admin dashboard */
(function () {
  "use strict";
  var CFG = window.ORVIO, S = window.ORVIO_SCHEMA;
  var PREVIEW = !CFG.API_URL;
  var KEY_STORE = "orvio_admin_key", ROLE_STORE = "orvio_admin_role";
  var TZ = "Africa/Kigali";
  var app = document.getElementById("app");
  var cache = { training: null, forum: null }, lastSync = null, timer = null;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(name) {
    var p = {
      chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
      users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4"/>',
      globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.3 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.3-3.4-8.5s1-6.1 3.4-8.5z"/>',
      layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z"/><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
      trend: '<path d="m3.5 16 5.5-5.5 4 4 7.5-7.5"/><path d="M15 7h5.5v5.5"/>',
      leaf: '<path d="M5 19c0-8 5-13.5 14-14 .5 9-5 14-13 14z"/><path d="M5 19c3-4 6-7 10-9"/>',
      out: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
      download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
      award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4 7.5 20.5l4.5-2.4 4.5 2.4-1.1-7.1"/>',
      map: '<path d="M12 20.5s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z"/><circle cx="12" cy="9.5" r="2.4"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    }[name] || "";
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>";
  }
  function fmtDate(iso, withTime) {
    var d = new Date(iso); if (isNaN(d)) return iso || "";
    return d.toLocaleString("en-GB", withTime ? { timeZone: TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } : { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
  }
  function dayKey(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-CA", { timeZone: TZ }); }
  function labelsFor(ev) { var m = {}; S[ev].forEach(function (f) { if (f.key) m[f.key] = f.type === "consent" ? "Consent" : f.label; }); return m; }
  function getKey() { try { return sessionStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { k ? sessionStorage.setItem(KEY_STORE, k) : sessionStorage.removeItem(KEY_STORE); } catch (e) {} if (!k) setRole(""); }
  function getRole() { try { return sessionStorage.getItem(ROLE_STORE) || "admin"; } catch (e) { return "admin"; } }
  function setRole(r) { try { r ? sessionStorage.setItem(ROLE_STORE, r) : sessionStorage.removeItem(ROLE_STORE); } catch (e) {} }
  function isSuper() { return getRole() === "super"; }

  /* ---------- data ---------- */
  function previewKey(ev) { return "orvio_" + CFG.event.code + "_" + ev; }
  function previewLoad(ev) { try { return JSON.parse(localStorage.getItem(previewKey(ev)) || "[]"); } catch (e) { return []; } }
  function previewStore(ev, rows) { try { localStorage.setItem(previewKey(ev), JSON.stringify(rows)); } catch (e) {} }

  function api(params) {
    var q = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(CFG.API_URL + "?" + q).then(function (r) { return r.json(); });
  }
  function apiPost(body) {
    return fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function load(ev) {
    if (PREVIEW) { cache[ev] = previewLoad(ev); return Promise.resolve(cache[ev]); }
    return api({ action: "list", event: ev, key: getKey() }).then(function (res) {
      if (!res.ok) throw new Error(res.error || "Could not load");
      if (res.role) setRole(res.role);
      cache[ev] = res.rows || []; return cache[ev];
    });
  }
  function setArchived(ev, ref, archived) {
    if (PREVIEW) {
      var rows = previewLoad(ev).map(function (r) { if (r.ref === ref) r.archived = archived; return r; });
      previewStore(ev, rows); return Promise.resolve();
    }
    return apiPost({ action: "archive", key: getKey(), event: ev, ref: ref, archived: archived }).then(function (res) { if (!res.ok) throw new Error(res.error); });
  }
  function deleteReg(ev, ref) {
    if (PREVIEW) { previewStore(ev, previewLoad(ev).filter(function (r) { return r.ref !== ref; })); return Promise.resolve(); }
    return apiPost({ action: "delete", key: getKey(), event: ev, ref: ref }).then(function (res) { if (!res.ok) throw new Error(res.error); });
  }
  function active(rows) { return rows.filter(function (r) { return !r.archived; }); }

  /* ---------- login ---------- */
  function renderLogin(err) {
    app.innerHTML =
      '<main class="login"><form class="login-card" id="login">' +
      '<span class="brand">' + ic("leaf") + "<span>Rwanda<br>Tourism Forum</span></span>" +
      "<h1>Registration admin</h1><p>" + esc(CFG.event.name) + "</p>" +
      '<label for="key">Access key</label><input id="key" type="password" autocomplete="current-password" required' + (PREVIEW ? ' value="preview"' : "") + ">" +
      '<button class="btn btn-primary" type="submit">Sign in</button>' +
      '<p class="login-err" role="alert">' + esc(err || "") + "</p>" +
      (PREVIEW ? '<p class="small" style="margin:0;font-size:13px;color:var(--muted)">Preview mode: any access key works. Type "super" to try the super admin view.</p>' : "") +
      "</form></main>";
    document.getElementById("login").addEventListener("submit", function (e) {
      e.preventDefault();
      var k = document.getElementById("key").value.trim(); if (!k) return;
      setKey(k);
      if (PREVIEW) { setRole(k.toLowerCase() === "super" ? "super" : "admin"); route(); return; }
      var btn = e.target.querySelector("button"); btn.disabled = true; btn.textContent = "Checking…";
      api({ action: "list", event: "forum", key: k }).then(function (res) {
        if (!res.ok) { setKey(""); renderLogin("That access key isn't valid."); return; }
        setRole(res.role || "admin"); cache.forum = res.rows || []; route();
      }).catch(function () { setKey(""); renderLogin("Couldn't reach the registration server. Try again."); });
    });
  }

  /* ---------- shell ---------- */
  var NAV = [
    { ev: "forum", title: "Tourism Forum & Awards" },
    { ev: "training", title: "Hustle Academy Training" },
  ];
  function shell(ev, view) {
    var nav = NAV.map(function (n) {
      return '<p class="nav-title">' + n.title + "</p>" +
        '<a href="#/' + n.ev + '/dashboard"' + (n.ev === ev && view === "dashboard" ? ' class="is-active" aria-current="page"' : "") + ">" + ic("chart") + "Dashboard</a>" +
        '<a href="#/' + n.ev + '/registrations"' + (n.ev === ev && view === "registrations" ? ' class="is-active" aria-current="page"' : "") + ">" + ic("users") + "Registrations</a>";
    }).join("");
    app.innerHTML =
      '<div class="shell"><aside class="side" id="side"><a class="brand" href="#/forum/dashboard">' + ic("leaf") + "<span>Rwanda<br>Tourism<br>Forum</span></a>" +
      '<nav class="nav" aria-label="Admin">' + nav + "</nav>" +
      '<div class="side-foot"><button type="button" id="signout">' + ic("out") + "Sign out</button></div></aside>" +
      '<main class="main" id="main"><button class="menu-btn" id="menu" aria-expanded="false" aria-controls="side">' + ic("menu") + "Menu</button><div id='view'></div></main></div>" +
      '<div class="drawer" id="drawer" hidden><div class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="dr-title" id="drawer-panel"></div></div>';
    document.getElementById("signout").addEventListener("click", function () { setKey(""); cache = { training: null, forum: null }; clearInterval(timer); location.hash = ""; renderLogin(); });
    var side = document.getElementById("side"), menu = document.getElementById("menu");
    menu.addEventListener("click", function () { var o = side.classList.toggle("is-open"); menu.setAttribute("aria-expanded", o); });
    side.addEventListener("click", function (e) { if (e.target.closest("a")) side.classList.remove("is-open"); });
    return document.getElementById("view");
  }

  function head(title, sub, ev) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1><p class="page-sub">' + esc(sub) + "</p></div></div>" +
      (PREVIEW ? '<div class="banner"><span><strong>Preview mode.</strong> Data shown is stored in this browser only. Connect the Google Sheet to see live registrations from everyone.</span><button class="btn btn-line btn-sm" id="sample">Add sample registrations</button><button class="btn btn-line btn-sm" id="clear">Clear preview data</button></div>' : "") +
      '<div class="page-meta"><span>All registrations · Times in Kigali</span><span class="live" id="live">Live' + (lastSync ? " · updated " + lastSync.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "") + "</span></div>";
  }

  /* ---------- breakdown helpers ---------- */
  function countBy(rows, key) {
    var m = {}; rows.forEach(function (r) { var v = (r[key] || "").toString().trim() || "Not specified"; m[v] = (m[v] || 0) + 1; });
    return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
  }
  function distinct(rows, key) { var s = {}; rows.forEach(function (r) { var v = (r[key] || "").toString().trim().toLowerCase(); if (v) s[v] = 1; }); return Object.keys(s).length; }
  function bars(list, total, cls, showPct) {
    if (!list.length) return '<p class="empty">No registrations yet.</p>';
    var max = Math.max.apply(null, list.map(function (x) { return x[1]; }));
    return '<ul class="bars ' + (cls || "") + '">' + list.map(function (x) {
      var pct = total ? Math.round(x[1] / total * 100) : 0, w = showPct ? pct : Math.round(x[1] / max * 100);
      return '<li class="bar-row"><span>' + esc(x[0]) + '</span><span class="n">' + x[1] + "</span>" + (showPct ? '<span class="pct">' + pct + "%</span>" : "<span></span>") +
        '<span class="track"><span class="fill" style="width:' + w + '%"></span></span></li>';
    }).join("") + "</ul>";
  }
  function stat(label, num, note, icon, gold) {
    return '<div class="panel"><div class="stat-top"><span class="stat-label">' + esc(label) + '</span><span class="stat-icon' + (gold ? " gold" : "") + '">' + ic(icon) + '</span></div><p class="stat-num">' + num + '</p><p class="stat-note">' + esc(note) + "</p></div>";
  }
  function breakdown(title, sub, icon, list, total) {
    return '<section class="panel"><div class="panel-head"><div><h2>' + esc(title) + "</h2><p>" + esc(sub) + "</p></div>" + ic(icon) + '</div><p class="caption">Count and share of current registrations</p>' + bars(list, total, "", true) + "</section>";
  }

  /* ---------- dashboard ---------- */
  function dashboard(ev) {
    var view = shell(ev, "dashboard"), rows = active(cache[ev] || []), total = rows.length, html;
    var title = ev === "forum" ? "Rwanda Tourism Forum & Awards 2026" : "Hustle Academy Training on Practical AI for Marketing";
    html = head(title, "Dashboard", ev);
    if (ev === "forum") {
      html += '<div class="stats">' +
        stat("Total registrations", total, "Current registrations · archived records excluded", "users") +
        stat("Countries represented", distinct(rows, "country"), "Connecting people across borders", "globe") +
        stat("Delegate categories", distinct(rows, "category"), "A community of tourism perspectives", "layers", true) + "</div>" +
        '<div class="duo">' + breakdown("Who's joining", "Registrations by delegate category", "users", countBy(rows, "category"), total) +
        breakdown("Where we're connecting", "Registrations by country of residence", "globe", countBy(rows, "country"), total) + "</div>";
    } else {
      html += '<div class="stats">' +
        stat("Total registrations", total, "Current registrations · archived records excluded", "users") +
        stat("Associations represented", distinct(rows.filter(function (r) { return r.association && r.association.indexOf("Not a member") !== 0; }), "association"), "RCOT member associations taking part", "layers") +
        stat("Certificates to issue", rows.filter(function (r) { return r.certificate_name; }).length, "Names confirmed for certificates", "award", true) + "</div>" +
        '<div class="duo">' + breakdown("Who's joining", "Registrations by association", "users", countBy(rows, "association"), total) +
        breakdown("Where we're connecting", "Registrations by province", "map", countBy(rows, "province"), total) + "</div>";
    }
    var days = {}; rows.forEach(function (r) { var k = dayKey(r.timestamp); if (k) days[k] = (days[k] || 0) + 1; });
    var dlist = Object.keys(days).sort().reverse().map(function (k) { return [fmtDate(k + "T12:00:00Z"), days[k]]; });
    html += '<section class="panel"><div class="panel-head"><div><h2>Daily registrations (Kigali)</h2><p>Registration activity by day · Kigali time</p></div>' + ic("trend") + '</div><p class="caption">Daily counts · bars relative to the busiest day</p>' + bars(dlist, total, "teal", false) + "</section>";
    view.innerHTML = html;
    wirePreview(ev);
  }

  /* ---------- registrations table ---------- */
  var tableState = { q: "", archived: false, filter: "" };
  function registrations(ev) {
    var view = shell(ev, "registrations");
    var title = ev === "forum" ? "Rwanda Tourism Forum & Awards 2026" : "Hustle Academy Training on Practical AI for Marketing";
    var filterKey = ev === "forum" ? "category" : "association";
    var filterOpts = countBy(active(cache[ev] || []), filterKey).map(function (x) { return x[0]; });
    view.innerHTML = head(title, "Registrations", ev) +
      '<div class="toolbar"><label class="search">' + ic("search") + '<span class="visually-hidden">Search</span><input id="q" type="search" placeholder="Search name, email, organisation, reference…" value="' + esc(tableState.q) + '"></label>' +
      '<select id="flt" aria-label="Filter"><option value="">All ' + (ev === "forum" ? "categories" : "associations") + "</option>" + filterOpts.map(function (o) { return "<option" + (o === tableState.filter ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>" +
      '<label class="check-inline"><input type="checkbox" id="arch"' + (tableState.archived ? " checked" : "") + "> Show archived</label>" +
      '<button class="btn btn-line" id="csv">' + ic("download") + "CSV</button>" +
      '<button class="btn btn-primary" id="xlsx">' + ic("download") + "Excel</button>" +
      (ev === "training" ? '<button class="btn btn-line" id="certs">' + ic("award") + "Certificate names</button>" : "") +
      '</div><div id="tbl"></div>';
    var q = view.querySelector("#q"), flt = view.querySelector("#flt"), arch = view.querySelector("#arch");
    function draw() {
      var rows = (cache[ev] || []).slice().reverse().filter(function (r) {
        if (!tableState.archived && r.archived) return false;
        if (tableState.filter && (r[filterKey] || "Not specified") !== tableState.filter) return false;
        if (!tableState.q) return true;
        var hay = [r.ref, r.full_name, r.email, r.organisation, r.phone, r.category, r.association, r.certificate_name].join(" ").toLowerCase();
        return hay.indexOf(tableState.q.toLowerCase()) >= 0;
      });
      var cols = ev === "forum"
        ? [["Ref", "ref"], ["Name", "full_name"], ["Organisation", "organisation"], ["Category", "category"], ["Country", "country"], ["Phone", "phone"], ["Registered", "timestamp"]]
        : [["Ref", "ref"], ["Name", "full_name"], ["Organisation", "organisation"], ["Association", "association"], ["Certificate name", "certificate_name"], ["Phone", "phone"], ["Registered", "timestamp"]];
      var html = '<div class="table-wrap"><table><thead><tr>' + cols.map(function (c) { return '<th scope="col">' + c[0] + "</th>"; }).join("") + "</tr></thead><tbody>";
      if (!rows.length) html += '<tr><td colspan="' + cols.length + '" class="empty">No registrations match.</td></tr>';
      rows.forEach(function (r) {
        html += '<tr data-ref="' + esc(r.ref) + '" class="' + (r.archived ? "is-archived" : "") + '" tabindex="0" style="cursor:pointer">' + cols.map(function (c) {
          var v = r[c[1]];
          if (c[1] === "ref") return '<td><span class="ref">' + esc(v) + "</span></td>";
          if (c[1] === "full_name") return "<td><strong>" + esc(v) + '</strong><span class="sub">' + esc(r.email) + "</span></td>";
          if (c[1] === "timestamp") return "<td>" + esc(fmtDate(v, true)) + "</td>";
          if (c[1] === "category") return '<td><span class="pill">' + esc(v) + "</span></td>";
          return "<td>" + esc(v) + "</td>";
        }).join("") + "</tr>";
      });
      html += "</tbody></table></div><p class='count-line'>Showing " + rows.length + " of " + (cache[ev] || []).length + " registrations</p>";
      view.querySelector("#tbl").innerHTML = html;
    }
    q.addEventListener("input", function () { tableState.q = q.value; draw(); });
    flt.addEventListener("change", function () { tableState.filter = flt.value; draw(); });
    arch.addEventListener("change", function () { tableState.archived = arch.checked; draw(); });
    view.querySelector("#tbl").addEventListener("click", function (e) { var tr = e.target.closest("tr[data-ref]"); if (tr) openDetail(ev, tr.getAttribute("data-ref")); });
    view.querySelector("#tbl").addEventListener("keydown", function (e) { var tr = e.target.closest("tr[data-ref]"); if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDetail(ev, tr.getAttribute("data-ref")); } });
    view.querySelector("#csv").addEventListener("click", function () { exportRows(ev, "csv"); });
    view.querySelector("#xlsx").addEventListener("click", function () { exportRows(ev, "xlsx"); });
    var c = view.querySelector("#certs"); if (c) c.addEventListener("click", function () { exportCerts(); });
    draw();
    registrations.redraw = draw;
    wirePreview(ev);
  }

  function openDetail(ev, ref) {
    var r = (cache[ev] || []).filter(function (x) { return x.ref === ref; })[0]; if (!r) return;
    var labels = labelsFor(ev), drawer = document.getElementById("drawer"), panel = document.getElementById("drawer-panel");
    var rows = [["Reference", r.ref], ["Registered", fmtDate(r.timestamp, true)]].concat(r.updated_at ? [["Last updated", fmtDate(r.updated_at, true)]] : []).concat(Object.keys(labels).map(function (k) { return [labels[k], r[k]]; }));
    panel.innerHTML = '<button class="close-x" aria-label="Close" id="dr-close">×</button><h2 id="dr-title">' + esc(r.full_name) + '</h2><p class="page-sub">' + esc(r.organisation || "") + "</p>" +
      "<dl>" + rows.map(function (x) { return "<div><dt>" + esc(x[0]) + "</dt><dd>" + esc(x[1] || "–") + "</dd></div>"; }).join("") + "</dl>" +
      '<div class="drawer-actions"><a class="btn btn-line" href="mailto:' + esc(r.email) + '">Email</a>' + (r.phone ? '<a class="btn btn-line" href="https://wa.me/' + esc(String(r.phone).replace(/\D/g, "")) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") +
      '<button class="btn ' + (r.archived ? "btn-primary" : "btn-line") + '" id="dr-arch">' + (r.archived ? "Restore registration" : "Archive registration") + "</button></div>" +
      '<p class="caption" style="margin-top:14px">Archived registrations are hidden from counts and exports but never deleted.</p>' +
      (isSuper() ? '<div class="danger-zone"><p class="danger-title">Super admin</p><p class="caption">Deleting removes this registration from the Google Sheet permanently. This can\'t be undone.</p>' +
        '<div class="drawer-actions" id="del-wrap"><button class="btn btn-danger" id="dr-del">Delete permanently</button></div></div>' : "");
    drawer.hidden = false;
    var close = function () { drawer.hidden = true; document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    panel.querySelector("#dr-close").addEventListener("click", close);
    panel.querySelector("#dr-close").focus();
    drawer.addEventListener("click", function (e) { if (e.target === drawer) close(); }, { once: true });
    var del = panel.querySelector("#dr-del");
    if (del) del.addEventListener("click", function () {
      var wrap = panel.querySelector("#del-wrap");
      wrap.innerHTML = '<span class="confirm-q">Delete ' + esc(r.full_name) + ' for good?</span><button class="btn btn-danger" id="del-yes">Yes, delete</button><button class="btn btn-line" id="del-no">Cancel</button>';
      wrap.querySelector("#del-no").addEventListener("click", function () { close(); openDetail(ev, ref); });
      wrap.querySelector("#del-yes").addEventListener("click", function () {
        var b = this; b.disabled = true; b.textContent = "Deleting…";
        deleteReg(ev, r.ref).then(function () { return load(ev); }).then(function () { close(); route(); })
          .catch(function () { b.disabled = false; b.textContent = "Couldn't delete. Try again"; });
      });
    });
    panel.querySelector("#dr-arch").addEventListener("click", function () {
      var b = this; b.disabled = true;
      setArchived(ev, r.ref, !r.archived).then(function () { return load(ev); }).then(function () { close(); route(); })
        .catch(function () { b.disabled = false; b.textContent = "Couldn't update. Try again"; });
    });
  }

  /* ---------- export ---------- */
  function exportTable(ev) {
    var labels = labelsFor(ev), keys = Object.keys(labels);
    var header = ["Reference", "Registered (Kigali)"].concat(keys.map(function (k) { return labels[k]; }));
    var rows = active(cache[ev] || []).map(function (r) { return [r.ref, fmtDate(r.timestamp, true)].concat(keys.map(function (k) { return r[k] == null ? "" : String(r[k]); })); });
    return [header].concat(rows);
  }
  function fileBase(ev) { return CFG.event.code + "_" + (ev === "forum" ? "Tourism-Forum-Awards" : "Hustle-Academy-Training") + "_" + new Date().toLocaleDateString("en-CA", { timeZone: TZ }); }
  function download(name, blob) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function toCSV(aoa) { return "﻿" + aoa.map(function (row) { return row.map(function (v) { v = String(v == null ? "" : v); if (/^[=+\-@\t\r]/.test(v) && !/^[+\-]?[\d\s().\-]+$/.test(v)) v = "'" + v; /* a value starting with = could run as a spreadsheet formula */ return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n"); }
  function withXLSX(cb) {
    if (window.XLSX) return cb();
    var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload = cb;
    s.onerror = function () { alert("Excel export couldn't load. Use CSV instead (it opens in Excel)."); };
    document.head.appendChild(s);
  }
  function saveAoa(aoa, name, sheet, fmt) {
    if (fmt === "csv") { download(name + ".csv", new Blob([toCSV(aoa)], { type: "text/csv;charset=utf-8" })); return; }
    withXLSX(function () {
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = aoa[0].map(function (h, i) { var w = Math.max.apply(null, aoa.map(function (r) { return String(r[i] || "").length; })); return { wch: Math.min(Math.max(w, 10), 50) }; });
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sheet); XLSX.writeFile(wb, name + ".xlsx");
    });
  }
  function exportRows(ev, fmt) { saveAoa(exportTable(ev), fileBase(ev), ev === "forum" ? "Tourism Forum and Awards" : "Hustle Academy Training", fmt); }
  function exportCerts() {
    var rows = active(cache.training || []).slice().sort(function (a, b) { return (a.certificate_name || "").localeCompare(b.certificate_name || ""); });
    var aoa = [["No.", "Name on certificate", "Full name", "Organisation", "Email", "Reference"]].concat(rows.map(function (r, i) { return [i + 1, r.certificate_name, r.full_name, r.organisation, r.email, r.ref]; }));
    saveAoa(aoa, CFG.event.code + "_Certificate-Names_" + new Date().toLocaleDateString("en-CA", { timeZone: TZ }), "Certificate names", "xlsx");
  }

  /* ---------- preview helpers ---------- */
  function wirePreview(ev) {
    var s = document.getElementById("sample"), c = document.getElementById("clear");
    if (s) s.addEventListener("click", function () { addSamples(ev); });
    if (c) c.addEventListener("click", function () { previewStore(ev, []); load(ev).then(route); });
  }
  function addSamples(ev) {
    var names = [["Aline Uwase", "Kivu Lodge Ltd"], ["Eric Mugisha", "Volcano Trails"], ["Grace Ingabire", "Kigali Heights Hotel"], ["Jean Bosco Habimana", "Akagera Safaris"], ["Diane Mukamana", "Nyungwe Eco Tours"], ["Patrick Niyonzima", "Lake Kivu Boats"]];
    var rows = previewLoad(ev), now = Date.now();
    names.forEach(function (n, i) {
      var base = { ref: (ev === "forum" ? "RTF" : "TRN") + "-SMP" + i + Math.floor(Math.random() * 9), timestamp: new Date(now - i * 26 * 3600e3).toISOString(), full_name: n[0] + " (sample)", organisation: n[1], email: "sample" + i + "@example.com", phone: "+250 78" + (1000000 + i * 1234567).toString().slice(0, 7), sample: true };
      if (ev === "forum") Object.assign(base, { job_title: ["Managing Director", "Marketing Manager", "Operations Lead"][i % 3], category: ["Delegate", "Exhibitor", "Award Nominee", "Delegate", "Media", "Sponsor / Partner"][i], country: ["Rwanda", "Rwanda", "Uganda", "Kenya", "Rwanda", "Tanzania"][i], consent: "Yes" });
      else Object.assign(base, { association: S.training[1].options[i % 8], gender: i % 2 ? "Male" : "Female", age_group: ["25–34", "35–44", "25–34", "45–54", "18–24", "35–44"][i], job_title: "Marketing Officer", department: "Sales & Marketing", province: ["Kigali City", "Western Province", "Kigali City", "Eastern Province", "Southern Province", "Western Province"][i], district: ["Gasabo", "Rubavu", "Kicukiro", "Kayonza", "Huye", "Karongi"][i], sector: "Sample sector", marketing_role: ["Directly responsible", "Partially responsible", "Directly responsible", "Directly responsible", "Partially responsible", "Not currently responsible"][i], certificate_name: n[0], objective: "Use AI to plan campaigns", expected_skills: "Content creation with AI tools", consent: "Yes" });
      rows.push(base);
    });
    previewStore(ev, rows); load(ev).then(route);
  }

  /* ---------- routing & polling ---------- */
  function parse() { var m = location.hash.match(/^#\/(forum|training)\/(dashboard|registrations)$/); return m ? { ev: m[1], view: m[2] } : { ev: "forum", view: "dashboard" }; }
  function render() { var p = parse(); (p.view === "dashboard" ? dashboard : registrations)(p.ev); }
  function route() {
    if (!getKey()) { renderLogin(); return; }
    var p = parse();
    if (cache[p.ev]) render();
    else { app.innerHTML = '<main class="login"><p>Loading registrations…</p></main>'; }
    load(p.ev).then(function () { lastSync = new Date(); render(); }).catch(function () { setKey(""); renderLogin("Your session expired or the key is no longer valid."); });
    clearInterval(timer);
    timer = setInterval(function () {
      if (document.hidden || !document.getElementById("live")) return;
      var ae = document.activeElement; if (ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT")) return;
      var p2 = parse();
      load(p2.ev).then(function () {
        lastSync = new Date();
        if (!document.getElementById("drawer") || !document.getElementById("drawer").hidden) return;
        var y = window.scrollY; render(); window.scrollTo(0, y);
      }).catch(function () {});
    }, PREVIEW ? 5000 : 20000);
  }
  window.addEventListener("hashchange", route);
  route();
})();
