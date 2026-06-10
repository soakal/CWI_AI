/**
 * CWI AI KPI Dashboard Builder
 * Google Apps Script — kpi-dashboard.gs
 *
 * Creates a full KPI dashboard in Google Sheets with 6 sheets:
 *   Summary, Outreach, Revenue, Retention, Chatbot Performance, Financial Health
 *
 * Entry point: createDashboard()
 * Menu:        CWI Dashboard → Rebuild Dashboard
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var SHEET_NAMES = {
  SUMMARY:      'Summary',
  OUTREACH:     'Outreach',
  REVENUE:      'Revenue',
  RETENTION:    'Retention',
  CHATBOT:      'Chatbot Performance',
  FINANCIAL:    'Financial Health'
};

// Brand colours
var COLORS = {
  HEADER_BG:   '#1a1a2e',   // dark navy
  HEADER_FG:   '#ffffff',
  ACCENT:      '#e94560',   // CWI red-ish accent
  SUBHEADER_BG:'#16213e',
  LABEL_BG:    '#0f3460',
  LABEL_FG:    '#e0e0e0',
  ALT_ROW:     '#f5f7fa',
  WHITE:       '#ffffff',
  GREEN:       '#34a853',
  YELLOW:      '#fbbc04',
  RED:         '#ea4335',
  LIGHT_GREEN: '#e6f4ea',
  LIGHT_YELLOW:'#fef7e0',
  LIGHT_RED:   '#fce8e6'
};

// ─────────────────────────────────────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds the "CWI Dashboard" menu when the spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CWI Dashboard')
    .addItem('Rebuild Dashboard', 'createDashboard')
    .addToUi();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main entry point.
 * Deletes and recreates all 6 dashboard sheets in order.
 */
function createDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Build sheets in dependency order (Summary last so references resolve)
  var buildOrder = [
    SHEET_NAMES.OUTREACH,
    SHEET_NAMES.REVENUE,
    SHEET_NAMES.RETENTION,
    SHEET_NAMES.CHATBOT,
    SHEET_NAMES.FINANCIAL,
    SHEET_NAMES.SUMMARY
  ];

  // Delete existing dashboard sheets
  buildOrder.forEach(function(name) {
    var existing = ss.getSheetByName(name);
    if (existing) ss.deleteSheet(existing);
  });

  // Create each sheet
  buildOutreachSheet(ss);
  buildRevenueSheet(ss);
  buildRetentionSheet(ss);
  buildChatbotSheet(ss);
  buildFinancialSheet(ss);
  buildSummarySheet(ss);

  // Reorder sheets so Summary is first
  var summarySheet = ss.getSheetByName(SHEET_NAMES.SUMMARY);
  ss.setActiveSheet(summarySheet);
  ss.moveActiveSheet(1);

  SpreadsheetApp.getUi().alert('CWI AI KPI Dashboard rebuilt successfully!');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new sheet with a given name and returns it.
 */
function createSheet(ss, name) {
  var sheet = ss.insertSheet(name);
  sheet.setTabColor(COLORS.ACCENT);
  return sheet;
}

/**
 * Applies standard header formatting to a range.
 */
function styleHeader(range) {
  range.setBackground(COLORS.HEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle');
}

/**
 * Applies sub-header (label column) formatting.
 */
function styleLabel(range) {
  range.setBackground(COLORS.LABEL_BG)
       .setFontColor(COLORS.LABEL_FG)
       .setFontWeight('bold');
}

/**
 * Applies alternating row shading to a block of data rows.
 * @param {Sheet}  sheet
 * @param {number} startRow  1-based first data row
 * @param {number} numRows
 * @param {number} startCol  1-based
 * @param {number} numCols
 */
function applyAlternatingRows(sheet, startRow, numRows, startCol, numCols) {
  for (var r = 0; r < numRows; r++) {
    if (r % 2 === 1) {
      sheet.getRange(startRow + r, startCol, 1, numCols)
           .setBackground(COLORS.ALT_ROW);
    }
  }
}

/**
 * Writes a month-column header row (Jan–Dec 2026) plus optional extras.
 * Returns the column letter of the first month column (B).
 */
function writeMonthHeaders(sheet, labelRow, labelCol, extraCols) {
  // Row title
  sheet.getRange(labelRow, labelCol).setValue('Metric');

  // Month columns
  for (var m = 0; m < 12; m++) {
    sheet.getRange(labelRow, labelCol + 1 + m).setValue(MONTHS[m] + ' 2026');
  }

  // Extra columns (e.g. Benchmark, Notes)
  if (extraCols) {
    extraCols.forEach(function(col, i) {
      sheet.getRange(labelRow, labelCol + 13 + i).setValue(col);
    });
  }

  // Style the full header row
  var totalCols = 13 + (extraCols ? extraCols.length : 0);
  styleHeader(sheet.getRange(labelRow, labelCol, 1, totalCols));

  // Freeze header row and label column
  sheet.setFrozenRows(labelRow);
  sheet.setFrozenColumns(labelCol);
}

/**
 * Converts a column number (1-based) to a column letter (A, B, …, Z, AA, …).
 */
function colLetter(n) {
  var s = '';
  while (n > 0) {
    var rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Adds green/yellow/red conditional formatting rules to a range.
 * Thresholds: [greenMin, yellowMin] — values above greenMin → green,
 *             between yellowMin and greenMin → yellow, below yellowMin → red.
 */
function addTrafficLight(sheet, range, greenMin, yellowMin, higherIsBetter) {
  var rules = sheet.getConditionalFormatRules();

  if (higherIsBetter !== false) {
    // Green: value >= greenMin
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(greenMin)
      .setBackground(COLORS.LIGHT_GREEN)
      .setFontColor(COLORS.GREEN)
      .setRanges([range])
      .build());

    // Yellow: value >= yellowMin (and < greenMin handled by rule order)
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberBetween(yellowMin, greenMin - 0.001)
      .setBackground(COLORS.LIGHT_YELLOW)
      .setFontColor('#b06000')
      .setRanges([range])
      .build());

    // Red: value < yellowMin
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(yellowMin)
      .setBackground(COLORS.LIGHT_RED)
      .setFontColor(COLORS.RED)
      .setRanges([range])
      .build());
  } else {
    // Lower is better (e.g. churn rate)
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(greenMin)
      .setBackground(COLORS.LIGHT_GREEN)
      .setFontColor(COLORS.GREEN)
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberBetween(greenMin + 0.001, yellowMin)
      .setBackground(COLORS.LIGHT_YELLOW)
      .setFontColor('#b06000')
      .setRanges([range])
      .build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(yellowMin)
      .setBackground(COLORS.LIGHT_RED)
      .setFontColor(COLORS.RED)
      .setRanges([range])
      .build());
  }

  sheet.setConditionalFormatRules(rules);
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTREACH SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Outreach sheet.
 *
 * Rows:
 *   2  Emails Sent
 *   3  Replies
 *   4  Reply Rate %        =B3/B2*100
 *   5  Qualified Leads
 *   6  Calls Booked
 *   7  Signed / Closed
 *   8  Close Rate %        =B7/B6*100
 *   9  CAC ($)
 *   10 Sales Cycle (Days)
 *
 * Conditional formatting:
 *   Reply Rate  — green >8, yellow 3-8, red <3
 *   Close Rate  — green >20, yellow 10-20, red <10
 */
function buildOutreachSheet(ss) {
  var sheet = createSheet(ss, SHEET_NAMES.OUTREACH);

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRange('A1').setValue('CWI AI — Outreach KPIs 2026');
  styleHeader(sheet.getRange('A1:N1'));
  sheet.getRange('A1').setFontSize(14);
  sheet.setRowHeight(1, 35);

  // ── Month headers (row 1 already used; headers go on row 1, data row 2+) ──
  // We'll use row 1 as title merged, row 2 as column headers, data from row 3
  sheet.getRange('A1:N1').merge();

  // Header row 2
  sheet.getRange('A2').setValue('Metric');
  for (var m = 0; m < 12; m++) {
    sheet.getRange(2, 2 + m).setValue(MONTHS[m] + ' 2026');
  }
  sheet.getRange('N2').setValue('Benchmark');
  styleHeader(sheet.getRange('A2:N2'));
  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(1);

  // ── Row definitions ────────────────────────────────────────────────────────
  var rows = [
    { label: 'Emails Sent',       benchmark: '200/mo',  formula: null },
    { label: 'Replies',           benchmark: '',        formula: null },
    { label: 'Reply Rate (%)',     benchmark: '>8%',     formula: '={prev2}/{prev3}*100' },
    { label: 'Qualified Leads',   benchmark: '',        formula: null },
    { label: 'Calls Booked',      benchmark: '',        formula: null },
    { label: 'Signed / Closed',   benchmark: '',        formula: null },
    { label: 'Close Rate (%)',     benchmark: '>20%',    formula: '={prev6}/{prev7}*100' },
    { label: 'CAC ($)',            benchmark: '<$500',   formula: null },
    { label: 'Sales Cycle (Days)', benchmark: '<30 days',formula: null }
  ];

  // Absolute row numbers for formula back-references
  var dataStartRow = 3;

  rows.forEach(function(rowDef, idx) {
    var r = dataStartRow + idx;
    // Label
    sheet.getRange(r, 1).setValue(rowDef.label);
    styleLabel(sheet.getRange(r, 1));

    // Month columns B–M (cols 2–13)
    for (var m = 0; m < 12; m++) {
      var col = 2 + m;
      var colL = colLetter(col);

      if (rowDef.label === 'Reply Rate (%)') {
        // =B3/B2*100  (replies / emails sent)
        var repliesRow   = dataStartRow + 1; // row index for Replies
        var emailsRow    = dataStartRow;     // row index for Emails Sent
        sheet.getRange(r, col).setFormula(
          '=IF(' + colL + emailsRow + '=0,"","' + '")');
        // Proper formula:
        sheet.getRange(r, col).setFormula(
          '=IFERROR(' + colL + repliesRow + '/' + colL + emailsRow + '*100,"")');
      } else if (rowDef.label === 'Close Rate (%)') {
        var signedRow = dataStartRow + 5; // Signed row
        var callsRow  = dataStartRow + 4; // Calls Booked row
        sheet.getRange(r, col).setFormula(
          '=IFERROR(' + colL + signedRow + '/' + colL + callsRow + '*100,"")');
      }
      // Other rows: leave blank for manual data entry
    }

    // Benchmark column N (col 14)
    sheet.getRange(r, 14).setValue(rowDef.benchmark)
         .setHorizontalAlignment('center')
         .setFontStyle('italic')
         .setFontColor('#666666');
  });

  // ── Alternating row shading ────────────────────────────────────────────────
  applyAlternatingRows(sheet, dataStartRow, rows.length, 1, 14);

  // ── Conditional formatting ─────────────────────────────────────────────────
  // Reply Rate — row 5 (dataStartRow + 2), cols B–M
  var replyRateRow = dataStartRow + 2;
  var replyRateRange = sheet.getRange(replyRateRow, 2, 1, 12);
  addTrafficLight(sheet, replyRateRange, 8, 3, true);

  // Close Rate — row 9 (dataStartRow + 6), cols B–M
  var closeRateRow = dataStartRow + 6;
  var closeRateRange = sheet.getRange(closeRateRow, 2, 1, 12);
  addTrafficLight(sheet, closeRateRange, 20, 10, true);

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 180);
  for (var c = 2; c <= 13; c++) sheet.setColumnWidth(c, 85);
  sheet.setColumnWidth(14, 110);

  // Number formatting for percentage rows
  sheet.getRange(replyRateRow, 2, 1, 12).setNumberFormat('0.0"%"');
  sheet.getRange(closeRateRow, 2, 1, 12).setNumberFormat('0.0"%"');
  // CAC row — currency
  sheet.getRange(dataStartRow + 7, 2, 1, 12).setNumberFormat('"$"#,##0');
}

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Revenue sheet.
 *
 * Rows:
 *   3  MRR
 *   4  New MRR
 *   5  Churned MRR
 *   6  Platform Costs
 *   7  Gross Margin %   =(MRR - PlatformCosts) / MRR * 100
 *   8  ARR              =MRR * 12
 *   9  MRR Growth Rate  =(MRR - PriorMRR) / PriorMRR * 100
 *
 * Conditional formatting:
 *   Gross Margin — green >75, yellow 60-75, red <60
 */
function buildRevenueSheet(ss) {
  var sheet = createSheet(ss, SHEET_NAMES.REVENUE);

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRange('A1:N1').merge()
       .setValue('CWI AI — Revenue KPIs 2026')
       .setFontSize(14);
  styleHeader(sheet.getRange('A1:N1'));
  sheet.setRowHeight(1, 35);

  // ── Header row ─────────────────────────────────────────────────────────────
  sheet.getRange('A2').setValue('Metric');
  for (var m = 0; m < 12; m++) {
    sheet.getRange(2, 2 + m).setValue(MONTHS[m] + ' 2026');
  }
  sheet.getRange('N2').setValue('Notes');
  styleHeader(sheet.getRange('A2:N2'));
  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(1);

  var dataStartRow = 3;

  var rows = [
    { label: 'MRR ($)',           type: 'currency', formula: null },
    { label: 'New MRR ($)',       type: 'currency', formula: null },
    { label: 'Churned MRR ($)',   type: 'currency', formula: null },
    { label: 'Platform Costs ($)',type: 'currency', formula: null },
    { label: 'Gross Margin (%)',  type: 'percent',  formula: 'margin' },
    { label: 'ARR ($)',           type: 'currency', formula: 'arr' },
    { label: 'MRR Growth Rate (%)',type:'percent',  formula: 'growth' }
  ];

  var mrrRow           = dataStartRow;       // row 3
  var platformCostRow  = dataStartRow + 3;   // row 6
  var grossMarginRow   = dataStartRow + 4;   // row 7
  var arrRow           = dataStartRow + 5;   // row 8
  var growthRow        = dataStartRow + 6;   // row 9

  rows.forEach(function(rowDef, idx) {
    var r = dataStartRow + idx;
    sheet.getRange(r, 1).setValue(rowDef.label);
    styleLabel(sheet.getRange(r, 1));

    for (var m = 0; m < 12; m++) {
      var col  = 2 + m;
      var colL = colLetter(col);
      var prevColL = colLetter(col - 1);

      if (rowDef.formula === 'margin') {
        // Gross Margin = (MRR - Platform Costs) / MRR * 100
        sheet.getRange(r, col).setFormula(
          '=IFERROR((' + colL + mrrRow + '-' + colL + platformCostRow + ')/' +
          colL + mrrRow + '*100,"")');
      } else if (rowDef.formula === 'arr') {
        // ARR = MRR * 12
        sheet.getRange(r, col).setFormula(
          '=IFERROR(' + colL + mrrRow + '*12,"")');
      } else if (rowDef.formula === 'growth') {
        if (m === 0) {
          // No prior month in Jan — leave blank
          sheet.getRange(r, col).setValue('');
        } else {
          // MRR Growth = (ThisMRR - PriorMRR) / PriorMRR * 100
          sheet.getRange(r, col).setFormula(
            '=IFERROR((' + colL + mrrRow + '-' + prevColL + mrrRow + ')/' +
            prevColL + mrrRow + '*100,"")');
        }
      }
      // Input rows stay blank for manual entry
    }
  });

  // ── Alternating rows ───────────────────────────────────────────────────────
  applyAlternatingRows(sheet, dataStartRow, rows.length, 1, 14);

  // ── Number formatting ──────────────────────────────────────────────────────
  var currencyRows = [mrrRow, mrrRow+1, mrrRow+2, platformCostRow, arrRow];
  currencyRows.forEach(function(r) {
    sheet.getRange(r, 2, 1, 12).setNumberFormat('"$"#,##0');
  });
  sheet.getRange(grossMarginRow, 2, 1, 12).setNumberFormat('0.0"%"');
  sheet.getRange(growthRow, 2, 1, 12).setNumberFormat('0.0"%"');

  // ── Conditional formatting — Gross Margin ──────────────────────────────────
  addTrafficLight(sheet, sheet.getRange(grossMarginRow, 2, 1, 12), 75, 60, true);

  // ── MRR Growth — green >10%, yellow 0-10%, red <0% ────────────────────────
  addTrafficLight(sheet, sheet.getRange(growthRow, 2, 1, 12), 10, 0, true);

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 190);
  for (var c = 2; c <= 13; c++) sheet.setColumnWidth(c, 90);
  sheet.setColumnWidth(14, 150);
}

// ─────────────────────────────────────────────────────────────────────────────
// RETENTION SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Retention sheet.
 *
 * Table 1 — Monthly metrics: Churn Rate, NPS Score, Upsells
 * Table 2 — Per-client chatbot tracker (5 client rows)
 */
function buildRetentionSheet(ss) {
  var sheet = createSheet(ss, SHEET_NAMES.RETENTION);

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRange('A1:N1').merge()
       .setValue('CWI AI — Retention & Client Health 2026')
       .setFontSize(14);
  styleHeader(sheet.getRange('A1:N1'));
  sheet.setRowHeight(1, 35);

  // ── TABLE 1: Monthly Retention Metrics ────────────────────────────────────
  sheet.getRange('A2').setValue('MONTHLY RETENTION METRICS');
  sheet.getRange('A2:N2').merge();
  sheet.getRange('A2').setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  // Header row
  sheet.getRange('A3').setValue('Metric');
  for (var m = 0; m < 12; m++) {
    sheet.getRange(3, 2 + m).setValue(MONTHS[m] + ' 2026');
  }
  sheet.getRange('N3').setValue('Target');
  styleHeader(sheet.getRange('A3:N3'));

  var monthlyRows = [
    { label: 'Monthly Churn Rate (%)', target: '<2%',  fmt: '0.0"%"' },
    { label: 'NPS Score',              target: '>50',  fmt: '0' },
    { label: 'Upsells / Expansions',   target: '1+/mo',fmt: '0' },
    { label: 'Active Clients',         target: '',     fmt: '0' },
    { label: 'At-Risk Clients',        target: '0',    fmt: '0' }
  ];

  monthlyRows.forEach(function(rowDef, idx) {
    var r = 4 + idx;
    sheet.getRange(r, 1).setValue(rowDef.label);
    styleLabel(sheet.getRange(r, 1));
    sheet.getRange(r, 14).setValue(rowDef.target)
         .setHorizontalAlignment('center').setFontStyle('italic')
         .setFontColor('#666666');
    if (rowDef.fmt) {
      sheet.getRange(r, 2, 1, 12).setNumberFormat(rowDef.fmt);
    }
  });

  applyAlternatingRows(sheet, 4, monthlyRows.length, 1, 14);

  // Conditional formatting — Churn Rate (lower is better)
  addTrafficLight(sheet, sheet.getRange(4, 2, 1, 12), 2, 5, false);

  // Conditional formatting — NPS Score (higher is better)
  addTrafficLight(sheet, sheet.getRange(5, 2, 1, 12), 50, 20, true);

  // ── Spacer row ─────────────────────────────────────────────────────────────
  var trackerStart = 4 + monthlyRows.length + 2; // row 11

  // ── TABLE 2: Per-Client Chatbot Tracker ───────────────────────────────────
  sheet.getRange('A' + trackerStart + ':J' + trackerStart).merge()
       .setValue('PER-CLIENT CHATBOT TRACKER')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  var trackerHeaderRow = trackerStart + 1;
  var trackerHeaders = [
    'Client Name', 'Industry', 'Containment Rate (%)',
    'Escalation Rate (%)', 'Tickets Deflected', 'Retrain Date',
    'Last Review', 'Contract Value ($)', 'Status', 'Notes'
  ];

  trackerHeaders.forEach(function(h, i) {
    sheet.getRange(trackerHeaderRow, 1 + i).setValue(h);
  });
  styleHeader(sheet.getRange(trackerHeaderRow, 1, 1, trackerHeaders.length));

  // 5 client data rows
  var clientPlaceholders = [
    ['Client 1', '', '', '', '', '', '', '', 'Active', ''],
    ['Client 2', '', '', '', '', '', '', '', 'Active', ''],
    ['Client 3', '', '', '', '', '', '', '', 'Pending', ''],
    ['Client 4', '', '', '', '', '', '', '', 'Active', ''],
    ['Client 5', '', '', '', '', '', '', '', 'At Risk', '']
  ];

  clientPlaceholders.forEach(function(clientRow, idx) {
    var r = trackerHeaderRow + 1 + idx;
    clientRow.forEach(function(val, c) {
      sheet.getRange(r, 1 + c).setValue(val);
    });
    // Style label column
    styleLabel(sheet.getRange(r, 1));
    if (idx % 2 === 1) {
      sheet.getRange(r, 2, 1, trackerHeaders.length - 1)
           .setBackground(COLORS.ALT_ROW);
    }
  });

  // Number formats for tracker
  var trackerDataRange = sheet.getRange(trackerHeaderRow + 1, 3,
                                        clientPlaceholders.length, 1);
  trackerDataRange.setNumberFormat('0.0"%"');
  sheet.getRange(trackerHeaderRow + 1, 4,
                 clientPlaceholders.length, 1).setNumberFormat('0.0"%"');
  sheet.getRange(trackerHeaderRow + 1, 8,
                 clientPlaceholders.length, 1).setNumberFormat('"$"#,##0');

  // Conditional formatting — Status column (col 9)
  var statusRange = sheet.getRange(
    trackerHeaderRow + 1, 9, clientPlaceholders.length, 1);
  var statusRules = sheet.getConditionalFormatRules();
  statusRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Active')
    .setBackground(COLORS.LIGHT_GREEN).setFontColor(COLORS.GREEN)
    .setRanges([statusRange]).build());
  statusRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground(COLORS.LIGHT_YELLOW).setFontColor('#b06000')
    .setRanges([statusRange]).build());
  statusRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('At Risk')
    .setBackground(COLORS.LIGHT_RED).setFontColor(COLORS.RED)
    .setRanges([statusRange]).build());
  sheet.setConditionalFormatRules(statusRules);

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 180);
  for (var c = 2; c <= 13; c++) sheet.setColumnWidth(c, 85);
  sheet.setColumnWidth(14, 110);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT PERFORMANCE SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Chatbot Performance sheet.
 *
 * Tracks aggregate chatbot metrics across all clients month-over-month.
 */
function buildChatbotSheet(ss) {
  var sheet = createSheet(ss, SHEET_NAMES.CHATBOT);

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRange('A1:N1').merge()
       .setValue('CWI AI — Chatbot Performance KPIs 2026')
       .setFontSize(14);
  styleHeader(sheet.getRange('A1:N1'));
  sheet.setRowHeight(1, 35);

  // ── Header row ─────────────────────────────────────────────────────────────
  sheet.getRange('A2').setValue('Metric');
  for (var m = 0; m < 12; m++) {
    sheet.getRange(2, 2 + m).setValue(MONTHS[m] + ' 2026');
  }
  sheet.getRange('N2').setValue('Benchmark');
  styleHeader(sheet.getRange('A2:N2'));
  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(1);

  var dataStartRow = 3;

  var rows = [
    { label: 'Total Conversations',      benchmark: '',       fmt: '#,##0' },
    { label: 'Containment Rate (%)',      benchmark: '>80%',   fmt: '0.0"%"' },
    { label: 'Escalation Rate (%)',       benchmark: '<20%',   fmt: '0.0"%"' },
    { label: 'Avg Resolution Time (min)', benchmark: '<5 min', fmt: '0.0' },
    { label: 'CSAT Score (1-5)',          benchmark: '>4.0',   fmt: '0.00' },
    { label: 'Tickets Deflected',         benchmark: '',       fmt: '#,##0' },
    { label: 'Deflection Value ($)',       benchmark: '',       fmt: '"$"#,##0' },
    { label: 'Avg Sessions / Client',     benchmark: '',       fmt: '#,##0' },
    { label: 'Bot Accuracy (%)',          benchmark: '>90%',   fmt: '0.0"%"' },
    { label: 'Retrain Events',            benchmark: '<2/mo',  fmt: '0' }
  ];

  rows.forEach(function(rowDef, idx) {
    var r = dataStartRow + idx;
    sheet.getRange(r, 1).setValue(rowDef.label);
    styleLabel(sheet.getRange(r, 1));
    sheet.getRange(r, 14).setValue(rowDef.benchmark)
         .setHorizontalAlignment('center').setFontStyle('italic')
         .setFontColor('#666666');
    if (rowDef.fmt) {
      sheet.getRange(r, 2, 1, 12).setNumberFormat(rowDef.fmt);
    }
  });

  applyAlternatingRows(sheet, dataStartRow, rows.length, 1, 14);

  // ── Conditional formatting ─────────────────────────────────────────────────
  // Containment Rate — row 4 — green >80, yellow 60-80, red <60
  addTrafficLight(sheet, sheet.getRange(dataStartRow + 1, 2, 1, 12), 80, 60, true);

  // Escalation Rate — row 5 — lower is better: green <20, yellow 20-35, red >35
  addTrafficLight(sheet, sheet.getRange(dataStartRow + 2, 2, 1, 12), 20, 35, false);

  // CSAT Score — row 7 — green >4, yellow 3-4, red <3
  addTrafficLight(sheet, sheet.getRange(dataStartRow + 4, 2, 1, 12), 4, 3, true);

  // Bot Accuracy — row 11 — green >90, yellow 75-90, red <75
  addTrafficLight(sheet, sheet.getRange(dataStartRow + 8, 2, 1, 12), 90, 75, true);

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 210);
  for (var c = 2; c <= 13; c++) sheet.setColumnWidth(c, 85);
  sheet.setColumnWidth(14, 110);
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL HEALTH SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Financial Health sheet.
 *
 * Sections:
 *   1. Break-even Calculator
 *   2. Milestone Tracker
 *   3. Effective Hourly Rate Calculator
 */
function buildFinancialSheet(ss) {
  var sheet = createSheet(ss, SHEET_NAMES.FINANCIAL);

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRange('A1:F1').merge()
       .setValue('CWI AI — Financial Health Dashboard')
       .setFontSize(14);
  styleHeader(sheet.getRange('A1:F1'));
  sheet.setRowHeight(1, 35);

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 1: Break-Even Calculator
  // ─────────────────────────────────────────────────────────────────────────
  sheet.getRange('A3:F3').merge()
       .setValue('BREAK-EVEN CALCULATOR')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  var beCells = [
    ['Input / Output',          'Value',          'Notes'],
    ['Monthly Platform Costs ($)', 500,            'Enter your total monthly platform costs'],
    ['Average Monthly Fee / Client ($)', 400,      'Average recurring fee per client'],
    ['Overhead & Other Costs ($)', 200,            'Tools, subscriptions, misc'],
    ['Total Monthly Fixed Costs ($)', '=B5+B7',    'Auto-calculated'],
    ['Clients Needed to Break Even', '=CEILING(B8/B6,1)', 'Auto-calculated — rounds up'],
    ['Break-Even MRR ($)',      '=B8',             'Same as total fixed costs']
  ];

  beCells.forEach(function(rowData, idx) {
    var r = 4 + idx;
    sheet.getRange(r, 1).setValue(rowData[0]);
    sheet.getRange(r, 2).setValue(rowData[1]);
    sheet.getRange(r, 3).setValue(rowData[2]);
  });

  // Style headers
  styleHeader(sheet.getRange('A4:C4'));

  // Style input rows
  [5, 6, 7].forEach(function(r) {
    styleLabel(sheet.getRange(r, 1));
    sheet.getRange(r, 2).setBackground('#e8f5e9').setFontWeight('bold');
  });

  // Style calculated rows
  [8, 9, 10].forEach(function(r) {
    styleLabel(sheet.getRange(r, 1));
    sheet.getRange(r, 2).setBackground(COLORS.LIGHT_GREEN).setFontWeight('bold');
  });

  // Number formats
  [5, 6, 7, 8, 10].forEach(function(r) {
    sheet.getRange(r, 2).setNumberFormat('"$"#,##0');
  });
  sheet.getRange(9, 2).setNumberFormat('0 " clients"');

  // Note label for inputs
  sheet.getRange('A11').setValue('* Edit yellow cells (rows 5, 6, 7) to recalculate.')
       .setFontStyle('italic').setFontColor('#888888');

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 2: Milestone Tracker
  // ─────────────────────────────────────────────────────────────────────────
  sheet.getRange('A13:F13').merge()
       .setValue('MILESTONE TRACKER')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  var msHeaders = ['Milestone', 'Revenue Target', 'Target Date',
                   'Actual Date', 'Status', 'Notes'];
  msHeaders.forEach(function(h, i) {
    sheet.getRange(14, 1 + i).setValue(h);
  });
  styleHeader(sheet.getRange('A14:F14'));

  var milestones = [
    ['First Paying Client',  '$0 → $1',     'Mar 2026', '', 'Pending', 'First contract signed'],
    ['$1k MRR',              '$1,000/mo',   'Apr 2026', '', 'Pending', '3 clients @ avg $333'],
    ['$3k MRR',              '$3,000/mo',   'Jun 2026', '', 'Pending', '~8 clients'],
    ['$5k MRR',              '$5,000/mo',   'Sep 2026', '', 'Pending', '~13 clients'],
    ['$10k MRR',             '$10,000/mo',  'Dec 2026', '', 'Pending', '~25 clients'],
    ['$100k ARR',            '$100,000/yr', 'Dec 2026', '', 'Pending', 'Annual milestone']
  ];

  milestones.forEach(function(ms, idx) {
    var r = 15 + idx;
    ms.forEach(function(val, c) {
      sheet.getRange(r, 1 + c).setValue(val);
    });
    styleLabel(sheet.getRange(r, 1));
    if (idx % 2 === 1) {
      sheet.getRange(r, 2, 1, 5).setBackground(COLORS.ALT_ROW);
    }
  });

  // Status conditional formatting
  var msStatusRange = sheet.getRange(15, 5, milestones.length, 1);
  var msRules = sheet.getConditionalFormatRules();
  msRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Achieved')
    .setBackground(COLORS.LIGHT_GREEN).setFontColor(COLORS.GREEN)
    .setRanges([msStatusRange]).build());
  msRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('In Progress')
    .setBackground(COLORS.LIGHT_YELLOW).setFontColor('#b06000')
    .setRanges([msStatusRange]).build());
  msRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#f5f5f5').setFontColor('#9e9e9e')
    .setRanges([msStatusRange]).build());
  msRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Missed')
    .setBackground(COLORS.LIGHT_RED).setFontColor(COLORS.RED)
    .setRanges([msStatusRange]).build());
  sheet.setConditionalFormatRules(msRules);

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 3: Effective Hourly Rate Calculator
  // ─────────────────────────────────────────────────────────────────────────
  var ehrStart = 15 + milestones.length + 2; // row 23

  sheet.getRange('A' + ehrStart + ':F' + ehrStart).merge()
       .setValue('EFFECTIVE HOURLY RATE CALCULATOR')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  var ehrRows = [
    ['Field',                          'Value',           'Notes'],
    ['Monthly Revenue ($)',            '',                'Your total MRR'],
    ['Monthly Platform Costs ($)',     '',                'Deducted from revenue'],
    ['Net Monthly Income ($)',         '=B' + (ehrStart+2) + '-B' + (ehrStart+3), 'Auto-calculated'],
    ['Hours Worked per Month',         '',                'Your actual hours'],
    ['Effective Hourly Rate ($/hr)',   '=IFERROR(B' + (ehrStart+4) + '/B' + (ehrStart+5) + ',"—")', 'Auto-calculated'],
    ['Annualized Income ($)',          '=IFERROR(B' + (ehrStart+4) + '*12,"—")', 'Auto-calculated']
  ];

  ehrRows.forEach(function(rowData, idx) {
    var r = ehrStart + 1 + idx;
    sheet.getRange(r, 1).setValue(rowData[0]);
    sheet.getRange(r, 2).setValue(rowData[1]);
    sheet.getRange(r, 3).setValue(rowData[2]);
  });

  styleHeader(sheet.getRange(ehrStart + 1, 1, 1, 3));

  // Style inputs
  [ehrStart + 2, ehrStart + 3, ehrStart + 5].forEach(function(r) {
    styleLabel(sheet.getRange(r, 1));
    sheet.getRange(r, 2).setBackground('#e8f5e9').setFontWeight('bold');
  });

  // Style outputs
  [ehrStart + 4, ehrStart + 6, ehrStart + 7].forEach(function(r) {
    styleLabel(sheet.getRange(r, 1));
    sheet.getRange(r, 2).setBackground(COLORS.LIGHT_GREEN).setFontWeight('bold');
  });

  // Number formats
  [ehrStart + 2, ehrStart + 3, ehrStart + 4, ehrStart + 7].forEach(function(r) {
    sheet.getRange(r, 2).setNumberFormat('"$"#,##0');
  });
  sheet.getRange(ehrStart + 5, 2).setNumberFormat('0 " hrs"');
  sheet.getRange(ehrStart + 6, 2).setNumberFormat('"$"#,##0.00"/hr"');

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 240);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 220);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the Summary sheet.
 *
 * Contains:
 *   - Key metrics pulled from other sheets (with SPARKLINE trend charts)
 *   - Overall health score
 *   - Monthly review checklist with checkboxes
 */
function buildSummarySheet(ss) {
  var sheet = createSheet(ss, SHEET_NAMES.SUMMARY);

  // ── Title ──────────────────────────────────────────────────────────────────
  sheet.getRange('A1:H1').merge()
       .setValue('CWI AI — Executive Summary Dashboard')
       .setFontSize(16).setFontWeight('bold');
  styleHeader(sheet.getRange('A1:H1'));
  sheet.setRowHeight(1, 40);

  // Last updated timestamp
  sheet.getRange('A2:H2').merge()
       .setFormula('="Dashboard last rebuilt: "&TEXT(NOW(),"mmm d, yyyy h:mm AM/PM")')
       .setHorizontalAlignment('right')
       .setFontStyle('italic')
       .setFontColor('#888888')
       .setBackground('#f8f9fa');

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 1: Key Metrics Snapshot
  // ─────────────────────────────────────────────────────────────────────────
  sheet.getRange('A4:H4').merge()
       .setValue('KEY METRICS SNAPSHOT')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  var kpiHeaders = ['KPI', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Trend'];
  kpiHeaders.forEach(function(h, i) {
    sheet.getRange(5, 1 + i).setValue(h);
  });
  styleHeader(sheet.getRange(5, 1, 1, kpiHeaders.length));

  // KPI rows — pull from respective sheets
  // Format: [label, sourceSheet, sourceRow, sparklineRange]
  var kpiRows = [
    {
      label:    'MRR ($)',
      formula:  function(col) {
        return '=IFERROR(\'Revenue\'!' + col + '3,"")';
      },
      sparkRange: '\'Revenue\'!B3:M3',
      fmt:      '"$"#,##0'
    },
    {
      label:    'ARR ($)',
      formula:  function(col) {
        return '=IFERROR(\'Revenue\'!' + col + '8,"")';
      },
      sparkRange: '\'Revenue\'!B8:M8',
      fmt:      '"$"#,##0'
    },
    {
      label:    'Gross Margin (%)',
      formula:  function(col) {
        return '=IFERROR(\'Revenue\'!' + col + '7,"")';
      },
      sparkRange: '\'Revenue\'!B7:M7',
      fmt:      '0.0"%"'
    },
    {
      label:    'Reply Rate (%)',
      formula:  function(col) {
        return '=IFERROR(\'Outreach\'!' + col + '5,"")';
      },
      sparkRange: '\'Outreach\'!B5:M5',
      fmt:      '0.0"%"'
    },
    {
      label:    'Close Rate (%)',
      formula:  function(col) {
        return '=IFERROR(\'Outreach\'!' + col + '9,"")';
      },
      sparkRange: '\'Outreach\'!B9:M9',
      fmt:      '0.0"%"'
    },
    {
      label:    'Churn Rate (%)',
      formula:  function(col) {
        return '=IFERROR(\'Retention\'!' + col + '4,"")';
      },
      sparkRange: '\'Retention\'!B4:M4',
      fmt:      '0.0"%"'
    },
    {
      label:    'NPS Score',
      formula:  function(col) {
        return '=IFERROR(\'Retention\'!' + col + '5,"")';
      },
      sparkRange: '\'Retention\'!B5:M5',
      fmt:      '0'
    },
    {
      label:    'Containment Rate (%)',
      formula:  function(col) {
        return '=IFERROR(\'Chatbot Performance\'!' + col + '4,"")';
      },
      sparkRange: '\'Chatbot Performance\'!B4:M4',
      fmt:      '0.0"%"'
    }
  ];

  var kpiDataStart = 6;

  kpiRows.forEach(function(kpi, idx) {
    var r = kpiDataStart + idx;
    sheet.getRange(r, 1).setValue(kpi.label);
    styleLabel(sheet.getRange(r, 1));

    // Month columns B-M (cols 2-13)
    for (var m = 0; m < 12; m++) {
      var col = 2 + m;
      var colL = colLetter(col);
      sheet.getRange(r, col).setFormula(kpi.formula(colL));
      if (kpi.fmt) sheet.getRange(r, col).setNumberFormat(kpi.fmt);
    }

    // Sparkline in column 14
    sheet.getRange(r, 14).setFormula(
      '=IFERROR(SPARKLINE(' + kpi.sparkRange + ',{"charttype","line";"color","' +
      COLORS.ACCENT + '";"linewidth",2}),"")');
    sheet.setRowHeight(r, 30);

    if (idx % 2 === 1) {
      sheet.getRange(r, 2, 1, 12).setBackground(COLORS.ALT_ROW);
    }
  });

  sheet.setRowHeight(5, 28); // header row

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 2: Overall Health Score
  // ─────────────────────────────────────────────────────────────────────────
  var healthRow = kpiDataStart + kpiRows.length + 2;

  sheet.getRange('A' + healthRow + ':H' + healthRow).merge()
       .setValue('OVERALL HEALTH SCORE')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  // Health score components
  var healthStart = healthRow + 1;
  var healthComponents = [
    ['Component',       'Weight', 'Current Value', 'Score (0-100)', 'Notes'],
    ['Revenue Growth',  '30%',    '',              '',              'MRR Growth Rate'],
    ['Client Retention','25%',    '',              '',              '100 - Churn Rate'],
    ['Chatbot Perf.',   '20%',    '',              '',              'Containment Rate'],
    ['Sales Pipeline',  '15%',    '',              '',              'Close Rate'],
    ['Gross Margin',    '10%',    '',              '',              'Gross Margin %']
  ];

  healthComponents.forEach(function(row, idx) {
    var r = healthStart + idx;
    row.forEach(function(val, c) {
      sheet.getRange(r, 1 + c).setValue(val);
    });
    if (idx === 0) {
      styleHeader(sheet.getRange(r, 1, 1, 5));
    } else {
      styleLabel(sheet.getRange(r, 1));
      if (idx % 2 === 1) {
        sheet.getRange(r, 2, 1, 4).setBackground(COLORS.ALT_ROW);
      }
    }
  });

  // Overall score row
  var overallRow = healthStart + healthComponents.length;
  sheet.getRange(overallRow, 1, 1, 5).merge()
       .setValue('Enter component scores in column D to calculate weighted health score')
       .setFontStyle('italic').setFontColor('#888888')
       .setHorizontalAlignment('center');

  // Weighted score formula note
  var scoreNoteRow = overallRow + 1;
  sheet.getRange(scoreNoteRow, 1).setValue('Weighted Health Score:');
  styleLabel(sheet.getRange(scoreNoteRow, 1));
  sheet.getRange(scoreNoteRow, 2).setFormula(
    '=IFERROR(' +
    'B' + (healthStart+1) + '*0.30*D' + (healthStart+1) + '/100+' +
    'B' + (healthStart+2) + '*0.25*D' + (healthStart+2) + '/100+' +
    'B' + (healthStart+3) + '*0.20*D' + (healthStart+3) + '/100+' +
    'B' + (healthStart+4) + '*0.15*D' + (healthStart+4) + '/100+' +
    'B' + (healthStart+5) + '*0.10*D' + (healthStart+5) + '/100' +
    ',"—")');
  sheet.getRange(scoreNoteRow, 2, 1, 4).merge()
       .setBackground(COLORS.LIGHT_GREEN)
       .setFontWeight('bold')
       .setFontSize(13)
       .setHorizontalAlignment('center')
       .setNumberFormat('0.0" / 100"');

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 3: Monthly Review Checklist
  // ─────────────────────────────────────────────────────────────────────────
  var checklistRow = scoreNoteRow + 3;

  sheet.getRange('A' + checklistRow + ':H' + checklistRow).merge()
       .setValue('MONTHLY REVIEW CHECKLIST')
       .setBackground(COLORS.SUBHEADER_BG)
       .setFontColor(COLORS.HEADER_FG)
       .setFontWeight('bold')
       .setFontSize(11);

  var checklistItems = [
    'Update all Outreach metrics (emails, replies, calls, signed)',
    'Update MRR, New MRR, and Churned MRR in Revenue sheet',
    'Log Platform Costs for the month',
    'Update Churn Rate and NPS Score in Retention sheet',
    'Update Chatbot Performance metrics for each client',
    'Review Milestone Tracker — mark any achieved milestones',
    'Update Financial Health break-even inputs if costs changed',
    'Review per-client chatbot tracker — flag any at-risk clients',
    'Schedule retrains for any chatbots with accuracy < 90%',
    'Send monthly report to stakeholders',
    'Set goals for next month based on trends'
  ];

  var checklistHeaderRow = checklistRow + 1;
  sheet.getRange(checklistHeaderRow, 1).setValue('Done?');
  sheet.getRange(checklistHeaderRow, 2).setValue('Review Task');
  sheet.getRange(checklistHeaderRow, 3).setValue('Month / Notes');
  styleHeader(sheet.getRange(checklistHeaderRow, 1, 1, 3));
  sheet.setColumnWidth(1, 70);

  checklistItems.forEach(function(item, idx) {
    var r = checklistHeaderRow + 1 + idx;
    // Insert checkbox in column A
    sheet.getRange(r, 1).insertCheckboxes();
    sheet.getRange(r, 2).setValue(item);
    sheet.getRange(r, 3).setValue('');  // Month/notes — manual entry
    if (idx % 2 === 1) {
      sheet.getRange(r, 2, 1, 2).setBackground(COLORS.ALT_ROW);
    }
  });

  // Strikethrough completed checklist items
  var checkboxRange = sheet.getRange(
    checklistHeaderRow + 1, 1, checklistItems.length, 1);
  var checkRules = sheet.getConditionalFormatRules();
  // When checkbox is TRUE, strike through the task text
  var taskRange = sheet.getRange(
    checklistHeaderRow + 1, 2, checklistItems.length, 1);
  checkRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(
      '=$A' + (checklistHeaderRow + 1) + '=TRUE')
    .setStrikethrough(true)
    .setFontColor('#aaaaaa')
    .setRanges([taskRange])
    .build());
  sheet.setConditionalFormatRules(checkRules);

  // ── Column widths ──────────────────────────────────────────────────────────
  sheet.setColumnWidth(1, 175);
  for (var c = 2; c <= 13; c++) sheet.setColumnWidth(c, 85);
  sheet.setColumnWidth(14, 140);

  sheet.setFrozenRows(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// END OF FILE
// ─────────────────────────────────────────────────────────────────────────────
