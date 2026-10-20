/* Equus Metric horse weight calculator.
   The maths mirrors src/lib/measurement.ts in the app, so this page and the
   app give the same answer for the same tape measurements. Everything runs in
   the browser: nothing typed here is sent anywhere or stored. */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EquusCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var MARGIN_PCT = 6;
  var CM_PER_INCH = 2.54;

  // Base divisor 11,900 (Carroll & Huntington, 1988). The per-type values are
  // directional corrections, not independently validated constants.
  var DIVISORS = { standard: 11900, pony: 11000, draft: 12600, narrow: 12200 };

  var BOUNDS_CM = { girthMin: 60, girthMax: 280, lengthMin: 60, lengthMax: 260 };
  var TYPICAL_GIRTH_CM = { min: 100, max: 200 };

  function estimateWeightKg(girthCm, lengthCm, bodyType) {
    if (!(girthCm > 0) || !(lengthCm > 0)) return 0;
    var divisor = DIVISORS[bodyType] || DIVISORS.standard;
    return Math.round((girthCm * girthCm * lengthCm) / divisor);
  }

  function kgToLb(kg) {
    return Math.round(kg * 2.20462);
  }

  // 1 stone = 14 lb. Returns {stone, lb} with lb 0-13.
  function lbToStone(lb) {
    return { stone: Math.floor(lb / 14), lb: lb - Math.floor(lb / 14) * 14 };
  }

  function toCm(value, unit) {
    return unit === 'in' ? value * CM_PER_INCH : value;
  }

  function fromCm(cm, unit) {
    var v = unit === 'in' ? cm / CM_PER_INCH : cm;
    return Math.round(v * 10) / 10;
  }

  function isLowConfidenceGirth(girthCm) {
    return girthCm < TYPICAL_GIRTH_CM.min || girthCm > TYPICAL_GIRTH_CM.max;
  }

  // +/- 6% typical accuracy for tape-based estimates, as the app states.
  function marginRange(kg) {
    return {
      low: Math.round(kg * (1 - MARGIN_PCT / 100)),
      high: Math.round(kg * (1 + MARGIN_PCT / 100))
    };
  }

  // A general guide only: 1.5-2% of bodyweight in forage a day.
  function forageRangeKg(kg) {
    return { low: Math.round(kg * 0.015), high: Math.round(kg * 0.02) };
  }

  // Returns null when the pair is fine, otherwise {field, min, max} in cm so
  // the caller can word the message in whichever unit the person is using.
  function outOfBounds(girthCm, lengthCm) {
    if (girthCm < BOUNDS_CM.girthMin || girthCm > BOUNDS_CM.girthMax) {
      return { field: 'girth', min: BOUNDS_CM.girthMin, max: BOUNDS_CM.girthMax };
    }
    if (lengthCm < BOUNDS_CM.lengthMin || lengthCm > BOUNDS_CM.lengthMax) {
      return { field: 'length', min: BOUNDS_CM.lengthMin, max: BOUNDS_CM.lengthMax };
    }
    return null;
  }

  var api = {
    MARGIN_PCT: MARGIN_PCT,
    DIVISORS: DIVISORS,
    estimateWeightKg: estimateWeightKg,
    kgToLb: kgToLb,
    lbToStone: lbToStone,
    toCm: toCm,
    fromCm: fromCm,
    isLowConfidenceGirth: isLowConfidenceGirth,
    marginRange: marginRange,
    forageRangeKg: forageRangeKg,
    outOfBounds: outOfBounds
  };

  // ---- page wiring (only when the calculator markup is present) ----------
  if (typeof document !== 'undefined' && document.getElementById('calc-form')) {
    var form = document.getElementById('calc-form');
    var girthEl = document.getElementById('calc-girth');
    var lengthEl = document.getElementById('calc-length');
    var typeEl = document.getElementById('calc-type');
    var unitEls = form.querySelectorAll('input[name="unit"]');
    var typeHint = document.getElementById('calc-type-hint');
    var exampleChip = document.getElementById('calc-example');
    var out = {
      panel: document.getElementById('calc-result'),
      kg: document.getElementById('calc-kg'),
      lb: document.getElementById('calc-lb'),
      stone: document.getElementById('calc-stone'),
      range: document.getElementById('calc-range'),
      forage: document.getElementById('calc-forage'),
      note: document.getElementById('calc-note'),
      error: document.getElementById('calc-error')
    };

    var TYPE_HINTS = {
      standard: 'Most riding horses.',
      pony: 'Pony breeds.',
      draft: 'Draft types and cobs.',
      narrow: 'Slim, narrow-bodied horses.'
    };

    var currentUnit = 'cm';
    var touched = false;

    function nf(n) {
      return n.toLocaleString('en-GB');
    }

    function unitLabel() {
      return currentUnit === 'in' ? 'in' : 'cm';
    }

    function bound(cm) {
      return nf(fromCm(cm, currentUnit)) + ' ' + unitLabel();
    }

    // After a unit switch the box shows a rounded figure, but the exact
    // original centimetres are kept until the person types, so switching
    // cm -> in -> cm never nudges the weight.
    function cmValue(el, shown) {
      if (el.dataset.cm && el.dataset.shown === el.value) return parseFloat(el.dataset.cm);
      return toCm(shown, currentUnit);
    }

    function setEmpty(message) {
      out.panel.classList.add('is-empty');
      out.kg.textContent = '--';
      out.lb.textContent = '--';
      out.stone.textContent = '--';
      out.range.textContent = '';
      out.forage.textContent = '';
      out.note.hidden = true;
      out.error.textContent = message || '';
      out.error.hidden = !message;
    }

    function update() {
      var type = typeEl.value;
      typeHint.textContent = TYPE_HINTS[type] || '';

      var girth = parseFloat(String(girthEl.value).replace(',', '.'));
      var length = parseFloat(String(lengthEl.value).replace(',', '.'));
      if (!(girth > 0) || !(length > 0)) {
        setEmpty('Enter both measurements to see the weight.');
        return;
      }
      var girthCm = cmValue(girthEl, girth);
      var lengthCm = cmValue(lengthEl, length);
      var bad = outOfBounds(girthCm, lengthCm);
      if (bad) {
        var name = bad.field === 'girth' ? 'heart girth' : 'body length';
        setEmpty('Check the ' + name + ': it should be between ' + bound(bad.min) + ' and ' + bound(bad.max) + '.');
        return;
      }

      var kg = estimateWeightKg(girthCm, lengthCm, type);
      var lb = kgToLb(kg);
      var st = lbToStone(lb);
      var range = marginRange(kg);
      var forage = forageRangeKg(kg);

      out.panel.classList.remove('is-empty');
      out.error.hidden = true;
      out.kg.textContent = nf(kg);
      out.lb.textContent = nf(lb) + ' lb';
      out.stone.textContent = st.stone + ' st ' + st.lb + ' lb';
      out.range.textContent = 'Likely range ' + nf(range.low) + ' to ' + nf(range.high) + ' kg (about plus or minus ' + MARGIN_PCT + '%).';
      out.forage.textContent = 'As a general guide, most horses eat about ' + nf(forage.low) + ' to ' + nf(forage.high) + ' kg of forage a day (1.5 to 2% of bodyweight).';
      out.note.hidden = !isLowConfidenceGirth(girthCm);
    }

    function markTouched() {
      if (!touched) {
        touched = true;
        exampleChip.hidden = true;
      }
    }

    function switchUnit(next) {
      if (next === currentUnit) return;
      [girthEl, lengthEl].forEach(function (el) {
        var v = parseFloat(String(el.value).replace(',', '.'));
        if (v > 0) {
          var exactCm = cmValue(el, v);
          el.value = fromCm(exactCm, next);
          el.dataset.cm = String(exactCm);
          el.dataset.shown = el.value;
        }
      });
      currentUnit = next;
      form.querySelectorAll('[data-unit-label]').forEach(function (el) {
        el.textContent = next === 'in' ? 'in' : 'cm';
      });
      girthEl.step = lengthEl.step = '0.1';
      update();
    }

    [girthEl, lengthEl].forEach(function (el) {
      el.addEventListener('input', function () { markTouched(); update(); });
    });
    typeEl.addEventListener('change', function () { markTouched(); update(); });
    unitEls.forEach(function (el) {
      el.addEventListener('change', function () {
        if (el.checked) switchUnit(el.value);
      });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    update();
  }

  return api;
});
