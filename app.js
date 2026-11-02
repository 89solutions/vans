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
  };

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
    dialog.append(h('div', { class: 'sheet-body' }, build(close)));
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
    };
  }

  function itemDialog(item, { preset, after }) {
    const refresh = after || render;
    openDialog((close) => {
      const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
      return h('form', {
        novalidate: true,
        onsubmit: (event) => {
          event.preventDefault();
          try {
            const fields = readItemForm(event.target);
            if (item) store.updateItem(item.id, fields);
            else store.addItem(fields);
            close();
            refresh();
            showToast(item ? 'Changes saved.' : 'Added to your stock.');
          } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
          }
        },
      },
      h('h2', null, item ? 'Edit item' : 'Add item'),
      itemFields(item || preset),
      error,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'),
        h('button', { class: 'btn btn-primary', type: 'submit' }, item ? 'Save' : 'Add item')),
      item ? h('button', {
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
      }, 'Delete item') : null);
    });
  }

  /* ---------- First use: inventory setup ---------- */

  function setupScreen() {
    const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const list = h('ul', { class: 'rows' });
    const heading = h('h2', { class: 'section-title' });
    const finish = h('button', { class: 'btn btn-primary btn-wide', type: 'button' });
    let form;

    function refreshSetup() {
      const items = [...store.state.items].reverse();
      const count = items.length;
      heading.textContent = count === 1 ? '1 item added' : count + ' items added';
      heading.hidden = count === 0;
      finish.textContent = count === 0 ? 'Add your first item above' : 'Finish setup (' + (count === 1 ? '1 item' : count + ' items') + ')';
      finish.disabled = count === 0;
      list.replaceChildren(...items.map((item) => h('li', null,
        h('button', {
          class: 'row row-plain',
          type: 'button',
          onclick: () => itemDialog(item, { after: refreshSetup }),
        },
        h('span', { class: 'row-text' },
          h('span', { class: 'row-name' }, item.name),
          item.category ? h('span', { class: 'row-meta' }, item.category) : null),
        h('span', { class: 'row-qty' }, fmtQty(item.qty, item.unit))))));
      const options = form.querySelector('#category-options');
      options.replaceChildren(...store.categories().map((c) => h('option', { value: c })));
    }

    function addFromForm() {
      const fields = readItemForm(form);
      if (fields.qty === '') throw new Error('Enter how many you have. Use 0 if you have run out.');
      const item = store.addItem(fields);
      form.elements.name.value = '';
      form.elements.qty.value = '';
      form.elements.low.value = '';
      error.hidden = true;
      refreshSetup();
      form.elements.name.focus();
      return item;
    }

    form = h('form', {
      class: 'card',
      novalidate: true,
      onsubmit: (event) => {
        event.preventDefault();
        try {
          addFromForm();
        } catch (err) {
          error.textContent = err.message;
          error.hidden = false;
        }
      },
    },
    itemFields({ unit: 'each' }),
    error,
    h('button', { class: 'btn btn-strong btn-wide', type: 'submit' }, 'Add item'));

    finish.addEventListener('click', () => {
      try {
        // Keep anything still typed in the form instead of dropping it.
        if (form.elements.name.value.trim()) addFromForm();
        store.finishSetup();
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
        ui.tab = 'use';
        render();
        window.scrollTo(0, 0);
        showToast('Inventory saved. Tap Use 1 each time you use a part.');
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
      }
    });

    refreshSetup();

    return h('div', { class: 'screen setup' },
      h('p', { class: 'brand' }, 'Van Stock'),
      h('h1', null, 'What’s on your van?'),
      h('p', { class: 'muted' },
        'List every part you carry and how many you have. Work through one shelf at a time. '
        + 'Your unit and category stay filled in to save typing, and your progress saves as you go.'),
      form,
      heading,
      list,
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

  function emptyMessage(text, action) {
    return h('div', { class: 'empty' }, h('p', null, text), action || null);
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

  function useRow(item) {
    const out = store.isOut(item);
    const part = item.qty > 0 && item.qty < 1;
    return h('li', { class: 'row-wrap' },
      h('button', {
        class: 'row row-main',
        type: 'button',
        disabled: out,
        'aria-label': 'Choose how much ' + item.name + ' you used. ' + fmtQty(item.qty, item.unit) + ' left.',
        onclick: () => openUseSheet(item),
      },
      h('span', { class: 'row-text' },
        h('span', { class: 'row-name' }, item.name),
        h('span', { class: 'row-meta' }, statusTag(item), item.category || null)),
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
        onclick: () => itemDialog(null, { preset: { unit: 'each' } }),
      }, 'Add an item'))];
    }
    let items;
    if (ui.filter === 'recent') {
      items = ui.recentIds.map((id) => store.state.items.find((i) => i.id === id)).filter(Boolean);
    } else if (ui.filter === 'all') {
      items = sortedItems();
    } else {
      items = sortedItems().filter((i) => i.category === ui.filter);
    }
    items = items.filter((i) => matches(i, ui.search));

    if (items.length === 0) {
      if (ui.search.trim()) {
        const name = ui.search.trim();
        return [emptyMessage('Nothing matches "' + name + '".', h('button', {
          class: 'btn',
          type: 'button',
          onclick: () => itemDialog(null, { preset: { name: name, unit: 'each' } }),
        }, 'Add it to your stock'))];
      }
      return [emptyMessage(ui.filter === 'recent' ? 'Parts you use will appear here.' : 'Nothing here yet.')];
    }

    if (ui.filter === 'all' && !ui.search.trim()) {
      return groupByCategory(items).map(([name, group]) => h('section', null,
        h('h2', { class: 'section-title' }, name),
        h('ul', { class: 'rows' }, group.map(useRow))));
    }
    return [h('ul', { class: 'rows' }, items.map(useRow))];
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
    const options = [['all', 'All'], ['recent', 'Recent']]
      .concat(store.categories().map((c) => [c, c]));
    if (ui.filter !== 'all' && !options.some(([id]) => id === ui.filter)) ui.filter = 'all';
    return [
      jobBar(),
      searchField(ui.search, 'Search your parts', (value) => {
        ui.search = value;
        fill();
      }),
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
    return h('li', { class: 'row-wrap' },
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

  function stockView() {
    const lowCount = store.state.items.filter((i) => store.isLow(i)).length;
    const list = h('div', { class: 'list' });
    const fill = () => list.replaceChildren(...stockList());
    fill();
    return [
      h('button', {
        class: 'btn btn-strong btn-wide',
        type: 'button',
        'data-key': 'add-item',
        onclick: () => itemDialog(null, { preset: { unit: 'each' } }),
      }, 'Add a new item'),
      searchField(ui.stockSearch, 'Search your stock', (value) => {
        ui.stockSearch = value;
        fill();
      }),
      chipRow([['all', 'All (' + store.state.items.length + ')'], ['low', 'Low or out (' + lowCount + ')']], ui.stockFilter, (id) => {
        ui.stockFilter = id;
        render();
      }),
      list,
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
    if (log.length === 0) return [emptyMessage('Nothing recorded yet. Parts you use will show here.')];
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
    return [
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
          render();
          window.scrollTo(0, 0);
        },
      },
      icon(ICONS[id]),
      h('span', null, label),
      id === 'stock' && lowCount > 0 ? h('span', { class: 'badge', 'aria-label': lowCount + ' low or out' }, String(lowCount)) : null)));
  }

  function mainScreen() {
    const tab = TABS.find(([id]) => id === ui.tab);
    return h('div', { class: 'screen with-tabs' },
      h('header', { class: 'top' }, h('p', { class: 'brand' }, 'Van Stock'), h('h1', null, tab[1] === 'Use' ? 'Record parts used' : tab[1])),
      tab[2](),
      navBar());
  }

  function render() {
    const focusKey = document.activeElement && document.activeElement.dataset
      ? document.activeElement.dataset.key : null;
    const chips = root.querySelector('.chips');
    const chipScroll = chips ? chips.scrollLeft : 0;

    root.replaceChildren(store.state.setupComplete ? mainScreen() : setupScreen());

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
