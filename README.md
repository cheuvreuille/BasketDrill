# BasketDrill

Open `index.html` to use the standalone basketball drill planner.

## Google Drive API-key gateway

Google Drive does not allow private file creation with a Google Cloud API key
alone. Drillboard therefore includes a small Google Apps Script gateway in
[`google-apps-script/Code.gs`](google-apps-script/Code.gs). The gateway runs as
its owner, checks a shared API key, validates the Drillboard JSON, and creates
the file in Google Drive.

### Deploy the gateway

1. Create a project at [script.google.com](https://script.google.com/).
2. Replace its `Code.gs` with `google-apps-script/Code.gs`. If you use `clasp`,
   copy `appsscript.json` into the Apps Script project as well.
3. In **Project Settings → Script Properties**, add:
   - `DRILLBOARD_API_KEY` (required): a long random value, preferably at least
     32 characters.
   - `DRIVE_FOLDER_ID` (optional): the ID of the Drive folder that should hold
     the exports. Without it, files are written to My Drive.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as** to **Me** and **Who has access** to **Anyone**. Authorize
   the requested Drive permission and deploy.
6. Copy the deployment URL ending in `/exec`.
7. In Drillboard, choose **Drive**, enter that URL and the same API key, choose
   **Connect**, and then choose **Save drill as JSON**.

The endpoint URL is retained in local storage. The API key is kept in session
storage and is cleared when the browser session ends. Redeploy the Apps Script
project after code changes, and rotate `DRILLBOARD_API_KEY` if it is exposed.
