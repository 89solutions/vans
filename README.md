# Van Stock

A phone-first web app for tradespeople to track the parts they carry on their van.

- **First use:** choose a trade and count parts on a ready-made list, or start from a blank list.
- **Quick add:** type `15mm elbow 12` or `twin and earth 50m` in one box, or paste a whole list. Works in setup and on the Stock tab.
- **On the job:** tap **Use 1** beside a part, or tap the part to enter a larger amount. Stock is deducted straight away, with an Undo.
- **Current job:** optionally type a job or address, and each use is recorded against it.
- **Stock:** add, edit and restock parts, and see what is low or out.
- **History:** every use and stock change by day, each one undoable.

## How it works

Plain HTML, CSS and JavaScript, with no build step and no server code. It works offline and can be installed to a phone's home screen.

Data is saved in the browser on that device (`localStorage`). It is not shared between devices, so the More tab has backup download and restore.

| File | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `store.js` | Stock data and rules |
| `starters.js` | Ready-made part lists for each trade |
| `app.js` | Screens and interaction |
| `stylesheet.css` | Styles, including dark mode |
| `sw.js` | Offline support |
| `tests/store.test.html` | Tests for `store.js` |

## Run it locally

On Windows, with nothing to install:

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open <http://localhost:8123>. For the tests, open <http://localhost:8123/tests/store.test.html>.

## Deploy

Upload the files to any static host. Offline use and home-screen install need HTTPS.

When adding a new file the app needs offline, list it in `FILES` in `sw.js`.
