"""Generates the static HTML pages for the event (run: python3 _tools/build_pages.py)."""
import pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">'

ICON = {
  "cal": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  "pin": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
  "screen": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16.5V20"/></svg>',
  "users": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4"/></svg>',
}
HILLS = '<svg class="hills" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path fill="#f6f4ee" d="M0 70V38c120-22 240-30 360-14s240 30 360 10 240-38 360-30 240 26 360 20v46z"/></svg>'


def page(path, title, desc, body, depth, extra_head="", scripts=""):
    up = "../" * depth
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta name="theme-color" content="#0d5b45">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%230d5b45'/%3E%3Cpath d='M0 22h32v10H0z' fill='%23e0a823'/%3E%3C/svg%3E">
{FONTS}
{extra_head}
</head>
<body>
{body}
{scripts}
</body>
</html>
"""
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding="utf-8")


def topbar(up, current=""):
    return """<header class="topbar"><div class="wrap topbar-inner">
<span class="host"><span class="host-mark"><span>RCOT</span></span><span class="host-name">Rwanda Chamber of Tourism<small>Rwanda Tourism Forum &amp; Awards 2026</small></span></span>
</div></header>"""


def footer(up):
    return f"""<footer class="foot"><div class="wrap foot-inner">
<span>Rwanda Tourism Forum &amp; Awards 2026 · Organised with Global Planners Ltd</span>
<span class="powered">Registration by <strong>Orvio Systems</strong></span></div></footer>"""


# ---------- Registration pages ----------
def reg_page(key, kicker, title, lead, facts):
    up = "../../"
    facts_html = "".join(f'<span class="fact">{ICON[i]}{t}</span>' for i, t in facts)
    body = f"""{topbar(up, key)}
<main>
<section class="hero"><div class="wrap hero-inner">
<p class="eyebrow">{kicker}</p>
<h1>{title}</h1>
<div class="facts">{facts_html}</div>
</div>{HILLS}</section>
<div class="wrap reg-layout" data-reg="{key}">
<div id="preview-flag"></div>
<section class="card" id="reg-card" aria-labelledby="form-title">
<h2 id="form-title">Registration form</h2>
<p class="small">Fields marked <span class="req">*</span> are required.</p>
<form id="reg-form" novalidate></form>
<noscript><p>Please enable JavaScript to register.</p></noscript>
</section>
</div>
</main>
{footer(up)}"""
    scripts = f"""<script src="{up}assets/js/config.js"></script>
<script src="{up}assets/js/schema.js"></script>
<script src="{up}assets/js/forms.js"></script>
<script>if(!window.ORVIO.API_URL){{document.getElementById('preview-flag').innerHTML='<div class="preview-flag"><strong>Preview</strong>This registration page is in preview mode. Registrations are kept in this browser only until the live system is connected.</div>';}}</script>"""
    page(f"rtfa2026/{key}/index.html", f"{title} · Registration", lead, body, 2, f'<link rel="stylesheet" href="{up}assets/css/event.css">', scripts)


reg_page("training", "Rwanda Tourism Forum &amp; Awards 2026", "Hustle Academy Training on Practical AI for Marketing",
         "Hustle Academy Training on Practical AI for Marketing, 26th Nov 2026, online.",
         [("cal", "26th Nov 2026"), ("screen", "Online · 1–2 hours")])

reg_page("forum", "Rwanda Tourism Forum &amp; Awards 2026", "Rwanda Tourism Forum, Gala Dinner &amp; Awards",
         "Rwanda Tourism Forum, Gala Dinner & Awards, 27th Nov 2026, Kigali.",
         [("cal", "27th Nov 2026"), ("pin", "Kigali, Rwanda")])


# ---------- Admin ----------
page("rtfa2026/admin/index.html", "Registration Admin · Rwanda Tourism Forum 2026", "Registration dashboard for the Rwanda Tourism Forum & Awards 2026.",
     '<div id="app"></div>', 2,
     '<meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="../../assets/css/admin.css">',
     '<script src="../../assets/js/config.js"></script><script src="../../assets/js/schema.js"></script><script src="../../assets/js/admin.js"></script>')


# ---------- Orvio Systems landing ----------
landing = """<header class="topbar"><div class="wrap topbar-inner"><a class="host" href="./"><span class="host-mark" style="background:#14211c"><span>OS</span></span><span class="host-name">Orvio Systems<small>Systems that make work flow</small></span></a></div></header>
<main>
<section class="hero"><div class="wrap hero-inner">
<p class="eyebrow">Orvio Systems</p>
<h1>Systems that make events and businesses run smoothly.</h1>
<p class="lead">Online registration, delegate management, dashboards and custom business systems, designed and delivered in Rwanda.</p>
<div class="facts"><span class="fact">Event registration</span><span class="fact">Live dashboards</span><span class="fact">Custom business systems</span></div>
</div>""" + HILLS + """</section>
</main>
<footer class="foot"><div class="wrap foot-inner"><span>© 2026 Orvio Systems</span><span>orviosystems.si</span></div></footer>"""
page("index.html", "Orvio Systems · Event registration & business systems", "Orvio Systems builds event registration platforms, dashboards and business systems.", landing, 0,
     '<link rel="stylesheet" href="assets/css/event.css">')

print("pages built")
