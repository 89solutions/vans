// Stock data and rules. No UI code lives here, so tests/store.test.html can run it directly.
(function (global) {
  'use strict';

  const STORAGE_KEY = 'vans.state.v1';
  const MAX_QTY = 1000000;
  // Repeat taps on the same item within this window become one history entry.
  const MERGE_WINDOW_MS = 60 * 1000;
  const UNITS = ['each', 'm', 'pack', 'box', 'roll', 'L', 'kg'];

  function round(n) {
    return Math.round(n * 1000) / 1000;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function emptyState() {
    return { version: 1, setupComplete: false, items: [], log: [], currentJob: '' };
  }

  function toNumber(value) {
    if (value === '' || value === null || value === undefined) return NaN;
    return Number(value);
  }

  function requireQty(value, label, allowZero) {
    const n = round(toNumber(value));
    if (!Number.isFinite(n)) throw new Error(label + ' must be a number.');
    if (n < 0 || (!allowZero && n === 0)) {
      throw new Error(label + (allowZero ? ' cannot be negative.' : ' must be more than 0.'));
    }
    if (n > MAX_QTY) throw new Error(label + ' is too large.');
    return n;
  }

  function cleanLow(value) {
    if (value === '' || value === null || value === undefined) return null;
    return requireQty(value, 'Low stock level', true);
  }

  function cleanName(value) {
    const name = String(value === undefined || value === null ? '' : value).trim();
    if (!name) throw new Error('Enter a name for the item.');
    return name;
  }

  function cleanItem(raw) {
    return {
      id: String(raw.id),
      name: cleanName(raw.name),
      category: String(raw.category || '').trim(),
      unit: UNITS.includes(raw.unit) ? raw.unit : 'each',
      qty: requireQty(raw.qty, 'Quantity', true),
      low: cleanLow(raw.low),
    };
  }

  function cleanEntry(raw) {
    const delta = Number(raw.delta);
    const at = Number(raw.at);
    if (!Number.isFinite(delta) || !Number.isFinite(at)) throw new Error('Bad history entry.');
    if (!['used', 'restock', 'correction', 'added'].includes(raw.type)) throw new Error('Bad history entry.');
    return {
      id: String(raw.id),
      at: at,
      itemId: String(raw.itemId),
      name: String(raw.name || ''),
      unit: UNITS.includes(raw.unit) ? raw.unit : 'each',
      type: raw.type,
      delta: delta,
      job: String(raw.job || ''),
    };
  }

  // Checks saved or imported data, so a bad backup file cannot break the app.
  function cleanState(raw) {
    if (!raw || !Array.isArray(raw.items) || !Array.isArray(raw.log)) {
      throw new Error('This is not a Van Stock backup file.');
    }
    return {
      version: 1,
      setupComplete: Boolean(raw.setupComplete),
      items: raw.items.map(cleanItem),
      log: raw.log.map(cleanEntry),
      currentJob: String(raw.currentJob || ''),
    };
  }

  function createStore(storage, options) {
    const now = (options && options.now) || Date.now;
    const onSaveError = (options && options.onSaveError) || function () {};
    let state = load();

    function load() {
      const saved = storage.getItem(STORAGE_KEY);
      if (!saved) return emptyState();
      try {
        return cleanState(JSON.parse(saved));
      } catch (err) {
        // Keep the unreadable data rather than overwriting it on the next save.
        storage.setItem(STORAGE_KEY + '.unreadable', saved);
        return emptyState();
      }
    }

    function save() {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        onSaveError(err);
      }
    }

    function getItem(id) {
      const item = state.items.find((i) => i.id === id);
      if (!item) throw new Error('That item is no longer in your stock.');
      return item;
    }

    function assertNameFree(name, ignoreId) {
      const lower = name.toLowerCase();
      if (state.items.some((i) => i.id !== ignoreId && i.name.toLowerCase() === lower)) {
        throw new Error('"' + name + '" is already in your stock.');
      }
    }

    function addLog(item, type, delta) {
      const entry = {
        id: uid(),
        at: now(),
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        type: type,
        delta: delta,
        job: state.currentJob,
      };
      state.log.push(entry);
      return entry;
    }

    return {
      get state() {
        return state;
      },

      addItem(fields) {
        const name = cleanName(fields.name);
        assertNameFree(name);
        const item = cleanItem({ ...fields, id: uid(), name: name });
        state.items.push(item);
        if (state.setupComplete && item.qty > 0) addLog(item, 'added', item.qty);
        save();
        return item;
      },

      updateItem(id, fields) {
        const item = getItem(id);
        const name = cleanName(fields.name);
        assertNameFree(name, id);
        const next = cleanItem({ ...fields, id: id, name: name });
        const delta = round(next.qty - item.qty);
        Object.assign(item, next);
        if (delta !== 0 && state.setupComplete) addLog(item, 'correction', delta);
        save();
        return item;
      },

      deleteItem(id) {
        getItem(id);
        state.items = state.items.filter((i) => i.id !== id);
        save();
      },

      useItem(id, quantity) {
        const item = getItem(id);
        const qty = requireQty(quantity, 'Quantity', false);
        if (qty > item.qty) {
          throw new Error('Only ' + item.qty + ' left on the van. Correct the stock level if that is wrong.');
        }
        item.qty = round(item.qty - qty);
        const last = state.log[state.log.length - 1];
        const merge = last && last.type === 'used' && last.itemId === id && last.job === state.currentJob
          && now() - last.at < MERGE_WINDOW_MS;
        let entry;
        if (merge) {
          last.delta = round(last.delta - qty);
          last.at = now();
          entry = last;
        } else {
          entry = addLog(item, 'used', -qty);
        }
        save();
        return entry;
      },

      restock(id, quantity) {
        const item = getItem(id);
        const qty = requireQty(quantity, 'Quantity', false);
        if (round(item.qty + qty) > MAX_QTY) throw new Error('Quantity is too large.');
        item.qty = round(item.qty + qty);
        const entry = addLog(item, 'restock', qty);
        save();
        return entry;
      },

      canUndo(entry) {
        return entry.type !== 'added' && state.items.some((i) => i.id === entry.itemId);
      },

      undo(entryId) {
        const entry = state.log.find((e) => e.id === entryId);
        if (!entry) throw new Error('That entry has already been undone.');
        if (entry.type === 'added') throw new Error('This entry cannot be undone.');
        const item = getItem(entry.itemId);
        const qty = round(item.qty - entry.delta);
        if (qty < 0) throw new Error('Cannot undo: some of this stock has since been used.');
        item.qty = qty;
        state.log = state.log.filter((e) => e.id !== entryId);
        save();
        return item;
      },

      finishSetup() {
        if (state.items.length === 0) throw new Error('Add at least one item first.');
        state.setupComplete = true;
        save();
      },

      setJob(job) {
        state.currentJob = String(job || '').trim();
        save();
      },

      isOut(item) {
        return item.qty <= 0;
      },

      isLow(item) {
        return item.qty <= 0 || (item.low !== null && item.qty <= item.low);
      },

      categories() {
        return [...new Set(state.items.map((i) => i.category).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b));
      },

      // The items used most recently, newest first.
      recentItemIds(limit) {
        const ids = [];
        for (let i = state.log.length - 1; i >= 0 && ids.length < limit; i--) {
          const entry = state.log[i];
          if (entry.type === 'used' && !ids.includes(entry.itemId)
            && state.items.some((item) => item.id === entry.itemId)) {
            ids.push(entry.itemId);
          }
        }
        return ids;
      },

      exportJson() {
        return JSON.stringify(state, null, 2);
      },

      importJson(text) {
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (err) {
          throw new Error('This is not a Van Stock backup file.');
        }
        let next;
        try {
          next = cleanState(parsed);
        } catch (err) {
          throw new Error('This is not a Van Stock backup file.');
        }
        state = next;
        save();
      },

      reset() {
        state = emptyState();
        save();
      },
    };
  }

  global.VanStore = { createStore: createStore, UNITS: UNITS };
})(window);
