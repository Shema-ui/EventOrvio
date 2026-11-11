/* Form definitions for both registration links.
   Each field: { key, label, type, required, options, help, placeholder, half }
   Types: text, email, tel, textarea, radio, select, province, district, certificate, consent */
(function () {
  "use strict";

  var ASSOCIATIONS = [
    "Rwanda Hospitality Association",
    "Rwanda Tours and Travel Association",
    "Rwanda Safari Guides Association",
    "Rwanda Association of Travel Agencies",
    "Rwanda Association of Professional Conference Organisers",
    "Rwanda Community Tourism Association",
    "Rwanda Hospitality and Tourism Educators Association",
  ];

  var RWANDA = {
    "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
    "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
    "Southern Province": ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
    "Eastern Province": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
    "Western Province": ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
  };

  var CONSENT = "I agree that the organisers may use my details to manage this registration, send event information and issue my certificate.";

  var training = [
    { section: "Membership & organisation" },
    { key: "association", label: "Association membership", type: "select", required: true, options: ASSOCIATIONS, help: "Which RCOT member association do you belong to?" },
    { key: "organisation", label: "Business / organisation name", type: "text", required: true, placeholder: "e.g. Kivu Lodge Ltd" },

    { section: "Participant information" },
    { key: "full_name", label: "Full name", type: "text", required: true, autocomplete: "name", half: true },
    { key: "gender", label: "Gender", type: "radio", required: true, options: ["Female", "Male"], half: true },
    { key: "age_group", label: "Age group", type: "radio", required: true, options: ["18–24", "25–34", "35–44", "45–54", "55+"] },
    { key: "nationality", label: "Nationality", type: "text", required: false, placeholder: "e.g. Rwandan", half: true },
    { key: "job_title", label: "Position / job title", type: "text", required: true, autocomplete: "organization-title", half: true },
    { key: "department", label: "Department / unit", type: "text", required: true, placeholder: "e.g. Sales & Marketing" },

    { section: "Participant contact information" },
    { key: "phone", label: "Mobile telephone number", type: "tel", required: true, placeholder: "+250 7XX XXX XXX", autocomplete: "tel", half: true },
    { key: "phone_alt", label: "Alternative telephone number", type: "tel", required: false, placeholder: "+250 7XX XXX XXX", half: true },
    { key: "email", label: "Email address", type: "email", required: true, autocomplete: "email", help: "Your confirmation will be sent here." },

    { section: "Business location" },
    { key: "province", label: "Province", type: "province", required: true, half: true },
    { key: "district", label: "District", type: "district", required: true, half: true },
    { key: "sector", label: "Sector", type: "text", required: true, placeholder: "e.g. Kimironko" },

    { section: "Relevance of the training" },
    { key: "marketing_role", label: "Your role in marketing and customer engagement", type: "radio", required: true, options: ["Directly responsible", "Partially responsible"] },

    { section: "Certificate" },
    { key: "certificate_name", label: "Name as it should appear on your certificate", type: "certificate", required: true, help: "Check the spelling carefully. Certificates are printed exactly as entered." },

    { section: "Monitoring & evaluation" },
    { key: "objective", label: "Main objective for attending the training", type: "textarea", required: true },
    { key: "expected_skills", label: "Skills or knowledge you expect to gain", type: "textarea", required: true },

    { section: "" },
    { key: "consent", label: CONSENT, type: "consent", required: true },
  ];

  var forum = [
    { section: "Delegate information" },
    { key: "full_name", label: "Full name", type: "text", required: true, autocomplete: "name", half: true },
    { key: "job_title", label: "Position / job title", type: "text", required: true, autocomplete: "organization-title", half: true },
    { key: "organisation", label: "Organisation", type: "text", required: true, autocomplete: "organization" },
    { key: "category", label: "Participant category", type: "select", required: true, options: ["Delegate", "Speaker / Panelist", "Exhibitor", "Sponsor / Partner", "Award Nominee", "Government / Public Institution", "Development Partner", "Media", "Student", "Other"] },

    { section: "Contact details" },
    { key: "email", label: "Email address", type: "email", required: true, autocomplete: "email", half: true, help: "Your confirmation will be sent here." },
    { key: "phone", label: "Mobile telephone number", type: "tel", required: true, placeholder: "+250 7XX XXX XXX", autocomplete: "tel", half: true },
    { key: "country", label: "Country of residence", type: "text", required: true, value: "Rwanda" },

    { section: "" },
    { key: "consent", label: "I agree that the organisers may use my details to manage this registration and send me event information.", type: "consent", required: true },
  ];

  window.ORVIO_SCHEMA = { training: training, forum: forum, RWANDA: RWANDA };
})();
