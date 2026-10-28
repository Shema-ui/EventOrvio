# EventOrvio · Event registration by Orvio Systems

Registration system for the **Rwanda Tourism Forum & Awards 2026** (Rwanda Chamber of Tourism, organised with Global Planners Ltd).

| Page | Path |
|---|---|
| Event hub | `/rtfa2026/` |
| Link A · Pre-Forum Training (26 Nov, online) | `/rtfa2026/training/` |
| Link B · Main Forum (27 Nov, Kigali) | `/rtfa2026/forum/` |
| Admin dashboard | `/rtfa2026/admin/` |

Static site on GitHub Pages; data stored in a Google Sheet through a Google Apps Script web app (`apps-script/Code.gs`).

While `API_URL` in `assets/js/config.js` is empty, the site runs in **preview mode**: registrations are kept in the visitor's own browser, and the dashboard accepts any key.

## Connect the Google Sheet (makes it live)

1. Create a new Google Sheet, e.g. "RTFA 2026 Registrations".
2. **Extensions → Apps Script**, delete the sample code and paste `apps-script/Code.gs`.
3. Change `ADMIN_KEY` to a long private password, then save.
4. Run `testSetup` once and approve the permissions. You should receive a test confirmation email.
5. **Deploy → New deployment → Web app**. Set *Execute as*: Me, and *Who has access*: Anyone. Then copy the `/exec` URL.
6. Paste that URL into `API_URL` in `assets/js/config.js` and push.

Confirmation emails go out from the Google account that owns the script. A free Gmail account can send about 100 emails a day; a Google Workspace account can send about 1,500.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Custom domain (orviosystems.si)

In Hostinger DNS, add these records:
- four `A` records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153
- a `CNAME` record for `www` → `shema-ui.github.io`

Then set the custom domain under **Settings → Pages** and tick **Enforce HTTPS**.

## Editing

- Form fields: `assets/js/schema.js`
- Event text and dates: `assets/js/config.js`
- Page layout: `_tools/build_pages.py`. Run `python3 _tools/build_pages.py` after editing.
