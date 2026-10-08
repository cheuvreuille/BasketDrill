/**
 * Drillboard Google Drive gateway.
 *
 * Required Script Property:
 *   DRILLBOARD_API_KEY - a long, random secret shared with the web app.
 *
 * Optional Script Property:
 *   DRIVE_FOLDER_ID - the destination folder. Files are created in My Drive
 *   when this property is omitted.
 */

const MAX_CONTENT_BYTES = 5 * 1024 * 1024;

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'Drillboard Google Drive gateway',
    configured: Boolean(
      PropertiesService.getScriptProperties().getProperty('DRILLBOARD_API_KEY')
    )
  });
}

function doPost(event) {
  try {
    const request = parseRequest(event);
    const properties = PropertiesService.getScriptProperties();
    const expectedKey = properties.getProperty('DRILLBOARD_API_KEY');

    if (!expectedKey) {
      throw new Error('Gateway is not configured. Add DRILLBOARD_API_KEY in Script Properties.');
    }
    if (!safeEqual(request.apiKey, expectedKey)) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    const fileName = sanitizeFileName(request.fileName);
    const content = validateDrillJson(request.content);
    const blob = Utilities.newBlob(content, 'application/json', fileName);
    const folderId = properties.getProperty('DRIVE_FOLDER_ID');
    const file = folderId
      ? DriveApp.getFolderById(folderId).createFile(blob)
      : DriveApp.createFile(blob);

    return jsonResponse({
      ok: true,
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl()
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: error.message || 'Unexpected gateway error' });
  }
}

function parseRequest(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('Missing request body.');
  }
  let request;
  try {
    request = JSON.parse(event.postData.contents);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
  if (!request || typeof request !== 'object') {
    throw new Error('Invalid request body.');
  }
  return request;
}

function sanitizeFileName(value) {
  const base = String(value || 'basketball-drill.json')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .trim()
    .slice(0, 180);
  if (!base) {
    throw new Error('A file name is required.');
  }
  return base.toLowerCase().endsWith('.json') ? base : base + '.json';
}

function validateDrillJson(value) {
  if (typeof value !== 'string' || !value) {
    throw new Error('Drill content is required.');
  }
  if (Utilities.newBlob(value).getBytes().length > MAX_CONTENT_BYTES) {
    throw new Error('Drill JSON exceeds the 5 MB limit.');
  }
  let payload;
  try {
    payload = JSON.parse(value);
  } catch (error) {
    throw new Error('Drill content must be valid JSON.');
  }
  if (payload.format !== 'drillboard' || !payload.drill || !Array.isArray(payload.drill.steps)) {
    throw new Error('JSON is not a valid Drillboard export.');
  }
  return value;
}

function safeEqual(left, right) {
  left = String(left || '');
  right = String(right || '');
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
