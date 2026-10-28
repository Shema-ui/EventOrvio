/* Orvio Systems · registration form engine */
(function () {
  "use strict";
  var CFG = window.ORVIO, S = window.ORVIO_SCHEMA;
  var root = document.querySelector("[data-reg]");
  if (!root) return;
  var eventKey = root.getAttribute("data-reg");             // "training" | "forum"
  var session = CFG.sessions[eventKey];
  var fields = S[eventKey];
  var form = document.getElementById("reg-form");
  var PREVIEW = !CFG.API_URL;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function req(f) { return f.required ? ' <span class="req" aria-hidden="true">*</span>' : ' <span class="opt">(optional)</span>'; }

  /* ---------- Render ---------- */
  var html = "", open = false;
  fields.forEach(function (f) {
    if ("section" in f) {
      if (open) html += "</div></fieldset>";
      html += '<fieldset class="fs">' + (f.section ? "<legend>" + esc(f.section) + "</legend>" : "") + '<div class="grid">';
      open = true;
      return;
    }
    var id = "f-" + f.key, cls = "field" + (f.half ? " half" : ""), help = f.help ? '<p class="help" id="' + id + '-help">' + esc(f.help) + "</p>" : "";
    var desc = f.help ? ' aria-describedby="' + id + '-help"' : "";
    var r = f.required ? " required" : "";
    if (f.type === "radio") {
      html += '<div class="' + cls + '" role="radiogroup" aria-labelledby="' + id + '-l" data-key="' + f.key + '"><span class="label" id="' + id + '-l">' + esc(f.label) + req(f) + '</span><div class="chips">' +
        f.options.map(function (o, i) { return '<label class="chip"><input type="radio" name="' + f.key + '" value="' + esc(o) + '"' + (i === 0 ? r : "") + "><span>" + esc(o) + "</span></label>"; }).join("") +
        "</div>" + help + "</div>";
    } else if (f.type === "select" || f.type === "province" || f.type === "district") {
      var opts = f.type === "province" ? Object.keys(S.RWANDA) : (f.type === "district" ? [] : f.options);
      html += '<div class="' + cls + '"><label for="' + id + '">' + esc(f.label) + req(f) + '</label><select id="' + id + '" name="' + f.key + '"' + r + desc + (f.type === "district" ? " disabled" : "") + '><option value="">' + (f.type === "district" ? "Choose a province first" : "Select…") + "</option>" +
        opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select>" + help + "</div>";
    } else if (f.type === "textarea") {
      html += '<div class="' + cls + '"><label for="' + id + '">' + esc(f.label) + req(f) + '</label><textarea id="' + id + '" name="' + f.key + '" rows="3"' + r + desc + ' maxlength="1000"></textarea>' + help + "</div>";
    } else if (f.type === "certificate") {
      html += '<div class="' + cls + ' cert-field"><label for="' + id + '">' + esc(f.label) + req(f) + '</label><input id="' + id + '" name="' + f.key + '" type="text"' + r + desc + ' maxlength="80" autocomplete="off">' + help +
        '<div class="cert-preview" aria-hidden="true"><span class="cert-kicker">Certificate of Participation</span><span class="cert-name" id="cert-name">Your Name</span><span class="cert-course">' + esc(session.title) + "</span></div></div>";
    } else if (f.type === "consent") {
      html += '<div class="field consent"><label class="check"><input type="checkbox" id="' + id + '" name="' + f.key + '" value="Yes"' + r + "><span>" + esc(f.label) + req(f) + "</span></label></div>";
    } else {
      html += '<div class="' + cls + '"><label for="' + id + '">' + esc(f.label) + req(f) + '</label><input id="' + id + '" name="' + f.key + '" type="' + f.type + '"' + r + desc +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : "") + (f.value ? ' value="' + esc(f.value) + '"' : "") +
        (f.type === "tel" ? ' pattern="[+0-9 ()-]{9,20}" inputmode="tel"' : "") + ' maxlength="160">' + help + "</div>";
    }
  });
  if (open) html += "</div></fieldset>";
  html += '<input type="text" name="_hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<div class="form-status" role="alert" aria-live="assertive"></div>' +
    '<div class="submit-row"><button type="submit" class="btn btn-primary btn-lg">Complete registration</button><p class="small">' + (PREVIEW ? "Preview mode: submissions are stored in this browser only." : "You'll receive a confirmation email immediately.") + "</p></div>";
  form.innerHTML = html;

  /* ---------- Province → district ---------- */
  var prov = form.querySelector('select[name="province"]'), dist = form.querySelector('select[name="district"]');
  if (prov && dist) prov.addEventListener("change", function () {
    var list = S.RWANDA[prov.value] || [];
    dist.innerHTML = '<option value="">' + (list.length ? "Select…" : "Choose a province first") + "</option>" + list.map(function (d) { return "<option>" + d + "</option>"; }).join("");
    dist.disabled = !list.length;
  });

  /* ---------- Certificate name follows full name until edited ---------- */
  var full = form.querySelector('input[name="full_name"]'), cert = form.querySelector('input[name="certificate_name"]'), certOut = document.getElementById("cert-name");
  var certTouched = false;
  function syncCert() { if (certOut) certOut.textContent = (cert.value || "Your Name").trim() || "Your Name"; }
  if (cert) {
    cert.addEventListener("input", function () { certTouched = true; syncCert(); });
    full.addEventListener("input", function () { if (!certTouched) { cert.value = full.value; syncCert(); } });
  }

  /* ---------- Validation ---------- */
  function fieldWrap(el) { return el.closest(".field"); }
  function clearErrors() {
    form.querySelectorAll(".has-error").forEach(function (w) { w.classList.remove("has-error"); });
    form.querySelectorAll(".err").forEach(function (e) { e.remove(); });
  }
  function msg(el) {
    var v = el.validity;
    if (v.valueMissing) return el.type === "checkbox" ? "Please tick this box to continue." : (el.type === "radio" || el.tagName === "SELECT" ? "Please choose an option." : "This field is required.");
    if (v.typeMismatch) return "Please enter a valid email address.";
    if (v.patternMismatch) return "Please enter a valid phone number, e.g. +250 788 123 456.";
    return "Please check this field.";
  }
  function validate() {
    clearErrors();
    var first = null, seen = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === "_hp" || seen[el.name]) return;
      if (el.type === "radio") seen[el.name] = true;
      if (el.type !== "radio" && el.type !== "checkbox" && el.value) el.value = el.value.trim();
      if (!el.checkValidity()) {
        var w = fieldWrap(el);
        if (w && !w.classList.contains("has-error")) {
          w.classList.add("has-error");
          var e = document.createElement("p"); e.className = "err"; e.textContent = msg(el); w.appendChild(e);
        }
        if (!first) first = el;
      }
    });
    if (first) { first.focus({ preventScroll: true }); fieldWrap(first).scrollIntoView({ behavior: "smooth", block: "center" }); }
    return !first;
  }
  /* Clear a field's error as soon as it's fixed: while typing for text fields
     (so nothing shifts when focus moves on), on change for choices. */
  function clearIfValid(e) {
    var w = e.target.closest && e.target.closest(".has-error");
    if (w && e.target.checkValidity()) { w.classList.remove("has-error"); var er = w.querySelector(".err"); if (er) er.remove(); }
  }
  form.addEventListener("input", clearIfValid);
  form.addEventListener("change", clearIfValid);

  /* ---------- Submit ---------- */
  function collect() {
    var data = {}, labels = {};
    fields.forEach(function (f) {
      if (!f.key) return;
      labels[f.key] = f.type === "consent" ? "Consent" : f.label;
      if (f.type === "radio") { var c = form.querySelector('input[name="' + f.key + '"]:checked'); data[f.key] = c ? c.value : ""; }
      else if (f.type === "consent") data[f.key] = form.elements[f.key].checked ? "Yes" : "No";
      else data[f.key] = form.elements[f.key].value;
    });
    return { data: data, labels: labels };
  }

  function makeRef() {
    var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
    return session.refPrefix + "-" + s;
  }

  function previewSave(payload) {
    var key = "orvio_" + CFG.event.code + "_" + eventKey, list = [];
    try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { list = []; }
    var email = (payload.data.email || "").trim().toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if ((list[i].email || "").toLowerCase() === email) {
        list[i] = Object.assign({}, list[i], payload.data, { email: email, updated_at: new Date().toISOString() });
        try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
        return Promise.resolve({ ok: true, ref: list[i].ref, updated: true, preview: true });
      }
    }
    var rec = Object.assign({ ref: makeRef(), timestamp: new Date().toISOString() }, payload.data);
    list.push(rec);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
    return Promise.resolve({ ok: true, ref: rec.ref, preview: true });
  }

  function apiSave(payload) {
    return fetch(CFG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },   // avoids a CORS pre-flight with Apps Script
      body: JSON.stringify({ action: "register", event: eventKey, data: payload.data, labels: payload.labels }),
    }).then(function (r) { return r.json(); });
  }

  var status = form.querySelector(".form-status"), btn = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements._hp.value) return;
    status.className = "form-status"; status.textContent = "";
    if (!validate()) { status.className = "form-status is-error"; status.textContent = "Some answers need attention. Please check the highlighted fields."; return; }
    var payload = collect();
    btn.disabled = true; btn.textContent = "Submitting…";
    (PREVIEW ? previewSave(payload) : apiSave(payload)).then(function (res) {
      if (!res || !res.ok) throw new Error(res && res.error || "failed");
      showSuccess(res, payload.data);
    }).catch(function () {
      status.className = "form-status is-error";
      status.textContent = "We couldn't submit your registration. Please check your internet connection and try again.";
      btn.disabled = false; btn.textContent = "Complete registration";
    });
  });

  /* ---------- Success ---------- */
  function ics() {
    var d = session.dateISO.replace(/-/g, ""), next = new Date(session.dateISO + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 1);
    var n = next.toISOString().slice(0, 10).replace(/-/g, "");
    var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Orvio Systems//Registration//EN", "BEGIN:VEVENT",
      "UID:" + eventKey + "-" + CFG.event.code + "@orviosystems.si", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + n, "SUMMARY:" + session.title, "LOCATION:" + session.format, "DESCRIPTION:" + session.kicker + " – " + CFG.event.name, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
  }
  function showSuccess(res, data) {
    var card = document.getElementById("reg-card");
    var rows = [["Name", data.full_name], ["Email", data.email], ["Organisation", data.organisation]];
    if (data.certificate_name) rows.push(["Certificate name", data.certificate_name]);
    if (data.category) rows.push(["Category", data.category]);
    card.innerHTML =
      '<div class="success" tabindex="-1">' +
      '<div class="success-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>' +
      "<h2>" + (res.updated ? "Registration updated" : "You're registered") + "</h2>" +
      "<p>" + (res.updated ? "This email address was already registered, so we've replaced your earlier details with the ones below. Your reference number stays the same." : "Thank you, " + esc((data.full_name || "").split(" ")[0]) + ". Your place for <strong>" + esc(session.title) + "</strong> is confirmed.") + "</p>" +
      '<p class="ref">Reference <strong>' + esc(res.ref) + "</strong></p>" +
      '<dl class="summary">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1] || "–") + "</dd></div>"; }).join("") + "</dl>" +
      "<p class=\"small\">" + (PREVIEW ? "Preview mode: in the live system a confirmation email is sent to " + esc(data.email) + "." : (res.updated ? "An updated confirmation email has been sent to " : "A confirmation email has been sent to ") + esc(data.email) + ". Check your spam folder if it doesn't arrive within a few minutes.") + "</p>" +
      '<div class="success-actions"><a class="btn btn-primary" href="' + ics() + '" download="' + eventKey + '-' + CFG.event.code + '.ics">Add to calendar</a><a class="btn btn-ghost" href="./">Register someone else</a></div>' +
      "</div>";
    var s = card.querySelector(".success"); s.focus(); card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
})();
