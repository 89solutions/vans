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
    // bays is null until asked during setup, and 0 for a van without numbered bays.
    return { version: 1, setupComplete: false, setupTrades: null, bays: null, items: [], log: [], currentJob: '' };
  }

  const MAX_BAYS = 100;

  function cleanBayCount(value) {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > MAX_BAYS) {
      throw new Error('Enter a number of bays from 0 to ' + MAX_BAYS + '.');
    }
    return n;
  }

  function cleanBay(value) {
    if (value === null || value === undefined || value === '' || value === 0 || value === '0') return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > MAX_BAYS) throw new Error('Choose a bay from the list.');
    return n;
  }

  const UNIT_WORDS = {
    each: 'each', ea: 'each', pc: 'each', pcs: 'each', piece: 'each', pieces: 'each', off: 'each', no: 'each',
    m: 'm', mtr: 'm', mtrs: 'm', metre: 'm', metres: 'm', meter: 'm', meters: 'm',
    pack: 'pack', packs: 'pack', pk: 'pack',
    box: 'box', boxes: 'box',
    roll: 'roll', rolls: 'roll',
    l: 'L', ltr: 'L', litre: 'L', litres: 'L', liter: 'L', liters: 'L',
    kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg',
  };

  // A number before these words describes the part, as in "2 gang socket", rather than counting it.
  const DESCRIPTORS = ['gang', 'way', 'pole', 'core', 'port', 'amp', 'amps', 'mm', 'mil', 'inch', 'inches', 'bar', 'pin', 'hole', 'phase'];

  function unitFromWord(word) {
    return UNIT_WORDS[String(word).toLowerCase()];
  }

  function namedLine(name, qty, unit) {
    const clean = name.replace(/[\s,;:=]+$/, '').trim();
    if (!clean) throw new Error('Add a name as well as a number.');
    if (clean.length > 80) throw new Error('That name is too long.');
    return { name: clean, qty: qty, unit: unit || null };
  }

  // Reads one typed, spoken or pasted line such as "15mm elbow 12", "twin and earth 50m" or "12 x 15mm elbow".
  function parseItemLine(raw) {
    const line = String(raw).replace(/\t+/g, ' ').replace(/^\s*[-*•]\s+/, '').replace(/[\s,;]+$/, '').trim();
    if (!line) throw new Error('Type a part name and how many.');

    const trailing = line.match(/^(.+?)(?:\s*[,;:=]\s*|\s+[-–]\s+|\s+)(?:[x×]\s*)?(\d+(?:\.\d+)?)(?:\s*([a-z]+))?$/i);
    if (trailing && (trailing[3] === undefined || unitFromWord(trailing[3]))) {
      return namedLine(trailing[1], trailing[2], trailing[3] ? unitFromWord(trailing[3]) : null);
    }

    const leading = line.match(/^(\d+(?:\.\d+)?)(\s*)(.*)$/);
    if (leading) {
      let rest = leading[3];
      const firstWord = rest.split(/\s+/)[0];
      const unit = unitFromWord(firstWord);
      if (unit) rest = rest.slice(firstWord.length).trim();
      const counted = /^(?:x|×|of)\s+/i.test(rest);
      if (counted) rest = rest.replace(/^(?:x|×|of)\s+/i, '');
      const describes = !unit && !counted && (!leading[2] || DESCRIPTORS.includes(firstWord.toLowerCase()));
      if (!describes && rest) return namedLine(rest, leading[1], unit);
    }

    throw new Error('Add how many at the end, like "15mm elbow 12".');
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
      bay: cleanBay(raw.bay),
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

  // The trade lists chosen in setup: null until chosen, empty for a blank list.
  // Older data saved one trade, or "blank", as setupTrade.
  function cleanTrades(raw) {
    if (Array.isArray(raw.setupTrades)) return raw.setupTrades.map(String);
    if (!raw.setupTrade) return null;
    return raw.setupTrade === 'blank' ? [] : [String(raw.setupTrade)];
  }

  // Joins several trade lists into one. Categories with the same name are merged,
  // and a part on more than one list is kept once, where it first appears.
  function combineLists(lists) {
    const categories = new Map();
    const seen = new Set();
    lists.forEach((list) => list.categories.forEach((category) => {
      if (!categories.has(category.name)) categories.set(category.name, []);
      category.parts.forEach((part) => {
        const lower = part.name.toLowerCase();
        if (seen.has(lower)) return;
        seen.add(lower);
        categories.get(category.name).push({ ...part, category: category.name });
      });
    }));
    return Array.from(categories, ([name, parts]) => ({ name: name, parts: parts })).filter((c) => c.parts.length > 0);
  }

  // Checks saved or imported data, so a bad backup file cannot break the app.
  function cleanState(raw) {
    if (!raw || !Array.isArray(raw.items) || !Array.isArray(raw.log)) {
      throw new Error('This is not a Van Stock backup file.');
    }
    return {
      version: 1,
      setupComplete: Boolean(raw.setupComplete),
      setupTrades: cleanTrades(raw),
      bays: cleanBayCount(raw.bays),
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

    function assertBayExists(item) {
      if (item.bay !== null && (!state.bays || item.bay > state.bays)) {
        throw new Error(state.bays ? 'Choose a bay from 1 to ' + state.bays + '.' : 'Set up your van’s bays first.');
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
        assertBayExists(item);
        state.items.push(item);
        if (state.setupComplete && item.qty > 0) addLog(item, 'added', item.qty);
        save();
        return item;
      },

      findItem(name) {
        const lower = String(name).trim().toLowerCase();
        return state.items.find((i) => i.name.toLowerCase() === lower);
      },

      addFromLine(line, defaults) {
        const parsed = parseItemLine(line);
        const base = defaults || {};
        return this.addItem({ ...base, name: parsed.name, qty: parsed.qty, unit: parsed.unit || base.unit });
      },

      // Adds what it can from a pasted list and reports the lines it could not use.
      addLines(text, defaults) {
        const result = { added: [], failed: [] };
        String(text).split(/\r?\n/).filter((line) => line.trim()).forEach((line) => {
          try {
            result.added.push(this.addFromLine(line, defaults));
          } catch (err) {
            result.failed.push({ line: line, reason: err.message });
          }
        });
        return result;
      },

      // Sets the count for a starter list part. At 0 during setup the part is not kept on the van's list;
      // after setup it stays on as out of stock, so its history and settings are kept.
      setStarterCount(part, value) {
        const qty = requireQty(value, 'Quantity', true);
        const existing = this.findItem(part.name);
        if (existing) {
          if (qty === 0 && !state.setupComplete) this.deleteItem(existing.id);
          else this.updateItem(existing.id, { ...existing, qty: qty });
        } else if (qty > 0) {
          this.addItem({ ...part, qty: qty });
        }
      },

      // Parts in bays beyond the new count lose their bay. Returns how many did.
      setBays(count) {
        const bays = cleanBayCount(count);
        if (bays === null) throw new Error('Enter a number of bays from 0 to ' + MAX_BAYS + '.');
        let cleared = 0;
        state.items.forEach((item) => {
          if (item.bay !== null && item.bay > bays) {
            item.bay = null;
            cleared += 1;
          }
        });
        state.bays = bays;
        save();
        return cleared;
      },

      // Takes the chosen trade ids, an empty list for a blank list, or null to choose again.
      setSetupTrades(trades) {
        state.setupTrades = trades === null ? null : trades.map(String);
        save();
      },

      updateItem(id, fields) {
        const item = getItem(id);
        const name = cleanName(fields.name);
        assertNameFree(name, id);
        const next = cleanItem({ ...fields, id: id, name: name });
        assertBayExists(next);
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

  global.VanStore = { createStore: createStore, parseItemLine: parseItemLine, combineLists: combineLists, UNITS: UNITS, MAX_BAYS: MAX_BAYS };
})(window);
