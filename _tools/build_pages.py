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
    links = [("Event", up + "rtfa2026/", "hub"), ("Pre-Forum Training", up + "rtfa2026/training/", "training"), ("Main Forum", up + "rtfa2026/forum/", "forum")]
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if k == current else ""}>{t}</a>' for t, h, k in links)
    return f"""<header class="topbar"><div class="wrap topbar-inner">
<a class="host" href="{up}rtfa2026/"><span class="host-mark"><span>RCOT</span></span><span class="host-name">Rwanda Chamber of Tourism<small>Rwanda Tourism Forum &amp; Awards 2026</small></span></a>
<nav class="top-links" aria-label="Event">{nav}</nav></div></header>"""


def footer(up):
    return f"""<footer class="foot"><div class="wrap foot-inner">
<span>Rwanda Tourism Forum &amp; Awards 2026 · Organised with Global Planners Ltd</span>
<span class="powered">Registration by <a href="{up}"><strong>Orvio Systems</strong></a></span></div></footer>"""


# ---------- Event hub ----------
hub = f"""{topbar('../', 'hub')}
<main>
<section class="hero"><div class="wrap hero-inner">
<p class="eyebrow">Rwanda Chamber of Tourism presents</p>
<h1>Rwanda Tourism Forum &amp; Awards 2026</h1>
<p class="lead">Two days that bring Rwanda's tourism sector together: a practical AI marketing training on 26 November, followed by the Forum and Awards in Kigali on 27 November.</p>
<div class="facts"><span class="fact">{ICON['cal']}26–27 November 2026</span><span class="fact">{ICON['pin']}Kigali, Rwanda</span><span class="fact">{ICON['users']}Around 400 participants</span></div>
</div>{HILLS}</section>
<section class="wrap hub">
<div class="hub-grid">
<article class="session-card is-training">
<span class="tag">Pre-Forum Training · Online</span>
<h2>Practical AI for Marketing</h2>
<div class="meta"><span>Thu 26 Nov 2026</span><span>Online · 1–2 hours</span><span>by Google Hustle Academy</span></div>
<p>Hands-on training on using AI tools to plan, create and measure tourism marketing. Participants receive a certificate of participation.</p>
<a class="btn btn-primary" href="training/">Register for the training</a>
</article>
<article class="session-card">
<span class="tag">Main Forum · In person</span>
<h2>Rwanda Tourism Forum &amp; Awards</h2>
<div class="meta"><span>Fri 27 Nov 2026</span><span>Kigali</span><span>~400 delegates</span></div>
<p>The sector's flagship gathering: industry dialogue, partnerships and the Rwanda Tourism Awards, with leaders, operators and partners from across tourism.</p>
<a class="btn btn-primary" href="forum/">Register for the Forum</a>
</article>
</div>
<p class="admin-note small">Organisers: <a href="admin/">open the registration dashboard</a></p>
</section>
</main>
{footer('../')}"""
page("rtfa2026/index.html", "Rwanda Tourism Forum & Awards 2026 · Registration", "Register for the Rwanda Tourism Forum & Awards 2026 and the Pre-Forum AI for Marketing training.", hub, 1,
     '<link rel="stylesheet" href="../assets/css/event.css">')


# ---------- Registration pages ----------
def reg_page(key, kicker, title, lead, facts, aside):
    up = "../../"
    facts_html = "".join(f'<span class="fact">{ICON[i]}{t}</span>' for i, t in facts)
    body = f"""{topbar(up, key)}
<main>
<section class="hero"><div class="wrap hero-inner">
<p class="eyebrow">{kicker}</p>
<h1>{title}</h1>
<p class="lead">{lead}</p>
<div class="facts">{facts_html}</div>
</div>{HILLS}</section>
<div class="wrap reg-layout" data-reg="{key}">
<section class="card" id="reg-card" aria-labelledby="form-title">
<h2 id="form-title">Registration form</h2>
<p class="small">Fields marked <span class="req">*</span> are required. It takes about {'4' if key == 'training' else '2'} minutes.</p>
<form id="reg-form" novalidate></form>
<noscript><p>Please enable JavaScript to register.</p></noscript>
</section>
<aside class="aside">
<div id="preview-flag"></div>
{aside}
</aside>
</div>
</main>
{footer(up)}"""
    scripts = f"""<script src="{up}assets/js/config.js"></script>
<script src="{up}assets/js/schema.js"></script>
<script src="{up}assets/js/forms.js"></script>
<script>if(!window.ORVIO.API_URL){{document.getElementById('preview-flag').innerHTML='<div class="preview-flag"><strong>Preview</strong>This registration page is in preview mode. Registrations are kept in this browser only until the live system is connected.</div>';}}</script>"""
    page(f"rtfa2026/{key}/index.html", f"{title} · Registration", lead, body, 2, f'<link rel="stylesheet" href="{up}assets/css/event.css">', scripts)


reg_page("training", "Pre-Forum Training · Google Hustle Academy", "Practical AI for Marketing",
         "A practical online session on using AI to plan, create and measure tourism marketing, delivered by Google Hustle Academy ahead of the Rwanda Tourism Forum.",
         [("cal", "Thursday, 26 November 2026"), ("screen", "Online · 1–2 hours")],
         """<div class="card"><h3>What you'll get</h3><ul><li>Hands-on AI tools for marketing content and campaigns</li><li>Practical examples from tourism and hospitality</li><li>A certificate of participation</li></ul></div>
<div class="card"><h3>Before the session</h3><ul><li>You'll receive a confirmation email right after registering</li><li>The joining link is sent before 26 November</li><li>Check your certificate name carefully</li></ul></div>""")

reg_page("forum", "Main Forum · Rwanda Chamber of Tourism", "Rwanda Tourism Forum &amp; Awards 2026",
         "Join around 400 tourism leaders, operators and partners in Kigali for a day of industry dialogue, partnerships and the Rwanda Tourism Awards.",
         [("cal", "Friday, 27 November 2026"), ("pin", "Kigali, Rwanda"), ("users", "Around 400 delegates")],
         """<div class="card"><h3>At the Forum</h3><ul><li>Industry dialogue on the future of Rwandan tourism</li><li>Networking with operators, partners and government</li><li>The Rwanda Tourism Awards</li></ul></div>
<div class="card"><h3>After you register</h3><ul><li>A confirmation email with your reference number</li><li>Venue and programme details before the event</li></ul></div>""")


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
<section class="wrap hub"><div class="hub-grid">
<article class="session-card"><span class="tag">Live now</span><h2>Rwanda Tourism Forum &amp; Awards 2026</h2><div class="meta"><span>26–27 Nov 2026</span><span>Kigali</span></div><p>Registration for the Pre-Forum AI for Marketing training and the Main Forum.</p><a class="btn btn-primary" href="rtfa2026/">Go to registration</a></article>
<article class="session-card is-training"><span class="tag">For organisers</span><h2>Need a registration system?</h2><div class="meta"><span>Branded forms</span><span>Confirmation emails</span><span>Excel exports</span></div><p>Branded registration pages, automatic confirmations and a real-time admin dashboard, ready in days.</p><a class="btn btn-ghost" href="rtfa2026/">See a live example</a></article>
</div></section>
</main>
<footer class="foot"><div class="wrap foot-inner"><span>© 2026 Orvio Systems</span><span>orviosystems.si</span></div></footer>"""
page("index.html", "Orvio Systems · Event registration & business systems", "Orvio Systems builds event registration platforms, dashboards and business systems.", landing, 0,
     '<link rel="stylesheet" href="assets/css/event.css">')

print("pages built")
