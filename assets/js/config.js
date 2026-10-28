/* =========================================================
   Orvio Systems · Event registration configuration
   ---------------------------------------------------------
   API_URL: the Google Apps Script web app URL (ends in /exec).
   Leave it empty and the site runs in PREVIEW MODE: forms and
   the admin dashboard work, but registrations are only kept in
   the current browser and no emails are sent.
   ========================================================= */
window.ORVIO = {
  API_URL: "https://script.google.com/macros/s/AKfycbwTntVPUMXw2apjIe5zAIfyeMAD_P00VwFeR5FgRK3s6ZY5cSWxPrvADyKjlaAtkfkg/exec",

  event: {
    code: "RTFA2026",
    name: "Rwanda Tourism Forum & Awards 2026",
    host: "Rwanda Chamber of Tourism",
    hostShort: "RCOT",
    organiser: "Global Planners Ltd",
    supportEmail: "",
  },

  sessions: {
    training: {
      title: "Hustle Academy Training on Practical AI for Marketing",
      kicker: "Hustle Academy Training",
      partner: "Rwanda Tourism Forum & Awards 2026",
      date: "26th Nov 2026",
      dateISO: "2026-11-26",
      format: "Online · 1–2 hours",
      blurb: "Hustle Academy Training on Practical AI for Marketing, 26th Nov 2026. Online, 1–2 hours.",
      refPrefix: "TRN",
    },
    forum: {
      title: "Rwanda Tourism Forum, Gala Dinner & Awards",
      kicker: "Rwanda Tourism Forum, Gala Dinner & Awards",
      partner: "Rwanda Chamber of Tourism",
      date: "27th Nov 2026",
      dateISO: "2026-11-27",
      format: "In person · Kigali",
      blurb: "Rwanda Tourism Forum, Gala Dinner & Awards, 27th Nov 2026. Kigali.",
      refPrefix: "RTF",
    },
  },
};
