# Pow's Table

---

A little collection of our next dates. A burgundy restaurant catalog for Pow and Jon, with 18 researched places, local photographs, and a mobile layout.

## Open it

Open `index.html` in a modern browser. The collection, filters, place details, and saved choices work without a build step. Directions, menus, Instagram, and booking links open the original services.

## Upload to GitHub Pages

1. Create or open the repository you want to use. `pows-table` is a suitable project name.
2. Upload **the contents of this `src` folder** to the repository root: `index.html`, `styles.css`, `data.js`, `app.js`, `.nojekyll`, and the entire `assets` folder. Keep the documentation and font license with the project. Do not upload the surrounding research folder, original screenshots, or personal backup files.
3. Open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose your uploaded branch, and select **/(root)**. Save.
4. Use the **Visit site** link shown by GitHub after deployment. For a project repository, the address normally includes the repository name. Relative asset paths and hash links already support that arrangement.

There is no install command, build command, API key, or backend. `.nojekyll` is an empty file that tells GitHub to publish these static files directly. If your uploader hides dotfiles, create `.nojekyll` in the repository root. These steps follow [GitHub's publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [static site guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), checked September 22, 2026.

## Keep your list

- **Want to go** and **Been here** are saved in this browser on this device. A place belongs to one list at a time. Tap the same choice again to remove it.
- **Pick our next date** uses the current collection filters. It starts with matching Want to go places when there are any; otherwise it starts with all matching places.
- **Our list → Export backup** downloads a JSON file. **Restore backup** shows the incoming counts before replacing your current choices. Cancel leaves your list unchanged.
- Export before clearing browser data or moving from the local preview to the hosted site. Each website address and browser has separate storage. Private browsing may discard it. The app shows a notice when saving is blocked.
- There is no automatic sharing, account, analytics, or cloud database. Exchanging a backup file is optional and manual.

## Updating the collection

Send the next screenshot batch for research, then upload the supplied replacement static files. Keep existing place IDs stable so saved choices continue to match. Unknown IDs from an older or newer collection remain in backups.

`data.js` is the public collection. `app.js` holds interaction and local storage behavior. `styles.css` holds the burgundy palette, typography, and responsive layouts. Photographs have 600- and 1200-width variants in `assets`; smaller originals are never enlarged. The font is bundled locally under its included license.

Details were checked on September 22, 2026, against 55 source records, including 16 official Instagram profiles. Hours that could not be confirmed remain labeled. Prices are published menu examples, sometimes from delivery listings, rather than an estimated bill for two. There is no live open-now claim. The matcha event is excluded.

## Photographs

See [CREDITS.md](CREDITS.md) and the in-app source links for each selected image. Public Instagram profiles were checked where identifiable; full photo grids were unavailable through public access. The strongest accessible venue, brand, or attributed publisher images were selected and downloaded. Public accessibility and attribution do not establish permission to redistribute a photograph; permission remains unverified. Replace an image if its owner requests it or before publishing when permission is required.

## Validation

68 browser checks passed in Chromium: all 18 detail pages and photographs, search and combined filters, saved choices and reloads, valid and invalid backup handling, picker behavior, focus containment, touch interactions, blocked-storage and image-error states, local-file opening, and a GitHub-style project subpath. Layouts were checked at 320, 360, 390, 768, 1024, and 1440 pixels. This is browser emulation, not a claim of testing on physical iPhones or every browser.

The delivered release has no deployed GitHub repository attached to it. Deployment is controlled by the repository owner.
