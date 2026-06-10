/**
 * CWI AI — Client Onboarding Google Form Generator
 * ===================================================
 * Paste this entire file into Google Apps Script (script.google.com),
 * then click Run > createOnboardingForm.
 *
 * The script will:
 *   1. Create a new Google Form in your Drive
 *   2. Add all 9 sections with correct field types
 *   3. Set the confirmation message
 *   4. Log the edit and live URLs to the Apps Script console
 *
 * No additional setup required — just run it.
 */

function createOnboardingForm() {

  /* ── Create the form ── */
  var form = FormApp.create('CWI AI — Client Onboarding Form');

  form.setTitle('CWI AI — Client Onboarding Form');
  form.setDescription(
    'Welcome! Please complete all sections so our team can build your AI assistant. ' +
    'Fields marked with an asterisk (*) are required. ' +
    'This should take approximately 15–20 minutes.'
  );
  form.setConfirmationMessage(
    'Thank you! Brian will review your responses and reach out within 24 hours to confirm your build start date.'
  );
  form.setAllowResponseEdits(true);
  form.setCollectEmail(true);
  form.setShowLinkToRespondAgain(false);


  /* ================================================================
     SECTION 1 — BUSINESS BASICS
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 1 of 9 — Business Basics')
    .setHelpText('Core details about your company so the AI can represent you accurately.');

  form.addTextItem()
    .setTitle('Business Name *')
    .setHelpText('The full legal or operating name of your business.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Owner / Primary Contact Name *')
    .setHelpText('The name the AI and CWI team will reference when addressing you.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Contact Email *')
    .setHelpText('Primary email used for all CWI communications.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Contact Phone *')
    .setHelpText('Best phone number to reach you.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Business Address')
    .setHelpText('Street address including city and state. The AI uses this for local references.');

  form.addTextItem()
    .setTitle('Website URL')
    .setHelpText('Full URL including https:// (e.g. https://yoursite.com).');

  form.addParagraphTextItem()
    .setTitle('What does your business do? *')
    .setHelpText('1–3 sentences describing your services, typical customers, and what makes you different. This becomes the AI\'s core understanding of your business.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Years in Business')
    .setHelpText('Approximate number of years operating.');

  form.addTextItem()
    .setTitle('Primary Service Area / Region')
    .setHelpText('e.g. Greater Phoenix, AZ or Dallas–Fort Worth metro.');

  form.addParagraphTextItem()
    .setTitle('Business Hours *')
    .setHelpText('e.g. Mon–Fri 8am–5pm, Sat 9am–2pm, Sun closed. The AI will quote these to customers.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('License / Certification Numbers (if applicable)')
    .setHelpText('e.g. ROC 123456, AZ Lic. #AB-12345. Leave blank if not applicable.');


  /* ================================================================
     SECTION 2 — SERVICES & PRICING
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 2 of 9 — Services & Pricing')
    .setHelpText('What you offer and how you charge, so the AI can answer pricing questions correctly.');

  form.addParagraphTextItem()
    .setTitle('List All Services Offered *')
    .setHelpText('Separate each service by a new line or comma. Be as specific as possible — e.g. "Full roof replacement" not just "roofing".')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Pricing Model *')
    .setHelpText('Select the option that best describes how you charge customers.')
    .setChoiceValues([
      'Flat rate per service',
      'Hourly rate',
      'Per square foot / unit',
      'Custom quote only',
      'Subscription / retainer',
      'Mixed (varies by service)'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Typical Price Ranges')
    .setHelpText('e.g. "Roof inspection $150, Full replacement $8k–$20k depending on size and material." The AI will share these when asked, or say "custom quote" if you prefer.');

  form.addMultipleChoiceItem()
    .setTitle('Do you share pricing over the phone or chat?')
    .setHelpText('This controls whether the AI quotes ranges to customers or directs them to request an in-person estimate.')
    .setChoiceValues([
      'Yes, share ranges',
      'No, always quote in person',
      'Depends on service'
    ]);

  form.addParagraphTextItem()
    .setTitle('Financing or Payment Plans Available?')
    .setHelpText('e.g. "0% financing through GreenSky, accepts all major cards, checks." List everything you accept.');

  form.addParagraphTextItem()
    .setTitle('Warranty / Guarantee Information')
    .setHelpText('e.g. "10-year labor warranty, manufacturer\'s material warranty up to 30 years."');


  /* ================================================================
     SECTION 3 — SCHEDULING & CALENDAR
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 3 of 9 — Scheduling & Calendar')
    .setHelpText('How appointments are booked and what the AI should say about availability.');

  form.addMultipleChoiceItem()
    .setTitle('Primary Booking Method *')
    .setHelpText('How do most customers schedule with you today?')
    .setChoiceValues([
      'Phone call',
      'Online booking link',
      'Email',
      'Text message',
      'In-person only',
      'AI handles scheduling directly'
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Online Booking URL (if applicable)')
    .setHelpText('Full URL for your Calendly, Jobber, or other booking page.');

  form.addTextItem()
    .setTitle('Scheduling Software Used')
    .setHelpText('e.g. Calendly, Jobber, ServiceTitan, Google Calendar, or none.');

  form.addTextItem()
    .setTitle('Typical Lead Time for New Appointments')
    .setHelpText('e.g. "3–5 business days" or "Same week during off-peak."');

  form.addParagraphTextItem()
    .setTitle('Available Appointment Windows')
    .setHelpText('e.g. "Morning (8am–12pm) or Afternoon (1pm–5pm) Mon–Fri."');

  form.addMultipleChoiceItem()
    .setTitle('Do you offer emergency / after-hours service?')
    .setChoiceValues(['Yes', 'No', 'Seasonal only']);

  form.addParagraphTextItem()
    .setTitle('Emergency Service Details')
    .setHelpText('If yes — who to call, what number, any extra fee, response time. e.g. "24/7 storm damage response, $150 after-hours surcharge."');

  form.addParagraphTextItem()
    .setTitle('Cancellation / Rescheduling Policy')
    .setHelpText('e.g. "24-hour notice required, no-shows charged a $50 fee."');


  /* ================================================================
     SECTION 4 — BRANDING & DESIGN
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 4 of 9 — Branding & Design')
    .setHelpText('Visual identity and voice guidelines for the AI chat widget.');

  form.addTextItem()
    .setTitle('Primary Brand Colors')
    .setHelpText('Hex codes preferred — e.g. "#1A3C6E (navy), #F5A623 (gold), #FFFFFF". These will style your chat widget.');

  form.addTextItem()
    .setTitle('Logo URL or File Location')
    .setHelpText('Direct link to your logo file (PNG or SVG preferred). If you\'ll email it, write "will email."');

  form.addTextItem()
    .setTitle('What should the AI assistant be named?')
    .setHelpText('e.g. "Apex," "Max," "Sarah," "Aria." Leave blank and we\'ll suggest one based on your brand.');

  form.addMultipleChoiceItem()
    .setTitle('AI Persona / Personality')
    .setHelpText('Choose the tone that best matches your brand.')
    .setChoiceValues([
      'Professional & formal',
      'Friendly & conversational',
      'Expert & authoritative',
      'Warm & empathetic',
      'Energetic & upbeat'
    ]);

  form.addParagraphTextItem()
    .setTitle('Tone Examples / Brand Voice Notes')
    .setHelpText('e.g. "We never use slang, always say \'our team\' not \'I\', avoid mentioning competitors."');

  form.addParagraphTextItem()
    .setTitle('Words or Phrases to Avoid')
    .setHelpText('e.g. "cheap," "discount," competitor names. The AI will never use these.');


  /* ================================================================
     SECTION 5 — FAQ CONTENT (15 questions)
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 5 of 9 — FAQ Content')
    .setHelpText(
      'Answer the 15 most common questions your customers ask. ' +
      'These answers train the AI directly — the more detail you provide, the better it performs. ' +
      'Skip any that do not apply to your business.'
    );

  var faqItems = [
    {
      q:    'FAQ 1: How do I get a quote?',
      hint: 'Describe your quoting process step by step — e.g. call in, we schedule a free estimate, you receive a written quote within 48 hours.'
    },
    {
      q:    'FAQ 2: How long does a typical job take?',
      hint: 'Give time ranges for your most common services — e.g. "Inspection: 1–2 hours, Full replacement: 1–3 days."'
    },
    {
      q:    'FAQ 3: Are you licensed and insured?',
      hint: 'State yes/no and list license numbers if comfortable sharing. e.g. "Yes — ROC 123456, fully insured with $2M liability."'
    },
    {
      q:    'FAQ 4: What areas do you service?',
      hint: 'List your full service area — cities, counties, or radius from your base location.'
    },
    {
      q:    'FAQ 5: Do you offer free estimates?',
      hint: 'Yes/no and any conditions — e.g. "Free on-site estimates within 30 miles, virtual estimates also available."'
    },
    {
      q:    'FAQ 6: What payment methods do you accept?',
      hint: 'Cash, card, check, financing — list everything. e.g. "Visa/MC/Amex, check, cash, GreenSky financing."'
    },
    {
      q:    'FAQ 7: Do you offer a warranty?',
      hint: 'Labor warranty duration, product/material warranty details — e.g. "10-year labor, 30-year shingle manufacturer warranty."'
    },
    {
      q:    'FAQ 8: How far in advance do I need to book?',
      hint: 'Typical lead time — e.g. "Usually 3–5 business days; 2–3 weeks during peak storm season (June–September)."'
    },
    {
      q:    'FAQ 9: What happens if weather causes a delay?',
      hint: 'Your weather rescheduling policy — e.g. "We monitor the forecast and will call you by 7am to reschedule at no charge."'
    },
    {
      q:    'FAQ 10: Can I get an itemized breakdown of costs?',
      hint: 'Describe what your estimate or invoice includes — e.g. "Yes, all quotes include materials, labor, disposal, and permit fees separately."'
    },
    {
      q:    'FAQ 11: Do you do residential and commercial work?',
      hint: 'Which types you serve or specialize in — e.g. "Primarily residential; commercial projects under 10,000 sq ft on request."'
    },
    {
      q:    'FAQ 12: What brands or materials do you use?',
      hint: 'Name preferred manufacturers and product lines — e.g. "GAF Timberline HDZ shingles, Owens Corning Duration, CertainTeed Landmark."'
    },
    {
      q:    'FAQ 13: What should I do in an emergency?',
      hint: 'Who to call, what number, and after-hours procedure — e.g. "Call our 24/7 emergency line: (555) 000-0000. We respond within 2 hours."'
    },
    {
      q:    'FAQ 14: Can I see examples of past work?',
      hint: 'Portfolio links, Google photo albums, or case study pages — e.g. "Yes, visit oursite.com/gallery or our Google Business profile."'
    },
    {
      q:    'FAQ 15: How do I leave a review?',
      hint: 'Preferred review platform and direct link — e.g. "Google is preferred: [your Google review link]. We\'d love a 5-star review!"'
    },
  ];

  faqItems.forEach(function(item) {
    form.addParagraphTextItem()
      .setTitle(item.q)
      .setHelpText(item.hint);
  });


  /* ================================================================
     SECTION 6 — STAFF & ESCALATION
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 6 of 9 — Staff & Escalation')
    .setHelpText('Who the AI transfers or escalates to, and how it handles those situations.');

  form.addTextItem()
    .setTitle('Primary Escalation Contact Name *')
    .setHelpText('The person customers should be connected with when the AI can\'t help or a human is requested.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Their Role / Title')
    .setHelpText('e.g. Owner, Office Manager, Sales Lead, Customer Service Rep.');

  form.addTextItem()
    .setTitle('Escalation Phone')
    .setHelpText('Direct number the AI or customer can call for escalated issues.');

  form.addTextItem()
    .setTitle('Escalation Email')
    .setHelpText('Email address for escalated inquiries or callbacks.');

  form.addCheckboxItem()
    .setTitle('When should the AI escalate to a human?')
    .setHelpText('Select all that apply. The AI will trigger a handoff in these situations.')
    .setChoiceValues([
      'Angry or upset customer',
      'Complex pricing question',
      'Legal or liability concern',
      'Customer explicitly requests a human',
      'Emergency situation',
      'Large job over a threshold amount'
    ]);

  form.addParagraphTextItem()
    .setTitle('What should the AI say when escalating?')
    .setHelpText('e.g. "Let me connect you with our team directly. Someone will call you within 2 hours." Write the exact script.');

  form.addMultipleChoiceItem()
    .setTitle('After-hours message handling')
    .setHelpText('What should the AI do when a customer contacts you outside of business hours?')
    .setChoiceValues([
      'Collect contact info and follow up next business day',
      'Offer to schedule a callback',
      'AI responds 24/7 autonomously'
    ]);

  form.addParagraphTextItem()
    .setTitle('Other Key Staff Names to Reference (optional)')
    .setHelpText('e.g. "Tom (Lead Inspector), Maria (Office), Dave (Project Manager)." The AI can refer customers to specific team members.');


  /* ================================================================
     SECTION 7 — TECHNICAL ACCESS
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 7 of 9 — Technical Access')
    .setHelpText('Credentials and integrations needed to deploy the AI assistant on your platforms.');

  form.addMultipleChoiceItem()
    .setTitle('Website Platform *')
    .setHelpText('What platform is your website built on? This determines how we install the chat widget.')
    .setChoiceValues([
      'WordPress',
      'Wix',
      'Squarespace',
      'Shopify',
      'Webflow',
      'GoDaddy',
      'Custom / HTML',
      'Other',
      'I don\'t know'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Do you have website admin access?')
    .setHelpText('We may need to install a small code snippet. You or your developer can do this.')
    .setChoiceValues([
      'Yes, I have access',
      'No',
      'My developer has access'
    ]);

  form.addTextItem()
    .setTitle('CRM or Job Management Software')
    .setHelpText('e.g. Jobber, HubSpot, Salesforce, ServiceTitan, none. We can integrate the AI with these.');

  form.addTextItem()
    .setTitle('Phone System / VoIP Provider')
    .setHelpText('e.g. RingCentral, Google Voice, Vonage, standard landline. Needed for call-routing features.');

  form.addCheckboxItem()
    .setTitle('Which platforms should the AI integrate with?')
    .setHelpText('Select all that apply. We will configure integrations for each selected platform.')
    .setChoiceValues([
      'Google Calendar',
      'Calendly',
      'Facebook Messenger',
      'Instagram DMs',
      'SMS / Text messaging',
      'Email inbox monitoring',
      'Jobber',
      'Zapier'
    ]);

  form.addTextItem()
    .setTitle('Web Developer Contact (if we need to coordinate)')
    .setHelpText('Name and email or phone of your developer. Leave blank if you manage the site yourself.');


  /* ================================================================
     SECTION 8 — BILLING
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 8 of 9 — Billing')
    .setHelpText('Payment and invoicing preferences for your CWI AI service.');

  form.addTextItem()
    .setTitle('Billing Email *')
    .setHelpText('Invoices and receipts will be sent here.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Billing Contact Name')
    .setHelpText('If different from the owner / primary contact.');

  form.addMultipleChoiceItem()
    .setTitle('Preferred Billing Cycle *')
    .setHelpText('How often would you like to be invoiced for CWI services?')
    .setChoiceValues(['Monthly', 'Quarterly', 'Annually'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Preferred Payment Method')
    .setChoiceValues([
      'Credit / Debit card (auto-pay)',
      'ACH bank transfer',
      'Check',
      'PayPal',
      'Zelle'
    ]);

  form.addParagraphTextItem()
    .setTitle('Additional Billing Notes')
    .setHelpText('e.g. PO number required, Net-30 terms, specific invoice format, or any other billing requirements.');


  /* ================================================================
     SECTION 9 — OPTIONAL & ADDITIONAL INFO
     ================================================================ */
  form.addPageBreakItem()
    .setTitle('Section 9 of 9 — Optional & Additional Info')
    .setHelpText('Extra context that helps us build a better AI assistant for you. All fields in this section are optional.');

  form.addParagraphTextItem()
    .setTitle('Main Competitors (optional)')
    .setHelpText('e.g. "ABC Roofing, XYZ Home Services." The AI will avoid directing your customers to these companies.');

  form.addParagraphTextItem()
    .setTitle('What sets you apart from competitors?')
    .setHelpText('e.g. "Family-owned since 1998, certified installers, 5-star Google rating, lifetime warranty." The AI will highlight these.');

  form.addParagraphTextItem()
    .setTitle('Review / Social Links')
    .setHelpText('Google review URL, Yelp, Facebook page, etc. The AI can direct happy customers here automatically.');

  form.addParagraphTextItem()
    .setTitle('Seasonal or Promotional Notes')
    .setHelpText('e.g. "Summer discount on inspections June–August, winter emergency surcharge November–February."');

  form.addParagraphTextItem()
    .setTitle('Anything else we should know?')
    .setHelpText('Special instructions, concerns, or questions for the CWI team. We read every response.');

  form.addDateItem()
    .setTitle('Target Go-Live Date')
    .setHelpText('When would you like your AI assistant to go live? We will work backward from this date to plan the build.');


  /* ================================================================
     OUTPUT LINKS
     ================================================================ */
  var editUrl = form.getEditUrl();
  var liveUrl = form.getPublishedUrl();

  Logger.log('========================================');
  Logger.log('CWI Onboarding Form Created Successfully');
  Logger.log('========================================');
  Logger.log('Edit URL  : ' + editUrl);
  Logger.log('Live URL  : ' + liveUrl);
  Logger.log('');
  Logger.log('Share the Live URL with clients.');
  Logger.log('Use the Edit URL to make changes in the Form editor.');

  // Optional: show a pop-up alert in the script editor
  var ui = SpreadsheetApp.getUi ? SpreadsheetApp : null;
  try {
    SpreadsheetApp.getUi().alert(
      'Form created!\n\nLive URL:\n' + liveUrl + '\n\nEdit URL:\n' + editUrl
    );
  } catch (e) {
    // Running from standalone Apps Script — links are in the Logger above
  }

  return { editUrl: editUrl, liveUrl: liveUrl };
}


/**
 * OPTIONAL UTILITY — linkToSheet
 * -----------------------------------------------
 * Run this AFTER createOnboardingForm() to create a linked
 * Google Sheet that captures all responses automatically.
 *
 * Usage:
 *   1. Open the form in the Form editor
 *   2. Go to Responses > Link to Sheets
 *   — OR —
 *   Run linkFormToSheet() below (requires the form ID).
 */
function linkFormToSheet() {
  // Paste your Form ID here (from the edit URL, between /d/ and /edit)
  var FORM_ID = 'PASTE_YOUR_FORM_ID_HERE';

  var form = FormApp.openById(FORM_ID);
  var ss   = SpreadsheetApp.create('CWI Onboarding Responses — ' + new Date().toLocaleDateString());

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('Linked! Spreadsheet URL: ' + ss.getUrl());
}
