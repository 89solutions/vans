// Screens and interaction. Stock rules live in store.js.
(function () {
  'use strict';

  const root = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const store = VanStore.createStore(openStorage(), {
    onSaveError: () => showToast('Could not save to this device. Your last change may be lost.'),
  });

  const ui = {
    tab: 'use',
    search: '',
    filter: 'all',
    recentIds: [],
    stockSearch: '',
    stockFilter: 'all',
    historyLimit: 100,
    setupFilter: '',
    setupOpen: new Set(),
    setupPick: new Set(),
    // The trades shown when adding from a list on the Stock tab, or null when that view is closed.
    lists: null,
    quick: { more: false, category: '', unit: 'each', low: '', bay: '' },
    editBays: false,
  };

  function openStorage() {
    try {
      const storage = window.localStorage;
      storage.getItem('vans.check');
      return storage;
    } catch (err) {
      const memory = new Map();
      return {
        getItem: (key) => (memory.has(key) ? memory.get(key) : null),
        setItem: (key, value) => memory.set(key, value),
      };
    }
  }

  /* ---------- Helpers ---------- */

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else if (key === 'class') el.className = value;
      else if (key === 'value') el.value = value;
      else if (value === true) el.setAttribute(key, '');
      else el.setAttribute(key, value);
    });
    children.flat(Infinity).forEach((child) => {
      if (child !== null && child !== undefined && child !== false) el.append(child);
    });
    return el;
  }

  function icon(path) {
    const span = document.createElement('span');
    span.className = 'icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" '
      + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
    return span;
  }

  const ICONS = {
    use: '<path d="M4 7h16M4 12h16M4 17h10"/><path d="m16 17 2 2 3-4"/>',
    stock: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    electrician: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    plumber: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    heating: '<path d="M12 22c4 0 7-2.8 7-7 0-4-3-6.5-4-10-2 2-3 4-3 6-1-1-2-2-2.5-3.5C7 9.5 5 12 5 15c0 4.2 3 7 7 7z"/>',
    gas: '<circle cx="12" cy="13" r="8"/><path d="m12 13 4-4M9 3h6"/>',
    carpenter: '<path d="m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 15 22 10.6 13.4 2 9 6.4z"/>',
    decorator: '<rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h3v5h-9v4"/><rect x="10" y="15" width="4" height="6" rx="1"/>',
    plasterer: '<path d="M3 16h13l5 4H7z"/><path d="M12 16V9a3 3 0 0 1 3-3h3"/>',
    tiler: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>',
    roofer: '<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/>',
    aircon: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/>',
    security: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    data: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/>'
      + '<rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
    solar: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    handyman: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    locksmith: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
    blank: '<path d="M12 5v14M5 12h14"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>'
      + '<path d="M7 8v8M10 8v8M14 8v8M17 8v8"/>',
  };

  // The van from the app icon, drawn in the text colour on an amber tile.
  const VAN_ART = '<path fill="currentColor" d="M20 34h40v32H18V36a2 2 0 0 1 2-2zM60 44h14l8 10v12H60z"/>'
    + '<path style="fill:var(--accent)" d="M64 48h8l5 7H64z"/>'
    + '<circle cx="33" cy="67" r="9" style="fill:var(--accent)"/><circle cx="33" cy="67" r="7" fill="currentColor"/>'
    + '<circle cx="68" cy="67" r="9" style="fill:var(--accent)"/><circle cx="68" cy="67" r="7" fill="currentColor"/>';

  function vanArt(className, size) {
    const span = document.createElement('span');
    span.className = className;
    span.setAttribute('aria-hidden', 'true');
    span.style.color = '#1f2328';
    span.innerHTML = '<svg viewBox="12 20 76 60" width="' + size + '" height="' + size + '">' + VAN_ART + '</svg>';
    return span;
  }

  function brandMark() {
    const mark = document.createElement('span');
    mark.className = 'brand-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<svg viewBox="0 0 100 100" style="color:#1f2328"><rect width="100" height="100" rx="22" style="fill:var(--accent)"/>'
      + VAN_ART + '</svg>';
    return h('p', { class: 'brand' }, mark, 'Van Stock');
  }

  function fmtQty(qty, unit) {
    return unit === 'each' ? String(qty) : qty + ' ' + unit;
  }

  function usedPhrase(amount, unit, name) {
    return unit === 'each' ? amount + ' × ' + name : amount + ' ' + unit + ' of ' + name;
  }

  function compareItems(a, b) {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  }

  function sortedItems() {
    return [...store.state.items].sort(compareItems);
  }

  function matches(item, search) {
    // "bay 3" finds exactly what is in bay 3, rather than anything containing a 3.
    const bay = search.trim().match(/^bay\s*(\d+)$/i);
    if (bay) return item.bay === Number(bay[1]);
    // A known barcode, typed or from a Bluetooth scanner, finds its part.
    if (/^\s*\d{8,}\s*$/.test(search)) {
      const owner = store.findByBarcode(search);
      if (owner) return owner.id === item.id;
    }
    const text = (item.name + ' ' + item.category).toLowerCase();
    return search.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
  }

  function groupByCategory(items) {
    const groups = new Map();
    items.forEach((item) => {
      const name = item.category || 'Other';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(item);
    });
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  }

  function statusTag(item) {
    if (store.isOut(item)) return h('span', { class: 'tag tag-out' }, 'Out');
    if (store.isLow(item)) return h('span', { class: 'tag tag-low' }, 'Low');
    return null;
  }

  /* ---------- Bays ---------- */

  function bayCount() {
    return store.state.bays || 0;
  }

  function bayTag(item) {
    return item.bay ? h('span', { class: 'tag tag-bay' }, 'Bay ' + item.bay) : null;
  }

  function baySelect(props, value) {
    const options = [h('option', { value: '', selected: !value }, 'No bay')];
    for (let bay = 1; bay <= bayCount(); bay++) {
      options.push(h('option', { value: String(bay), selected: Number(value) === bay }, 'Bay ' + bay));
    }
    return h('select', props, options);
  }

  // A number picker shared by setup and the More tab.
  function bayCountPicker(start) {
    const input = h('input', {
      class: 'stepper-input',
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      'aria-label': 'Number of bays',
      value: String(start),
      onfocus: (event) => event.target.select(),
    });
    const step = (change) => {
      const next = (parseInt(input.value, 10) || 0) + change;
      input.value = String(Math.min(VanStore.MAX_BAYS, Math.max(1, next)));
    };
    return {
      input: input,
      el: h('div', { class: 'stepper' },
        h('button', { class: 'stepper-btn', type: 'button', 'aria-label': 'One fewer bay', onclick: () => step(-1) }, '−'),
        input,
        h('button', { class: 'stepper-btn', type: 'button', 'aria-label': 'One more bay', onclick: () => step(1) }, '+')),
    };
  }

  function wholeBays(value) {
    const text = String(value).trim();
    if (!/^\d+$/.test(text) || Number(text) < 1) throw new Error('Enter how many bays, from 1 to ' + VanStore.MAX_BAYS + '.');
    return Number(text);
  }

  function baysDialog() {
    openDialog((close) => {
      const picker = bayCountPicker(bayCount() || 4);
      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      const apply = async (count) => {
        const affected = store.state.items.filter((i) => i.bay !== null && i.bay > count).length;
        if (affected > 0) {
          close();
          const yes = await confirmDialog({
            title: 'Remove bays with parts in them?',
            body: partCount(affected) + ' will no longer have a bay. You can give them a new one on the Stock tab.',
            confirmLabel: 'Remove bays',
            danger: true,
          });
          if (!yes) return;
        }
        store.setBays(count);
        close();
        render();
        showToast(count === 0 ? 'Bays switched off.' : 'Your van has ' + count + (count === 1 ? ' bay.' : ' bays.'));
      };
      return h('form', {
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          try {
            apply(wholeBays(picker.input.value));
          } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
          }
        },
      },
      h('h2', null, 'Bays in your van'),
      h('p', { class: 'muted' }, 'Count the shelving units or racking sections you keep parts in.'),
      picker.el,
      error,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'),
        h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save')),
      bayCount() > 0 ? h('button', {
        class: 'btn btn-quiet-danger',
        type: 'button',
        onclick: () => apply(0),
      }, 'I don’t use bays') : null);
    });
  }

  function attempt(action) {
    try {
      return action();
    } catch (err) {
      showToast(err.message);
      return undefined;
    }
  }

  /* ---------- Toast ---------- */

  let toastTimer;

  function showToast(message, undo) {
    clearTimeout(toastTimer);
    toastEl.replaceChildren(h('span', { class: 'toast-text' }, message));
    if (undo) {
      toastEl.append(h('button', {
        class: 'toast-action',
        type: 'button',
        onclick: () => {
          hideToast();
          undo();
        },
      }, 'Undo'));
    }
    toastEl.hidden = false;
    toastTimer = setTimeout(hideToast, undo ? 7000 : 4000);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    toastEl.hidden = true;
  }

  /* ---------- Dialogs ---------- */

  function openDialog(build) {
    const dialog = h('dialog', { class: 'sheet' });
    const close = () => dialog.close();
    dialog.append(h('div', { class: 'sheet-handle', 'aria-hidden': 'true' }), h('div', { class: 'sheet-body' }, build(close)));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    return dialog;
  }

  function confirmDialog({ title, body, confirmLabel, danger }) {
    return new Promise((resolve) => {
      let answer = false;
      const dialog = openDialog((close) => [
        h('h2', null, title),
        h('p', { class: 'muted' }, body),
        h('div', { class: 'sheet-actions' },
          h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'),
          h('button', {
            class: danger ? 'btn btn-danger' : 'btn btn-primary',
            type: 'button',
            onclick: () => {
              answer = true;
              close();
            },
          }, confirmLabel)),
      ]);
      dialog.addEventListener('close', () => resolve(answer));
    });
  }

  // Shared by "record use" and "restock": choose an amount, then confirm.
  function quantitySheet({ title, subtitle, note, confirmLabel, start, max, quick, run, done }) {
    openDialog((close) => {
      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      const input = h('input', {
        class: 'stepper-input',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        'aria-label': 'Quantity',
        value: String(start),
        onfocus: (event) => event.target.select(),
      });
      const step = (change) => {
        let next = (Number(input.value) || 0) + change;
        if (max !== undefined) next = Math.min(next, max);
        const lowest = change < 0 && (max === undefined || max >= 1) ? 1 : 0;
        input.value = String(Math.max(Math.round(next * 1000) / 1000, lowest));
      };
      return h('form', {
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          try {
            const result = run(input.value);
            close();
            done(result);
          } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
          }
        },
      },
      h('h2', null, title),
      h('p', { class: 'muted' }, subtitle),
      h('div', { class: 'stepper' },
        h('button', { class: 'stepper-btn', type: 'button', 'aria-label': 'One fewer', onclick: () => step(-1) }, '−'),
        input,
        h('button', { class: 'stepper-btn', type: 'button', 'aria-label': 'One more', onclick: () => step(1) }, '+')),
      h('div', { class: 'quick' },
        quick.filter((n) => max === undefined || n <= max).map((n) => h('button', {
          class: 'chip',
          type: 'button',
          onclick: () => {
            input.value = String(n);
          },
        }, String(n)))),
      note ? h('p', { class: 'muted small' }, note) : null,
      error,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'),
        // Starting here keeps the phone keyboard closed until the amount is tapped.
        h('button', { class: 'btn btn-primary', type: 'submit', autofocus: true }, confirmLabel)));
    });
  }

  function itemFields(values) {
    const v = values || {};
    return [
      h('label', { class: 'field' },
        h('span', null, 'Part or item name'),
        h('input', {
          name: 'name', type: 'text', maxlength: 80, autocomplete: 'off',
          placeholder: 'e.g. 15mm copper elbow', value: v.name || '',
        })),
      h('div', { class: 'field-row' },
        h('label', { class: 'field' },
          h('span', null, 'Quantity on van'),
          h('input', {
            name: 'qty', type: 'text', inputmode: 'decimal', autocomplete: 'off',
            value: v.qty === undefined ? '' : String(v.qty),
          })),
        h('label', { class: 'field' },
          h('span', null, 'Unit'),
          h('select', { name: 'unit' },
            VanStore.UNITS.map((unit) => h('option', { value: unit, selected: unit === (v.unit || 'each') }, unit))))),
      h('div', { class: 'field-row' },
        h('label', { class: 'field' },
          h('span', null, 'Category (optional)'),
          h('input', {
            name: 'category', type: 'text', maxlength: 40, autocomplete: 'off',
            list: 'category-options', value: v.category || '',
          })),
        h('label', { class: 'field' },
          h('span', null, 'Warn at (optional)'),
          h('input', {
            name: 'low', type: 'text', inputmode: 'decimal', autocomplete: 'off',
            value: v.low === null || v.low === undefined ? '' : String(v.low),
          }))),
      bayCount() > 0 ? h('label', { class: 'field' },
        h('span', null, 'Bay (optional)'),
        baySelect({ name: 'bay' }, v.bay)) : null,
      h('datalist', { id: 'category-options' }, store.categories().map((c) => h('option', { value: c }))),
    ];
  }

  function readItemForm(form) {
    const data = new FormData(form);
    return {
      name: data.get('name'),
      qty: data.get('qty'),
      unit: data.get('unit'),
      category: data.get('category'),
      low: data.get('low'),
      bay: data.get('bay'),
    };
  }

  // The barcodes linked to a part, each removable, with a button to scan another.
  function barcodeList(item, onAdd) {
    const rows = h('ul', { class: 'barcode-list' });
    const fill = () => rows.replaceChildren(...item.barcodes.map((code) => h('li', null,
      h('span', { class: 'barcode-code' }, code),
      h('button', {
        class: 'link-btn',
        type: 'button',
        'aria-label': 'Remove barcode ' + code,
        onclick: () => {
          store.unlinkBarcode(item.id, code);
          fill();
        },
      }, 'Remove'))));
    fill();
    return h('div', { class: 'barcodes' },
      h('span', { class: 'field-label' }, 'Barcodes'),
      rows,
      h('button', { class: 'btn btn-icon', type: 'button', onclick: onAdd }, icon(ICONS.scan), item.barcodes.length ? 'Scan another barcode' : 'Scan a barcode'));
  }

  function itemDialog(item, { after }) {
    const refresh = after || render;
    openDialog((close) => {
      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      return h('form', {
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          try {
            store.updateItem(item.id, readItemForm(event.target));
            close();
            refresh();
            showToast('Changes saved.');
          } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
          }
        },
      },
      h('h2', null, 'Edit item'),
      itemFields(item),
      barcodeList(item, () => {
        close();
        scanSheet({
          title: 'Scan a barcode for ' + item.name,
          onCode: (code) => {
            if (attempt(() => store.linkBarcode(item.id, code))) {
              refresh();
              showToast('Barcode saved for ' + item.name + '.');
            }
          },
        });
      }),
      error,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'),
        h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save')),
      h('button', {
        class: 'btn btn-quiet-danger',
        type: 'button',
        onclick: async () => {
          close();
          const yes = await confirmDialog({
            title: 'Delete ' + item.name + '?',
            body: 'It will be removed from your stock. Its past uses stay in History.',
            confirmLabel: 'Delete item',
            danger: true,
          });
          if (yes) {
            attempt(() => store.deleteItem(item.id));
            refresh();
          }
        },
      }, 'Delete item'));
    });
  }

  /* ---------- Barcodes ---------- */

  // Opens the camera and hands back the first barcode read, or one typed in.
  // A Bluetooth scanner types into the box and presses Enter, so that works too.
  function scanSheet({ title, onCode }) {
    let scan = null;
    const dialog = openDialog((close) => {
      const video = h('video', { class: 'scan-video', 'aria-hidden': 'true' });
      const viewfinder = h('div', { class: 'scan-view' }, video, h('span', { class: 'scan-frame', 'aria-hidden': 'true' }));
      const status = h('p', { class: 'muted small', role: 'status' }, 'Starting the camera…');
      const input = h('input', {
        name: 'code',
        type: 'text',
        autocomplete: 'off',
        enterkeyhint: 'search',
        'aria-label': 'Barcode number',
        placeholder: 'Or type the barcode number',
      });
      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      const finish = (code) => {
        close();
        onCode(code);
      };
      scan = VanScanner.start(video, {
        onReady: () => {
          status.textContent = 'Hold the barcode inside the box. It reads by itself.';
        },
        onCode: (code) => {
          if (navigator.vibrate) navigator.vibrate(60);
          finish(code);
        },
        onError: (message) => {
          viewfinder.hidden = true;
          status.textContent = message;
        },
      });
      return h('form', {
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          if (!input.value.trim()) {
            error.textContent = 'Type the number under the barcode.';
            error.hidden = false;
            return;
          }
          finish(input.value.trim());
        },
      },
      h('h2', null, title),
      viewfinder,
      status,
      h('div', { class: 'quick-line' }, input, h('button', { class: 'btn', type: 'submit' }, 'Find')),
      error,
      // Starting on Close keeps the phone keyboard from covering the camera.
      h('button', { class: 'btn btn-wide', type: 'button', autofocus: true, onclick: close }, 'Close'));
    });
    dialog.addEventListener('close', () => scan.stop());
  }

  // What a scan does depends on where it started: record a use, restock, or count during setup.
  const SCAN_TITLES = { use: 'Scan a part you used', restock: 'Scan a part to restock', count: 'Scan a part on the van' };

  function scanFor(purpose, after) {
    scanSheet({
      title: SCAN_TITLES[purpose],
      onCode: (code) => {
        const item = store.findByBarcode(code);
        if (item) actOnScan(item, purpose, after);
        else newBarcodeSheet(code, purpose, after);
      },
    });
  }

  function actOnScan(item, purpose, after) {
    if (purpose === 'use') {
      if (store.isOut(item)) showToast(item.name + ' is out of stock.');
      else openUseSheet(item);
    } else if (purpose === 'restock') {
      openRestockSheet(item);
    } else {
      quantitySheet({
        title: item.name,
        subtitle: 'How many are on the van?',
        confirmLabel: 'Save count',
        start: item.qty || 1,
        quick: [1, 5, 10, 25],
        run: (amount) => store.updateItem(item.id, { ...item, qty: amount }),
        done: () => {
          after();
          showToast(fmtQty(item.qty, item.unit) + ' ' + item.name + ' on the van.');
        },
      });
    }
  }

  // A barcode seen for the first time: link it to a part already in stock, or add a new part with it.
  function newBarcodeSheet(code, purpose, after) {
    openDialog((close) => {
      const list = h('ul', { class: 'rows link-rows' });
      const fillList = (search) => {
        const found = sortedItems().filter((item) => matches(item, search)).slice(0, 6);
        list.replaceChildren(...found.map((item) => h('li', null,
          h('button', {
            class: 'row row-plain',
            type: 'button',
            onclick: () => {
              try {
                store.linkBarcode(item.id, code);
              } catch (err) {
                showToast(err.message);
                return;
              }
              close();
              showToast('Barcode saved for ' + item.name + '.');
              actOnScan(item, purpose, after);
            },
          },
          h('span', { class: 'row-text' },
            h('span', { class: 'row-name' }, item.name),
            h('span', { class: 'row-meta' }, bayTag(item), item.category || null)),
          h('span', { class: 'row-qty' }, fmtQty(item.qty, item.unit))))));
      };
      fillList('');

      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      const line = h('input', {
        type: 'text',
        autocomplete: 'off',
        autocapitalize: 'sentences',
        'aria-label': 'New part name and how many',
        placeholder: 'e.g. 15mm elbow 12',
      });
      const hasStock = store.state.items.length > 0;
      return [
        h('h2', null, 'New barcode'),
        h('p', { class: 'muted' }, 'Barcode ', h('strong', null, code), '. Tell the app which part this is and it will know it next time.'),
        hasStock ? h('h3', { class: 'field-label' }, 'One of your parts') : null,
        hasStock ? searchField('', 'Find the part', fillList) : null,
        hasStock ? list : null,
        h('form', {
          class: 'stack',
          novalidate: true,
          onsubmit: (event) => {
            event.preventDefault();
            try {
              const item = store.addFromLine(line.value, { ...quickDefaults(), barcodes: [code] });
              close();
              after();
              showToast('Added ' + fmtQty(item.qty, item.unit) + ' ' + item.name + ' with its barcode.');
            } catch (err) {
              error.textContent = err.message;
              error.hidden = false;
            }
          },
        },
        h('h3', { class: 'field-label' }, hasStock ? 'Or a new part: name and how many' : 'A new part: name and how many'),
        h('div', { class: 'quick-line' }, line, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Add')),
        error),
        h('button', { class: 'btn btn-wide', type: 'button', autofocus: true, onclick: close }, 'Cancel'),
      ];
    });
  }

  function scanButton(purpose, label, after) {
    return h('button', {
      class: 'scan-btn',
      type: 'button',
      'aria-label': label,
      title: label,
      onclick: () => scanFor(purpose, after || render),
    }, icon(ICONS.scan));
  }

  /* ---------- Quick add ---------- */

  function quickDefaults() {
    return { category: ui.quick.category, unit: ui.quick.unit, low: ui.quick.low, bay: bayCount() > 0 ? ui.quick.bay : '' };
  }

  function partCount(count) {
    return count === 1 ? '1 part' : count + ' parts';
  }

  function openPasteSheet(text, onAdded) {
    openDialog((close) => {
      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      const area = h('textarea', {
        class: 'paste-area',
        rows: 8,
        autocomplete: 'off',
        'aria-label': 'Your list of parts',
        placeholder: '15mm elbow 12\n22mm tee 4\nTwin and earth 50m',
      });
      area.value = text || '';
      return h('form', {
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          const result = store.addLines(area.value, quickDefaults());
          if (result.added.length > 0) onAdded();
          if (result.failed.length === 0 && result.added.length > 0) {
            close();
            showToast('Added ' + partCount(result.added.length) + '.');
            return;
          }
          if (result.failed.length === 0) {
            error.textContent = 'Type or paste at least one line.';
          } else {
            area.value = result.failed.map((f) => f.line).join('\n');
            error.textContent = 'Added ' + partCount(result.added.length) + '. Fix the lines left here. '
              + 'First problem, "' + result.failed[0].line + '": ' + result.failed[0].reason;
          }
          error.hidden = false;
        },
      },
      h('h2', null, 'Paste a list'),
      h('p', { class: 'muted' }, 'One part per line, with how many. A column copied from a spreadsheet works too.'),
      area,
      error,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', type: 'button', onclick: close }, 'Close'),
        h('button', { class: 'btn btn-primary', type: 'submit' }, 'Add these parts')));
    });
  }

  function quickAddBox({ initial, onAdded, showBay }) {
    const feedback = h('p', { class: 'quick-feedback', role: 'status', hidden: true });
    const setFeedback = (text, isError) => {
      feedback.textContent = text;
      feedback.hidden = false;
      feedback.classList.toggle('form-error', isError);
    };

    const line = h('input', {
      name: 'line',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'sentences',
      enterkeyhint: 'next',
      'aria-label': 'Part name and how many',
      placeholder: 'e.g. 15mm elbow 12',
      value: initial || '',
      onpaste: (event) => {
        const pasted = event.clipboardData.getData('text');
        if (/\n/.test(pasted.trim())) {
          event.preventDefault();
          openPasteSheet(pasted, onAdded);
        }
      },
    });

    const lowInput = h('input', {
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
      value: ui.quick.low,
      oninput: (event) => {
        ui.quick.low = event.target.value;
      },
    });

    const categoryOptions = h('datalist', { id: 'quick-category-options' }, store.categories().map((c) => h('option', { value: c })));

    const moreOptions = h('div', { class: 'quick-more', hidden: !ui.quick.more },
      h('div', { class: 'field-row' },
        h('label', { class: 'field' },
          h('span', null, 'Category'),
          h('input', {
            type: 'text',
            maxlength: 40,
            autocomplete: 'off',
            list: 'quick-category-options',
            value: ui.quick.category,
            oninput: (event) => {
              ui.quick.category = event.target.value;
            },
          })),
        h('label', { class: 'field' },
          h('span', null, 'Unit if not typed'),
          h('select', {
            onchange: (event) => {
              ui.quick.unit = event.target.value;
            },
          }, VanStore.UNITS.map((unit) => h('option', { value: unit, selected: unit === ui.quick.unit }, unit))))),
      h('div', { class: 'field-row' },
        h('label', { class: 'field' }, h('span', null, 'Warn when down to'), lowInput),
        bayCount() > 0 && showBay !== false ? h('label', { class: 'field' },
          h('span', null, 'Bay'),
          baySelect({
            onchange: (event) => {
              ui.quick.bay = event.target.value;
            },
          }, ui.quick.bay)) : null),
      categoryOptions,
      h('p', { class: 'muted small' }, 'These stay set for the next part, which helps when working through one shelf or bay.'));

    return h('form', {
      class: 'card quick-add',
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        try {
          const item = store.addFromLine(line.value, quickDefaults());
          line.value = '';
          lowInput.value = '';
          ui.quick.low = '';
          categoryOptions.replaceChildren(...store.categories().map((c) => h('option', { value: c })));
          setFeedback('Added ' + item.name + ': ' + fmtQty(item.qty, item.unit), false);
          line.focus();
          onAdded(item);
        } catch (err) {
          setFeedback(err.message, true);
          line.focus();
        }
      },
    },
    h('div', { class: 'quick-line' },
      line,
      h('button', { class: 'btn btn-strong', type: 'submit' }, 'Add')),
    feedback,
    h('div', { class: 'quick-links' },
      h('button', {
        class: 'link-btn',
        type: 'button',
        onclick: () => {
          ui.quick.more = !ui.quick.more;
          moreOptions.hidden = !ui.quick.more;
        },
      }, 'More options'),
      h('button', {
        class: 'link-btn',
        type: 'button',
        onclick: () => openPasteSheet(line.value, onAdded),
      }, 'Paste a list')),
    moreOptions);
  }

  function openQuickAddDialog(initial) {
    const dialog = openDialog((close) => [
      h('h2', null, 'Add a part'),
      h('p', { class: 'muted' }, 'Type the name, then how many.'),
      quickAddBox({
        initial: initial,
        onAdded: () => {
          close();
          render();
          showToast('Added to your stock.');
        },
      }),
    ]);
    const input = dialog.querySelector('input');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /* ---------- First use: inventory setup ---------- */

  function baysScreen() {
    const picker = bayCountPicker(bayCount() || 4);
    const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const save = (count) => {
      const cleared = store.setBays(count);
      ui.editBays = false;
      ui.quick.bay = '';
      render();
      window.scrollTo(0, 0);
      if (cleared > 0) showToast(partCount(cleared) + ' no longer have a bay.');
    };
    return h('div', { class: 'screen' },
      brandMark(),
      h('div', { class: 'hero' },
        vanArt('hero-art', 58),
        h('h1', null, 'How many bays are in your van?'),
        h('p', { class: 'muted' },
          'Bays are the shelving units or racking sections you keep parts in. Number them however suits you, '
          + 'such as from the back doors forward. Then you can note which bay each part lives in.')),
      h('form', {
        class: 'card',
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          try {
            save(wholeBays(picker.input.value));
          } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
          }
        },
      },
      h('p', { class: 'field-label' }, 'Number of bays'),
      picker.el,
      error,
      h('button', { class: 'btn btn-primary btn-wide', type: 'submit' }, 'Continue')),
      h('button', { class: 'btn btn-wide', type: 'button', onclick: () => save(0) }, 'Skip: I don’t use bays'));
  }

  // The trade lists for the given ids, in the order they are offered.
  function tradeLists(ids) {
    return VanStarters.filter((trade) => ids.includes(trade.id));
  }

  function partTotal(trade) {
    return trade.categories.reduce((n, c) => n + c.parts.length, 0);
  }

  // The bay is chosen once at the top of a trade list, for counting and typing alike.
  function bayBar() {
    if (bayCount() === 0) return null;
    return h('div', { class: 'bay-bar' },
      h('label', { class: 'field' },
        h('span', null, 'Putting parts in'),
        baySelect({
          onchange: (event) => {
            ui.quick.bay = event.target.value;
          },
        }, ui.quick.bay)),
      h('p', { class: 'muted small' }, 'Work one bay at a time: choose it here, then count or add what’s in it.'));
  }

  function tradeScreen() {
    const picked = ui.setupPick;
    const start = (ids) => {
      store.setSetupTrades(ids);
      ui.setupFilter = '';
      render();
      window.scrollTo(0, 0);
    };
    const go = h('button', { class: 'btn btn-primary btn-wide', type: 'button', onclick: () => start(Array.from(picked)) });
    const refreshGo = () => {
      go.disabled = picked.size === 0;
      go.textContent = picked.size === 0 ? 'Choose one or more trades'
        : 'Continue with ' + picked.size + (picked.size === 1 ? ' list' : ' lists');
    };
    refreshGo();

    const card = (trade) => {
      const button = h('button', {
        class: 'choice choice-pick',
        type: 'button',
        'aria-pressed': String(picked.has(trade.id)),
        onclick: () => {
          if (picked.has(trade.id)) picked.delete(trade.id);
          else picked.add(trade.id);
          button.setAttribute('aria-pressed', String(picked.has(trade.id)));
          refreshGo();
        },
      },
      h('span', { class: 'choice-icon' }, icon(ICONS[trade.id] || ICONS.blank)),
      h('span', { class: 'choice-text' },
        h('span', { class: 'choice-title' }, trade.label),
        h('span', { class: 'choice-meta' }, partTotal(trade) + ' common parts')),
      h('span', { class: 'choice-check', 'aria-hidden': 'true' }));
      return button;
    };

    return h('div', { class: 'screen setup' },
      brandMark(),
      h('div', { class: 'hero' },
        vanArt('hero-art', 58),
        h('h1', null, 'What’s on your van?'),
        h('p', { class: 'muted' },
          'Choose your trade for a ready-made list of parts, then just count what you carry. '
          + 'Work across trades? Choose more than one and they’re joined into one list.')),
      h('div', { class: 'bay-note' },
        h('span', null, bayCount() > 0 ? 'Your van has ' + bayCount() + (bayCount() === 1 ? ' bay.' : ' bays.') : 'No bays set up.'),
        h('button', {
          class: 'link-btn',
          type: 'button',
          onclick: () => {
            ui.editBays = true;
            render();
            window.scrollTo(0, 0);
          },
        }, 'Change')),
      h('div', { class: 'choices', role: 'group', 'aria-label': 'Trades' }, VanStarters.map(card)),
      h('button', { class: 'choice choice-blank', type: 'button', onclick: () => start([]) },
        h('span', { class: 'choice-icon' }, icon(ICONS.blank)),
        h('span', { class: 'choice-text' },
          h('span', { class: 'choice-title' }, 'Start with a blank list'),
          h('span', { class: 'choice-meta' }, 'Type in your own parts')),
        h('span', { class: 'chevron', 'aria-hidden': 'true' })),
      h('div', { class: 'setup-finish' }, go));
  }

  // One or more trade lists to count parts from, by category. Used in setup and from the Stock tab.
  function starterPicker(lists, onChange, missingText) {
    const categories = VanStore.combineLists(lists);
    const names = new Set();
    const counters = [];
    const tallies = [];

    function refresh() {
      const byName = new Map(store.state.items.map((item) => [item.name.toLowerCase(), item]));
      counters.forEach((refreshCounter) => refreshCounter(byName));
      tallies.forEach((refreshTally) => refreshTally(byName));
    }

    function partRow(part) {
      const held = () => {
        const item = store.findItem(part.name);
        return item ? item.qty : 0;
      };
      const setCount = (value) => {
        try {
          // A newly counted part goes into the bay chosen at the top of the screen.
          store.setStarterCount({ ...part, bay: quickDefaults().bay }, String(value).trim() === '' ? 0 : value);
        } catch (err) {
          showToast(err.message);
        }
        refresh();
        if (onChange) onChange();
      };
      const input = h('input', {
        class: 'count-input',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        placeholder: '0',
        'aria-label': 'How many ' + part.name,
        onfocus: (event) => event.target.select(),
        onchange: (event) => setCount(event.target.value),
      });
      const minus = h('button', {
        class: 'count-btn',
        type: 'button',
        'aria-label': 'One fewer ' + part.name,
        onclick: () => setCount(Math.max(0, held() - 1)),
      }, '−');
      const meta = h('span', { class: 'row-meta' });
      const row = h('li', { class: 'part-row' },
        h('span', { class: 'row-text' },
          h('span', { class: 'row-name' }, part.name),
          meta),
        h('span', { class: 'counter' },
          minus,
          input,
          h('button', {
            class: 'count-btn',
            type: 'button',
            'aria-label': 'One more ' + part.name,
            onclick: () => setCount(held() + 1),
          }, '+')));
      counters.push((byName) => {
        const item = byName.get(part.name.toLowerCase());
        const qty = item ? item.qty : 0;
        input.value = qty > 0 ? String(qty) : '';
        minus.disabled = qty <= 0;
        meta.replaceChildren(...[item ? bayTag(item) : null, part.unit !== 'each' ? part.unit : null].filter(Boolean));
        row.classList.toggle('counted', qty > 0);
      });
      return row;
    }

    categories.forEach((category) => category.parts.forEach((part) => names.add(part.name.toLowerCase())));
    // Each category opens on a tap, so a long list starts as a short index of categories.
    const sections = categories.map((category) => {
      const rows = category.parts.map(partRow);
      const list = h('ul', { class: 'rows' }, rows);
      const tally = h('span', { class: 'category-tally' });
      const toggle = h('button', {
        class: 'category-toggle',
        type: 'button',
        'aria-expanded': 'false',
        onclick: () => {
          if (ui.setupOpen.has(category.name)) ui.setupOpen.delete(category.name);
          else ui.setupOpen.add(category.name);
          applyFilter();
        },
      },
      h('span', { class: 'category-name' }, category.name),
      ' ',
      tally,
      h('span', { class: 'chevron', 'aria-hidden': 'true' }));
      tallies.push((byName) => {
        const counted = category.parts.filter((part) => {
          const item = byName.get(part.name.toLowerCase());
          return item && item.qty > 0;
        }).length;
        tally.textContent = counted > 0 ? counted + ' of ' + category.parts.length : category.parts.length + ' parts';
        tally.classList.toggle('has-count', counted > 0);
      });
      return {
        name: category.name,
        rows: rows,
        parts: category.parts,
        list: list,
        toggle: toggle,
        el: h('section', null, h('h2', { class: 'category-heading' }, toggle), list),
      };
    });
    const noMatch = h('p', { class: 'muted', hidden: true }, missingText);

    function applyFilter() {
      // While searching, every category with a match is shown open.
      const searching = ui.setupFilter.trim() !== '';
      let shown = 0;
      sections.forEach((section) => {
        let inSection = 0;
        section.parts.forEach((part, index) => {
          const show = matches(part, ui.setupFilter);
          section.rows[index].hidden = !show;
          if (show) inSection += 1;
        });
        const open = searching || ui.setupOpen.has(section.name);
        section.list.hidden = !open;
        section.toggle.setAttribute('aria-expanded', String(open));
        section.toggle.disabled = searching;
        section.el.hidden = inSection === 0;
        shown += inSection;
      });
      noMatch.hidden = shown > 0;
    }

    applyFilter();
    refresh();
    return {
      names: names,
      refresh: refresh,
      el: h('div', { class: 'list' },
        searchField(ui.setupFilter, lists.length === 1 ? 'Find a part on this list' : 'Find a part on these lists', (value) => {
          ui.setupFilter = value;
          applyFilter();
        }),
        sections.map((section) => section.el),
        noMatch),
    };
  }

  function setupListScreen() {
    const lists = tradeLists(store.state.setupTrades);
    const ownHeading = h('h2', { class: 'section-title' });
    const ownList = h('ul', { class: 'rows' });
    const finish = h('button', { class: 'btn btn-primary btn-wide', type: 'button' });
    const picker = lists.length > 0
      ? starterPicker(lists, () => refreshSetup(),
        (lists.length === 1 ? 'Not on this list.' : 'Not on these lists.') + ' Add it with the box above.')
      : null;

    function refreshSetup() {
      const count = store.state.items.length;
      const own = store.state.items.filter((i) => !(picker && picker.names.has(i.name.toLowerCase()))).reverse();
      ownHeading.textContent = picker ? 'Your own parts' : partCount(count) + ' added';
      ownHeading.hidden = own.length === 0;
      ownList.replaceChildren(...own.map((item) => h('li', null,
        h('button', {
          class: 'row row-plain',
          type: 'button',
          onclick: () => itemDialog(item, { after: refreshAll }),
        },
        h('span', { class: 'row-text' },
          h('span', { class: 'row-name' }, item.name),
          h('span', { class: 'row-meta' }, bayTag(item), item.category || null)),
        h('span', { class: 'row-qty' }, fmtQty(item.qty, item.unit))))));
      finish.textContent = count === 0 ? (picker ? 'Count at least one part' : 'Add your first part above') : 'Finish setup (' + partCount(count) + ')';
      finish.disabled = count === 0;
    }

    // Typing or editing a part can change a count on the list too.
    function refreshAll() {
      if (picker) picker.refresh();
      refreshSetup();
    }

    // A part typed by hand that is also on a list goes under the list's category.
    function fileTypedParts() {
      lists.forEach((trade) => trade.categories.forEach((category) => category.parts.forEach((part) => {
        const item = store.findItem(part.name);
        if (item && !item.category) store.updateItem(item.id, { ...item, category: part.category });
      })));
    }

    const box = quickAddBox({
      showBay: false,
      onAdded: () => {
        fileTypedParts();
        refreshAll();
      },
    });

    finish.addEventListener('click', () => {
      try {
        // Keep anything still typed in the box instead of dropping it.
        const pending = box.elements.line;
        if (pending.value.trim()) {
          store.addFromLine(pending.value, quickDefaults());
          pending.value = '';
          fileTypedParts();
        }
        store.finishSetup();
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
        ui.tab = 'use';
        render();
        window.scrollTo(0, 0);
        showToast('Inventory saved. Tap Use 1 each time you use a part.');
      } catch (err) {
        showToast(err.message);
      }
    });

    refreshSetup();

    const howTo = 'Open a category, then tap + or type how many you carry. Skip anything you don’t carry. Your progress saves as you go.';
    return h('div', { class: 'screen setup' },
      brandMark(),
      h('h1', null, lists.length === 1 ? lists[0].label + ' parts' : lists.length > 1 ? 'Your parts lists' : 'What’s on your van?'),
      h('p', { class: 'muted' }, lists.length > 1
        ? 'One list for ' + lists.map((trade) => trade.label).join(', ') + '. ' + howTo
        : lists.length === 1 ? howTo : 'Type each part and how many, then press Add. Your progress saves as you go.'),
      h('button', {
        class: 'link-btn',
        type: 'button',
        onclick: () => {
          ui.setupPick = new Set(store.state.setupTrades);
          store.setSetupTrades(null);
          render();
          window.scrollTo(0, 0);
        },
      }, lists.length > 0 ? 'Choose different lists' : 'Use a ready-made list instead'),
      bayBar(),
      box,
      h('button', {
        class: 'btn btn-wide btn-icon',
        type: 'button',
        onclick: () => scanFor('count', () => {
          fileTypedParts();
          refreshAll();
        }),
      }, icon(ICONS.scan), 'Scan a barcode'),
      ownHeading,
      ownList,
      picker ? picker.el : null,
      h('div', { class: 'setup-finish' }, finish));
  }

  /* ---------- Shared pieces of the main screens ---------- */

  function searchField(value, label, onChange) {
    return h('div', { class: 'search' },
      h('input', {
        type: 'search',
        placeholder: label,
        'aria-label': label,
        autocomplete: 'off',
        value: value,
        oninput: (event) => onChange(event.target.value),
      }));
  }

  function chipRow(options, current, onSelect) {
    return h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter' },
      options.map(([id, label]) => h('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': String(id === current),
        'data-key': 'chip:' + id,
        onclick: () => onSelect(id),
      }, label)));
  }

  function emptyMessage(text, action, iconName) {
    return h('div', { class: 'empty' },
      h('span', { class: 'empty-icon' }, icon(ICONS[iconName || 'stock'])),
      h('p', null, text),
      action || null);
  }

  /* ---------- Use tab ---------- */

  function recordUse(item, amount) {
    const entry = store.useItem(item.id, amount);
    return entry;
  }

  function afterUse(item, entry) {
    render();
    const left = fmtQty(item.qty, item.unit);
    showToast('Used ' + usedPhrase(-entry.delta, entry.unit, entry.name) + '. ' + left + ' left.', () => {
      attempt(() => {
        store.undo(entry.id);
        render();
        showToast('Undone. ' + fmtQty(item.qty, item.unit) + ' back on the van.');
      });
    });
  }

  function openUseSheet(item) {
    const job = store.state.currentJob;
    quantitySheet({
      title: item.name,
      subtitle: fmtQty(item.qty, item.unit) + ' on the van. How many did you use?',
      note: job ? 'Recording against job: ' + job : null,
      confirmLabel: 'Record use',
      start: item.qty < 1 ? item.qty : 1,
      max: item.qty,
      quick: [1, 2, 5, 10],
      run: (amount) => recordUse(item, amount),
      done: (entry) => afterUse(item, entry),
    });
  }

  function rowWrapClass(item) {
    if (store.isOut(item)) return 'row-wrap is-out';
    return store.isLow(item) ? 'row-wrap is-low' : 'row-wrap';
  }

  function useRow(item, underHeading) {
    const out = store.isOut(item);
    const part = item.qty > 0 && item.qty < 1;
    return h('li', { class: rowWrapClass(item) },
      h('button', {
        class: 'row row-main',
        type: 'button',
        disabled: out,
        'aria-label': 'Choose how much ' + item.name + ' you used. ' + fmtQty(item.qty, item.unit) + ' left.',
        onclick: () => openUseSheet(item),
      },
      h('span', { class: 'row-text' },
        h('span', { class: 'row-name' }, item.name),
        h('span', { class: 'row-meta' }, statusTag(item), bayTag(item), underHeading ? null : item.category || null)),
      h('span', { class: 'row-qty' }, fmtQty(item.qty, item.unit))),
      h('button', {
        class: 'use-btn',
        type: 'button',
        disabled: out,
        'data-key': 'use:' + item.id,
        'aria-label': out ? item.name + ' is out of stock' : 'Use 1 ' + item.name,
        onclick: () => {
          if (part) {
            openUseSheet(item);
            return;
          }
          attempt(() => afterUse(item, recordUse(item, 1)));
        },
      }, out ? 'Out' : part ? 'Use' : 'Use 1'));
  }

  function useList() {
    if (store.state.items.length === 0) {
      return [emptyMessage('Nothing in stock yet.', h('button', {
        class: 'btn btn-primary',
        type: 'button',
        onclick: () => openQuickAddDialog(''),
      }, 'Add a part'))];
    }
    let items;
    if (ui.filter === 'recent') {
      items = ui.recentIds.map((id) => store.state.items.find((i) => i.id === id)).filter(Boolean);
    } else if (ui.filter === 'all') {
      items = sortedItems();
    } else {
      const bay = ui.filter.startsWith('bay:') ? Number(ui.filter.slice(4)) : null;
      items = sortedItems().filter((i) => (bay ? i.bay === bay : i.category === ui.filter));
    }
    items = items.filter((i) => matches(i, ui.search));

    if (items.length === 0) {
      if (ui.search.trim()) {
        const name = ui.search.trim();
        return [emptyMessage('Nothing matches "' + name + '".', h('button', {
          class: 'btn',
          type: 'button',
          onclick: () => openQuickAddDialog(name + ' '),
        }, 'Add it to your stock'))];
      }
      return [emptyMessage(ui.filter === 'recent' ? 'Parts you use will appear here.' : 'Nothing here yet.')];
    }

    if (ui.filter === 'all' && !ui.search.trim()) {
      return groupByCategory(items).map(([name, group]) => h('section', null,
        h('h2', { class: 'section-title' }, name),
        h('ul', { class: 'rows' }, group.map((item) => useRow(item, true)))));
    }
    return [h('ul', { class: 'rows' }, items.map((item) => useRow(item, false)))];
  }

  function jobBar() {
    const input = h('input', {
      type: 'text',
      maxlength: 80,
      autocomplete: 'off',
      placeholder: 'Job or address (optional)',
      value: store.state.currentJob,
      oninput: (event) => {
        store.setJob(event.target.value);
        clear.hidden = !event.target.value;
      },
    });
    const clear = h('button', {
      class: 'job-clear',
      type: 'button',
      hidden: !store.state.currentJob,
      onclick: () => {
        input.value = '';
        store.setJob('');
        clear.hidden = true;
        input.focus();
      },
    }, 'Clear');
    return h('div', { class: 'job' }, h('label', { class: 'job-field' }, h('span', null, 'Current job'), input), clear);
  }

  function useView() {
    const list = h('div', { class: 'list' });
    const fill = () => list.replaceChildren(...useList());
    fill();
    // Only bays that hold something get a chip, so the row stays short.
    const usedBays = [...new Set(store.state.items.map((i) => i.bay).filter(Boolean))].sort((a, b) => a - b);
    const options = [['all', 'All'], ['recent', 'Recent']]
      .concat(usedBays.map((bay) => ['bay:' + bay, 'Bay ' + bay]))
      .concat(store.categories().map((c) => [c, c]));
    if (ui.filter !== 'all' && !options.some(([id]) => id === ui.filter)) ui.filter = 'all';
    return [
      jobBar(),
      h('div', { class: 'search-row' },
        searchField(ui.search, 'Search your parts', (value) => {
          ui.search = value;
          fill();
        }),
        scanButton('use', 'Scan a barcode to record a use')),
      chipRow(options, ui.filter, (id) => {
        ui.filter = id;
        // Frozen when chosen so rows do not move under a thumb between taps.
        if (id === 'recent') ui.recentIds = store.recentItemIds(15);
        render();
      }),
      list,
    ];
  }

  /* ---------- Stock tab ---------- */

  function openRestockSheet(item) {
    quantitySheet({
      title: 'Restock ' + item.name,
      subtitle: fmtQty(item.qty, item.unit) + ' on the van now. How many are you adding?',
      confirmLabel: 'Add to stock',
      start: 1,
      quick: [1, 5, 10, 25],
      run: (amount) => store.restock(item.id, amount),
      done: (entry) => {
        render();
        showToast('Added ' + usedPhrase(entry.delta, entry.unit, entry.name) + '. ' + fmtQty(item.qty, item.unit) + ' on the van.', () => {
          attempt(() => {
            store.undo(entry.id);
            render();
            showToast('Restock undone.');
          });
        });
      },
    });
  }

  function stockRow(item) {
    return h('li', { class: rowWrapClass(item) },
      h('button', {
        class: 'row row-main',
        type: 'button',
        'data-key': 'edit:' + item.id,
        'aria-label': 'Edit ' + item.name + '. ' + fmtQty(item.qty, item.unit) + ' on the van.',
        onclick: () => itemDialog(item, {}),
      },
      h('span', { class: 'row-text' },
        h('span', { class: 'row-name' }, item.name),
        h('span', { class: 'row-meta' },
          statusTag(item),
          bayTag(item),
          item.category || null,
          item.low !== null ? h('span', null, 'warn at ' + item.low) : null)),
      h('span', { class: 'row-qty' }, fmtQty(item.qty, item.unit))),
      h('button', {
        class: 'restock-btn',
        type: 'button',
        'data-key': 'restock:' + item.id,
        'aria-label': 'Restock ' + item.name,
        onclick: () => openRestockSheet(item),
      }, 'Restock'));
  }

  function stockList() {
    const items = sortedItems()
      .filter((i) => ui.stockFilter === 'all' || store.isLow(i))
      .filter((i) => matches(i, ui.stockSearch));
    if (items.length === 0) {
      return [emptyMessage(ui.stockFilter === 'low' && !ui.stockSearch ? 'Nothing is running low.' : 'Nothing matches your search.')];
    }
    return [h('ul', { class: 'rows' }, items.map(stockRow))];
  }

  // Counting from trade lists after setup, for new work or a trade not chosen at the start.
  function listsView() {
    const picked = ui.lists;
    const close = () => {
      ui.lists = null;
      ui.setupFilter = '';
      render();
      window.scrollTo(0, 0);
    };
    const done = h('button', { class: 'btn btn-primary btn-wide', type: 'button', onclick: close }, 'Done');
    const lists = tradeLists(Array.from(picked));
    const picker = lists.length > 0
      ? starterPicker(lists, () => {
        root.querySelector('.summary').replaceWith(stockSummary());
        root.querySelector('.tabs').replaceWith(navBar());
      }, (lists.length === 1 ? 'Not on this list.' : 'Not on these lists.') + ' Tap Done and type it in on the Stock tab.')
      : null;
    return [
      h('p', { class: 'muted' },
        'Choose one or more trades, then count what you carry. Parts already on your van show their count, and changes save as you go.'),
      // Wrapped rather than scrolled, so every chosen trade stays in view.
      h('div', { class: 'chips chips-wrap', role: 'group', 'aria-label': 'Trades' },
        VanStarters.map((trade) => h('button', {
          class: 'chip',
          type: 'button',
          'aria-pressed': String(picked.has(trade.id)),
          'data-key': 'trade:' + trade.id,
          onclick: () => {
            if (picked.has(trade.id)) picked.delete(trade.id);
            else picked.add(trade.id);
            render();
          },
        }, trade.label))),
      picker ? bayBar() : null,
      picker ? picker.el : emptyMessage('Choose a trade above to see its parts.'),
      picker ? h('p', { class: 'muted small' }, 'A part counted down to 0 stays on your stock as out. Delete parts on the Stock tab.') : null,
      done,
    ];
  }

  function stockView() {
    if (ui.lists) return listsView();
    const body = h('div', { class: 'stack-wide' });
    const fill = () => {
      const lowCount = store.state.items.filter((i) => store.isLow(i)).length;
      body.replaceChildren(
        chipRow([['all', 'All (' + store.state.items.length + ')'], ['low', 'Low or out (' + lowCount + ')']], ui.stockFilter, (id) => {
          ui.stockFilter = id;
          render();
        }),
        h('div', { class: 'list' }, stockList())
      );
    };
    fill();
    return [
      // Only the list below redraws after adding, so the phone keyboard stays open for the next part.
      quickAddBox({
        onAdded: () => {
          fill();
          root.querySelector('.tabs').replaceWith(navBar());
        },
      }),
      h('button', {
        class: 'btn btn-wide',
        type: 'button',
        onclick: () => {
          ui.lists = new Set(store.state.setupTrades || []);
          ui.setupFilter = '';
          render();
          window.scrollTo(0, 0);
        },
      }, 'Add from a trade list'),
      h('div', { class: 'search-row' },
        searchField(ui.stockSearch, 'Search your stock', (value) => {
          ui.stockSearch = value;
          fill();
        }),
        scanButton('restock', 'Scan a barcode to restock')),
      body,
    ];
  }

  /* ---------- History tab ---------- */

  const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
  const ENTRY_LABELS = { used: 'Used', restock: 'Restocked', correction: 'Stock corrected', added: 'New item' };

  function dayLabel(time) {
    const date = new Date(time);
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return dayFormat.format(date);
  }

  function historyRow(entry) {
    const sign = entry.delta > 0 ? '+' : '−';
    const details = [ENTRY_LABELS[entry.type], timeFormat.format(new Date(entry.at))];
    if (entry.job) details.push(entry.job);
    return h('li', { class: 'row-wrap' },
      h('div', { class: 'row' },
        h('span', { class: 'row-text' },
          h('span', { class: 'row-name' }, entry.name),
          h('span', { class: 'row-meta' }, details.join(' · '))),
        h('span', { class: entry.delta > 0 ? 'row-qty delta-up' : 'row-qty' }, sign + fmtQty(Math.abs(entry.delta), entry.unit))),
      store.canUndo(entry) ? h('button', {
        class: 'undo-btn',
        type: 'button',
        'data-key': 'undo:' + entry.id,
        'aria-label': 'Undo ' + ENTRY_LABELS[entry.type] + ' ' + entry.name,
        onclick: () => attempt(() => {
          const item = store.undo(entry.id);
          render();
          showToast('Undone. ' + fmtQty(item.qty, item.unit) + ' of ' + item.name + ' on the van.');
        }),
      }, 'Undo') : null);
  }

  function historyView() {
    const log = store.state.log;
    if (log.length === 0) return [emptyMessage('Nothing recorded yet. Parts you use will show here.', null, 'history')];
    const entries = log.slice(-ui.historyLimit).reverse();
    const days = new Map();
    entries.forEach((entry) => {
      const day = dayLabel(entry.at);
      if (!days.has(day)) days.set(day, []);
      days.get(day).push(entry);
    });
    return [
      [...days.entries()].map(([day, group]) => h('section', null,
        h('h2', { class: 'section-title' }, day),
        h('ul', { class: 'rows' }, group.map(historyRow)))),
      log.length > ui.historyLimit ? h('button', {
        class: 'btn btn-wide',
        type: 'button',
        onclick: () => {
          ui.historyLimit += 100;
          render();
        },
      }, 'Show older') : null,
    ];
  }

  /* ---------- More tab ---------- */

  function downloadBackup() {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = h('a', { href: url, download: 'van-stock-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Backup saved to your downloads.');
  }

  async function restoreBackup(file) {
    let text;
    try {
      text = await file.text();
    } catch (err) {
      showToast('Could not read that file.');
      return;
    }
    const yes = await confirmDialog({
      title: 'Restore this backup?',
      body: 'Everything on this device will be replaced by ' + file.name + '.',
      confirmLabel: 'Replace and restore',
      danger: true,
    });
    if (!yes) return;
    attempt(() => {
      store.importJson(text);
      render();
      showToast('Backup restored.');
    });
  }

  function moreView() {
    const fileInput = h('input', {
      type: 'file',
      accept: '.json,application/json',
      hidden: true,
      onchange: (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (file) restoreBackup(file);
      },
    });
    const bays = bayCount();
    const placed = store.state.items.filter((i) => i.bay !== null).length;
    return [
      h('section', { class: 'card' },
        h('h2', null, 'Van bays'),
        h('p', { class: 'muted' }, bays > 0
          ? 'Your van has ' + bays + (bays === 1 ? ' bay' : ' bays') + ', and ' + partCount(placed) + ' have a bay set. '
            + 'Set a part’s bay by tapping it on the Stock tab.'
          : 'Number the shelving units or racking in your van, so each part can show which bay it lives in.'),
        h('button', { class: 'btn btn-wide', type: 'button', onclick: baysDialog }, bays > 0 ? 'Change number of bays' : 'Set up bays')),
      h('section', { class: 'card' },
        h('h2', null, 'Backup'),
        h('p', { class: 'muted' },
          'Your stock is saved on this device only. Download a backup now and then, so a lost or '
          + 'replaced phone does not cost you your records. You can restore it on any device.'),
        h('div', { class: 'stack' },
          h('button', { class: 'btn btn-wide', type: 'button', onclick: downloadBackup }, 'Download backup'),
          h('button', { class: 'btn btn-wide', type: 'button', onclick: () => fileInput.click() }, 'Restore a backup'),
          fileInput)),
      h('section', { class: 'card' },
        h('h2', null, 'Start over'),
        h('p', { class: 'muted' }, 'Deletes all stock and history on this device and takes you back to first-time setup.'),
        h('button', {
          class: 'btn btn-quiet-danger btn-wide',
          type: 'button',
          onclick: async () => {
            const yes = await confirmDialog({
              title: 'Delete everything?',
              body: 'All stock and history on this device will be gone. This cannot be undone unless you have a backup.',
              confirmLabel: 'Delete everything',
              danger: true,
            });
            if (yes) {
              store.reset();
              ui.search = '';
              ui.filter = 'all';
              ui.stockSearch = '';
              ui.stockFilter = 'all';
              ui.quick = { more: false, category: '', unit: 'each', low: '', bay: '' };
              ui.setupPick = new Set();
              ui.lists = null;
              render();
              window.scrollTo(0, 0);
            }
          },
        }, 'Delete everything')),
    ];
  }

  /* ---------- Main layout ---------- */

  const TABS = [
    ['use', 'Use', useView],
    ['stock', 'Stock', stockView],
    ['history', 'History', historyView],
    ['more', 'More', moreView],
  ];

  function navBar() {
    const lowCount = store.state.items.filter((i) => store.isLow(i)).length;
    return h('nav', { class: 'tabs', 'aria-label': 'Main' },
      TABS.map(([id, label]) => h('button', {
        class: 'tab',
        type: 'button',
        'aria-current': id === ui.tab ? 'page' : null,
        'data-key': 'tab:' + id,
        onclick: () => {
          ui.tab = id;
          ui.lists = null;
          render();
          window.scrollTo(0, 0);
        },
      },
      icon(ICONS[id]),
      h('span', null, label),
      id === 'stock' && lowCount > 0 ? h('span', { class: 'badge', 'aria-label': lowCount + ' low or out' }, String(lowCount)) : null)));
  }

  function stockSummary() {
    const items = store.state.items;
    const out = items.filter((i) => store.isOut(i)).length;
    const low = items.filter((i) => store.isLow(i) && !store.isOut(i)).length;
    return h('div', { class: 'summary' },
      h('span', { class: 'summary-pill' }, partCount(items.length) + ' on the van'),
      low > 0 ? h('span', { class: 'summary-pill is-low' }, low + ' running low') : null,
      out > 0 ? h('span', { class: 'summary-pill is-out' }, out + ' out') : null);
  }

  function mainScreen() {
    const tab = TABS.find(([id]) => id === ui.tab);
    return h('div', { class: 'screen with-tabs' },
      h('header', { class: 'top' },
        brandMark(),
        h('h1', null, tab[1] === 'Use' ? 'Record parts used' : ui.tab === 'stock' && ui.lists ? 'Add from trade lists' : tab[1]),
        ui.tab === 'use' || ui.tab === 'stock' ? stockSummary() : null),
      tab[2](),
      navBar());
  }

  function render() {
    const focusKey = document.activeElement && document.activeElement.dataset
      ? document.activeElement.dataset.key : null;
    const chips = root.querySelector('.chips');
    const chipScroll = chips ? chips.scrollLeft : 0;

    if (store.state.setupComplete) root.replaceChildren(mainScreen());
    else if (ui.editBays || (store.state.bays === null && store.state.setupTrades === null)) root.replaceChildren(baysScreen());
    else root.replaceChildren(store.state.setupTrades ? setupListScreen() : tradeScreen());

    const newChips = root.querySelector('.chips');
    if (newChips) newChips.scrollLeft = chipScroll;
    if (focusKey) {
      const target = root.querySelector('[data-key="' + CSS.escape(focusKey) + '"]');
      if (target) target.focus();
    }
  }

  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
