# Pow's Table

---

A little collection of our next dates. A burgundy restaurant catalog for Pow and Jon, with 20 places, including two owner-confirmed visited places, local photographs, and a mobile layout.

The September 27 update adds **What's new** and **Our calendar**. The two new finds are the Shangri-La Plaza Wine Fair (October 7–11; year to confirm) and Half Saints Soft Shell Crab Risotto (branch and availability to confirm). They are transcribed from the supplied posts. The existing 18-place collection keeps its prior source checks. The new finds use text entries; personal screenshot overlays are not included in the app.

The September 30 update adds **Sebastian's, Rockwell** and **Deuces Coffee Salmon Maki** to What's new, bringing the saved finds to four. Sebastian's includes all eight dishes and prices from the supplied post; Deuces includes the PHP 410.00 price for eight pieces and the suggested coffee pairing. Both can be scheduled. Current hours, branch, and availability caveats appear beside their sources. Social-media screenshots and personal overlays are not included in the public app.

The current October 5 release is **v1.6**. **The Underbelly** and **Alto Bar**, both at The Alley at Karrivin on Chino Roces Avenue Extension, are included in **Our list → Been here**. Both have credited venue photographs, addresses, listed hours, phone numbers, and social links. Alto’s official profile identifies it as in soft opening, with walk-ins only and Tuesday–Sunday hours of 17:00–01:00. A current itemized Alto menu was not available in the public sources checked. The Underbelly includes three published dish examples and prices.

The visited additions merge once into existing browser lists, preserving other choices and calendar plans. Later manual changes remain saved, including through backups. Actual visit dates remain unspecified. The original 18 venue records and four saved finds are unchanged.

Sources for this update: [The Underbelly in MICHELIN Guide](https://guide.michelin.com/en/metro-manila/makati-city_2329358/restaurant/the-underbelly), [Philippine Primer](https://primer.com.ph/food/cuisines/japanese/the-underbelly/), [Alto Bar’s official Instagram](https://www.instagram.com/alto.again/), and [Alto Bar’s Google listing](https://www.google.com/maps/place/Alto+Bar/data=!4m2!3m1!1s0x0:0xd25a1691e5d8be03). Underbelly prices are published examples from September 3, 2026; confirm current prices and availability.

## Open it

Open `index.html` in a modern browser. The collection, filters, place details, and saved choices work without a build step. Directions, menus, Instagram, and booking links open the original services.

## Upload to GitHub Pages

1. Create or open the repository you want to use. `pows-table` is a suitable project name.
2. Upload **the contents of this `src` folder** to the repository root: `index.html`, `styles.css`, `data.js`, `planner.js`, `app.js`, `.nojekyll`, and the entire `assets` folder. Keep the documentation and font license with the project. Do not upload the surrounding research folder, original screenshots, or personal backup files.
3. Open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose your uploaded branch, and select **/(root)**. Save.
4. Use the **Visit site** link shown by GitHub after deployment. For a project repository, the address normally includes the repository name. Relative asset paths and hash links already support that arrangement.

There is no install command, build command, API key, or backend. `.nojekyll` is an empty file that tells GitHub to publish these static files directly. If your uploader hides dotfiles, create `.nojekyll` in the repository root. These steps follow [GitHub's publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [static site guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), checked September 22, 2026.

## Keep your list

- **Want to go** and **Been here** are saved in this browser on this device. A place belongs to one list at a time. Tap the same choice again to remove it.
- **Pick our next date** uses the current collection filters. It starts with matching Want to go places when there are any; otherwise it starts with all matching places.
- **Our list → Export backup** downloads a JSON file containing your saved places and calendar dates. **Restore backup** shows the incoming counts before replacing your current choices. Cancel leaves your data unchanged. An older list-only backup replaces the lists and keeps your current calendar.
- Export before clearing browser data or moving from the local preview to the hosted site. Each website address and browser has separate storage. Private browsing may discard it. The app shows a notice when saving is blocked.
- There is no automatic sharing, account, analytics, or cloud database. Exchanging a backup file is optional and manual.

## Set a date

1. Select **Set a date** under a new find or inside a place's details. You can also open **Calendar**, select a day, then choose **Plan something for this day**.
2. Choose the date, optionally add a time and duration, and write any notes. Times use Philippine time (UTC+08:00). Leave the time blank for an all-day plan.
3. Select **Save date**. Saved dates appear on the month calendar and in **All our plans**. Select **Edit** to change or remove a plan.
4. **Calendar file** downloads one plan as an `.ics` file; **Download calendar** exports all saved plans. Import or open that file in your calendar app. This is a manual transfer and does not create a reservation or synchronize later edits automatically.

The Wine Fair date is intentionally blank when opened from What's new: the source says October 7–11 but does not show a year. The Half Saints dish is separate from the existing Half Saints stall at The Grid because the supplied post does not identify a branch.

## Updating the collection

Send the next screenshot batch for research, then upload the supplied replacement static files. Keep existing place IDs stable so saved choices continue to match. Unknown IDs from an older or newer collection remain in backups.

`data.js` is the public collection. `planner.js` holds the four saved finds, date planner, and calendar export. `app.js` holds the collection interactions, routing, shared storage, and backup behavior. `styles.css` holds the burgundy palette, typography, and responsive layouts. Photographs have 600- and 1200-width variants in `assets`; smaller originals are never enlarged. The font is bundled locally under its included license.

Details were checked on September 22, 2026, against 55 source records, including 16 official Instagram profiles. Hours that could not be confirmed remain labeled. Prices are published menu examples, sometimes from delivery listings, rather than an estimated bill for two. There is no live open-now claim. The matcha event is excluded.

## Photographs

See [CREDITS.md](CREDITS.md) and the in-app source links for each selected image. Public Instagram profiles were checked where identifiable; full photo grids were unavailable through public access. The strongest accessible venue, brand, or attributed publisher images were selected and downloaded. Public accessibility and attribution do not establish permission to redistribute a photograph; permission remains unverified. Replace an image if its owner requests it or before publishing when permission is required.

## Validation

For v1.6 on October 5, eight deterministic checks passed for venue identity, stable IDs, source references, photograph files, unchanged prior records, and release labels. JavaScript syntax checks passed for `app.js`, `data.js`, and `planner.js`. The in-app browser displayed both visited photo cards, the corrected Alto contact details and hours, and both detail pages at a 390 px phone width without horizontal overflow. The 1440 px desktop layout was inspected. Removing and restoring Alto’s visited status survived reload; the final list contains both venues. No browser console errors were reported.

14 browser checks passed in Chromium on October 5 for v1.4. Both visits appear on a fresh list and merge into an existing list without replacing other choices or calendar plans. Checks covered manual removal and reload, export and restore, older backups, blocked storage, corrupt saved data, original venue details, and photograph credits. JavaScript syntax checks passed. Phone (390 px) and desktop (1440 px) screenshots were inspected. The original 18 venue records and their sources are unchanged.

98 browser checks passed in Chromium on September 27: 68 regression checks plus 30 checks for the new finds and calendar. Coverage includes scheduling, editing, removing, reload persistence, old-list migration, backup preview/cancel/restore, invalid dates, blocked storage, local-tab updates, calendar downloads and timezone conversion, keyboard focus, and local-file opening. Layouts were checked at 320, 360, 390, 768, 1024, and 1440 pixels. Desktop and phone renders were inspected. This is browser emulation, not a claim of testing on physical iPhones or every browser.

The repository is [jstiosinmd-ui/pows-table](https://github.com/jstiosinmd-ui/pows-table). The static site files are at the repository root. GitHub Pages publication follows the repository’s existing deployment settings.
