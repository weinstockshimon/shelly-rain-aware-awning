/*
  Shelly rain delay/filter script

  Replace these placeholders before using:
  - YOUR_DEVICE_NAME
  - YOUR_GOOGLE_SCRIPT_WEB_APP_URL
  - YOUR_NTFY_TOPIC
*/

var DEVICE_NAME = "YOUR_DEVICE_NAME";

var GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL";
var NTFY_TOPIC = "YOUR_NTFY_TOPIC";

var INPUT_ID = 100;
var COVER_ID = 0;

var RAIN_ON_DELAY_MS = 70000;
var RAIN_OFF_DELAY_MS = 180000;

var rainOnTimer = null;
var rainOffTimer = null;

var confirmedRain = false;
var rainInputOnAt = 0;
var rainConfirmedAt = 0;
var rainInputOffAt = 0;
var cycleId = "";

function nowMs() {
  return Math.floor(Date.now());
}

function makeCycleId() {
  return DEVICE_NAME + "_" + String(nowMs());
}

function enc(v) {
  v = String(v || "");
  v = v.split("%").join("%25");
  v = v.split(" ").join("%20");
  v = v.split("\n").join("%0A");
  v = v.split("#").join("%23");
  v = v.split("&").join("%26");
  v = v.split("?").join("%3F");
  v = v.split("=").join("%3D");
  v = v.split("/").join("%2F");
  v = v.split(":").join("%3A");
  return v;
}

function durationSince(startMs) {
  if (startMs === 0) return "";

  var totalSeconds = Math.round((nowMs() - startMs) / 1000);
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;

  if (minutes > 0) {
    return String(minutes) + " min " + String(seconds) + " sec";
  }

  return String(seconds) + " sec";
}

function isRaining() {
  var input = Shelly.getComponentStatus("input:" + INPUT_ID);

  if (input === null || input === undefined) {
    return false;
  }

  return input.state === true;
}

function logToGoogle(eventName, type, details, duration) {
  if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_WEB_APP_URL") {
    print("Google Script URL is not configured");
    return;
  }

  var url = GOOGLE_SCRIPT_URL +
    "?device=" + enc(DEVICE_NAME) +
    "&event=" + enc(eventName) +
    "&type=" + enc(type) +
    "&details=" + enc(details) +
    "&duration=" + enc(duration) +
    "&cycle=" + enc(cycleId) +
    "&source=" + enc("Shelly Script");

  Shelly.call("HTTP.GET", { url: url, timeout: 5 });
}

function notifyPhone(eventName, type, details, duration) {
  if (NTFY_TOPIC === "YOUR_NTFY_TOPIC") {
    print("ntfy topic is not configured");
    return;
  }

  var msg = DEVICE_NAME + "\n" +
    eventName + "\n" +
    type + "\n" +
    details + "\n" +
    "Duration: " + duration + "\n" +
    "Cycle: " + cycleId;

  var url = "https://ntfy.sh/" + NTFY_TOPIC +
    "/publish?title=" + enc("Shelly Rain Alert") +
    "&message=" + enc(msg);

  Shelly.call("HTTP.GET", { url: url, timeout: 5 });
}

function logBoth(eventName, type, details, duration) {
  print(eventName + " | " + type + " | " + details + " | " + duration);
  logToGoogle(eventName, type, details, duration);
  notifyPhone(eventName, type, details, duration);
}

function clearRainOnTimer() {
  if (rainOnTimer !== null) {
    Timer.clear(rainOnTimer);
    rainOnTimer = null;
  }
}

function clearRainOffTimer() {
  if (rainOffTimer !== null) {
    Timer.clear(rainOffTimer);
    rainOffTimer = null;
  }
}

function openCoverIfStillRaining() {
  rainOnTimer = null;

  if (isRaining()) {
    confirmedRain = true;
    rainConfirmedAt = nowMs();

    logBoth(
      "RAIN_CONFIRMED_OPEN_COMMAND",
      "RAIN CONFIRMED",
      "Rain stayed ON for 70 seconds. Sending cover open command.",
      durationSince(rainInputOnAt)
    );

    Shelly.call("Cover.Open", { id: COVER_ID });
  } else {
    logBoth(
      "FALSE_POSITIVE_SHORT_TRIGGER",
      "FALSE POSITIVE",
      "Rain input turned OFF before 70 seconds. Cover will not open.",
      durationSince(rainInputOnAt)
    );

    cycleId = "";
    rainInputOnAt = 0;
  }
}

function closeCoverIfStillDry() {
  rainOffTimer = null;

  if (!isRaining()) {
    logBoth(
      "DRY_CONFIRMED_CLOSE_COMMAND",
      "DRY CONFIRMED",
      "Rain stayed OFF for 3 minutes. Sending cover close command.",
      durationSince(rainInputOffAt)
    );

    Shelly.call("Cover.Close", { id: COVER_ID });

    logBoth(
      "RAIN_CYCLE_COMPLETE",
      "RAIN CYCLE COMPLETE",
      "Rain cycle completed by Shelly script.",
      durationSince(rainConfirmedAt)
    );

    confirmedRain = false;
    rainInputOnAt = 0;
    rainConfirmedAt = 0;
    rainInputOffAt = 0;
    cycleId = "";
  } else {
    logBoth(
      "RAIN_RETURNED_BEFORE_CLOSE",
      "RAIN STILL ACTIVE",
      "Rain returned before 3-minute dry timer finished. Cover will stay open.",
      durationSince(rainInputOffAt)
    );
  }
}

function handleRainInputChange() {
  if (isRaining()) {
    clearRainOffTimer();

    if (!confirmedRain) {
      clearRainOnTimer();

      cycleId = makeCycleId();
      rainInputOnAt = nowMs();

      logBoth(
        "RAIN_INPUT_ON",
        "RAIN INPUT",
        "Rain input turned ON. Starting 70-second confirmation timer.",
        ""
      );

      rainOnTimer = Timer.set(RAIN_ON_DELAY_MS, false, openCoverIfStillRaining);
    } else {
      logBoth(
        "RAIN_INPUT_ON_AGAIN",
        "RAIN STILL ACTIVE",
        "Rain input turned ON again while rain was already confirmed.",
        ""
      );
    }
  } else {
    clearRainOnTimer();

    if (confirmedRain) {
      rainInputOffAt = nowMs();

      logBoth(
        "RAIN_INPUT_OFF",
        "RAIN INPUT",
        "Rain input turned OFF. Starting 3-minute dry timer.",
        durationSince(rainConfirmedAt)
      );

      clearRainOffTimer();
      rainOffTimer = Timer.set(RAIN_OFF_DELAY_MS, false, closeCoverIfStillDry);
    } else {
      logBoth(
        "FALSE_POSITIVE_SHORT_TRIGGER",
        "FALSE POSITIVE",
        "Rain input turned OFF before rain was confirmed.",
        durationSince(rainInputOnAt)
      );

      cycleId = "";
      rainInputOnAt = 0;
    }
  }
}

Shelly.addStatusHandler(function(event) {
  if (event.component === "input:" + INPUT_ID) {
    handleRainInputChange();
  }
});

logBoth(
  "SCRIPT_STARTED",
  "SCRIPT STATUS",
  "Rain delay filter script started.",
  ""
);
