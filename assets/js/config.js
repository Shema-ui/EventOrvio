/* =========================================================
   Orvio Systems · Event registration configuration
   ---------------------------------------------------------
   API_URL: the Google Apps Script web app URL (ends in /exec).
   Leave it empty and the site runs in PREVIEW MODE: forms and
   the admin dashboard work, but registrations are only kept in
   the current browser and no emails are sent.
   ========================================================= */
window.ORVIO = {
  API_URL: "",

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
      title: "Practical AI for Marketing",
      kicker: "Pre-Forum Training",
      partner: "Google Hustle Academy",
      date: "Thursday, 26 November 2026",
      dateISO: "2026-11-26",
      format: "Online · 1–2 hours",
      blurb: "A practical, hands-on session on using AI tools to plan, create and measure tourism marketing. Delivered online by Google Hustle Academy ahead of the Forum.",
      refPrefix: "TRN",
    },
    forum: {
      title: "Rwanda Tourism Forum & Awards 2026",
      kicker: "Main Forum",
      partner: "Rwanda Chamber of Tourism",
      date: "Friday, 27 November 2026",
      dateISO: "2026-11-27",
      format: "In person · Kigali",
      blurb: "The tourism sector's flagship gathering: industry dialogue, partnerships and the Rwanda Tourism Awards, bringing together around 400 leaders, operators and partners.",
      refPrefix: "RTF",
    },
  },
};
