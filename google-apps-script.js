/*
  Google Apps Script receiver for Shelly rain logs.

  Deploy as a web app:
  - Execute as: yourself
  - Access: anyone with the link
*/

const TIMEZONE = "America/New_York";

function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("Manual run detected.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getDailySheet();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, TIMEZONE, "MM/dd/yyyy hh:mm:ss a");

    const device = e.parameter.device || "";
    const event = e.parameter.event || "";
    const type = e.parameter.type || "";
    const details = e.parameter.details || "";
    const duration = e.parameter.duration || "";
    const cycle = e.parameter.cycle || "";
    const source = e.parameter.source || "Shelly Script";

    sheet.appendRow([timestamp, device, event, type, details, duration, cycle, source]);

    const row = sheet.getLastRow();
    sheet.getRange(row, 1, 1, 8).setBackground(getColor(type, event));

    return ContentService.createTextOutput("OK LOGGED - " + event);
  } finally {
    lock.releaseLock();
  }
}

function getDailySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const todayName = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");

  let sheet = ss.getSheetByName(todayName);

  if (!sheet) {
    sheet = ss.insertSheet(todayName);

    sheet.getRange(1, 1).setValue("Date");
    sheet.getRange(1, 2).setValue(todayName);

    sheet.getRange(2, 1, 1, 8).setValues([[
      "Timestamp",
      "Device",
      "Event",
      "Type",
      "Details",
      "Duration",
      "Cycle ID",
      "Source"
    ]]);

    sheet.getRange(1, 1, 2, 8).setFontWeight("bold");
    sheet.setFrozenRows(2);
  }

  return sheet;
}

function getColor(type, event) {
  if (event === "RESET") return "#cfe2f3";
  if (type.indexOf("FALSE") !== -1 || type.indexOf("BROKEN") !== -1) return "#f4cccc";
  if (type.indexOf("TIMER") !== -1 || type.indexOf("PENDING") !== -1) return "#fff2cc";
  if (type.indexOf("MANUAL") !== -1) return "#e6e6e6";
  if (type.indexOf("RAIN") !== -1 || type.indexOf("COMMAND") !== -1 || type.indexOf("COMPLETE") !== -1) return "#d9ead3";

  return "#ffffff";
}
