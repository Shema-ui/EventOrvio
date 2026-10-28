/**
 * Orvio Systems · Registration backend for Google Sheets
 * Rwanda Tourism Forum & Awards 2026
 *
 * What it does
 *  - Saves every registration as a row in this Google Sheet (one tab per event)
 *  - Gives each registrant a reference number (TRN-0001, RTF-0001 …)
 *  - Sends a branded confirmation email from the Google account that owns the script
 *  - Lets the admin dashboard read registrations and archive test entries (needs ADMIN_KEY)
 *
 * Setup: see README.md → "Connect the Google Sheet".
 */

// 1) CHANGE THIS to a long, private password for the admin dashboard.
const ADMIN_KEY = 'CHANGE-ME-to-a-long-private-key';

// 2) Optional: where replies to the confirmation email should go.
const REPLY_TO = '';

const EVENT_NAME = 'Rwanda Tourism Forum & Awards 2026';
const HOST_NAME = 'Rwanda Chamber of Tourism';
const SENDER_NAME = 'RTFA 2026 Registration';

const EVENTS = {
  training: {
    sheet: 'Pre-Forum Training',
    prefix: 'TRN',
    title: 'Practical AI for Marketing',
    subtitle: 'Pre-Forum Training by Google Hustle Academy',
    date: 'Thursday, 26 November 2026',
    where: 'Online (1–2 hours). Your joining link will be emailed before the session.',
  },
  forum: {
    sheet: 'Main Forum',
    prefix: 'RTF',
    title: 'Rwanda Tourism Forum & Awards 2026',
    subtitle: 'Main Forum',
    date: 'Friday, 27 November 2026',
    where: 'Kigali, Rwanda. Venue and programme details will follow by email.',
  },
};

const FIXED = ['Reference', 'Registered at (UTC)', 'Archived'];
const FIXED_KEYS = ['ref', 'timestamp', 'archived'];

/* ------------------------------------------------------------------ */
/* Web app entry points                                                */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'register') return json(register(body));
    if (body.action === 'archive') return json(archive(body));
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'list') {
    if (p.key !== ADMIN_KEY) return json({ ok: false, error: 'Invalid access key' });
    if (!EVENTS[p.event]) return json({ ok: false, error: 'Unknown event' });
    return json({ ok: true, rows: readRows(p.event) });
  }
  return json({ ok: true, service: 'Orvio registration', event: EVENT_NAME });
}

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

function register(body) {
  const ev = EVENTS[body.event];
  if (!ev) return { ok: false, error: 'Unknown event' };
  const data = body.data || {};
  const labels = body.labels || {};

  const email = String(data.email || '').trim().toLowerCase();
  if (!data.full_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Name and a valid email are required' };
  if (data.consent !== 'Yes') return { ok: false, error: 'Consent is required' };

  // Trim and cap every value so nobody can flood the sheet.
  Object.keys(data).forEach(function (k) { data[k] = String(data[k] == null ? '' : data[k]).trim().slice(0, 1000); });
  data.email = email;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let ref, duplicate = false;
  try {
    const sheet = getSheet(ev.sheet);
    const keys = ensureColumns(sheet, data, labels);

    // One registration per email address per event.
    const emailCol = keys.indexOf('email');
    const last = sheet.getLastRow();
    if (last > 2 && emailCol >= 0) {
      const emails = sheet.getRange(3, emailCol + 1, last - 2, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).toLowerCase() === email) {
          ref = sheet.getRange(i + 3, 1).getValue();
          duplicate = true;
          break;
        }
      }
    }

    if (!duplicate) {
      const count = Math.max(0, sheet.getLastRow() - 2);
      ref = ev.prefix + '-' + ('000' + (count + 1)).slice(-4);
      const row = keys.map(function (k) {
        if (k === 'ref') return ref;
        if (k === 'timestamp') return new Date().toISOString();
        if (k === 'archived') return '';
        const v = data[k] == null ? '' : data[k];
        return /^[=+\-@]/.test(v) ? "'" + v : v;   // stop spreadsheet formulas
      });
      sheet.appendRow(row);
    }
  } finally {
    lock.releaseLock();
  }

  if (!duplicate) {
    try { sendConfirmation(body.event, ev, data, ref); } catch (err) { console.error('Email failed', err); }
  }
  return { ok: true, ref: ref, duplicate: duplicate };
}

function archive(body) {
  if (body.key !== ADMIN_KEY) return { ok: false, error: 'Invalid access key' };
  const ev = EVENTS[body.event];
  if (!ev) return { ok: false, error: 'Unknown event' };
  const sheet = getSheet(ev.sheet);
  const last = sheet.getLastRow();
  if (last < 3) return { ok: false, error: 'Not found' };
  const refs = sheet.getRange(3, 1, last - 2, 1).getValues();
  for (let i = 0; i < refs.length; i++) {
    if (refs[i][0] === body.ref) {
      sheet.getRange(i + 3, 3).setValue(body.archived ? 'Yes' : '');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Not found' };
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* Row 1 = readable headers, row 2 = field keys (kept for the app),   */
/* data starts on row 3.                                               */
/* ------------------------------------------------------------------ */

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, FIXED.length).setValues([FIXED]);
    sh.getRange(2, 1, 1, FIXED_KEYS.length).setValues([FIXED_KEYS]);
    sh.getRange(1, 1, 1, 30).setFontWeight('bold').setBackground('#e7f1ec');
    sh.getRange(2, 1, 1, 30).setFontColor('#9aa5a0').setFontSize(8);
    sh.setFrozenRows(2);
  }
  return sh;
}

function ensureColumns(sheet, data, labels) {
  const width = Math.max(sheet.getLastColumn(), FIXED_KEYS.length);
  const keys = sheet.getRange(2, 1, 1, width).getValues()[0].map(String);
  const missing = Object.keys(data).filter(function (k) { return keys.indexOf(k) === -1; });
  missing.forEach(function (k) {
    const col = keys.length + 1;
    sheet.getRange(1, col).setValue(labels[k] || k).setFontWeight('bold').setBackground('#e7f1ec');
    sheet.getRange(2, col).setValue(k).setFontColor('#9aa5a0').setFontSize(8);
    keys.push(k);
  });
  return keys;
}

function readRows(eventKey) {
  const sheet = getSheet(EVENTS[eventKey].sheet);
  const last = sheet.getLastRow(), width = sheet.getLastColumn();
  if (last < 3) return [];
  const keys = sheet.getRange(2, 1, 1, width).getValues()[0].map(String);
  const values = sheet.getRange(3, 1, last - 2, width).getValues();
  return values.map(function (r) {
    const o = {};
    keys.forEach(function (k, i) {
      let v = r[i];
      if (v instanceof Date) v = v.toISOString();
      o[k] = k === 'archived' ? v === 'Yes' : String(v == null ? '' : v).replace(/^'/, '');
    });
    return o;
  });
}

/* ------------------------------------------------------------------ */
/* Confirmation email                                                  */
/* ------------------------------------------------------------------ */

function sendConfirmation(eventKey, ev, d, ref) {
  const first = String(d.full_name).split(' ')[0];
  const rows = [['Reference', ref], ['Name', d.full_name], ['Organisation', d.organisation], ['Email', d.email], ['Phone', d.phone]];
  if (eventKey === 'training') rows.push(['Name on certificate', d.certificate_name]);
  if (eventKey === 'forum') rows.push(['Category', d.category]);

  const table = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<tr><td style="padding:8px 0;color:#697570;width:170px;border-bottom:1px solid #e3e9e5">' + esc(r[0]) +
      '</td><td style="padding:8px 0;color:#14211c;font-weight:bold;border-bottom:1px solid #e3e9e5">' + esc(r[1]) + '</td></tr>';
  }).join('');

  const html =
    '<div style="background:#f6f4ee;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden">' +
    '<div style="background:#0d5b45;padding:24px 28px;color:#ffffff">' +
    '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e0a823;font-weight:bold">' + esc(HOST_NAME) + '</div>' +
    '<div style="font-size:22px;font-weight:bold;margin-top:6px">' + esc(ev.title) + '</div>' +
    '<div style="font-size:14px;opacity:.85;margin-top:4px">' + esc(ev.subtitle) + '</div></div>' +
    '<div style="height:6px;background:#e0a823"></div>' +
    '<div style="padding:26px 28px;color:#3a4742;font-size:15px;line-height:1.6">' +
    '<p style="margin:0 0 14px">Dear ' + esc(first) + ',</p>' +
    '<p style="margin:0 0 14px">Thank you for registering. Your place is <strong>confirmed</strong>.</p>' +
    '<p style="margin:0 0 4px"><strong>Date:</strong> ' + esc(ev.date) + '</p>' +
    '<p style="margin:0 0 18px"><strong>Where:</strong> ' + esc(ev.where) + '</p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' + table + '</table>' +
    '<p style="margin:18px 0 0">Please keep your reference number <strong>' + esc(ref) + '</strong> for any questions about your registration.</p>' +
    '<p style="margin:18px 0 0">We look forward to welcoming you.<br>' + esc(EVENT_NAME) + ' team</p></div>' +
    '<div style="padding:14px 28px;background:#f6f4ee;color:#697570;font-size:12px">Registration powered by Orvio Systems</div>' +
    '</div></div>';

  const options = { to: d.email, subject: 'Registration confirmed: ' + ev.title + ' (' + ref + ')', htmlBody: html, name: SENDER_NAME };
  if (REPLY_TO) options.replyTo = REPLY_TO;
  MailApp.sendEmail(options);
}

/* ------------------------------------------------------------------ */

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

/** Run this once from the editor to grant permissions and send yourself a test email. */
function testSetup() {
  const me = Session.getActiveUser().getEmail();
  const res = register({ event: 'training', data: { full_name: 'Test Person', email: me, organisation: 'Test Org', phone: '+250 700 000 000', certificate_name: 'Test Person', consent: 'Yes' }, labels: { full_name: 'Full name', email: 'Email address', organisation: 'Business / organisation name', phone: 'Mobile telephone number', certificate_name: 'Name as it should appear on your certificate', consent: 'Consent' } });
  console.log(JSON.stringify(res) + ' — check ' + me + ' for the confirmation email, then archive the test row in the dashboard.');
}
