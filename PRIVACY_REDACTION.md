# Privacy Redaction Checklist

Before publishing this project to GitHub or submitting it to Shelly, check every image and screenshot for private information.

## Code Files

The public code should use placeholders only:

```text
YOUR_DEVICE_NAME
YOUR_GOOGLE_SCRIPT_WEB_APP_URL
YOUR_NTFY_TOPIC
```

Do not publish:

```text
Live Google Apps Script URLs
Private ntfy topic names
Customer names
Street addresses
Personal file paths
```

## Images To Blur Or Crop

### ntfy Phone Notification Screenshot

Blur or crop:

```text
Topic name in the top bar
Any private notification topic
Any exact address or customer name if visible
```

Safe to keep:

```text
Shelly Rain Alert
Event names
Durations
Generic device name like "test"
```

### Shelly Script Screenshots

Use the screenshot showing the rain-confirmation logic around `openCoverIfStillRaining()` if possible.

Blur or crop:

```text
Google Apps Script URL
ntfy topic
Any real device names or addresses
```

Safe to keep:

```text
RAIN_ON_DELAY_MS = 70000
RAIN_OFF_DELAY_MS = 180000
RAIN_CONFIRMED_OPEN_COMMAND
FALSE_POSITIVE_SHORT_TRIGGER
Shelly.call("Cover.Open")
```

### Google Sheet Screenshot

Blur or crop:

```text
Spreadsheet title if it contains a customer/site name
Any real device name or address
Any live webhook URL if visible
```

Safe to keep:

```text
Event names
Durations
Generic device name like "test"
Daily sheet date
False positive and confirmed-cycle rows
```

### Awning / House Photo

Consider cropping tighter around the awning and rain sensor.

Blur or crop:

```text
Street numbers
License plates
Neighboring identifiable property details
Faces
Any signs or labels
```

### Wiring Photos

Blur or crop:

```text
Installer/customer notes
Serial numbers if visible
Any labels with addresses or account names
```

Safe to keep:

```text
RG-9 board
J1 wiring
Shelly Add-on wiring
12V/24V power wiring
```

## Metadata

Before publishing photos, strip image metadata if possible. This removes hidden GPS/location/device info that may be embedded in original camera files.

## Final Check

- [ ] No live Apps Script URL visible
- [ ] No private ntfy topic visible
- [ ] No real addresses visible
- [ ] No customer names visible
- [ ] No personal file paths visible
- [ ] No location metadata in published images
- [ ] Device names are generic or anonymized
