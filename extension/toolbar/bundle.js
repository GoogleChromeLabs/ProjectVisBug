const sugar = {
  on: function(names, fn) {
    names
      .split(' ')
      .forEach(name =>
        this.addEventListener(name, fn));
    return this
  },
  off: function(names, fn) {
    names
      .split(' ')
      .forEach(name =>
        this.removeEventListener(name, fn));
    return this
  },
  attr: function(attr, val) {
    if (val === undefined) return this.getAttribute(attr)

    val == null
      ? this.removeAttribute(attr)
      : this.setAttribute(attr, val || '');
      
    return this
  }
};

function $(query, $context = document) {
  let $nodes = query instanceof NodeList
    ? query
    : query instanceof HTMLElement 
      ? [query]
      : $context.querySelectorAll(query);

  if (!$nodes.length) $nodes = [];

  return Object.assign(
    [...$nodes].map($el => Object.assign($el, sugar)), 
    {
      on: function(names, fn) {
        this.forEach($el => $el.on(names, fn));
        return this
      },
      off: function(names, fn) {
        this.forEach($el => $el.off(names, fn));
        return this
      },
      attr: function(attrs, val) {
        if (typeof attrs === 'string' && val === undefined)
          return this[0].attr(attrs)

        else if (typeof attrs === 'object') 
          this.forEach($el =>
            Object.entries(attrs)
              .forEach(([key, val]) =>
                $el.attr(key, val)));

        else if (typeof attrs == 'string' && (val || val == null || val == ''))
          this.forEach($el => $el.attr(attrs, val));

        return this
      }
    }
  )
}

/*!
 * hotkeys-js v3.3.5
 * A simple micro-library for defining and dispatching keyboard shortcuts. It has no dependencies.
 * 
 * Copyright (c) 2018 kenny wong <wowohoo@qq.com>
 * http://jaywcjlove.github.io/hotkeys
 * 
 * Licensed under the MIT license.
 */

var isff = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase().indexOf('firefox') > 0 : false;

// 绑定事件
function addEvent(object, event, method) {
  if (object.addEventListener) {
    object.addEventListener(event, method, false);
  } else if (object.attachEvent) {
    object.attachEvent('on' + event, function () {
      method(window.event);
    });
  }
}

// 修饰键转换成对应的键码
function getMods(modifier, key) {
  var mods = key.slice(0, key.length - 1);
  for (var i = 0; i < mods.length; i++) {
    mods[i] = modifier[mods[i].toLowerCase()];
  }return mods;
}

// 处理传的key字符串转换成数组
function getKeys(key) {
  if (!key) key = '';

  key = key.replace(/\s/g, ''); // 匹配任何空白字符,包括空格、制表符、换页符等等
  var keys = key.split(','); // 同时设置多个快捷键，以','分割
  var index = keys.lastIndexOf('');

  // 快捷键可能包含','，需特殊处理
  for (; index >= 0;) {
    keys[index - 1] += ',';
    keys.splice(index, 1);
    index = keys.lastIndexOf('');
  }

  return keys;
}

// 比较修饰键的数组
function compareArray(a1, a2) {
  var arr1 = a1.length >= a2.length ? a1 : a2;
  var arr2 = a1.length >= a2.length ? a2 : a1;
  var isIndex = true;

  for (var i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) isIndex = false;
  }
  return isIndex;
}

var _keyMap = { // 特殊键
  backspace: 8,
  tab: 9,
  clear: 12,
  enter: 13,
  return: 13,
  esc: 27,
  escape: 27,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  del: 46,
  delete: 46,
  ins: 45,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  capslock: 20,
  '⇪': 20,
  ',': 188,
  '.': 190,
  '/': 191,
  '`': 192,
  '-': isff ? 173 : 189,
  '=': isff ? 61 : 187,
  ';': isff ? 59 : 186,
  '\'': 222,
  '[': 219,
  ']': 221,
  '\\': 220
};

var _modifier = { // 修饰键
  '⇧': 16,
  shift: 16,
  '⌥': 18,
  alt: 18,
  option: 18,
  '⌃': 17,
  ctrl: 17,
  control: 17,
  '⌘': isff ? 224 : 91,
  cmd: isff ? 224 : 91,
  command: isff ? 224 : 91
};
var _downKeys = []; // 记录摁下的绑定键
var modifierMap = {
  16: 'shiftKey',
  18: 'altKey',
  17: 'ctrlKey'
};
var _mods = { 16: false, 18: false, 17: false };
var _handlers = {};

// F1~F12 特殊键
for (var k = 1; k < 20; k++) {
  _keyMap['f' + k] = 111 + k;
}

// 兼容Firefox处理
modifierMap[isff ? 224 : 91] = 'metaKey';
_mods[isff ? 224 : 91] = false;

var _scope = 'all'; // 默认热键范围
var isBindElement = false; // 是否绑定节点

// 返回键码
var code = function code(x) {
  return _keyMap[x.toLowerCase()] || x.toUpperCase().charCodeAt(0);
};

// 设置获取当前范围（默认为'所有'）
function setScope(scope) {
  _scope = scope || 'all';
}
// 获取当前范围
function getScope() {
  return _scope || 'all';
}
// 获取摁下绑定键的键值
function getPressedKeyCodes() {
  return _downKeys.slice(0);
}

// 表单控件控件判断 返回 Boolean
function filter(event) {
  var tagName = event.target.tagName || event.srcElement.tagName;
  // 忽略这些标签情况下快捷键无效
  return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
}

// 判断摁下的键是否为某个键，返回true或者false
function isPressed(keyCode) {
  if (typeof keyCode === 'string') {
    keyCode = code(keyCode); // 转换成键码
  }
  return _downKeys.indexOf(keyCode) !== -1;
}

// 循环删除handlers中的所有 scope(范围)
function deleteScope(scope, newScope) {
  var handlers = void 0;
  var i = void 0;

  // 没有指定scope，获取scope
  if (!scope) scope = getScope();

  for (var key in _handlers) {
    if (Object.prototype.hasOwnProperty.call(_handlers, key)) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length;) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);else i++;
      }
    }
  }

  // 如果scope被删除，将scope重置为all
  if (getScope() === scope) setScope(newScope || 'all');
}

// 清除修饰键
function clearModifier(event) {
  var key = event.keyCode || event.which || event.charCode;
  var i = _downKeys.indexOf(key);

  // 从列表中清除按压过的键
  if (i >= 0) _downKeys.splice(i, 1);

  // 修饰键 shiftKey altKey ctrlKey (command||metaKey) 清除
  if (key === 93 || key === 224) key = 91;
  if (key in _mods) {
    _mods[key] = false;

    // 将修饰键重置为false
    for (var k in _modifier) {
      if (_modifier[k] === key) hotkeys[k] = false;
    }
  }
}

// 解除绑定某个范围的快捷键
function unbind(key, scope) {
  var multipleKeys = getKeys(key);
  var keys = void 0;
  var mods = [];
  var obj = void 0;

  for (var i = 0; i < multipleKeys.length; i++) {
    // 将组合快捷键拆分为数组
    keys = multipleKeys[i].split('+');

    // 记录每个组合键中的修饰键的键码 返回数组
    if (keys.length > 1) mods = getMods(_modifier, keys);

    // 获取除修饰键外的键值key
    key = keys[keys.length - 1];
    key = key === '*' ? '*' : code(key);

    // 判断是否传入范围，没有就获取范围
    if (!scope) scope = getScope();

    // 如何key不在 _handlers 中返回不做处理
    if (!_handlers[key]) return;

    // 清空 handlers 中数据，
    // 让触发快捷键键之后没有事件执行到达解除快捷键绑定的目的
    for (var r = 0; r < _handlers[key].length; r++) {
      obj = _handlers[key][r];
      // 判断是否在范围内并且键值相同
      if (obj.scope === scope && compareArray(obj.mods, mods)) {
        _handlers[key][r] = {};
      }
    }
  }
}

// 对监听对应快捷键的回调函数进行处理
function eventHandler(event, handler, scope) {
  var modifiersMatch = void 0;

  // 看它是否在当前范围
  if (handler.scope === scope || handler.scope === 'all') {
    // 检查是否匹配修饰符（如果有返回true）
    modifiersMatch = handler.mods.length > 0;

    for (var y in _mods) {
      if (Object.prototype.hasOwnProperty.call(_mods, y)) {
        if (!_mods[y] && handler.mods.indexOf(+y) > -1 || _mods[y] && handler.mods.indexOf(+y) === -1) modifiersMatch = false;
      }
    }

    // 调用处理程序，如果是修饰键不做处理
    if (handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91] || modifiersMatch || handler.shortcut === '*') {
      if (handler.method(event, handler) === false) {
        if (event.preventDefault) event.preventDefault();else event.returnValue = false;
        if (event.stopPropagation) event.stopPropagation();
        if (event.cancelBubble) event.cancelBubble = true;
      }
    }
  }
}

// 处理keydown事件
function dispatch(event) {
  var asterisk = _handlers['*'];
  var key = event.keyCode || event.which || event.charCode;

  // 搜集绑定的键
  if (_downKeys.indexOf(key) === -1) _downKeys.push(key);

  // Gecko(Firefox)的command键值224，在Webkit(Chrome)中保持一致
  // Webkit左右command键值不一样
  if (key === 93 || key === 224) key = 91;

  if (key in _mods) {
    _mods[key] = true;

    // 将特殊字符的key注册到 hotkeys 上
    for (var k in _modifier) {
      if (_modifier[k] === key) hotkeys[k] = true;
    }

    if (!asterisk) return;
  }

  // 将modifierMap里面的修饰键绑定到event中
  for (var e in _mods) {
    if (Object.prototype.hasOwnProperty.call(_mods, e)) {
      _mods[e] = event[modifierMap[e]];
    }
  }

  // 表单控件过滤 默认表单控件不触发快捷键
  if (!hotkeys.filter.call(this, event)) return;

  // 获取范围 默认为all
  var scope = getScope();

  // 对任何快捷键都需要做的处理
  if (asterisk) {
    for (var i = 0; i < asterisk.length; i++) {
      if (asterisk[i].scope === scope) eventHandler(event, asterisk[i], scope);
    }
  }
  // key 不在_handlers中返回
  if (!(key in _handlers)) return;

  for (var _i = 0; _i < _handlers[key].length; _i++) {
    // 找到处理内容
    eventHandler(event, _handlers[key][_i], scope);
  }
}

function hotkeys(key, option, method) {
  var keys = getKeys(key); // 需要处理的快捷键列表
  var mods = [];
  var scope = 'all'; // scope默认为all，所有范围都有效
  var element = document; // 快捷键事件绑定节点
  var i = 0;

  // 对为设定范围的判断
  if (method === undefined && typeof option === 'function') {
    method = option;
  }

  if (Object.prototype.toString.call(option) === '[object Object]') {
    if (option.scope) scope = option.scope; // eslint-disable-line
    if (option.element) element = option.element; // eslint-disable-line
  }

  if (typeof option === 'string') scope = option;

  // 对于每个快捷键进行处理
  for (; i < keys.length; i++) {
    key = keys[i].split('+'); // 按键列表
    mods = [];

    // 如果是组合快捷键取得组合快捷键
    if (key.length > 1) mods = getMods(_modifier, key);

    // 将非修饰键转化为键码
    key = key[key.length - 1];
    key = key === '*' ? '*' : code(key); // *表示匹配所有快捷键

    // 判断key是否在_handlers中，不在就赋一个空数组
    if (!(key in _handlers)) _handlers[key] = [];

    _handlers[key].push({
      scope: scope,
      mods: mods,
      shortcut: keys[i],
      method: method,
      key: keys[i]
    });
  }
  // 在全局document上设置快捷键
  if (typeof element !== 'undefined' && !isBindElement) {
    isBindElement = true;
    addEvent(element, 'keydown', function (e) {
      dispatch(e);
    });
    addEvent(element, 'keyup', function (e) {
      clearModifier(e);
    });
  }
}

var _api = {
  setScope: setScope,
  getScope: getScope,
  deleteScope: deleteScope,
  getPressedKeyCodes: getPressedKeyCodes,
  isPressed: isPressed,
  filter: filter,
  unbind: unbind
};
for (var a in _api) {
  if (Object.prototype.hasOwnProperty.call(_api, a)) {
    hotkeys[a] = _api[a];
  }
}

if (typeof window !== 'undefined') {
  var _hotkeys = window.hotkeys;
  hotkeys.noConflict = function (deep) {
    if (deep && window.hotkeys === hotkeys) {
      window.hotkeys = _hotkeys;
    }
    return hotkeys;
  };
  window.hotkeys = hotkeys;
}

/**
 * Take input from [0, n] and return it as [0, 1]
 * @hidden
 */
function bound01(n, max) {
    if (isOnePointZero(n)) {
        n = '100%';
    }
    const processPercent = isPercentage(n);
    n = max === 360 ? n : Math.min(max, Math.max(0, parseFloat(n)));
    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(String(n * max), 10) / 100;
    }
    // Handle floating point rounding errors
    if (Math.abs(n - max) < 0.000001) {
        return 1;
    }
    // Convert into [0, 1] range if it isn't already
    if (max === 360) {
        // If n is a hue given in degrees,
        // wrap around out-of-range values into [0, 360] range
        // then convert into [0, 1].
        n = (n < 0 ? n % max + max : n % max) / parseFloat(String(max));
    }
    else {
        // If n not a hue given in degrees
        // Convert into [0, 1] range if it isn't already.
        n = (n % max) / parseFloat(String(max));
    }
    return n;
}
/**
 * Force a number between 0 and 1
 * @hidden
 */
function clamp01(val) {
    return Math.min(1, Math.max(0, val));
}
/**
 * Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
 * <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
 * @hidden
 */
function isOnePointZero(n) {
    return typeof n === 'string' && n.indexOf('.') !== -1 && parseFloat(n) === 1;
}
/**
 * Check to see if string passed in is a percentage
 * @hidden
 */
function isPercentage(n) {
    return typeof n === 'string' && n.indexOf('%') !== -1;
}
/**
 * Return a valid alpha value [0,1] with all invalid values being set to 1
 * @hidden
 */
function boundAlpha(a) {
    a = parseFloat(a);
    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }
    return a;
}
/**
 * Replace a decimal with it's percentage value
 * @hidden
 */
function convertToPercentage(n) {
    if (n <= 1) {
        return +n * 100 + '%';
    }
    return n;
}
/**
 * Force a hex value to have 2 characters
 * @hidden
 */
function pad2(c) {
    return c.length === 1 ? '0' + c : '' + c;
}

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>
/**
 * Handle bounds / percentage checking to conform to CSS color spec
 * <http://www.w3.org/TR/css3-color/>
 * *Assumes:* r, g, b in [0, 255] or [0, 1]
 * *Returns:* { r, g, b } in [0, 255]
 */
function rgbToRgb(r, g, b) {
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255,
    };
}
/**
 * Converts an RGB color value to HSL.
 * *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
 * *Returns:* { h, s, l } in [0,1]
 */
function rgbToHsl(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h, s, l };
}
/**
 * Converts an HSL color value to RGB.
 *
 * *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
 * *Returns:* { r, g, b } in the set [0, 255]
 */
function hslToRgb(h, s, l) {
    let r;
    let g;
    let b;
    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);
    function hue2rgb(p, q, t) {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }
    if (s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
}
/**
 * Converts an RGB color value to HSV
 *
 * *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
 * *Returns:* { h, s, v } in [0,1]
 */
function rgbToHsv(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0; // achromatic
    }
    else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}
/**
 * Converts an HSV color value to RGB.
 *
 * *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
 * *Returns:* { r, g, b } in the set [0, 255]
 */
function hsvToRgb(h, s, v) {
    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);
    const i = Math.floor(h);
    const f = h - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    const mod = i % 6;
    const r = [v, q, p, p, t, v][mod];
    const g = [t, v, v, q, p, p][mod];
    const b = [p, p, t, v, v, q][mod];
    return { r: r * 255, g: g * 255, b: b * 255 };
}
/**
 * Converts an RGB color to hex
 *
 * Assumes r, g, and b are contained in the set [0, 255]
 * Returns a 3 or 6 character hex
 */
function rgbToHex(r, g, b, allow3Char) {
    const hex = [
        pad2(Math.round(r).toString(16)),
        pad2(Math.round(g).toString(16)),
        pad2(Math.round(b).toString(16)),
    ];
    // Return a 3 character hex if possible
    if (allow3Char &&
        hex[0].charAt(0) === hex[0].charAt(1) &&
        hex[1].charAt(0) === hex[1].charAt(1) &&
        hex[2].charAt(0) === hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }
    return hex.join('');
}
/**
 * Converts an RGBA color plus alpha transparency to hex
 *
 * Assumes r, g, b are contained in the set [0, 255] and
 * a in [0, 1]. Returns a 4 or 8 character rgba hex
 */
function rgbaToHex(r, g, b, a, allow4Char) {
    const hex = [
        pad2(Math.round(r).toString(16)),
        pad2(Math.round(g).toString(16)),
        pad2(Math.round(b).toString(16)),
        pad2(convertDecimalToHex(a)),
    ];
    // Return a 4 character hex if possible
    if (allow4Char &&
        hex[0].charAt(0) === hex[0].charAt(1) &&
        hex[1].charAt(0) === hex[1].charAt(1) &&
        hex[2].charAt(0) === hex[2].charAt(1) &&
        hex[3].charAt(0) === hex[3].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
    }
    return hex.join('');
}
/** Converts a decimal to a hex value */
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
/** Converts a hex value to a decimal */
function convertHexToDecimal(h) {
    return parseIntFromHex(h) / 255;
}
/** Parse a base-16 hex value into a base-10 integer */
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// https://github.com/bahamas10/css-color-names/blob/master/css-color-names.json
/**
 * @hidden
 */
const names = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32',
};

/**
 * Given a string or object, convert that input to RGB
 *
 * Possible string inputs:
 * ```
 * "red"
 * "#f00" or "f00"
 * "#ff0000" or "ff0000"
 * "#ff000000" or "ff000000"
 * "rgb 255 0 0" or "rgb (255, 0, 0)"
 * "rgb 1.0 0 0" or "rgb (1, 0, 0)"
 * "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
 * "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
 * "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
 * "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
 * "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
 * ```
 */
function inputToRGB(color) {
    let rgb = { r: 0, g: 0, b: 0 };
    let a = 1;
    let s = null;
    let v = null;
    let l = null;
    let ok = false;
    let format = false;
    if (typeof color === 'string') {
        color = stringInputToObject(color);
    }
    if (typeof color === 'object') {
        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === '%' ? 'prgb' : 'rgb';
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
            s = convertToPercentage(color.s);
            v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, s, v);
            ok = true;
            format = 'hsv';
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
            s = convertToPercentage(color.s);
            l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, s, l);
            ok = true;
            format = 'hsl';
        }
        if (color.hasOwnProperty('a')) {
            a = color.a;
        }
    }
    a = boundAlpha(a);
    return {
        ok,
        format: color.format || format,
        r: Math.min(255, Math.max(rgb.r, 0)),
        g: Math.min(255, Math.max(rgb.g, 0)),
        b: Math.min(255, Math.max(rgb.b, 0)),
        a,
    };
}
// <http://www.w3.org/TR/css3-values/#integers>
const CSS_INTEGER = '[-\\+]?\\d+%?';
// <http://www.w3.org/TR/css3-values/#number-value>
const CSS_NUMBER = '[-\\+]?\\d*\\.\\d+%?';
// Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
const CSS_UNIT = `(?:${CSS_NUMBER})|(?:${CSS_INTEGER})`;
// Actual matching.
// Parentheses and commas are optional, but not required.
// Whitespace can take the place of commas or opening paren
const PERMISSIVE_MATCH3 = `[\\s|\\(]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})\\s*\\)?`;
const PERMISSIVE_MATCH4 = `[\\s|\\(]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})[,|\\s]+(${CSS_UNIT})\\s*\\)?`;
const matchers = {
    CSS_UNIT: new RegExp(CSS_UNIT),
    rgb: new RegExp('rgb' + PERMISSIVE_MATCH3),
    rgba: new RegExp('rgba' + PERMISSIVE_MATCH4),
    hsl: new RegExp('hsl' + PERMISSIVE_MATCH3),
    hsla: new RegExp('hsla' + PERMISSIVE_MATCH4),
    hsv: new RegExp('hsv' + PERMISSIVE_MATCH3),
    hsva: new RegExp('hsva' + PERMISSIVE_MATCH4),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
};
/**
 * Permissive string parsing.  Take in a number of formats, and output an object
 * based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
 */
function stringInputToObject(color) {
    color = color.trim().toLowerCase();
    if (color.length === 0) {
        return false;
    }
    let named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color === 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: 'name' };
    }
    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    let match = matchers.rgb.exec(color);
    if (match) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    match = matchers.rgba.exec(color);
    if (match) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    match = matchers.hsl.exec(color);
    if (match) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    match = matchers.hsla.exec(color);
    if (match) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    match = matchers.hsv.exec(color);
    if (match) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    match = matchers.hsva.exec(color);
    if (match) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    match = matchers.hex8.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            a: convertHexToDecimal(match[4]),
            format: named ? 'name' : 'hex8',
        };
    }
    match = matchers.hex6.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? 'name' : 'hex',
        };
    }
    match = matchers.hex4.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1] + match[1]),
            g: parseIntFromHex(match[2] + match[2]),
            b: parseIntFromHex(match[3] + match[3]),
            a: convertHexToDecimal(match[4] + match[4]),
            format: named ? 'name' : 'hex8',
        };
    }
    match = matchers.hex3.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1] + match[1]),
            g: parseIntFromHex(match[2] + match[2]),
            b: parseIntFromHex(match[3] + match[3]),
            format: named ? 'name' : 'hex',
        };
    }
    return false;
}
/**
 * Check to see if it looks like a CSS unit
 * (see `matchers` above for definition).
 */
function isValidCSSUnit(color) {
    return !!matchers.CSS_UNIT.exec(String(color));
}

class TinyColor {
    constructor(color = '', opts = {}) {
        // If input is already a tinycolor, return itself
        if (color instanceof TinyColor) {
            return color;
        }
        this.originalInput = color;
        const rgb = inputToRGB(color);
        this.originalInput = color;
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
        this.a = rgb.a;
        this.roundA = Math.round(100 * this.a) / 100;
        this.format = opts.format || rgb.format;
        this.gradientType = opts.gradientType;
        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this.r < 1) {
            this.r = Math.round(this.r);
        }
        if (this.g < 1) {
            this.g = Math.round(this.g);
        }
        if (this.b < 1) {
            this.b = Math.round(this.b);
        }
        this.isValid = rgb.ok;
    }
    isDark() {
        return this.getBrightness() < 128;
    }
    isLight() {
        return !this.isDark();
    }
    /**
     * Returns the perceived brightness of the color, from 0-255.
     */
    getBrightness() {
        // http://www.w3.org/TR/AERT#color-contrast
        const rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }
    /**
     * Returns the perceived luminance of a color, from 0-1.
     */
    getLuminance() {
        // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        const rgb = this.toRgb();
        let R;
        let G;
        let B;
        const RsRGB = rgb.r / 255;
        const GsRGB = rgb.g / 255;
        const BsRGB = rgb.b / 255;
        if (RsRGB <= 0.03928) {
            R = RsRGB / 12.92;
        }
        else {
            R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
        }
        if (GsRGB <= 0.03928) {
            G = GsRGB / 12.92;
        }
        else {
            G = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
        }
        if (BsRGB <= 0.03928) {
            B = BsRGB / 12.92;
        }
        else {
            B = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }
    /**
     * Sets the alpha value on the current color.
     *
     * @param alpha - The new alpha value. The accepted range is 0-1.
     */
    setAlpha(alpha) {
        this.a = boundAlpha(alpha);
        this.roundA = Math.round(100 * this.a) / 100;
        return this;
    }
    /**
     * Returns the object as a HSVA object.
     */
    toHsv() {
        const hsv = rgbToHsv(this.r, this.g, this.b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this.a };
    }
    /**
     * Returns the hsva values interpolated into a string with the following format:
     * "hsva(xxx, xxx, xxx, xx)".
     */
    toHsvString() {
        const hsv = rgbToHsv(this.r, this.g, this.b);
        const h = Math.round(hsv.h * 360);
        const s = Math.round(hsv.s * 100);
        const v = Math.round(hsv.v * 100);
        return this.a === 1 ? `hsv(${h}, ${s}%, ${v}%)` : `hsva(${h}, ${s}%, ${v}%, ${this.roundA})`;
    }
    /**
     * Returns the object as a HSLA object.
     */
    toHsl() {
        const hsl = rgbToHsl(this.r, this.g, this.b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this.a };
    }
    /**
     * Returns the hsla values interpolated into a string with the following format:
     * "hsla(xxx, xxx, xxx, xx)".
     */
    toHslString() {
        const hsl = rgbToHsl(this.r, this.g, this.b);
        const h = Math.round(hsl.h * 360);
        const s = Math.round(hsl.s * 100);
        const l = Math.round(hsl.l * 100);
        return this.a === 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${this.roundA})`;
    }
    /**
     * Returns the hex value of the color.
     * @param allow3Char will shorten hex value to 3 char if possible
     */
    toHex(allow3Char = false) {
        return rgbToHex(this.r, this.g, this.b, allow3Char);
    }
    /**
     * Returns the hex value of the color -with a # appened.
     * @param allow3Char will shorten hex value to 3 char if possible
     */
    toHexString(allow3Char = false) {
        return '#' + this.toHex(allow3Char);
    }
    /**
     * Returns the hex 8 value of the color.
     * @param allow4Char will shorten hex value to 4 char if possible
     */
    toHex8(allow4Char = false) {
        return rgbaToHex(this.r, this.g, this.b, this.a, allow4Char);
    }
    /**
     * Returns the hex 8 value of the color -with a # appened.
     * @param allow4Char will shorten hex value to 4 char if possible
     */
    toHex8String(allow4Char = false) {
        return '#' + this.toHex8(allow4Char);
    }
    /**
     * Returns the object as a RGBA object.
     */
    toRgb() {
        return {
            r: Math.round(this.r),
            g: Math.round(this.g),
            b: Math.round(this.b),
            a: this.a,
        };
    }
    /**
     * Returns the RGBA values interpolated into a string with the following format:
     * "RGBA(xxx, xxx, xxx, xx)".
     */
    toRgbString() {
        const r = Math.round(this.r);
        const g = Math.round(this.g);
        const b = Math.round(this.b);
        return this.a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${this.roundA})`;
    }
    /**
     * Returns the object as a RGBA object.
     */
    toPercentageRgb() {
        const fmt = (x) => Math.round(bound01(x, 255) * 100) + '%';
        return {
            r: fmt(this.r),
            g: fmt(this.g),
            b: fmt(this.b),
            a: this.a,
        };
    }
    /**
     * Returns the RGBA relative values interpolated into a string
     */
    toPercentageRgbString() {
        const rnd = (x) => Math.round(bound01(x, 255) * 100);
        return this.a === 1
            ? `rgb(${rnd(this.r)}%, ${rnd(this.g)}%, ${rnd(this.b)}%)`
            : `rgba(${rnd(this.r)}%, ${rnd(this.g)}%, ${rnd(this.b)}%, ${this.roundA})`;
    }
    /**
     * The 'real' name of the color -if there is one.
     */
    toName() {
        if (this.a === 0) {
            return 'transparent';
        }
        if (this.a < 1) {
            return false;
        }
        const hex = '#' + rgbToHex(this.r, this.g, this.b, false);
        for (const key of Object.keys(names)) {
            if (names[key] === hex) {
                return key;
            }
        }
        return false;
    }
    /**
     * String representation of the color.
     *
     * @param format - The format to be used when displaying the string representation.
     */
    toString(format) {
        const formatSet = !!format;
        format = format || this.format;
        let formattedString = false;
        const hasAlpha = this.a < 1 && this.a >= 0;
        const needsAlphaFormat = !formatSet && hasAlpha && (format.startsWith('hex') || format === 'name');
        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === 'name' && this.a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === 'rgb') {
            formattedString = this.toRgbString();
        }
        if (format === 'prgb') {
            formattedString = this.toPercentageRgbString();
        }
        if (format === 'hex' || format === 'hex6') {
            formattedString = this.toHexString();
        }
        if (format === 'hex3') {
            formattedString = this.toHexString(true);
        }
        if (format === 'hex4') {
            formattedString = this.toHex8String(true);
        }
        if (format === 'hex8') {
            formattedString = this.toHex8String();
        }
        if (format === 'name') {
            formattedString = this.toName();
        }
        if (format === 'hsl') {
            formattedString = this.toHslString();
        }
        if (format === 'hsv') {
            formattedString = this.toHsvString();
        }
        return formattedString || this.toHexString();
    }
    clone() {
        return new TinyColor(this.toString());
    }
    /**
     * Lighten the color a given amount. Providing 100 will always return white.
     * @param amount - valid between 1-100
     */
    lighten(amount = 10) {
        const hsl = this.toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return new TinyColor(hsl);
    }
    /**
     * Brighten the color a given amount, from 0 to 100.
     * @param amount - valid between 1-100
     */
    brighten(amount = 10) {
        const rgb = this.toRgb();
        rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
        rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
        rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
        return new TinyColor(rgb);
    }
    /**
     * Darken the color a given amount, from 0 to 100.
     * Providing 100 will always return black.
     * @param amount - valid between 1-100
     */
    darken(amount = 10) {
        const hsl = this.toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return new TinyColor(hsl);
    }
    /**
     * Mix the color with pure white, from 0 to 100.
     * Providing 0 will do nothing, providing 100 will always return white.
     * @param amount - valid between 1-100
     */
    tint(amount = 10) {
        return this.mix('white', amount);
    }
    /**
     * Mix the color with pure black, from 0 to 100.
     * Providing 0 will do nothing, providing 100 will always return black.
     * @param amount - valid between 1-100
     */
    shade(amount = 10) {
        return this.mix('black', amount);
    }
    /**
     * Desaturate the color a given amount, from 0 to 100.
     * Providing 100 will is the same as calling greyscale
     * @param amount - valid between 1-100
     */
    desaturate(amount = 10) {
        const hsl = this.toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return new TinyColor(hsl);
    }
    /**
     * Saturate the color a given amount, from 0 to 100.
     * @param amount - valid between 1-100
     */
    saturate(amount = 10) {
        const hsl = this.toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return new TinyColor(hsl);
    }
    /**
     * Completely desaturates a color into greyscale.
     * Same as calling `desaturate(100)`
     */
    greyscale() {
        return this.desaturate(100);
    }
    /**
     * Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
     * Values outside of this range will be wrapped into this range.
     */
    spin(amount) {
        const hsl = this.toHsl();
        const hue = (hsl.h + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return new TinyColor(hsl);
    }
    mix(color, amount = 50) {
        const rgb1 = this.toRgb();
        const rgb2 = new TinyColor(color).toRgb();
        const p = amount / 100;
        const rgba = {
            r: (rgb2.r - rgb1.r) * p + rgb1.r,
            g: (rgb2.g - rgb1.g) * p + rgb1.g,
            b: (rgb2.b - rgb1.b) * p + rgb1.b,
            a: (rgb2.a - rgb1.a) * p + rgb1.a,
        };
        return new TinyColor(rgba);
    }
    analogous(results = 6, slices = 30) {
        const hsl = this.toHsl();
        const part = 360 / slices;
        const ret = [this];
        for (hsl.h = (hsl.h - ((part * results) >> 1) + 720) % 360; --results;) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(new TinyColor(hsl));
        }
        return ret;
    }
    /**
     * taken from https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js
     */
    complement() {
        const hsl = this.toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return new TinyColor(hsl);
    }
    monochromatic(results = 6) {
        const hsv = this.toHsv();
        const h = hsv.h;
        const s = hsv.s;
        let v = hsv.v;
        const res = [];
        const modification = 1 / results;
        while (results--) {
            res.push(new TinyColor({ h, s, v }));
            v = (v + modification) % 1;
        }
        return res;
    }
    splitcomplement() {
        const hsl = this.toHsl();
        const h = hsl.h;
        return [
            this,
            new TinyColor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l }),
            new TinyColor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l }),
        ];
    }
    triad() {
        return this.polyad(3);
    }
    tetrad() {
        return this.polyad(4);
    }
    /**
     * Get polyad colors, like (for 1, 2, 3, 4, 5, 6, 7, 8, etc...)
     * monad, dyad, triad, tetrad, pentad, hexad, heptad, octad, etc...
     */
    polyad(n) {
        const hsl = this.toHsl();
        const h = hsl.h;
        const result = [this];
        const increment = 360 / n;
        for (let i = 1; i < n; i++) {
            result.push(new TinyColor({ h: (h + i * increment) % 360, s: hsl.s, l: hsl.l }));
        }
        return result;
    }
    /**
     * compare color vs current color
     */
    equals(color) {
        return this.toRgbString() === new TinyColor(color).toRgbString();
    }
}

const move = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/>
  </svg>
`;

const search = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
`;

const margin = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M9 7H7v2h2V7zm0 4H7v2h2v-2zm0-8c-1.11 0-2 .9-2 2h2V3zm4 12h-2v2h2v-2zm6-12v2h2c0-1.1-.9-2-2-2zm-6 0h-2v2h2V3zM9 17v-2H7c0 1.1.89 2 2 2zm10-4h2v-2h-2v2zm0-4h2V7h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zM5 7H3v12c0 1.1.89 2 2 2h12v-2H5V7zm10-2h2V3h-2v2zm0 12h2v-2h-2v2z"/>
  </svg>
`;

const padding = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3c0 1.1.89 2 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9c-1.11 0-2 .9-2 2v10c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z"/>
  </svg>
`;

const font = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
  </svg>
`;

const type = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
`;

const align = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/>
  </svg>
`;

const hueshift = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
`;

const boxshadow = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-.89 0-1.74-.2-2.5-.55C11.56 16.5 13 14.42 13 12s-1.44-4.5-3.5-5.45C10.26 6.2 11.11 6 12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"/>
  </svg>
`;

const inspector = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g>
      <rect x="11" y="7" width="2" height="2"/>
      <rect x="11" y="11" width="2" height="6"/>
      <path d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8
        c0-4.41,3.59-8,8-8s8,3.59,8,8C20,16.41,16.41,20,12,20z"/>
    </g>
  </svg>
`;

function getSide(direction) {
  let start = direction.split('+').pop().replace(/^\w/, c => c.toUpperCase());
  if (start == 'Up') start = 'Top';
  if (start == 'Down') start = 'Bottom';
  return start
}

function getStyle(el, name) {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    name = name.replace(/([A-Z])/g, '-$1');
    name = name.toLowerCase();
    let s = document.defaultView.getComputedStyle(el, '');
    return s && s.getPropertyValue(name)
  } 
  else {
    return null
  }
}

function getStyles(el, desiredPropMap) {
  const elStyleObject = el.style;
  const computedStyle = window.getComputedStyle(el, null);

  let desiredValues = [];

  for (prop in el.style)
    if (prop in desiredPropMap && desiredPropMap[prop] != computedStyle[prop])
      desiredValues.push({
        prop,
        value: computedStyle[prop]
      });

  return desiredValues
}

let timeoutMap = {};
function showHideSelected(el, duration = 750) {
  el.setAttribute('data-selected-hide', true);

  if (timeoutMap[el]) clearTimeout(timeoutMap[el]);

  timeoutMap[el] = setTimeout(_ =>
    el.removeAttribute('data-selected-hide')
  , duration);
  
  return el
}

function camelToDash(camelString = "") {
  return camelString.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();})
}

function htmlStringToDom(htmlString = "") {
  return (new DOMParser().parseFromString(htmlString, 'text/html')).body.firstChild
}

// todo: show margin color
const key_events = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1);

const command_events = 'cmd+up,cmd+shift+up,cmd+down,cmd+shift+down';

function Margin(selector) {
  hotkeys(key_events, (e, handler) => {
    e.preventDefault();
    pushElement($(selector), handler.key);
  });

  hotkeys(command_events, (e, handler) => {
    e.preventDefault();
    pushAllElementSides($(selector), handler.key);
  });

  return () => {
    hotkeys.unbind(key_events);
    hotkeys.unbind(command_events);
    hotkeys.unbind('up,down,left,right'); // bug in lib?
  }
}

function pushElement(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'margin' + getSide(direction),
      current:  parseInt(getStyle(el, 'margin' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        margin: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, margin}) =>
      el.style[style] = `${margin < 0 ? 0 : margin}px`);
}

function pushAllElementSides(els, keycommand) {
  const combo = keycommand.split('+');
  let spoof = '';

  if (combo.includes('shift'))  spoof = 'shift+' + spoof;
  if (combo.includes('down'))   spoof = 'alt+' + spoof;

  'up,down,left,right'.split(',')
    .forEach(side => pushElement(els, spoof + side));
}

const removeEditability = e => {
  e.target.removeAttribute('contenteditable');
  e.target.removeEventListener('blur', removeEditability);
  e.target.removeEventListener('keydown', stopBubbling);
};

const stopBubbling = e => e.key != 'Escape' && e.stopPropagation();

function EditText(elements, focus=false) {
  if (!elements.length) return

  elements.map(el => {
    el.setAttribute('contenteditable', 'true');
    focus && el.focus();
    $(el).on('keydown', stopBubbling);
    $(el).on('blur', removeEditability);
  });

  hotkeys('escape,esc', (e, handler) => {
    elements.forEach(target => removeEditability({target}));
    window.getSelection().empty();
    hotkeys.unbind('escape,esc');
  });
}

const key_events$1 = 'up,down,left,right,backspace';
// todo: indicator for when node can descend
// todo: indicator where left and right will go
// todo: indicator when left or right hit dead ends
// todo: undo
function Moveable(selector) {
  hotkeys(key_events$1, (e, handler) => {
    e.preventDefault();
    e.stopPropagation();
    let el = $(selector)[0]; // only allow 1 node to be moved at a time
    moveElement(el, handler.key);
    updateFeedback(el);
  });

  return () => {
    hotkeys.unbind(key_events$1);
    hotkeys.unbind('up,down,left,right');
  }
}

function moveElement(el, direction) {
  if (!el) return

  switch(direction) {
    case 'left':
      if (canMoveLeft(el))
        el.parentNode.insertBefore(el, el.previousElementSibling);
      else
        showEdge(el.parentNode);
      break

    case 'right':
      if (canMoveRight(el) && el.nextElementSibling.nextSibling)
        el.parentNode.insertBefore(el, el.nextElementSibling.nextSibling);
      else if (canMoveRight(el))
        el.parentNode.appendChild(el);
      else
        showEdge(el.parentNode);
      break

    case 'up':
      if (canMoveUp(el))
        el.parentNode.parentNode.prepend(el);
      break

    case 'down':
      // edge case behavior, user test
      if (!el.nextElementSibling && el.parentNode && el.parentNode.parentNode && el.parentNode.nodeName != 'BODY')
        el.parentNode.parentNode.insertBefore(el, el.parentNode.parentNode.children[[...el.parentElement.parentElement.children].indexOf(el.parentElement) + 1]);
      if (canMoveDown(el))
        el.nextElementSibling.prepend(el);
      break
  }
}

const canMoveLeft = el => el.previousElementSibling;
const canMoveRight = el => el.nextElementSibling;
const canMoveDown = el => 
  el.nextElementSibling && el.nextElementSibling.children.length;
const canMoveUp = el => 
  el.parentNode && el.parentNode.parentNode && el.parentNode.nodeName != 'BODY';

function showEdge(el) {
  return el.animate([
    { outline: '1px solid transparent' },
    { outline: '1px solid hsla(330, 100%, 71%, 80%)' },
    { outline: '1px solid transparent' },
  ], 600)
}

function updateFeedback(el) {
  let options = '';
  // get current elements offset/size
  if (canMoveLeft(el))  options += '⇠';
  if (canMoveRight(el)) options += '⇢';
  if (canMoveDown(el))  options += '⇣';
  if (canMoveUp(el))    options += '⇡';
  // create/move arrows in absolute/fixed to overlay element
  options && console.info('%c'+options, "font-size: 2rem;");
}

let imgs = [];

function watchImagesForUpload() {
  imgs = $('img');

  clearWatchers(imgs);
  initWatchers(imgs);
}

const initWatchers = imgs => {
  imgs.on('dragover', onDragEnter);
  imgs.on('dragleave', onDragLeave);
  document.addEventListener('drop', onDrop);
};

const previewFile = file => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result);
  })
};

const onDragEnter = e => {
  $(e.target).attr('data-droptarget', true);
  e.preventDefault();
};

const onDragLeave = e => {
  $(e.target).attr('data-droptarget', null);
};

const onDrop = async (e) => {
  e.preventDefault();
  $(e.target).attr('data-droptarget', null);

  const selectedImages = $('img[data-selected=true]');

  const srcs = await Promise.all(
    [...e.dataTransfer.files].map(previewFile));
  
  if (!selectedImages.length && e.target.nodeName === 'IMG')
    e.target.src = srcs[0];
  else {
    let i = 0;
    selectedImages.forEach(img => {
      img.src = srcs[i++];
      if (i >= srcs.length) i = 0;
    });
  }
};

const clearWatchers = imgs => {
  imgs.off('dragenter', onDragEnter);
  imgs.off('dragleave', onDragLeave);
  document.removeEventListener('drop', onDrop);
  imgs = [];
};

// todo: alignment guides
function Selectable() {
  const elements          = $('body');
  let selected            = [];
  let selectedCallbacks   = [];

  watchImagesForUpload();

  elements.on('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (isOffBounds(e.target)) return
    if (!e.shiftKey) unselect_all();
    select(e.target);
  });

  elements.on('dblclick', e => {
    e.preventDefault();
    e.stopPropagation();
    if (isOffBounds(e.target)) return
    EditText([e.target], {focus:true});
    $('tool-pallete')[0].toolSelected('text');
  });

  hotkeys('esc', _ => 
    selected.length && unselect_all());

  hotkeys('cmd+d', e => {
    const root_node = selected[0];
    if (!root_node) return

    const deep_clone = root_node.cloneNode(true);
    selected.push(deep_clone);
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling);
    e.preventDefault();
  });

  hotkeys('backspace,del,delete', e => 
    selected.length && delete_all());

  document.addEventListener('copy', e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      e.preventDefault();
      e.clipboardData.setData('text/html', selected[0].outerHTML);
    }
  });

  document.addEventListener('paste', e => {
    const potentialHTML = e.clipboardData.getData('text/html');
    if (selected[0] && potentialHTML) {
      e.preventDefault();
      selected[0].appendChild(
        htmlStringToDom(potentialHTML));
    }
  });

  hotkeys('cmd+e,cmd+shift+e', (e, {key}) => {
    e.preventDefault();

    // TODO: need a much smarter system here
    // only expands base tag names atm
    if (selected[0].nodeName !== 'DIV')
      expandSelection({
        root_node: selected[0], 
        all: key.includes('shift'),
      });
  });

  elements.on('selectstart', e =>
    !isOffBounds(e.target) 
    && selected.length 
    && selected[0].textContent != e.target.textContent 
    && e.preventDefault());

  hotkeys('tab,shift+tab,enter,shift+enter', (e, {key}) => {
    if (selected.length !== 1) return

    e.preventDefault();
    e.stopPropagation();

    const current = selected[0];

    if (key.includes('shift')) {
      if (key.includes('tab') && canMoveLeft(current)) {
        unselect_all();
        select(canMoveLeft(current));
      }
      if (key.includes('enter') && canMoveUp(current)) {
        unselect_all();
        select(current.parentNode);
      }
    }
    else {
      if (key.includes('tab') && canMoveRight(current)) {
        unselect_all();
        select(canMoveRight(current));
      }
      if (key.includes('enter') && current.children.length) {
        unselect_all();
        select(current.children[0]);
      }
    }
  });

  elements.on('mouseover', ({target}) =>
    !isOffBounds(target) && target.setAttribute('data-hover', true));

  elements.on('mouseout', ({target}) =>
    target.removeAttribute('data-hover'));

  elements.on('click', ({target}) => {
    if (!isOffBounds(target) && !selected.filter(el => el == target).length) 
      unselect_all();
    tellWatchers();
  });

  const select = el => {
    if (el.nodeName === 'svg' || el.ownerSVGElement) return

    el.setAttribute('data-selected', true);
    selected.unshift(el);
    tellWatchers();
  };

  const unselect_all = () => {
    selected
      .forEach(el => 
        $(el).attr({
          'data-selected': null,
          'data-selected-hide': null,
        }));

    selected = [];
  };

  const delete_all = () => {
    selected.forEach(el =>
      el.remove());
    selected = [];
  };

  const expandSelection = ({root_node, all}) => {
    if (all) {
      const unselecteds = $(root_node.nodeName.toLowerCase() + ':not([data-selected])');
      unselecteds.forEach(select);
    }
    else {
      const potentials = $(root_node.nodeName.toLowerCase());
      if (!potentials) return

      const root_node_index = potentials.reduce((index, node, i) =>
        node == root_node 
          ? index = i
          : index
      , null);

      if (root_node_index !== null) {
        if (!potentials[root_node_index + 1]) {
          const potential = potentials.filter(el => !el.attr('data-selected'))[0];
          if (potential) select(potential);
        }
        else {
          select(potentials[root_node_index + 1]);
        }
      }
    }
  };

  const isOffBounds = node =>
    node.closest && (node.closest('tool-pallete') || node.closest('.metatip'));

  const onSelectedUpdate = cb =>
    selectedCallbacks.push(cb) && cb(selected);

  const removeSelectedCallback = cb =>
    selectedCallbacks = selectedCallbacks.filter(callback => callback != cb);

  const tellWatchers = () =>
    selectedCallbacks.forEach(cb => cb(selected));

  return {
    select,
    unselect_all,
    onSelectedUpdate,
    removeSelectedCallback,
  }
}

// todo: show padding color
const key_events$2 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},alt+${event},shift+${event},shift+alt+${event}`
  , '')
  .substring(1);

const command_events$1 = 'cmd+up,cmd+shift+up,cmd+down,cmd+shift+down';

function Padding(selector) {
  hotkeys(key_events$2, (e, handler) => {
    e.preventDefault();
    padElement($(selector), handler.key);
  });

  hotkeys(command_events$1, (e, handler) => {
    e.preventDefault();
    padAllElementSides($(selector), handler.key);
  });

  return () => {
    hotkeys.unbind(key_events$2);
    hotkeys.unbind(command_events$1);
    hotkeys.unbind('up,down,left,right'); // bug in lib?
  }
}

function padElement(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'padding' + getSide(direction),
      current:  parseInt(getStyle(el, 'padding' + getSide(direction)), 10),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('alt'),
    }))
    .map(payload =>
      Object.assign(payload, {
        padding: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, padding}) =>
      el.style[style] = `${padding < 0 ? 0 : padding}px`);
}

function padAllElementSides(els, keycommand) {
  const combo = keycommand.split('+');
  let spoof = '';

  if (combo.includes('shift'))  spoof = 'shift+' + spoof;
  if (combo.includes('down'))   spoof = 'alt+' + spoof;

  'up,down,left,right'.split(',')
    .forEach(side => padElement(els, spoof + side));
}

const key_events$3 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$2 = 'cmd+up,cmd+down';

function Font(selector) {
  hotkeys(key_events$3, (e, handler) => {
    e.preventDefault();

    let selectedNodes = $(selector)
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeKerning(selectedNodes, handler.key)
        : changeAlignment(selectedNodes, handler.key);
    else
      keys.includes('shift')
        ? changeLeading(selectedNodes, handler.key)
        : changeFontSize(selectedNodes, handler.key);
  });

  hotkeys(command_events$2, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split('+');
    changeFontWeight($(selector), keys.includes('up') ? 'up' : 'down');
  });

  hotkeys('cmd+b', e => {
    $(selector).forEach(el =>
      el.style.fontWeight = 'bold');
  });

  hotkeys('cmd+i', e => {
    $(selector).forEach(el =>
      el.style.fontStyle = 'italic');
  });

  return () => {
    hotkeys.unbind(key_events$3);
    hotkeys.unbind(command_events$2);
    hotkeys.unbind('cmd+b,cmd+i');
    hotkeys.unbind('up,down,left,right');
  }
}

function changeLeading(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'lineHeight',
      current:  parseInt(getStyle(el, 'lineHeight')),
      amount:   1,
      negative: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        current: payload.current == 'normal' || isNaN(payload.current)
          ? 1.14 * parseInt(getStyle(payload.el, 'fontSize')) // document this choice
          : payload.current
      }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = `${value}px`);
}

function changeKerning(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'letterSpacing',
      current:  parseFloat(getStyle(el, 'letterSpacing')),
      amount:   .1,
      negative: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        current: payload.current == 'normal' || isNaN(payload.current)
          ? 0
          : payload.current
      }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = `${value <= -2 ? -2 : value}px`);
}

function changeFontSize(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'fontSize',
      current:  parseInt(getStyle(el, 'fontSize')),
      amount:   direction.split('+').includes('shift') ? 10 : 1,
      negative: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        font_size: payload.negative
          ? payload.current - payload.amount 
          : payload.current + payload.amount
      }))
    .forEach(({el, style, font_size}) =>
      el.style[style] = `${font_size <= 6 ? 6 : font_size}px`);
}

const weightMap = {
  normal: 2,
  bold:   5,
  light:  0,
  "": 2,
  "100":0,"200":1,"300":2,"400":3,"500":4,"600":5,"700":6,"800":7,"900":8
};
const weightOptions = [100,200,300,400,500,600,700,800,900];

function changeFontWeight(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'fontWeight',
      current:  getStyle(el, 'fontWeight'),
      direction: direction.split('+').includes('down'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? weightMap[payload.current] - 1 
          : weightMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = weightOptions[value < 0 ? 0 : value >= weightOptions.length 
        ? weightOptions.length
        : value
      ]);
}

const alignMap = {
  start: 0,
  left: 0,
  center: 1,
  right: 2,
};
const alignOptions = ['left','center','right'];

function changeAlignment(els, direction) {
  els
    .map(el => showHideSelected(el))
    .map(el => ({ 
      el, 
      style:    'textAlign',
      current:  getStyle(el, 'textAlign'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? alignMap[payload.current] - 1 
          : alignMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = alignOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

const key_events$4 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$3 = 'cmd+up,cmd+down,cmd+left,cmd+right';

function Flex(selector) {
  hotkeys(key_events$4, (e, handler) => {
    e.preventDefault();

    let selectedNodes = $(selector)
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeHDistribution(selectedNodes, handler.key)
        : changeHAlignment(selectedNodes, handler.key);
    else
      keys.includes('shift')
        ? changeVDistribution(selectedNodes, handler.key)
        : changeVAlignment(selectedNodes, handler.key);
  });

  hotkeys(command_events$3, (e, handler) => {
    e.preventDefault();

    let selectedNodes = $(selector)
      , keys = handler.key.split('+');
    
    changeDirection(selectedNodes, keys.includes('left') ? 'row' : 'column');
  });

  return () => {
    hotkeys.unbind(key_events$4);
    hotkeys.unbind(command_events$3);
    hotkeys.unbind('up,down,left,right');
  }
}

const ensureFlex = el => {
  el.style.display = 'flex';
  return el
};

const accountForOtherJustifyContent = (cur, want) => {
  if (want == 'align' && (cur != 'flex-start' && cur != 'center' && cur != 'flex-end'))
    cur = 'normal';
  else if (want == 'distribute' && (cur != 'space-around' && cur != 'space-between'))
    cur = 'normal';

  return cur
};

function changeDirection(els, value) {
  els
    .map(ensureFlex)
    .map(el => {
      el.style.flexDirection = value;
    });
}

const h_alignMap      = {normal: 0,'flex-start': 0,'center': 1,'flex-end': 2,};
const h_alignOptions  = ['flex-start','center','flex-end'];

function changeHAlignment(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({ 
      el, 
      style:    'justifyContent',
      current:  accountForOtherJustifyContent(getStyle(el, 'justifyContent'), 'align'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? h_alignMap[payload.current] - 1 
          : h_alignMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = h_alignOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}
const v_alignOptions  = ['flex-start','center','flex-end'];

function changeVAlignment(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({ 
      el, 
      style:    'alignItems',
      current:  getStyle(el, 'alignItems'),
      direction: direction.split('+').includes('up'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? h_alignMap[payload.current] - 1 
          : h_alignMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = v_alignOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

const h_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,};
const h_distributionOptions  = ['space-around','','space-between'];

function changeHDistribution(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({ 
      el, 
      style:    'justifyContent',
      current:  accountForOtherJustifyContent(getStyle(el, 'justifyContent'), 'distribute'),
      direction: direction.split('+').includes('left'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? h_distributionMap[payload.current] - 1 
          : h_distributionMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = h_distributionOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

const v_distributionMap      = {normal: 1,'space-around': 0,'': 1,'space-between': 2,};
const v_distributionOptions  = ['space-around','','space-between'];

function changeVDistribution(els, direction) {
  els
    .map(ensureFlex)
    .map(el => ({ 
      el, 
      style:    'alignContent',
      current:  getStyle(el, 'alignContent'),
      direction: direction.split('+').includes('up'),
    }))
    .map(payload =>
      Object.assign(payload, {
        value: payload.direction
          ? v_distributionMap[payload.current] - 1 
          : v_distributionMap[payload.current] + 1
      }))
    .forEach(({el, style, value}) =>
      el.style[style] = v_distributionOptions[value < 0 ? 0 : value >= 2 ? 2: value]);
}

// create input
const search_base = document.createElement('div');
search_base.classList.add('search');
search_base.innerHTML = `<input type="text" placeholder="ex: images, .btn, div, and more"/>`;

const search$1        = $(search_base);
const searchInput   = $('input', search_base);

const showSearchBar = () => search$1.attr('style', 'display:block');
const hideSearchBar = () => search$1.attr('style', 'display:none');
const stopBubbling$1  = e => e.key != 'Escape' && e.stopPropagation();

function Search(SelectorEngine, node) {
  if (node) node[0].appendChild(search$1[0]);

  const onQuery = e => {
    e.preventDefault();
    e.stopPropagation();

    let query = e.target.value;

    if (query == 'links') query = 'a';
    if (query == 'buttons') query = 'button';
    if (query == 'images') query = 'img';
    if (query == 'text') query = 'p,caption,a,h1,h2,h3,h4,h5,h6,small,date,time,li,dt,dd';

    if (!query) return SelectorEngine.unselect_all()
    if (query == '.' || query == '#') return

    try {
      const matches = $(query);
      SelectorEngine.unselect_all();
      if (matches.length)
        matches.forEach(el =>
          SelectorEngine.select(el));
    }
    catch (err) {}
  };

  searchInput.on('input', onQuery);
  searchInput.on('keydown', stopBubbling$1);
  // searchInput.on('blur', hideSearchBar)

  showSearchBar();
  searchInput[0].focus();

  // hotkeys('escape,esc', (e, handler) => {
  //   hideSearchBar()
  //   hotkeys.unbind('escape,esc')
  // })

  return () => {
    hideSearchBar();
    searchInput.off('oninput', onQuery);
    searchInput.off('keydown', stopBubbling$1);
    searchInput.off('blur', hideSearchBar);
  }
}

function ChangeForeground(elements, color) {
  elements.map(el =>
    el.style.color = color);
}

function ChangeBackground(elements, color) {
  elements.map(el =>
    el.style.backgroundColor = color);
}

const desiredPropMap = {
  color:            'rgb(0, 0, 0)',
  backgroundColor:  'rgba(0, 0, 0, 0)',
  borderRadius:     '0px',
  padding:          '0px',
  margin:           '0px',
  fontSize:         '16px',
  fontWeight:       '400',
  textAlign:        'start',
  textShadow:       'none',
  textTransform:    'none',
  lineHeight:       'normal',
  display:          'block',
  alignItems:       'normal',
  justifyContent:   'normal',
};

let tip_map = {};

// todo: 
// - node recycling (for new target) no need to create/delete
// - make single function create/update
function MetaTip() {
  const template = ({target: el}) => {
    const { width, height } = el.getBoundingClientRect();
    const styles = getStyles(el, desiredPropMap).map(style => {
      style.prop = camelToDash(style.prop);

      if (style.prop.includes('color') || style.prop.includes('Color'))
        style.value = `<span color style="background-color: ${style.value};"></span>${new TinyColor(style.value).toHslString()}`;

      // check if style is inline style, show indicator
      if (el.getAttribute('style') && el.getAttribute('style').includes(style.prop))
        style.value = `<span local-change>${style.value}</span>`;
      
      return style
    });

    const localModifications = styles.filter(style =>
      el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
        ? 1
        : 0
    );

    const notLocalModifications = styles.filter(style =>
      el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
        ? 0
        : 1
    );
    
    let tip = document.createElement('div');
    tip.classList.add('metatip');
    tip.innerHTML = `
      <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}${el.className && '.'+el.className.replace(/ /g, '.')}</h5>
      <small><span>${Math.round(width)}</span>px <span divider>×</span> <span>${Math.round(height)}</span>px</small>
      <div>${notLocalModifications.reduce((items, item) => `
        ${items}
        <span prop>${item.prop}:</span><span value>${item.value}</span>
      `, '')}</div>
      ${localModifications.length ? `
        <h6>Local Modifications</h6>
        <div>${localModifications.reduce((items, item) => `
          ${items}
          <span prop>${item.prop}:</span><span value>${item.value}</span>
        `, '')}</div>
      ` : ''}
    `;

    return tip
  };

  const tip_key = node =>
    `${node.nodeName}_${node.className}_${node.children.length}_${node.clientWidth}`;

  const tip_position = (node, e) => `
    top: ${e.clientY > window.innerHeight / 2
      ? e.pageY - node.clientHeight
      : e.pageY}px;
    left: ${e.clientX > window.innerWidth / 2
      ? e.pageX - node.clientWidth - 25
      : e.pageX + 25}px;
  `;

  const mouseOut = ({target}) => {
    if (tip_map[tip_key(target)] && !target.hasAttribute('data-metatip')) {
      $(target).off('mouseout', mouseOut);
      $(target).off('click', togglePinned);
      tip_map[tip_key(target)].tip.remove();
      delete tip_map[tip_key(target)];
    }
  };

  const togglePinned = e => {
    if (e.altKey) {
      !e.target.hasAttribute('data-metatip')
        ? e.target.setAttribute('data-metatip', true)
        : e.target.removeAttribute('data-metatip');
    }
  };

  const mouseMove = e => {
    if (e.target.closest('tool-pallete') || e.target.closest('.metatip')) return

    e.altKey
      ? e.target.setAttribute('data-pinhover', true)
      : e.target.removeAttribute('data-pinhover');

    // if node is in our hash (already created)
    if (tip_map[tip_key(e.target)]) {
      // return if it's pinned
      if (e.target.hasAttribute('data-metatip')) 
        return
      // otherwise update position
      const tip = tip_map[tip_key(e.target)].tip;
      tip.style = tip_position(tip, e);
    }
    // create new tip
    else {
      const tip = template(e);
      document.body.appendChild(tip);

      tip.style = tip_position(tip, e);

      $(e.target).on('mouseout', mouseOut);
      $(e.target).on('click', togglePinned);

      tip_map[tip_key(e.target)] = { tip, e };
    }
  };

  $('body').on('mousemove', mouseMove);

  hotkeys('esc', _ => removeAll());

  const hideAll = () =>
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.style.display = 'none';
        $(tip).off('mouseout', mouseOut);
        $(tip).off('click', togglePinned);
      });

  const removeAll = () => {
    Object.values(tip_map)
      .forEach(({tip}) => {
        tip.remove();
        $(tip).off('mouseout', mouseOut);
        $(tip).off('click', togglePinned);
      });
    
    $('[data-metatip]').attr('data-metatip', null);

    tip_map = {};
  };

  Object.values(tip_map)
    .forEach(({tip,e}) => {
      tip.style.display = 'block';
      tip.innerHTML = template(e).innerHTML;
      tip.on('mouseout', mouseOut);
      tip.on('click', togglePinned);
    });

  return () => {
    $('body').off('mousemove', mouseMove);
    hotkeys.unbind('esc');
    hideAll();
  }
}

const key_events$5 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

const command_events$4 = 'cmd+up,cmd+down';

function BoxShadow(selector) {
  hotkeys(key_events$5, (e, handler) => {
    e.preventDefault();

    let selectedNodes = $(selector)
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      keys.includes('shift')
        ? changeBoxShadow(selectedNodes, keys, 'size')
        : changeBoxShadow(selectedNodes, keys, 'x');
    else
      keys.includes('shift')
        ? changeBoxShadow(selectedNodes, keys, 'blur')
        : changeBoxShadow(selectedNodes, keys, 'y');
  });

  hotkeys(command_events$4, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split('+');
    changeBoxShadow($(selector), keys, 'inset');
  });

  return () => {
    hotkeys.unbind(key_events$5);
    hotkeys.unbind(command_events$4);
    hotkeys.unbind('up,down,left,right');
  }
}

const ensureHasShadow = el => {
  if (el.style.boxShadow == '' || el.style.boxShadow == 'none')
    el.style.boxShadow = 'hsla(0,0%,0%,50%) 0 0 0 0';
  return el
};

// todo: work around this propMap with a better split
const propMap = {
  'x':      4,
  'y':      5,
  'blur':   6,
  'size':   7,
  'inset':  8,
};

const parseCurrentShadow = el => getStyle(el, 'boxShadow').split(' ');

function changeBoxShadow(els, direction, prop) {
  els
    .map(ensureHasShadow)
    .map(el => showHideSelected(el, 1500))
    .map(el => ({ 
      el, 
      style:     'boxShadow',
      current:   parseCurrentShadow(el), // ["rgb(255,", "0,", "0)", "0px", "0px", "1px", "0px"]
      propIndex: parseCurrentShadow(el)[0].includes('rgba') ? propMap[prop] : propMap[prop] - 1
    }))
    .map(payload => {
      let updated = [...payload.current];
      let cur     = parseInt(payload.current[payload.propIndex]);

      if (prop == 'blur') {
        updated[payload.propIndex] = direction.includes('down')
          ? `${cur - 1}px`
          : `${cur + 1}px`;
      }
      else if (prop == 'inset') {
        updated[payload.propIndex] = direction.includes('down')
          ? ''
          : 'inset';
      }
      else {
        updated[payload.propIndex] = direction.includes('left') || direction.includes('up')
          ? `${cur - 1}px`
          : `${cur + 1}px`;
      }

      payload.value = updated;
      return payload
    })
    .forEach(({el, style, value}) =>
      el.style[style] = value.join(' '));
}

const key_events$6 = 'up,down,left,right'
  .split(',')
  .reduce((events, event) => 
    `${events},${event},shift+${event}`
  , '')
  .substring(1);

// todo: alpha as cmd+left,cmd+shift+left,cmd+right,cmd+shift+right
const command_events$5 = 'cmd+up,cmd+shift+up,cmd+down,cmd+shift+down';

function HueShift(selector) {
  hotkeys(key_events$6, (e, handler) => {
    e.preventDefault();

    let selectedNodes = $(selector)
      , keys = handler.key.split('+');

    if (keys.includes('left') || keys.includes('right'))
      changeHue(selectedNodes, keys, 's');
    else
      changeHue(selectedNodes, keys, 'l');
  });

  hotkeys(command_events$5, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split('+');
    changeHue($(selector), keys, 'h');
  });

  return () => {
    hotkeys.unbind(key_events$6);
    hotkeys.unbind(command_events$5);
    hotkeys.unbind('up,down,left,right');
  }
}

function changeHue(els, direction, prop) {
  els
    .map(showHideSelected)
    .map(el => {
      const FG = new TinyColor(getStyle(el, 'color'));
      const BG = new TinyColor(getStyle(el, 'backgroundColor'));
      
      return BG.originalInput != 'rgba(0, 0, 0, 0)'             // if bg is set to a value
        ? { el, current: BG.toHsl(), style: 'backgroundColor' } // use bg
        : { el, current: FG.toHsl(), style: 'color' }           // else use fg
    })
    .map(payload =>
      Object.assign(payload, {
        amount:   direction.includes('shift') ? 10 : 1,
        negative: direction.includes('down') || direction.includes('left'),
      }))
    .map(payload => {
      if (prop === 's' || prop === 'l')
        payload.amount = payload.amount * 0.01;

      payload.current[prop] = payload.negative
        ? payload.current[prop] - payload.amount 
        : payload.current[prop] + payload.amount;

      return payload
    })
    .forEach(({el, style, current}) =>
      el.style[style] = new TinyColor(current).toHslString());
}

// todo: create?
// todo: resize
class ToolPallete extends HTMLElement {
  constructor() {
    super();

    this.toolbar_model = {
      i: { tool: 'inspector', icon: inspector, label: 'Inspect', description: 'Peak into the common/current styles of an element' },
      v: { tool: 'move', icon: move, label: 'Move', description: 'Shift things around, copy/paste, duplicate' },
      // r: { tool: 'resize', icon: resize, label: 'Resize', description: '' },
      m: { tool: 'margin', icon: margin, label: 'Margin', description: 'Change the margin around 1 or many selected elements' },
      p: { tool: 'padding', icon: padding, label: 'Padding', description: 'Change the padding around 1 or many selected elements' },
      // b: { tool: 'border', icon: border, label: 'Border', description: '' },
      a: { tool: 'align', icon: align, label: 'Flexbox Align', description: 'Quick alignment adjustments' },
      h: { tool: 'hueshift', icon: hueshift, label: 'Hue Shifter', description: 'Shift the brightness, saturation & hue' },
      d: { tool: 'boxshadow', icon: boxshadow, label: 'Shadow', description: 'Move or create a shadow' },
      // t: { tool: 'transform', icon: transform, label: '3D Transform', description: '' },
      f: { tool: 'font', icon: font, label: 'Font Styles', description: 'Change size, leading, kerning, & weights' },
      e: { tool: 'text', icon: type, label: 'Edit Text', description: 'Change any text on the page' },
      s: { tool: 'search', icon: search, label: 'Search', description: 'Select elements by searching for them' },
    };

    this.$shadow = this.attachShadow({mode: 'open'});
    this.$shadow.innerHTML = this.render();

    this.selectorEngine = Selectable();
  }

  connectedCallback() {
    $('li', this.$shadow).on('click', e => 
      this.toolSelected(e.currentTarget) && e.stopPropagation());

    this.foregroundPicker = $('#foreground', this.$shadow)[0];
    this.backgroundPicker = $('#background', this.$shadow)[0];

    // set colors
    this.foregroundPicker.on('input', e =>
      ChangeForeground($('[data-selected=true]'), e.target.value));

    this.backgroundPicker.on('input', e =>
      ChangeBackground($('[data-selected=true]'), e.target.value));

    // read colors
    this.selectorEngine.onSelectedUpdate(elements => {
      if (!elements.length) return

      if (elements.length >= 2) {
        this.foregroundPicker.value = null;
        this.backgroundPicker.value = null;
      }
      else {
        const FG = new TinyColor(getStyle(elements[0], 'color'));
        const BG = new TinyColor(getStyle(elements[0], 'backgroundColor'));

        let fg = '#' + FG.toHex();
        let bg = '#' + BG.toHex();

        this.foregroundPicker.attr('value', (FG.originalInput == 'rgb(0, 0, 0)' && elements[0].textContent == '') ? '' : fg);
        this.backgroundPicker.attr('value', BG.originalInput == 'rgba(0, 0, 0, 0)' ? '' : bg);
      }
    });

    // toolbar hotkeys
    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => 
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0])));

    // initial selected node
    this.toolSelected($('[data-tool="inspector"]', this.$shadow)[0]);
  }

  disconnectedCallback() {}

  toolSelected(el) {
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0];

    if (this.active_tool) {
      this.active_tool.attr('data-active', null);
      this.deactivate_feature();
    }

    el.attr('data-active', true);
    this.active_tool = el;
    this[el.dataset.tool]();
  }

  render() {
    return `
      ${this.styles()}
      <ol>
        ${Object.entries(this.toolbar_model).reduce((list, [key, value]) => `
          ${list}
          <li aria-label="${value.label} Tool" aria-description="${value.description}" data-tool="${value.tool}" data-active="${key == 'i'}">${value.icon}</li>
        `,'')}
        <li></li>
        <li class="color" aria-label="Foreground">
          <input type="color" id='foreground' value=''>
        </li>
        <li class="color" aria-label="Background">
          <input type="color" id='background' value=''>
        </li>
      </ol>
    `
  }

  styles() {
    return `
      <style>
        :host {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 99998; 

          background: white;
          box-shadow: 0 0.25rem 0.5rem hsla(0,0%,0%,10%);

          --darkest-grey: hsl(0,0%,2%);
          --darker-grey: hsl(0,0%,5%);
          --dark-grey: hsl(0,0%,20%);
          --grey: hsl(0,0%,50%);
          --light-grey: hsl(0,0%,60%);
          --lighter-grey: hsl(0,0%,80%);
          --lightest-grey: hsl(0,0%,95%);
          --theme-color: hotpink;
        }

        :host > ol {
          margin: 0;
          padding: 0;
          list-style-type: none;

          display: flex;
          flex-direction: column;
        }

        :host li {
          height: 2.5rem;
          width: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        :host li:hover {
          cursor: pointer;
          background: hsl(0,0%,98%);
        }

        :host li:hover:after {
          content: attr(aria-label) "\\A" attr(aria-description);
          position: absolute;
          left: 100%;
          top: 0;
          z-index: -1;
          box-shadow: 0 0.1rem 0.1rem hsla(0,0%,0%,10%);
          height: 100%;
          display: inline-flex;
          align-items: center;
          padding: 0 0.5rem;
          background: hotpink;
          color: white;
          font-size: 0.8rem;
          white-space: pre;
        }

        :host li.color:hover:after {
          top: 0;
        }

        :host li[data-tool='align'] > svg {
          transform: rotateZ(90deg);
        }

        :host li[data-active=true] {
          background: hsl(0,0%,98%);
        }

        :host li[data-active=true] > svg:not(.icon-cursor) { 
          fill: var(--theme-color); 
        }

        :host li[data-active=true] > .icon-cursor { 
          stroke: var(--theme-color); 
        }

        :host li:empty {
          height: 0.25rem;
          background: hsl(0,0%,90%);
        }

        :host li.color {
          height: 20px;
        }

        :host li > svg {
          width: 50%;
          fill: var(--dark-grey);
        }

        :host li > svg.icon-cursor {
          width: 35%;
          fill: white;
          stroke: var(--dark-grey);
          stroke-width: 2px;
        }

        :host li[data-tool="search"] > .search {
          position: absolute;
          left: 100%;
          top: 0;
          height: 100%;
          z-index: 9999;
        }

        :host li[data-tool="search"] > .search > input {
          border: none;
          font-size: 1rem;
          padding: 0.4em;
          outline: none;
          height: 100%;
          width: 250px;
          box-sizing: border-box;
          caret-color: hotpink;
        }

        :host input[type='color'] {
          width: 100%;
          box-sizing: border-box;
          border: white;
        }

        :host input[type='color'][value='']::-webkit-color-swatch { 
          background-color: transparent !important; 
          background-image: linear-gradient(135deg, #ffffff 0%,#ffffff 46%,#ff0000 46%,#ff0000 64%,#ffffff 64%,#ffffff 100%);;
        }
      </style>
    `
  }

  move() {
    this.deactivate_feature = Moveable('[data-selected=true]');
  }

  margin() {
    this.deactivate_feature = Margin('[data-selected=true]'); 
  }

  padding() {
    this.deactivate_feature = Padding('[data-selected=true]'); 
  }

  font() {
    this.deactivate_feature = Font('[data-selected=true]');
  } 

  text() {
    this.selectorEngine.onSelectedUpdate(EditText);
    this.deactivate_feature = () => 
      this.selectorEngine.removeSelectedCallback(EditText);
  }

  align() {
    this.deactivate_feature = Flex('[data-selected=true]');
  }

  search() {
    this.deactivate_feature = Search(this.selectorEngine, $('[data-tool="search"]', this.$shadow));
  }

  boxshadow() {
    this.deactivate_feature = BoxShadow('[data-selected=true]');
  }

  hueshift() {
    this.deactivate_feature = HueShift('[data-selected=true]');
  }

  inspector() {
    this.deactivate_feature = MetaTip();
  }

  activeTool() {
    return this.active_tool.dataset.tool
  }
}

customElements.define('tool-pallete', ToolPallete);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYmxpbmdibGluZ2pzL3NyYy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9ob3RrZXlzLWpzL2Rpc3QvaG90a2V5cy5lc20uanMiLCIuLi9ub2RlX21vZHVsZXMvQGN0cmwvdGlueWNvbG9yL2J1bmRsZXMvdGlueWNvbG9yLmVzMjAxNS5qcyIsImNvbXBvbmVudHMvdG9vbHBhbGxldGUuaWNvbnMuanMiLCJmZWF0dXJlcy91dGlscy5qcyIsImZlYXR1cmVzL21hcmdpbi5qcyIsImZlYXR1cmVzL3RleHQuanMiLCJmZWF0dXJlcy9tb3ZlLmpzIiwiZmVhdHVyZXMvaW1hZ2Vzd2FwLmpzIiwiZmVhdHVyZXMvc2VsZWN0YWJsZS5qcyIsImZlYXR1cmVzL3BhZGRpbmcuanMiLCJmZWF0dXJlcy9mb250LmpzIiwiZmVhdHVyZXMvZmxleC5qcyIsImZlYXR1cmVzL3NlYXJjaC5qcyIsImZlYXR1cmVzL2NvbG9yLmpzIiwiZmVhdHVyZXMvbWV0YXRpcC5qcyIsImZlYXR1cmVzL2JveHNoYWRvdy5qcyIsImZlYXR1cmVzL2h1ZXNoaWZ0LmpzIiwiY29tcG9uZW50cy90b29scGFsbGV0ZS5lbGVtZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHN1Z2FyID0ge1xuICBvbjogZnVuY3Rpb24obmFtZXMsIGZuKSB7XG4gICAgbmFtZXNcbiAgICAgIC5zcGxpdCgnICcpXG4gICAgICAuZm9yRWFjaChuYW1lID0+XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmbikpXG4gICAgcmV0dXJuIHRoaXNcbiAgfSxcbiAgb2ZmOiBmdW5jdGlvbihuYW1lcywgZm4pIHtcbiAgICBuYW1lc1xuICAgICAgLnNwbGl0KCcgJylcbiAgICAgIC5mb3JFYWNoKG5hbWUgPT5cbiAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGZuKSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuICBhdHRyOiBmdW5jdGlvbihhdHRyLCB2YWwpIHtcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShhdHRyKVxuXG4gICAgdmFsID09IG51bGxcbiAgICAgID8gdGhpcy5yZW1vdmVBdHRyaWJ1dGUoYXR0cilcbiAgICAgIDogdGhpcy5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsIHx8ICcnKVxuICAgICAgXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAkKHF1ZXJ5LCAkY29udGV4dCA9IGRvY3VtZW50KSB7XG4gIGxldCAkbm9kZXMgPSBxdWVyeSBpbnN0YW5jZW9mIE5vZGVMaXN0XG4gICAgPyBxdWVyeVxuICAgIDogcXVlcnkgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCBcbiAgICAgID8gW3F1ZXJ5XVxuICAgICAgOiAkY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KVxuXG4gIGlmICghJG5vZGVzLmxlbmd0aCkgJG5vZGVzID0gW11cblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihcbiAgICBbLi4uJG5vZGVzXS5tYXAoJGVsID0+IE9iamVjdC5hc3NpZ24oJGVsLCBzdWdhcikpLCBcbiAgICB7XG4gICAgICBvbjogZnVuY3Rpb24obmFtZXMsIGZuKSB7XG4gICAgICAgIHRoaXMuZm9yRWFjaCgkZWwgPT4gJGVsLm9uKG5hbWVzLCBmbikpXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9LFxuICAgICAgb2ZmOiBmdW5jdGlvbihuYW1lcywgZm4pIHtcbiAgICAgICAgdGhpcy5mb3JFYWNoKCRlbCA9PiAkZWwub2ZmKG5hbWVzLCBmbikpXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9LFxuICAgICAgYXR0cjogZnVuY3Rpb24oYXR0cnMsIHZhbCkge1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJzID09PSAnc3RyaW5nJyAmJiB2YWwgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICByZXR1cm4gdGhpc1swXS5hdHRyKGF0dHJzKVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBhdHRycyA9PT0gJ29iamVjdCcpIFxuICAgICAgICAgIHRoaXMuZm9yRWFjaCgkZWwgPT5cbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGF0dHJzKVxuICAgICAgICAgICAgICAuZm9yRWFjaCgoW2tleSwgdmFsXSkgPT5cbiAgICAgICAgICAgICAgICAkZWwuYXR0cihrZXksIHZhbCkpKVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBhdHRycyA9PSAnc3RyaW5nJyAmJiAodmFsIHx8IHZhbCA9PSBudWxsIHx8IHZhbCA9PSAnJykpXG4gICAgICAgICAgdGhpcy5mb3JFYWNoKCRlbCA9PiAkZWwuYXR0cihhdHRycywgdmFsKSlcblxuICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgfVxuICAgIH1cbiAgKVxufSIsIi8qIVxuICogaG90a2V5cy1qcyB2My4zLjVcbiAqIEEgc2ltcGxlIG1pY3JvLWxpYnJhcnkgZm9yIGRlZmluaW5nIGFuZCBkaXNwYXRjaGluZyBrZXlib2FyZCBzaG9ydGN1dHMuIEl0IGhhcyBubyBkZXBlbmRlbmNpZXMuXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxOCBrZW5ueSB3b25nIDx3b3dvaG9vQHFxLmNvbT5cbiAqIGh0dHA6Ly9qYXl3Y2psb3ZlLmdpdGh1Yi5pby9ob3RrZXlzXG4gKiBcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG52YXIgaXNmZiA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnID8gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IDAgOiBmYWxzZTtcblxuLy8g57uR5a6a5LqL5Lu2XG5mdW5jdGlvbiBhZGRFdmVudChvYmplY3QsIGV2ZW50LCBtZXRob2QpIHtcbiAgaWYgKG9iamVjdC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgb2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIG1ldGhvZCwgZmFsc2UpO1xuICB9IGVsc2UgaWYgKG9iamVjdC5hdHRhY2hFdmVudCkge1xuICAgIG9iamVjdC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1ldGhvZCh3aW5kb3cuZXZlbnQpO1xuICAgIH0pO1xuICB9XG59XG5cbi8vIOS/rumlsOmUrui9rOaNouaIkOWvueW6lOeahOmUrueggVxuZnVuY3Rpb24gZ2V0TW9kcyhtb2RpZmllciwga2V5KSB7XG4gIHZhciBtb2RzID0ga2V5LnNsaWNlKDAsIGtleS5sZW5ndGggLSAxKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgbW9kc1tpXSA9IG1vZGlmaWVyW21vZHNbaV0udG9Mb3dlckNhc2UoKV07XG4gIH1yZXR1cm4gbW9kcztcbn1cblxuLy8g5aSE55CG5Lyg55qEa2V55a2X56ym5Liy6L2s5o2i5oiQ5pWw57uEXG5mdW5jdGlvbiBnZXRLZXlzKGtleSkge1xuICBpZiAoIWtleSkga2V5ID0gJyc7XG5cbiAga2V5ID0ga2V5LnJlcGxhY2UoL1xccy9nLCAnJyk7IC8vIOWMuemFjeS7u+S9leepuueZveWtl+espizljIXmi6znqbrmoLzjgIHliLbooajnrKbjgIHmjaLpobXnrKbnrYnnrYlcbiAgdmFyIGtleXMgPSBrZXkuc3BsaXQoJywnKTsgLy8g5ZCM5pe26K6+572u5aSa5Liq5b+r5o236ZSu77yM5LulJywn5YiG5YmyXG4gIHZhciBpbmRleCA9IGtleXMubGFzdEluZGV4T2YoJycpO1xuXG4gIC8vIOW/q+aNt+mUruWPr+iDveWMheWQqycsJ++8jOmcgOeJueauiuWkhOeQhlxuICBmb3IgKDsgaW5kZXggPj0gMDspIHtcbiAgICBrZXlzW2luZGV4IC0gMV0gKz0gJywnO1xuICAgIGtleXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICBpbmRleCA9IGtleXMubGFzdEluZGV4T2YoJycpO1xuICB9XG5cbiAgcmV0dXJuIGtleXM7XG59XG5cbi8vIOavlOi+g+S/rumlsOmUrueahOaVsOe7hFxuZnVuY3Rpb24gY29tcGFyZUFycmF5KGExLCBhMikge1xuICB2YXIgYXJyMSA9IGExLmxlbmd0aCA+PSBhMi5sZW5ndGggPyBhMSA6IGEyO1xuICB2YXIgYXJyMiA9IGExLmxlbmd0aCA+PSBhMi5sZW5ndGggPyBhMiA6IGExO1xuICB2YXIgaXNJbmRleCA9IHRydWU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIxLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGFycjIuaW5kZXhPZihhcnIxW2ldKSA9PT0gLTEpIGlzSW5kZXggPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gaXNJbmRleDtcbn1cblxudmFyIF9rZXlNYXAgPSB7IC8vIOeJueauiumUrlxuICBiYWNrc3BhY2U6IDgsXG4gIHRhYjogOSxcbiAgY2xlYXI6IDEyLFxuICBlbnRlcjogMTMsXG4gIHJldHVybjogMTMsXG4gIGVzYzogMjcsXG4gIGVzY2FwZTogMjcsXG4gIHNwYWNlOiAzMixcbiAgbGVmdDogMzcsXG4gIHVwOiAzOCxcbiAgcmlnaHQ6IDM5LFxuICBkb3duOiA0MCxcbiAgZGVsOiA0NixcbiAgZGVsZXRlOiA0NixcbiAgaW5zOiA0NSxcbiAgaW5zZXJ0OiA0NSxcbiAgaG9tZTogMzYsXG4gIGVuZDogMzUsXG4gIHBhZ2V1cDogMzMsXG4gIHBhZ2Vkb3duOiAzNCxcbiAgY2Fwc2xvY2s6IDIwLFxuICAn4oeqJzogMjAsXG4gICcsJzogMTg4LFxuICAnLic6IDE5MCxcbiAgJy8nOiAxOTEsXG4gICdgJzogMTkyLFxuICAnLSc6IGlzZmYgPyAxNzMgOiAxODksXG4gICc9JzogaXNmZiA/IDYxIDogMTg3LFxuICAnOyc6IGlzZmYgPyA1OSA6IDE4NixcbiAgJ1xcJyc6IDIyMixcbiAgJ1snOiAyMTksXG4gICddJzogMjIxLFxuICAnXFxcXCc6IDIyMFxufTtcblxudmFyIF9tb2RpZmllciA9IHsgLy8g5L+u6aWw6ZSuXG4gICfih6cnOiAxNixcbiAgc2hpZnQ6IDE2LFxuICAn4oylJzogMTgsXG4gIGFsdDogMTgsXG4gIG9wdGlvbjogMTgsXG4gICfijIMnOiAxNyxcbiAgY3RybDogMTcsXG4gIGNvbnRyb2w6IDE3LFxuICAn4oyYJzogaXNmZiA/IDIyNCA6IDkxLFxuICBjbWQ6IGlzZmYgPyAyMjQgOiA5MSxcbiAgY29tbWFuZDogaXNmZiA/IDIyNCA6IDkxXG59O1xudmFyIF9kb3duS2V5cyA9IFtdOyAvLyDorrDlvZXmkYHkuIvnmoTnu5HlrprplK5cbnZhciBtb2RpZmllck1hcCA9IHtcbiAgMTY6ICdzaGlmdEtleScsXG4gIDE4OiAnYWx0S2V5JyxcbiAgMTc6ICdjdHJsS2V5J1xufTtcbnZhciBfbW9kcyA9IHsgMTY6IGZhbHNlLCAxODogZmFsc2UsIDE3OiBmYWxzZSB9O1xudmFyIF9oYW5kbGVycyA9IHt9O1xuXG4vLyBGMX5GMTIg54m55q6K6ZSuXG5mb3IgKHZhciBrID0gMTsgayA8IDIwOyBrKyspIHtcbiAgX2tleU1hcFsnZicgKyBrXSA9IDExMSArIGs7XG59XG5cbi8vIOWFvOWuuUZpcmVmb3jlpITnkIZcbm1vZGlmaWVyTWFwW2lzZmYgPyAyMjQgOiA5MV0gPSAnbWV0YUtleSc7XG5fbW9kc1tpc2ZmID8gMjI0IDogOTFdID0gZmFsc2U7XG5cbnZhciBfc2NvcGUgPSAnYWxsJzsgLy8g6buY6K6k54Ot6ZSu6IyD5Zu0XG52YXIgaXNCaW5kRWxlbWVudCA9IGZhbHNlOyAvLyDmmK/lkKbnu5HlrproioLngrlcblxuLy8g6L+U5Zue6ZSu56CBXG52YXIgY29kZSA9IGZ1bmN0aW9uIGNvZGUoeCkge1xuICByZXR1cm4gX2tleU1hcFt4LnRvTG93ZXJDYXNlKCldIHx8IHgudG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApO1xufTtcblxuLy8g6K6+572u6I635Y+W5b2T5YmN6IyD5Zu077yI6buY6K6k5Li6J+aJgOaciSfvvIlcbmZ1bmN0aW9uIHNldFNjb3BlKHNjb3BlKSB7XG4gIF9zY29wZSA9IHNjb3BlIHx8ICdhbGwnO1xufVxuLy8g6I635Y+W5b2T5YmN6IyD5Zu0XG5mdW5jdGlvbiBnZXRTY29wZSgpIHtcbiAgcmV0dXJuIF9zY29wZSB8fCAnYWxsJztcbn1cbi8vIOiOt+WPluaRgeS4i+e7keWumumUrueahOmUruWAvFxuZnVuY3Rpb24gZ2V0UHJlc3NlZEtleUNvZGVzKCkge1xuICByZXR1cm4gX2Rvd25LZXlzLnNsaWNlKDApO1xufVxuXG4vLyDooajljZXmjqfku7bmjqfku7bliKTmlq0g6L+U5ZueIEJvb2xlYW5cbmZ1bmN0aW9uIGZpbHRlcihldmVudCkge1xuICB2YXIgdGFnTmFtZSA9IGV2ZW50LnRhcmdldC50YWdOYW1lIHx8IGV2ZW50LnNyY0VsZW1lbnQudGFnTmFtZTtcbiAgLy8g5b+955Wl6L+Z5Lqb5qCH562+5oOF5Ya15LiL5b+r5o236ZSu5peg5pWIXG4gIHJldHVybiAhKHRhZ05hbWUgPT09ICdJTlBVVCcgfHwgdGFnTmFtZSA9PT0gJ1NFTEVDVCcgfHwgdGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyk7XG59XG5cbi8vIOWIpOaWreaRgeS4i+eahOmUruaYr+WQpuS4uuafkOS4qumUru+8jOi/lOWbnnRydWXmiJbogIVmYWxzZVxuZnVuY3Rpb24gaXNQcmVzc2VkKGtleUNvZGUpIHtcbiAgaWYgKHR5cGVvZiBrZXlDb2RlID09PSAnc3RyaW5nJykge1xuICAgIGtleUNvZGUgPSBjb2RlKGtleUNvZGUpOyAvLyDovazmjaLmiJDplK7noIFcbiAgfVxuICByZXR1cm4gX2Rvd25LZXlzLmluZGV4T2Yoa2V5Q29kZSkgIT09IC0xO1xufVxuXG4vLyDlvqrnjq/liKDpmaRoYW5kbGVyc+S4reeahOaJgOaciSBzY29wZSjojIPlm7QpXG5mdW5jdGlvbiBkZWxldGVTY29wZShzY29wZSwgbmV3U2NvcGUpIHtcbiAgdmFyIGhhbmRsZXJzID0gdm9pZCAwO1xuICB2YXIgaSA9IHZvaWQgMDtcblxuICAvLyDmsqHmnInmjIflrppzY29wZe+8jOiOt+WPlnNjb3BlXG4gIGlmICghc2NvcGUpIHNjb3BlID0gZ2V0U2NvcGUoKTtcblxuICBmb3IgKHZhciBrZXkgaW4gX2hhbmRsZXJzKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChfaGFuZGxlcnMsIGtleSkpIHtcbiAgICAgIGhhbmRsZXJzID0gX2hhbmRsZXJzW2tleV07XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOykge1xuICAgICAgICBpZiAoaGFuZGxlcnNbaV0uc2NvcGUgPT09IHNjb3BlKSBoYW5kbGVycy5zcGxpY2UoaSwgMSk7ZWxzZSBpKys7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8g5aaC5p6cc2NvcGXooqvliKDpmaTvvIzlsIZzY29wZemHjee9ruS4umFsbFxuICBpZiAoZ2V0U2NvcGUoKSA9PT0gc2NvcGUpIHNldFNjb3BlKG5ld1Njb3BlIHx8ICdhbGwnKTtcbn1cblxuLy8g5riF6Zmk5L+u6aWw6ZSuXG5mdW5jdGlvbiBjbGVhck1vZGlmaWVyKGV2ZW50KSB7XG4gIHZhciBrZXkgPSBldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoIHx8IGV2ZW50LmNoYXJDb2RlO1xuICB2YXIgaSA9IF9kb3duS2V5cy5pbmRleE9mKGtleSk7XG5cbiAgLy8g5LuO5YiX6KGo5Lit5riF6Zmk5oyJ5Y6L6L+H55qE6ZSuXG4gIGlmIChpID49IDApIF9kb3duS2V5cy5zcGxpY2UoaSwgMSk7XG5cbiAgLy8g5L+u6aWw6ZSuIHNoaWZ0S2V5IGFsdEtleSBjdHJsS2V5IChjb21tYW5kfHxtZXRhS2V5KSDmuIXpmaRcbiAgaWYgKGtleSA9PT0gOTMgfHwga2V5ID09PSAyMjQpIGtleSA9IDkxO1xuICBpZiAoa2V5IGluIF9tb2RzKSB7XG4gICAgX21vZHNba2V5XSA9IGZhbHNlO1xuXG4gICAgLy8g5bCG5L+u6aWw6ZSu6YeN572u5Li6ZmFsc2VcbiAgICBmb3IgKHZhciBrIGluIF9tb2RpZmllcikge1xuICAgICAgaWYgKF9tb2RpZmllcltrXSA9PT0ga2V5KSBob3RrZXlzW2tdID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8vIOino+mZpOe7keWumuafkOS4quiMg+WbtOeahOW/q+aNt+mUrlxuZnVuY3Rpb24gdW5iaW5kKGtleSwgc2NvcGUpIHtcbiAgdmFyIG11bHRpcGxlS2V5cyA9IGdldEtleXMoa2V5KTtcbiAgdmFyIGtleXMgPSB2b2lkIDA7XG4gIHZhciBtb2RzID0gW107XG4gIHZhciBvYmogPSB2b2lkIDA7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdWx0aXBsZUtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyDlsIbnu4TlkIjlv6vmjbfplK7mi4bliIbkuLrmlbDnu4RcbiAgICBrZXlzID0gbXVsdGlwbGVLZXlzW2ldLnNwbGl0KCcrJyk7XG5cbiAgICAvLyDorrDlvZXmr4/kuKrnu4TlkIjplK7kuK3nmoTkv67ppbDplK7nmoTplK7noIEg6L+U5Zue5pWw57uEXG4gICAgaWYgKGtleXMubGVuZ3RoID4gMSkgbW9kcyA9IGdldE1vZHMoX21vZGlmaWVyLCBrZXlzKTtcblxuICAgIC8vIOiOt+WPlumZpOS/rumlsOmUruWklueahOmUruWAvGtleVxuICAgIGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgICBrZXkgPSBrZXkgPT09ICcqJyA/ICcqJyA6IGNvZGUoa2V5KTtcblxuICAgIC8vIOWIpOaWreaYr+WQpuS8oOWFpeiMg+WbtO+8jOayoeacieWwseiOt+WPluiMg+WbtFxuICAgIGlmICghc2NvcGUpIHNjb3BlID0gZ2V0U2NvcGUoKTtcblxuICAgIC8vIOWmguS9lWtleeS4jeWcqCBfaGFuZGxlcnMg5Lit6L+U5Zue5LiN5YGa5aSE55CGXG4gICAgaWYgKCFfaGFuZGxlcnNba2V5XSkgcmV0dXJuO1xuXG4gICAgLy8g5riF56m6IGhhbmRsZXJzIOS4reaVsOaNru+8jFxuICAgIC8vIOiuqeinpuWPkeW/q+aNt+mUrumUruS5i+WQjuayoeacieS6i+S7tuaJp+ihjOWIsOi+vuino+mZpOW/q+aNt+mUrue7keWumueahOebrueahFxuICAgIGZvciAodmFyIHIgPSAwOyByIDwgX2hhbmRsZXJzW2tleV0ubGVuZ3RoOyByKyspIHtcbiAgICAgIG9iaiA9IF9oYW5kbGVyc1trZXldW3JdO1xuICAgICAgLy8g5Yik5pat5piv5ZCm5Zyo6IyD5Zu05YaF5bm25LiU6ZSu5YC855u45ZCMXG4gICAgICBpZiAob2JqLnNjb3BlID09PSBzY29wZSAmJiBjb21wYXJlQXJyYXkob2JqLm1vZHMsIG1vZHMpKSB7XG4gICAgICAgIF9oYW5kbGVyc1trZXldW3JdID0ge307XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIOWvueebkeWQrOWvueW6lOW/q+aNt+mUrueahOWbnuiwg+WHveaVsOi/m+ihjOWkhOeQhlxuZnVuY3Rpb24gZXZlbnRIYW5kbGVyKGV2ZW50LCBoYW5kbGVyLCBzY29wZSkge1xuICB2YXIgbW9kaWZpZXJzTWF0Y2ggPSB2b2lkIDA7XG5cbiAgLy8g55yL5a6D5piv5ZCm5Zyo5b2T5YmN6IyD5Zu0XG4gIGlmIChoYW5kbGVyLnNjb3BlID09PSBzY29wZSB8fCBoYW5kbGVyLnNjb3BlID09PSAnYWxsJykge1xuICAgIC8vIOajgOafpeaYr+WQpuWMuemFjeS/rumlsOespu+8iOWmguaenOaciei/lOWbnnRydWXvvIlcbiAgICBtb2RpZmllcnNNYXRjaCA9IGhhbmRsZXIubW9kcy5sZW5ndGggPiAwO1xuXG4gICAgZm9yICh2YXIgeSBpbiBfbW9kcykge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChfbW9kcywgeSkpIHtcbiAgICAgICAgaWYgKCFfbW9kc1t5XSAmJiBoYW5kbGVyLm1vZHMuaW5kZXhPZigreSkgPiAtMSB8fCBfbW9kc1t5XSAmJiBoYW5kbGVyLm1vZHMuaW5kZXhPZigreSkgPT09IC0xKSBtb2RpZmllcnNNYXRjaCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIOiwg+eUqOWkhOeQhueoi+W6j++8jOWmguaenOaYr+S/rumlsOmUruS4jeWBmuWkhOeQhlxuICAgIGlmIChoYW5kbGVyLm1vZHMubGVuZ3RoID09PSAwICYmICFfbW9kc1sxNl0gJiYgIV9tb2RzWzE4XSAmJiAhX21vZHNbMTddICYmICFfbW9kc1s5MV0gfHwgbW9kaWZpZXJzTWF0Y2ggfHwgaGFuZGxlci5zaG9ydGN1dCA9PT0gJyonKSB7XG4gICAgICBpZiAoaGFuZGxlci5tZXRob2QoZXZlbnQsIGhhbmRsZXIpID09PSBmYWxzZSkge1xuICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7ZWxzZSBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICBpZiAoZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgaWYgKGV2ZW50LmNhbmNlbEJ1YmJsZSkgZXZlbnQuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8g5aSE55CGa2V5ZG93buS6i+S7tlxuZnVuY3Rpb24gZGlzcGF0Y2goZXZlbnQpIHtcbiAgdmFyIGFzdGVyaXNrID0gX2hhbmRsZXJzWycqJ107XG4gIHZhciBrZXkgPSBldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoIHx8IGV2ZW50LmNoYXJDb2RlO1xuXG4gIC8vIOaQnOmbhue7keWumueahOmUrlxuICBpZiAoX2Rvd25LZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpIF9kb3duS2V5cy5wdXNoKGtleSk7XG5cbiAgLy8gR2Vja28oRmlyZWZveCnnmoRjb21tYW5k6ZSu5YC8MjI077yM5ZyoV2Via2l0KENocm9tZSnkuK3kv53mjIHkuIDoh7RcbiAgLy8gV2Via2l05bem5Y+zY29tbWFuZOmUruWAvOS4jeS4gOagt1xuICBpZiAoa2V5ID09PSA5MyB8fCBrZXkgPT09IDIyNCkga2V5ID0gOTE7XG5cbiAgaWYgKGtleSBpbiBfbW9kcykge1xuICAgIF9tb2RzW2tleV0gPSB0cnVlO1xuXG4gICAgLy8g5bCG54m55q6K5a2X56ym55qEa2V55rOo5YaM5YiwIGhvdGtleXMg5LiKXG4gICAgZm9yICh2YXIgayBpbiBfbW9kaWZpZXIpIHtcbiAgICAgIGlmIChfbW9kaWZpZXJba10gPT09IGtleSkgaG90a2V5c1trXSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFhc3RlcmlzaykgcmV0dXJuO1xuICB9XG5cbiAgLy8g5bCGbW9kaWZpZXJNYXDph4zpnaLnmoTkv67ppbDplK7nu5HlrprliLBldmVudOS4rVxuICBmb3IgKHZhciBlIGluIF9tb2RzKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChfbW9kcywgZSkpIHtcbiAgICAgIF9tb2RzW2VdID0gZXZlbnRbbW9kaWZpZXJNYXBbZV1dO1xuICAgIH1cbiAgfVxuXG4gIC8vIOihqOWNleaOp+S7tui/h+a7pCDpu5jorqTooajljZXmjqfku7bkuI3op6blj5Hlv6vmjbfplK5cbiAgaWYgKCFob3RrZXlzLmZpbHRlci5jYWxsKHRoaXMsIGV2ZW50KSkgcmV0dXJuO1xuXG4gIC8vIOiOt+WPluiMg+WbtCDpu5jorqTkuLphbGxcbiAgdmFyIHNjb3BlID0gZ2V0U2NvcGUoKTtcblxuICAvLyDlr7nku7vkvZXlv6vmjbfplK7pg73pnIDopoHlgZrnmoTlpITnkIZcbiAgaWYgKGFzdGVyaXNrKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhc3Rlcmlzay5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFzdGVyaXNrW2ldLnNjb3BlID09PSBzY29wZSkgZXZlbnRIYW5kbGVyKGV2ZW50LCBhc3Rlcmlza1tpXSwgc2NvcGUpO1xuICAgIH1cbiAgfVxuICAvLyBrZXkg5LiN5ZyoX2hhbmRsZXJz5Lit6L+U5ZueXG4gIGlmICghKGtleSBpbiBfaGFuZGxlcnMpKSByZXR1cm47XG5cbiAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IF9oYW5kbGVyc1trZXldLmxlbmd0aDsgX2krKykge1xuICAgIC8vIOaJvuWIsOWkhOeQhuWGheWuuVxuICAgIGV2ZW50SGFuZGxlcihldmVudCwgX2hhbmRsZXJzW2tleV1bX2ldLCBzY29wZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaG90a2V5cyhrZXksIG9wdGlvbiwgbWV0aG9kKSB7XG4gIHZhciBrZXlzID0gZ2V0S2V5cyhrZXkpOyAvLyDpnIDopoHlpITnkIbnmoTlv6vmjbfplK7liJfooahcbiAgdmFyIG1vZHMgPSBbXTtcbiAgdmFyIHNjb3BlID0gJ2FsbCc7IC8vIHNjb3Bl6buY6K6k5Li6YWxs77yM5omA5pyJ6IyD5Zu06YO95pyJ5pWIXG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQ7IC8vIOW/q+aNt+mUruS6i+S7tue7keWumuiKgueCuVxuICB2YXIgaSA9IDA7XG5cbiAgLy8g5a+55Li66K6+5a6a6IyD5Zu055qE5Yik5patXG4gIGlmIChtZXRob2QgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgbWV0aG9kID0gb3B0aW9uO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvcHRpb24pID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgIGlmIChvcHRpb24uc2NvcGUpIHNjb3BlID0gb3B0aW9uLnNjb3BlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgaWYgKG9wdGlvbi5lbGVtZW50KSBlbGVtZW50ID0gb3B0aW9uLmVsZW1lbnQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykgc2NvcGUgPSBvcHRpb247XG5cbiAgLy8g5a+55LqO5q+P5Liq5b+r5o236ZSu6L+b6KGM5aSE55CGXG4gIGZvciAoOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGtleSA9IGtleXNbaV0uc3BsaXQoJysnKTsgLy8g5oyJ6ZSu5YiX6KGoXG4gICAgbW9kcyA9IFtdO1xuXG4gICAgLy8g5aaC5p6c5piv57uE5ZCI5b+r5o236ZSu5Y+W5b6X57uE5ZCI5b+r5o236ZSuXG4gICAgaWYgKGtleS5sZW5ndGggPiAxKSBtb2RzID0gZ2V0TW9kcyhfbW9kaWZpZXIsIGtleSk7XG5cbiAgICAvLyDlsIbpnZ7kv67ppbDplK7ovazljJbkuLrplK7noIFcbiAgICBrZXkgPSBrZXlba2V5Lmxlbmd0aCAtIDFdO1xuICAgIGtleSA9IGtleSA9PT0gJyonID8gJyonIDogY29kZShrZXkpOyAvLyAq6KGo56S65Yy56YWN5omA5pyJ5b+r5o236ZSuXG5cbiAgICAvLyDliKTmlq1rZXnmmK/lkKblnKhfaGFuZGxlcnPkuK3vvIzkuI3lnKjlsLHotYvkuIDkuKrnqbrmlbDnu4RcbiAgICBpZiAoIShrZXkgaW4gX2hhbmRsZXJzKSkgX2hhbmRsZXJzW2tleV0gPSBbXTtcblxuICAgIF9oYW5kbGVyc1trZXldLnB1c2goe1xuICAgICAgc2NvcGU6IHNjb3BlLFxuICAgICAgbW9kczogbW9kcyxcbiAgICAgIHNob3J0Y3V0OiBrZXlzW2ldLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBrZXk6IGtleXNbaV1cbiAgICB9KTtcbiAgfVxuICAvLyDlnKjlhajlsYBkb2N1bWVudOS4iuiuvue9ruW/q+aNt+mUrlxuICBpZiAodHlwZW9mIGVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmICFpc0JpbmRFbGVtZW50KSB7XG4gICAgaXNCaW5kRWxlbWVudCA9IHRydWU7XG4gICAgYWRkRXZlbnQoZWxlbWVudCwgJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgZGlzcGF0Y2goZSk7XG4gICAgfSk7XG4gICAgYWRkRXZlbnQoZWxlbWVudCwgJ2tleXVwJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNsZWFyTW9kaWZpZXIoZSk7XG4gICAgfSk7XG4gIH1cbn1cblxudmFyIF9hcGkgPSB7XG4gIHNldFNjb3BlOiBzZXRTY29wZSxcbiAgZ2V0U2NvcGU6IGdldFNjb3BlLFxuICBkZWxldGVTY29wZTogZGVsZXRlU2NvcGUsXG4gIGdldFByZXNzZWRLZXlDb2RlczogZ2V0UHJlc3NlZEtleUNvZGVzLFxuICBpc1ByZXNzZWQ6IGlzUHJlc3NlZCxcbiAgZmlsdGVyOiBmaWx0ZXIsXG4gIHVuYmluZDogdW5iaW5kXG59O1xuZm9yICh2YXIgYSBpbiBfYXBpKSB7XG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoX2FwaSwgYSkpIHtcbiAgICBob3RrZXlzW2FdID0gX2FwaVthXTtcbiAgfVxufVxuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgdmFyIF9ob3RrZXlzID0gd2luZG93LmhvdGtleXM7XG4gIGhvdGtleXMubm9Db25mbGljdCA9IGZ1bmN0aW9uIChkZWVwKSB7XG4gICAgaWYgKGRlZXAgJiYgd2luZG93LmhvdGtleXMgPT09IGhvdGtleXMpIHtcbiAgICAgIHdpbmRvdy5ob3RrZXlzID0gX2hvdGtleXM7XG4gICAgfVxuICAgIHJldHVybiBob3RrZXlzO1xuICB9O1xuICB3aW5kb3cuaG90a2V5cyA9IGhvdGtleXM7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGhvdGtleXM7XG4iLCIvKipcbiAqIFRha2UgaW5wdXQgZnJvbSBbMCwgbl0gYW5kIHJldHVybiBpdCBhcyBbMCwgMV1cbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gYm91bmQwMShuLCBtYXgpIHtcbiAgICBpZiAoaXNPbmVQb2ludFplcm8obikpIHtcbiAgICAgICAgbiA9ICcxMDAlJztcbiAgICB9XG4gICAgY29uc3QgcHJvY2Vzc1BlcmNlbnQgPSBpc1BlcmNlbnRhZ2Uobik7XG4gICAgbiA9IG1heCA9PT0gMzYwID8gbiA6IE1hdGgubWluKG1heCwgTWF0aC5tYXgoMCwgcGFyc2VGbG9hdChuKSkpO1xuICAgIC8vIEF1dG9tYXRpY2FsbHkgY29udmVydCBwZXJjZW50YWdlIGludG8gbnVtYmVyXG4gICAgaWYgKHByb2Nlc3NQZXJjZW50KSB7XG4gICAgICAgIG4gPSBwYXJzZUludChTdHJpbmcobiAqIG1heCksIDEwKSAvIDEwMDtcbiAgICB9XG4gICAgLy8gSGFuZGxlIGZsb2F0aW5nIHBvaW50IHJvdW5kaW5nIGVycm9yc1xuICAgIGlmIChNYXRoLmFicyhuIC0gbWF4KSA8IDAuMDAwMDAxKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICAvLyBDb252ZXJ0IGludG8gWzAsIDFdIHJhbmdlIGlmIGl0IGlzbid0IGFscmVhZHlcbiAgICBpZiAobWF4ID09PSAzNjApIHtcbiAgICAgICAgLy8gSWYgbiBpcyBhIGh1ZSBnaXZlbiBpbiBkZWdyZWVzLFxuICAgICAgICAvLyB3cmFwIGFyb3VuZCBvdXQtb2YtcmFuZ2UgdmFsdWVzIGludG8gWzAsIDM2MF0gcmFuZ2VcbiAgICAgICAgLy8gdGhlbiBjb252ZXJ0IGludG8gWzAsIDFdLlxuICAgICAgICBuID0gKG4gPCAwID8gbiAlIG1heCArIG1heCA6IG4gJSBtYXgpIC8gcGFyc2VGbG9hdChTdHJpbmcobWF4KSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyBJZiBuIG5vdCBhIGh1ZSBnaXZlbiBpbiBkZWdyZWVzXG4gICAgICAgIC8vIENvbnZlcnQgaW50byBbMCwgMV0gcmFuZ2UgaWYgaXQgaXNuJ3QgYWxyZWFkeS5cbiAgICAgICAgbiA9IChuICUgbWF4KSAvIHBhcnNlRmxvYXQoU3RyaW5nKG1heCkpO1xuICAgIH1cbiAgICByZXR1cm4gbjtcbn1cbi8qKlxuICogRm9yY2UgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGNsYW1wMDEodmFsKSB7XG4gICAgcmV0dXJuIE1hdGgubWluKDEsIE1hdGgubWF4KDAsIHZhbCkpO1xufVxuLyoqXG4gKiBOZWVkIHRvIGhhbmRsZSAxLjAgYXMgMTAwJSwgc2luY2Ugb25jZSBpdCBpcyBhIG51bWJlciwgdGhlcmUgaXMgbm8gZGlmZmVyZW5jZSBiZXR3ZWVuIGl0IGFuZCAxXG4gKiA8aHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83NDIyMDcyL2phdmFzY3JpcHQtaG93LXRvLWRldGVjdC1udW1iZXItYXMtYS1kZWNpbWFsLWluY2x1ZGluZy0xLTA+XG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGlzT25lUG9pbnRaZXJvKG4pIHtcbiAgICByZXR1cm4gdHlwZW9mIG4gPT09ICdzdHJpbmcnICYmIG4uaW5kZXhPZignLicpICE9PSAtMSAmJiBwYXJzZUZsb2F0KG4pID09PSAxO1xufVxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgc3RyaW5nIHBhc3NlZCBpbiBpcyBhIHBlcmNlbnRhZ2VcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gaXNQZXJjZW50YWdlKG4pIHtcbiAgICByZXR1cm4gdHlwZW9mIG4gPT09ICdzdHJpbmcnICYmIG4uaW5kZXhPZignJScpICE9PSAtMTtcbn1cbi8qKlxuICogUmV0dXJuIGEgdmFsaWQgYWxwaGEgdmFsdWUgWzAsMV0gd2l0aCBhbGwgaW52YWxpZCB2YWx1ZXMgYmVpbmcgc2V0IHRvIDFcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gYm91bmRBbHBoYShhKSB7XG4gICAgYSA9IHBhcnNlRmxvYXQoYSk7XG4gICAgaWYgKGlzTmFOKGEpIHx8IGEgPCAwIHx8IGEgPiAxKSB7XG4gICAgICAgIGEgPSAxO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn1cbi8qKlxuICogUmVwbGFjZSBhIGRlY2ltYWwgd2l0aCBpdCdzIHBlcmNlbnRhZ2UgdmFsdWVcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gY29udmVydFRvUGVyY2VudGFnZShuKSB7XG4gICAgaWYgKG4gPD0gMSkge1xuICAgICAgICByZXR1cm4gK24gKiAxMDAgKyAnJSc7XG4gICAgfVxuICAgIHJldHVybiBuO1xufVxuLyoqXG4gKiBGb3JjZSBhIGhleCB2YWx1ZSB0byBoYXZlIDIgY2hhcmFjdGVyc1xuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBwYWQyKGMpIHtcbiAgICByZXR1cm4gYy5sZW5ndGggPT09IDEgPyAnMCcgKyBjIDogJycgKyBjO1xufVxuXG4vLyBgcmdiVG9Ic2xgLCBgcmdiVG9Ic3ZgLCBgaHNsVG9SZ2JgLCBgaHN2VG9SZ2JgIG1vZGlmaWVkIGZyb206XG4vLyA8aHR0cDovL21qaWphY2tzb24uY29tLzIwMDgvMDIvcmdiLXRvLWhzbC1hbmQtcmdiLXRvLWhzdi1jb2xvci1tb2RlbC1jb252ZXJzaW9uLWFsZ29yaXRobXMtaW4tamF2YXNjcmlwdD5cbi8qKlxuICogSGFuZGxlIGJvdW5kcyAvIHBlcmNlbnRhZ2UgY2hlY2tpbmcgdG8gY29uZm9ybSB0byBDU1MgY29sb3Igc3BlY1xuICogPGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtY29sb3IvPlxuICogKkFzc3VtZXM6KiByLCBnLCBiIGluIFswLCAyNTVdIG9yIFswLCAxXVxuICogKlJldHVybnM6KiB7IHIsIGcsIGIgfSBpbiBbMCwgMjU1XVxuICovXG5mdW5jdGlvbiByZ2JUb1JnYihyLCBnLCBiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcjogYm91bmQwMShyLCAyNTUpICogMjU1LFxuICAgICAgICBnOiBib3VuZDAxKGcsIDI1NSkgKiAyNTUsXG4gICAgICAgIGI6IGJvdW5kMDEoYiwgMjU1KSAqIDI1NSxcbiAgICB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSR0IgY29sb3IgdmFsdWUgdG8gSFNMLlxuICogKkFzc3VtZXM6KiByLCBnLCBhbmQgYiBhcmUgY29udGFpbmVkIGluIFswLCAyNTVdIG9yIFswLCAxXVxuICogKlJldHVybnM6KiB7IGgsIHMsIGwgfSBpbiBbMCwxXVxuICovXG5mdW5jdGlvbiByZ2JUb0hzbChyLCBnLCBiKSB7XG4gICAgciA9IGJvdW5kMDEociwgMjU1KTtcbiAgICBnID0gYm91bmQwMShnLCAyNTUpO1xuICAgIGIgPSBib3VuZDAxKGIsIDI1NSk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgbGV0IGggPSAwO1xuICAgIGxldCBzID0gMDtcbiAgICBjb25zdCBsID0gKG1heCArIG1pbikgLyAyO1xuICAgIGlmIChtYXggPT09IG1pbikge1xuICAgICAgICBoID0gcyA9IDA7IC8vIGFjaHJvbWF0aWNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IGQgPSBtYXggLSBtaW47XG4gICAgICAgIHMgPSBsID4gMC41ID8gZCAvICgyIC0gbWF4IC0gbWluKSA6IGQgLyAobWF4ICsgbWluKTtcbiAgICAgICAgc3dpdGNoIChtYXgpIHtcbiAgICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgICAgICBoID0gKGcgLSBiKSAvIGQgKyAoZyA8IGIgPyA2IDogMCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgICAgICAgaCA9IChiIC0gcikgLyBkICsgMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgYjpcbiAgICAgICAgICAgICAgICBoID0gKHIgLSBnKSAvIGQgKyA0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGggLz0gNjtcbiAgICB9XG4gICAgcmV0dXJuIHsgaCwgcywgbCB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBIU0wgY29sb3IgdmFsdWUgdG8gUkdCLlxuICpcbiAqICpBc3N1bWVzOiogaCBpcyBjb250YWluZWQgaW4gWzAsIDFdIG9yIFswLCAzNjBdIGFuZCBzIGFuZCBsIGFyZSBjb250YWluZWQgWzAsIDFdIG9yIFswLCAxMDBdXG4gKiAqUmV0dXJuczoqIHsgciwgZywgYiB9IGluIHRoZSBzZXQgWzAsIDI1NV1cbiAqL1xuZnVuY3Rpb24gaHNsVG9SZ2IoaCwgcywgbCkge1xuICAgIGxldCByO1xuICAgIGxldCBnO1xuICAgIGxldCBiO1xuICAgIGggPSBib3VuZDAxKGgsIDM2MCk7XG4gICAgcyA9IGJvdW5kMDEocywgMTAwKTtcbiAgICBsID0gYm91bmQwMShsLCAxMDApO1xuICAgIGZ1bmN0aW9uIGh1ZTJyZ2IocCwgcSwgdCkge1xuICAgICAgICBpZiAodCA8IDApXG4gICAgICAgICAgICB0ICs9IDE7XG4gICAgICAgIGlmICh0ID4gMSlcbiAgICAgICAgICAgIHQgLT0gMTtcbiAgICAgICAgaWYgKHQgPCAxIC8gNikge1xuICAgICAgICAgICAgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQgPCAxIC8gMikge1xuICAgICAgICAgICAgcmV0dXJuIHE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQgPCAyIC8gMykge1xuICAgICAgICAgICAgcmV0dXJuIHAgKyAocSAtIHApICogKDIgLyAzIC0gdCkgKiA2O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cbiAgICBpZiAocyA9PT0gMCkge1xuICAgICAgICByID0gZyA9IGIgPSBsOyAvLyBhY2hyb21hdGljXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBxID0gbCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogcztcbiAgICAgICAgY29uc3QgcCA9IDIgKiBsIC0gcTtcbiAgICAgICAgciA9IGh1ZTJyZ2IocCwgcSwgaCArIDEgLyAzKTtcbiAgICAgICAgZyA9IGh1ZTJyZ2IocCwgcSwgaCk7XG4gICAgICAgIGIgPSBodWUycmdiKHAsIHEsIGggLSAxIC8gMyk7XG4gICAgfVxuICAgIHJldHVybiB7IHI6IHIgKiAyNTUsIGc6IGcgKiAyNTUsIGI6IGIgKiAyNTUgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCIGNvbG9yIHZhbHVlIHRvIEhTVlxuICpcbiAqICpBc3N1bWVzOiogciwgZywgYW5kIGIgYXJlIGNvbnRhaW5lZCBpbiB0aGUgc2V0IFswLCAyNTVdIG9yIFswLCAxXVxuICogKlJldHVybnM6KiB7IGgsIHMsIHYgfSBpbiBbMCwxXVxuICovXG5mdW5jdGlvbiByZ2JUb0hzdihyLCBnLCBiKSB7XG4gICAgciA9IGJvdW5kMDEociwgMjU1KTtcbiAgICBnID0gYm91bmQwMShnLCAyNTUpO1xuICAgIGIgPSBib3VuZDAxKGIsIDI1NSk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgbGV0IGggPSAwO1xuICAgIGNvbnN0IHYgPSBtYXg7XG4gICAgY29uc3QgZCA9IG1heCAtIG1pbjtcbiAgICBjb25zdCBzID0gbWF4ID09PSAwID8gMCA6IGQgLyBtYXg7XG4gICAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgICAgIGggPSAwOyAvLyBhY2hyb21hdGljXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzd2l0Y2ggKG1heCkge1xuICAgICAgICAgICAgY2FzZSByOlxuICAgICAgICAgICAgICAgIGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgZzpcbiAgICAgICAgICAgICAgICBoID0gKGIgLSByKSAvIGQgKyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBiOlxuICAgICAgICAgICAgICAgIGggPSAociAtIGcpIC8gZCArIDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaCAvPSA2O1xuICAgIH1cbiAgICByZXR1cm4geyBoOiBoLCBzOiBzLCB2OiB2IH07XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIEhTViBjb2xvciB2YWx1ZSB0byBSR0IuXG4gKlxuICogKkFzc3VtZXM6KiBoIGlzIGNvbnRhaW5lZCBpbiBbMCwgMV0gb3IgWzAsIDM2MF0gYW5kIHMgYW5kIHYgYXJlIGNvbnRhaW5lZCBpbiBbMCwgMV0gb3IgWzAsIDEwMF1cbiAqICpSZXR1cm5zOiogeyByLCBnLCBiIH0gaW4gdGhlIHNldCBbMCwgMjU1XVxuICovXG5mdW5jdGlvbiBoc3ZUb1JnYihoLCBzLCB2KSB7XG4gICAgaCA9IGJvdW5kMDEoaCwgMzYwKSAqIDY7XG4gICAgcyA9IGJvdW5kMDEocywgMTAwKTtcbiAgICB2ID0gYm91bmQwMSh2LCAxMDApO1xuICAgIGNvbnN0IGkgPSBNYXRoLmZsb29yKGgpO1xuICAgIGNvbnN0IGYgPSBoIC0gaTtcbiAgICBjb25zdCBwID0gdiAqICgxIC0gcyk7XG4gICAgY29uc3QgcSA9IHYgKiAoMSAtIGYgKiBzKTtcbiAgICBjb25zdCB0ID0gdiAqICgxIC0gKDEgLSBmKSAqIHMpO1xuICAgIGNvbnN0IG1vZCA9IGkgJSA2O1xuICAgIGNvbnN0IHIgPSBbdiwgcSwgcCwgcCwgdCwgdl1bbW9kXTtcbiAgICBjb25zdCBnID0gW3QsIHYsIHYsIHEsIHAsIHBdW21vZF07XG4gICAgY29uc3QgYiA9IFtwLCBwLCB0LCB2LCB2LCBxXVttb2RdO1xuICAgIHJldHVybiB7IHI6IHIgKiAyNTUsIGc6IGcgKiAyNTUsIGI6IGIgKiAyNTUgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCIGNvbG9yIHRvIGhleFxuICpcbiAqIEFzc3VtZXMgciwgZywgYW5kIGIgYXJlIGNvbnRhaW5lZCBpbiB0aGUgc2V0IFswLCAyNTVdXG4gKiBSZXR1cm5zIGEgMyBvciA2IGNoYXJhY3RlciBoZXhcbiAqL1xuZnVuY3Rpb24gcmdiVG9IZXgociwgZywgYiwgYWxsb3czQ2hhcikge1xuICAgIGNvbnN0IGhleCA9IFtcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKHIpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChnKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoYikudG9TdHJpbmcoMTYpKSxcbiAgICBdO1xuICAgIC8vIFJldHVybiBhIDMgY2hhcmFjdGVyIGhleCBpZiBwb3NzaWJsZVxuICAgIGlmIChhbGxvdzNDaGFyICYmXG4gICAgICAgIGhleFswXS5jaGFyQXQoMCkgPT09IGhleFswXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzFdLmNoYXJBdCgwKSA9PT0gaGV4WzFdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbMl0uY2hhckF0KDApID09PSBoZXhbMl0uY2hhckF0KDEpKSB7XG4gICAgICAgIHJldHVybiBoZXhbMF0uY2hhckF0KDApICsgaGV4WzFdLmNoYXJBdCgwKSArIGhleFsyXS5jaGFyQXQoMCk7XG4gICAgfVxuICAgIHJldHVybiBoZXguam9pbignJyk7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQkEgY29sb3IgcGx1cyBhbHBoYSB0cmFuc3BhcmVuY3kgdG8gaGV4XG4gKlxuICogQXNzdW1lcyByLCBnLCBiIGFyZSBjb250YWluZWQgaW4gdGhlIHNldCBbMCwgMjU1XSBhbmRcbiAqIGEgaW4gWzAsIDFdLiBSZXR1cm5zIGEgNCBvciA4IGNoYXJhY3RlciByZ2JhIGhleFxuICovXG5mdW5jdGlvbiByZ2JhVG9IZXgociwgZywgYiwgYSwgYWxsb3c0Q2hhcikge1xuICAgIGNvbnN0IGhleCA9IFtcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKHIpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChnKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoYikudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihjb252ZXJ0RGVjaW1hbFRvSGV4KGEpKSxcbiAgICBdO1xuICAgIC8vIFJldHVybiBhIDQgY2hhcmFjdGVyIGhleCBpZiBwb3NzaWJsZVxuICAgIGlmIChhbGxvdzRDaGFyICYmXG4gICAgICAgIGhleFswXS5jaGFyQXQoMCkgPT09IGhleFswXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzFdLmNoYXJBdCgwKSA9PT0gaGV4WzFdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbMl0uY2hhckF0KDApID09PSBoZXhbMl0uY2hhckF0KDEpICYmXG4gICAgICAgIGhleFszXS5jaGFyQXQoMCkgPT09IGhleFszXS5jaGFyQXQoMSkpIHtcbiAgICAgICAgcmV0dXJuIGhleFswXS5jaGFyQXQoMCkgKyBoZXhbMV0uY2hhckF0KDApICsgaGV4WzJdLmNoYXJBdCgwKSArIGhleFszXS5jaGFyQXQoMCk7XG4gICAgfVxuICAgIHJldHVybiBoZXguam9pbignJyk7XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQkEgY29sb3IgdG8gYW4gQVJHQiBIZXg4IHN0cmluZ1xuICogUmFyZWx5IHVzZWQsIGJ1dCByZXF1aXJlZCBmb3IgXCJ0b0ZpbHRlcigpXCJcbiAqL1xuZnVuY3Rpb24gcmdiYVRvQXJnYkhleChyLCBnLCBiLCBhKSB7XG4gICAgY29uc3QgaGV4ID0gW1xuICAgICAgICBwYWQyKGNvbnZlcnREZWNpbWFsVG9IZXgoYSkpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQocikudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGcpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChiKS50b1N0cmluZygxNikpLFxuICAgIF07XG4gICAgcmV0dXJuIGhleC5qb2luKCcnKTtcbn1cbi8qKiBDb252ZXJ0cyBhIGRlY2ltYWwgdG8gYSBoZXggdmFsdWUgKi9cbmZ1bmN0aW9uIGNvbnZlcnREZWNpbWFsVG9IZXgoZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKHBhcnNlRmxvYXQoZCkgKiAyNTUpLnRvU3RyaW5nKDE2KTtcbn1cbi8qKiBDb252ZXJ0cyBhIGhleCB2YWx1ZSB0byBhIGRlY2ltYWwgKi9cbmZ1bmN0aW9uIGNvbnZlcnRIZXhUb0RlY2ltYWwoaCkge1xuICAgIHJldHVybiBwYXJzZUludEZyb21IZXgoaCkgLyAyNTU7XG59XG4vKiogUGFyc2UgYSBiYXNlLTE2IGhleCB2YWx1ZSBpbnRvIGEgYmFzZS0xMCBpbnRlZ2VyICovXG5mdW5jdGlvbiBwYXJzZUludEZyb21IZXgodmFsKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KHZhbCwgMTYpO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vYmFoYW1hczEwL2Nzcy1jb2xvci1uYW1lcy9ibG9iL21hc3Rlci9jc3MtY29sb3ItbmFtZXMuanNvblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmNvbnN0IG5hbWVzID0ge1xuICAgIGFsaWNlYmx1ZTogJyNmMGY4ZmYnLFxuICAgIGFudGlxdWV3aGl0ZTogJyNmYWViZDcnLFxuICAgIGFxdWE6ICcjMDBmZmZmJyxcbiAgICBhcXVhbWFyaW5lOiAnIzdmZmZkNCcsXG4gICAgYXp1cmU6ICcjZjBmZmZmJyxcbiAgICBiZWlnZTogJyNmNWY1ZGMnLFxuICAgIGJpc3F1ZTogJyNmZmU0YzQnLFxuICAgIGJsYWNrOiAnIzAwMDAwMCcsXG4gICAgYmxhbmNoZWRhbG1vbmQ6ICcjZmZlYmNkJyxcbiAgICBibHVlOiAnIzAwMDBmZicsXG4gICAgYmx1ZXZpb2xldDogJyM4YTJiZTInLFxuICAgIGJyb3duOiAnI2E1MmEyYScsXG4gICAgYnVybHl3b29kOiAnI2RlYjg4NycsXG4gICAgY2FkZXRibHVlOiAnIzVmOWVhMCcsXG4gICAgY2hhcnRyZXVzZTogJyM3ZmZmMDAnLFxuICAgIGNob2NvbGF0ZTogJyNkMjY5MWUnLFxuICAgIGNvcmFsOiAnI2ZmN2Y1MCcsXG4gICAgY29ybmZsb3dlcmJsdWU6ICcjNjQ5NWVkJyxcbiAgICBjb3Juc2lsazogJyNmZmY4ZGMnLFxuICAgIGNyaW1zb246ICcjZGMxNDNjJyxcbiAgICBjeWFuOiAnIzAwZmZmZicsXG4gICAgZGFya2JsdWU6ICcjMDAwMDhiJyxcbiAgICBkYXJrY3lhbjogJyMwMDhiOGInLFxuICAgIGRhcmtnb2xkZW5yb2Q6ICcjYjg4NjBiJyxcbiAgICBkYXJrZ3JheTogJyNhOWE5YTknLFxuICAgIGRhcmtncmVlbjogJyMwMDY0MDAnLFxuICAgIGRhcmtncmV5OiAnI2E5YTlhOScsXG4gICAgZGFya2toYWtpOiAnI2JkYjc2YicsXG4gICAgZGFya21hZ2VudGE6ICcjOGIwMDhiJyxcbiAgICBkYXJrb2xpdmVncmVlbjogJyM1NTZiMmYnLFxuICAgIGRhcmtvcmFuZ2U6ICcjZmY4YzAwJyxcbiAgICBkYXJrb3JjaGlkOiAnIzk5MzJjYycsXG4gICAgZGFya3JlZDogJyM4YjAwMDAnLFxuICAgIGRhcmtzYWxtb246ICcjZTk5NjdhJyxcbiAgICBkYXJrc2VhZ3JlZW46ICcjOGZiYzhmJyxcbiAgICBkYXJrc2xhdGVibHVlOiAnIzQ4M2Q4YicsXG4gICAgZGFya3NsYXRlZ3JheTogJyMyZjRmNGYnLFxuICAgIGRhcmtzbGF0ZWdyZXk6ICcjMmY0ZjRmJyxcbiAgICBkYXJrdHVycXVvaXNlOiAnIzAwY2VkMScsXG4gICAgZGFya3Zpb2xldDogJyM5NDAwZDMnLFxuICAgIGRlZXBwaW5rOiAnI2ZmMTQ5MycsXG4gICAgZGVlcHNreWJsdWU6ICcjMDBiZmZmJyxcbiAgICBkaW1ncmF5OiAnIzY5Njk2OScsXG4gICAgZGltZ3JleTogJyM2OTY5NjknLFxuICAgIGRvZGdlcmJsdWU6ICcjMWU5MGZmJyxcbiAgICBmaXJlYnJpY2s6ICcjYjIyMjIyJyxcbiAgICBmbG9yYWx3aGl0ZTogJyNmZmZhZjAnLFxuICAgIGZvcmVzdGdyZWVuOiAnIzIyOGIyMicsXG4gICAgZnVjaHNpYTogJyNmZjAwZmYnLFxuICAgIGdhaW5zYm9ybzogJyNkY2RjZGMnLFxuICAgIGdob3N0d2hpdGU6ICcjZjhmOGZmJyxcbiAgICBnb2xkOiAnI2ZmZDcwMCcsXG4gICAgZ29sZGVucm9kOiAnI2RhYTUyMCcsXG4gICAgZ3JheTogJyM4MDgwODAnLFxuICAgIGdyZWVuOiAnIzAwODAwMCcsXG4gICAgZ3JlZW55ZWxsb3c6ICcjYWRmZjJmJyxcbiAgICBncmV5OiAnIzgwODA4MCcsXG4gICAgaG9uZXlkZXc6ICcjZjBmZmYwJyxcbiAgICBob3RwaW5rOiAnI2ZmNjliNCcsXG4gICAgaW5kaWFucmVkOiAnI2NkNWM1YycsXG4gICAgaW5kaWdvOiAnIzRiMDA4MicsXG4gICAgaXZvcnk6ICcjZmZmZmYwJyxcbiAgICBraGFraTogJyNmMGU2OGMnLFxuICAgIGxhdmVuZGVyOiAnI2U2ZTZmYScsXG4gICAgbGF2ZW5kZXJibHVzaDogJyNmZmYwZjUnLFxuICAgIGxhd25ncmVlbjogJyM3Y2ZjMDAnLFxuICAgIGxlbW9uY2hpZmZvbjogJyNmZmZhY2QnLFxuICAgIGxpZ2h0Ymx1ZTogJyNhZGQ4ZTYnLFxuICAgIGxpZ2h0Y29yYWw6ICcjZjA4MDgwJyxcbiAgICBsaWdodGN5YW46ICcjZTBmZmZmJyxcbiAgICBsaWdodGdvbGRlbnJvZHllbGxvdzogJyNmYWZhZDInLFxuICAgIGxpZ2h0Z3JheTogJyNkM2QzZDMnLFxuICAgIGxpZ2h0Z3JlZW46ICcjOTBlZTkwJyxcbiAgICBsaWdodGdyZXk6ICcjZDNkM2QzJyxcbiAgICBsaWdodHBpbms6ICcjZmZiNmMxJyxcbiAgICBsaWdodHNhbG1vbjogJyNmZmEwN2EnLFxuICAgIGxpZ2h0c2VhZ3JlZW46ICcjMjBiMmFhJyxcbiAgICBsaWdodHNreWJsdWU6ICcjODdjZWZhJyxcbiAgICBsaWdodHNsYXRlZ3JheTogJyM3Nzg4OTknLFxuICAgIGxpZ2h0c2xhdGVncmV5OiAnIzc3ODg5OScsXG4gICAgbGlnaHRzdGVlbGJsdWU6ICcjYjBjNGRlJyxcbiAgICBsaWdodHllbGxvdzogJyNmZmZmZTAnLFxuICAgIGxpbWU6ICcjMDBmZjAwJyxcbiAgICBsaW1lZ3JlZW46ICcjMzJjZDMyJyxcbiAgICBsaW5lbjogJyNmYWYwZTYnLFxuICAgIG1hZ2VudGE6ICcjZmYwMGZmJyxcbiAgICBtYXJvb246ICcjODAwMDAwJyxcbiAgICBtZWRpdW1hcXVhbWFyaW5lOiAnIzY2Y2RhYScsXG4gICAgbWVkaXVtYmx1ZTogJyMwMDAwY2QnLFxuICAgIG1lZGl1bW9yY2hpZDogJyNiYTU1ZDMnLFxuICAgIG1lZGl1bXB1cnBsZTogJyM5MzcwZGInLFxuICAgIG1lZGl1bXNlYWdyZWVuOiAnIzNjYjM3MScsXG4gICAgbWVkaXVtc2xhdGVibHVlOiAnIzdiNjhlZScsXG4gICAgbWVkaXVtc3ByaW5nZ3JlZW46ICcjMDBmYTlhJyxcbiAgICBtZWRpdW10dXJxdW9pc2U6ICcjNDhkMWNjJyxcbiAgICBtZWRpdW12aW9sZXRyZWQ6ICcjYzcxNTg1JyxcbiAgICBtaWRuaWdodGJsdWU6ICcjMTkxOTcwJyxcbiAgICBtaW50Y3JlYW06ICcjZjVmZmZhJyxcbiAgICBtaXN0eXJvc2U6ICcjZmZlNGUxJyxcbiAgICBtb2NjYXNpbjogJyNmZmU0YjUnLFxuICAgIG5hdmFqb3doaXRlOiAnI2ZmZGVhZCcsXG4gICAgbmF2eTogJyMwMDAwODAnLFxuICAgIG9sZGxhY2U6ICcjZmRmNWU2JyxcbiAgICBvbGl2ZTogJyM4MDgwMDAnLFxuICAgIG9saXZlZHJhYjogJyM2YjhlMjMnLFxuICAgIG9yYW5nZTogJyNmZmE1MDAnLFxuICAgIG9yYW5nZXJlZDogJyNmZjQ1MDAnLFxuICAgIG9yY2hpZDogJyNkYTcwZDYnLFxuICAgIHBhbGVnb2xkZW5yb2Q6ICcjZWVlOGFhJyxcbiAgICBwYWxlZ3JlZW46ICcjOThmYjk4JyxcbiAgICBwYWxldHVycXVvaXNlOiAnI2FmZWVlZScsXG4gICAgcGFsZXZpb2xldHJlZDogJyNkYjcwOTMnLFxuICAgIHBhcGF5YXdoaXA6ICcjZmZlZmQ1JyxcbiAgICBwZWFjaHB1ZmY6ICcjZmZkYWI5JyxcbiAgICBwZXJ1OiAnI2NkODUzZicsXG4gICAgcGluazogJyNmZmMwY2InLFxuICAgIHBsdW06ICcjZGRhMGRkJyxcbiAgICBwb3dkZXJibHVlOiAnI2IwZTBlNicsXG4gICAgcHVycGxlOiAnIzgwMDA4MCcsXG4gICAgcmViZWNjYXB1cnBsZTogJyM2NjMzOTknLFxuICAgIHJlZDogJyNmZjAwMDAnLFxuICAgIHJvc3licm93bjogJyNiYzhmOGYnLFxuICAgIHJveWFsYmx1ZTogJyM0MTY5ZTEnLFxuICAgIHNhZGRsZWJyb3duOiAnIzhiNDUxMycsXG4gICAgc2FsbW9uOiAnI2ZhODA3MicsXG4gICAgc2FuZHlicm93bjogJyNmNGE0NjAnLFxuICAgIHNlYWdyZWVuOiAnIzJlOGI1NycsXG4gICAgc2Vhc2hlbGw6ICcjZmZmNWVlJyxcbiAgICBzaWVubmE6ICcjYTA1MjJkJyxcbiAgICBzaWx2ZXI6ICcjYzBjMGMwJyxcbiAgICBza3libHVlOiAnIzg3Y2VlYicsXG4gICAgc2xhdGVibHVlOiAnIzZhNWFjZCcsXG4gICAgc2xhdGVncmF5OiAnIzcwODA5MCcsXG4gICAgc2xhdGVncmV5OiAnIzcwODA5MCcsXG4gICAgc25vdzogJyNmZmZhZmEnLFxuICAgIHNwcmluZ2dyZWVuOiAnIzAwZmY3ZicsXG4gICAgc3RlZWxibHVlOiAnIzQ2ODJiNCcsXG4gICAgdGFuOiAnI2QyYjQ4YycsXG4gICAgdGVhbDogJyMwMDgwODAnLFxuICAgIHRoaXN0bGU6ICcjZDhiZmQ4JyxcbiAgICB0b21hdG86ICcjZmY2MzQ3JyxcbiAgICB0dXJxdW9pc2U6ICcjNDBlMGQwJyxcbiAgICB2aW9sZXQ6ICcjZWU4MmVlJyxcbiAgICB3aGVhdDogJyNmNWRlYjMnLFxuICAgIHdoaXRlOiAnI2ZmZmZmZicsXG4gICAgd2hpdGVzbW9rZTogJyNmNWY1ZjUnLFxuICAgIHllbGxvdzogJyNmZmZmMDAnLFxuICAgIHllbGxvd2dyZWVuOiAnIzlhY2QzMicsXG59O1xuXG4vKipcbiAqIEdpdmVuIGEgc3RyaW5nIG9yIG9iamVjdCwgY29udmVydCB0aGF0IGlucHV0IHRvIFJHQlxuICpcbiAqIFBvc3NpYmxlIHN0cmluZyBpbnB1dHM6XG4gKiBgYGBcbiAqIFwicmVkXCJcbiAqIFwiI2YwMFwiIG9yIFwiZjAwXCJcbiAqIFwiI2ZmMDAwMFwiIG9yIFwiZmYwMDAwXCJcbiAqIFwiI2ZmMDAwMDAwXCIgb3IgXCJmZjAwMDAwMFwiXG4gKiBcInJnYiAyNTUgMCAwXCIgb3IgXCJyZ2IgKDI1NSwgMCwgMClcIlxuICogXCJyZ2IgMS4wIDAgMFwiIG9yIFwicmdiICgxLCAwLCAwKVwiXG4gKiBcInJnYmEgKDI1NSwgMCwgMCwgMSlcIiBvciBcInJnYmEgMjU1LCAwLCAwLCAxXCJcbiAqIFwicmdiYSAoMS4wLCAwLCAwLCAxKVwiIG9yIFwicmdiYSAxLjAsIDAsIDAsIDFcIlxuICogXCJoc2woMCwgMTAwJSwgNTAlKVwiIG9yIFwiaHNsIDAgMTAwJSA1MCVcIlxuICogXCJoc2xhKDAsIDEwMCUsIDUwJSwgMSlcIiBvciBcImhzbGEgMCAxMDAlIDUwJSwgMVwiXG4gKiBcImhzdigwLCAxMDAlLCAxMDAlKVwiIG9yIFwiaHN2IDAgMTAwJSAxMDAlXCJcbiAqIGBgYFxuICovXG5mdW5jdGlvbiBpbnB1dFRvUkdCKGNvbG9yKSB7XG4gICAgbGV0IHJnYiA9IHsgcjogMCwgZzogMCwgYjogMCB9O1xuICAgIGxldCBhID0gMTtcbiAgICBsZXQgcyA9IG51bGw7XG4gICAgbGV0IHYgPSBudWxsO1xuICAgIGxldCBsID0gbnVsbDtcbiAgICBsZXQgb2sgPSBmYWxzZTtcbiAgICBsZXQgZm9ybWF0ID0gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29sb3IgPSBzdHJpbmdJbnB1dFRvT2JqZWN0KGNvbG9yKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKGlzVmFsaWRDU1NVbml0KGNvbG9yLnIpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLmcpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLmIpKSB7XG4gICAgICAgICAgICByZ2IgPSByZ2JUb1JnYihjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKTtcbiAgICAgICAgICAgIG9rID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcm1hdCA9IFN0cmluZyhjb2xvci5yKS5zdWJzdHIoLTEpID09PSAnJScgPyAncHJnYicgOiAncmdiJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1ZhbGlkQ1NTVW5pdChjb2xvci5oKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci5zKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci52KSkge1xuICAgICAgICAgICAgcyA9IGNvbnZlcnRUb1BlcmNlbnRhZ2UoY29sb3Iucyk7XG4gICAgICAgICAgICB2ID0gY29udmVydFRvUGVyY2VudGFnZShjb2xvci52KTtcbiAgICAgICAgICAgIHJnYiA9IGhzdlRvUmdiKGNvbG9yLmgsIHMsIHYpO1xuICAgICAgICAgICAgb2sgPSB0cnVlO1xuICAgICAgICAgICAgZm9ybWF0ID0gJ2hzdic7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNWYWxpZENTU1VuaXQoY29sb3IuaCkgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IucykgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IubCkpIHtcbiAgICAgICAgICAgIHMgPSBjb252ZXJ0VG9QZXJjZW50YWdlKGNvbG9yLnMpO1xuICAgICAgICAgICAgbCA9IGNvbnZlcnRUb1BlcmNlbnRhZ2UoY29sb3IubCk7XG4gICAgICAgICAgICByZ2IgPSBoc2xUb1JnYihjb2xvci5oLCBzLCBsKTtcbiAgICAgICAgICAgIG9rID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcm1hdCA9ICdoc2wnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xvci5oYXNPd25Qcm9wZXJ0eSgnYScpKSB7XG4gICAgICAgICAgICBhID0gY29sb3IuYTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhID0gYm91bmRBbHBoYShhKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvayxcbiAgICAgICAgZm9ybWF0OiBjb2xvci5mb3JtYXQgfHwgZm9ybWF0LFxuICAgICAgICByOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KHJnYi5yLCAwKSksXG4gICAgICAgIGc6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgocmdiLmcsIDApKSxcbiAgICAgICAgYjogTWF0aC5taW4oMjU1LCBNYXRoLm1heChyZ2IuYiwgMCkpLFxuICAgICAgICBhLFxuICAgIH07XG59XG4vLyA8aHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy12YWx1ZXMvI2ludGVnZXJzPlxuY29uc3QgQ1NTX0lOVEVHRVIgPSAnWy1cXFxcK10/XFxcXGQrJT8nO1xuLy8gPGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtdmFsdWVzLyNudW1iZXItdmFsdWU+XG5jb25zdCBDU1NfTlVNQkVSID0gJ1stXFxcXCtdP1xcXFxkKlxcXFwuXFxcXGQrJT8nO1xuLy8gQWxsb3cgcG9zaXRpdmUvbmVnYXRpdmUgaW50ZWdlci9udW1iZXIuICBEb24ndCBjYXB0dXJlIHRoZSBlaXRoZXIvb3IsIGp1c3QgdGhlIGVudGlyZSBvdXRjb21lLlxuY29uc3QgQ1NTX1VOSVQgPSBgKD86JHtDU1NfTlVNQkVSfSl8KD86JHtDU1NfSU5URUdFUn0pYDtcbi8vIEFjdHVhbCBtYXRjaGluZy5cbi8vIFBhcmVudGhlc2VzIGFuZCBjb21tYXMgYXJlIG9wdGlvbmFsLCBidXQgbm90IHJlcXVpcmVkLlxuLy8gV2hpdGVzcGFjZSBjYW4gdGFrZSB0aGUgcGxhY2Ugb2YgY29tbWFzIG9yIG9wZW5pbmcgcGFyZW5cbmNvbnN0IFBFUk1JU1NJVkVfTUFUQ0gzID0gYFtcXFxcc3xcXFxcKF0rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlcXFxccypcXFxcKT9gO1xuY29uc3QgUEVSTUlTU0lWRV9NQVRDSDQgPSBgW1xcXFxzfFxcXFwoXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlbLHxcXFxcc10rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pXFxcXHMqXFxcXCk/YDtcbmNvbnN0IG1hdGNoZXJzID0ge1xuICAgIENTU19VTklUOiBuZXcgUmVnRXhwKENTU19VTklUKSxcbiAgICByZ2I6IG5ldyBSZWdFeHAoJ3JnYicgKyBQRVJNSVNTSVZFX01BVENIMyksXG4gICAgcmdiYTogbmV3IFJlZ0V4cCgncmdiYScgKyBQRVJNSVNTSVZFX01BVENINCksXG4gICAgaHNsOiBuZXcgUmVnRXhwKCdoc2wnICsgUEVSTUlTU0lWRV9NQVRDSDMpLFxuICAgIGhzbGE6IG5ldyBSZWdFeHAoJ2hzbGEnICsgUEVSTUlTU0lWRV9NQVRDSDQpLFxuICAgIGhzdjogbmV3IFJlZ0V4cCgnaHN2JyArIFBFUk1JU1NJVkVfTUFUQ0gzKSxcbiAgICBoc3ZhOiBuZXcgUmVnRXhwKCdoc3ZhJyArIFBFUk1JU1NJVkVfTUFUQ0g0KSxcbiAgICBoZXgzOiAvXiM/KFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pJC8sXG4gICAgaGV4NjogL14jPyhbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KSQvLFxuICAgIGhleDQ6IC9eIz8oWzAtOWEtZkEtRl17MX0pKFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pJC8sXG4gICAgaGV4ODogL14jPyhbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KShbMC05YS1mQS1GXXsyfSkkLyxcbn07XG4vKipcbiAqIFBlcm1pc3NpdmUgc3RyaW5nIHBhcnNpbmcuICBUYWtlIGluIGEgbnVtYmVyIG9mIGZvcm1hdHMsIGFuZCBvdXRwdXQgYW4gb2JqZWN0XG4gKiBiYXNlZCBvbiBkZXRlY3RlZCBmb3JtYXQuICBSZXR1cm5zIGB7IHIsIGcsIGIgfWAgb3IgYHsgaCwgcywgbCB9YCBvciBgeyBoLCBzLCB2fWBcbiAqL1xuZnVuY3Rpb24gc3RyaW5nSW5wdXRUb09iamVjdChjb2xvcikge1xuICAgIGNvbG9yID0gY29sb3IudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGNvbG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxldCBuYW1lZCA9IGZhbHNlO1xuICAgIGlmIChuYW1lc1tjb2xvcl0pIHtcbiAgICAgICAgY29sb3IgPSBuYW1lc1tjb2xvcl07XG4gICAgICAgIG5hbWVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY29sb3IgPT09ICd0cmFuc3BhcmVudCcpIHtcbiAgICAgICAgcmV0dXJuIHsgcjogMCwgZzogMCwgYjogMCwgYTogMCwgZm9ybWF0OiAnbmFtZScgfTtcbiAgICB9XG4gICAgLy8gVHJ5IHRvIG1hdGNoIHN0cmluZyBpbnB1dCB1c2luZyByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgIC8vIEtlZXAgbW9zdCBvZiB0aGUgbnVtYmVyIGJvdW5kaW5nIG91dCBvZiB0aGlzIGZ1bmN0aW9uIC0gZG9uJ3Qgd29ycnkgYWJvdXQgWzAsMV0gb3IgWzAsMTAwXSBvciBbMCwzNjBdXG4gICAgLy8gSnVzdCByZXR1cm4gYW4gb2JqZWN0IGFuZCBsZXQgdGhlIGNvbnZlcnNpb24gZnVuY3Rpb25zIGhhbmRsZSB0aGF0LlxuICAgIC8vIFRoaXMgd2F5IHRoZSByZXN1bHQgd2lsbCBiZSB0aGUgc2FtZSB3aGV0aGVyIHRoZSB0aW55Y29sb3IgaXMgaW5pdGlhbGl6ZWQgd2l0aCBzdHJpbmcgb3Igb2JqZWN0LlxuICAgIGxldCBtYXRjaCA9IG1hdGNoZXJzLnJnYi5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgcjogbWF0Y2hbMV0sIGc6IG1hdGNoWzJdLCBiOiBtYXRjaFszXSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLnJnYmEuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IHI6IG1hdGNoWzFdLCBnOiBtYXRjaFsyXSwgYjogbWF0Y2hbM10sIGE6IG1hdGNoWzRdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaHNsLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyBoOiBtYXRjaFsxXSwgczogbWF0Y2hbMl0sIGw6IG1hdGNoWzNdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaHNsYS5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgaDogbWF0Y2hbMV0sIHM6IG1hdGNoWzJdLCBsOiBtYXRjaFszXSwgYTogbWF0Y2hbNF0gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oc3YuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IGg6IG1hdGNoWzFdLCBzOiBtYXRjaFsyXSwgdjogbWF0Y2hbM10gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oc3ZhLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyBoOiBtYXRjaFsxXSwgczogbWF0Y2hbMl0sIHY6IG1hdGNoWzNdLCBhOiBtYXRjaFs0XSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhleDguZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMV0pLFxuICAgICAgICAgICAgZzogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50RnJvbUhleChtYXRjaFszXSksXG4gICAgICAgICAgICBhOiBjb252ZXJ0SGV4VG9EZWNpbWFsKG1hdGNoWzRdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4OCcsXG4gICAgICAgIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaGV4Ni5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50RnJvbUhleChtYXRjaFsxXSksXG4gICAgICAgICAgICBnOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMl0pLFxuICAgICAgICAgICAgYjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzNdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4JyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oZXg0LmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzFdICsgbWF0Y2hbMV0pLFxuICAgICAgICAgICAgZzogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzJdICsgbWF0Y2hbMl0pLFxuICAgICAgICAgICAgYjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzNdICsgbWF0Y2hbM10pLFxuICAgICAgICAgICAgYTogY29udmVydEhleFRvRGVjaW1hbChtYXRjaFs0XSArIG1hdGNoWzRdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4OCcsXG4gICAgICAgIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaGV4My5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50RnJvbUhleChtYXRjaFsxXSArIG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGc6IHBhcnNlSW50RnJvbUhleChtYXRjaFsyXSArIG1hdGNoWzJdKSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50RnJvbUhleChtYXRjaFszXSArIG1hdGNoWzNdKSxcbiAgICAgICAgICAgIGZvcm1hdDogbmFtZWQgPyAnbmFtZScgOiAnaGV4JyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgaXQgbG9va3MgbGlrZSBhIENTUyB1bml0XG4gKiAoc2VlIGBtYXRjaGVyc2AgYWJvdmUgZm9yIGRlZmluaXRpb24pLlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkQ1NTVW5pdChjb2xvcikge1xuICAgIHJldHVybiAhIW1hdGNoZXJzLkNTU19VTklULmV4ZWMoU3RyaW5nKGNvbG9yKSk7XG59XG5cbmNsYXNzIFRpbnlDb2xvciB7XG4gICAgY29uc3RydWN0b3IoY29sb3IgPSAnJywgb3B0cyA9IHt9KSB7XG4gICAgICAgIC8vIElmIGlucHV0IGlzIGFscmVhZHkgYSB0aW55Y29sb3IsIHJldHVybiBpdHNlbGZcbiAgICAgICAgaWYgKGNvbG9yIGluc3RhbmNlb2YgVGlueUNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcmlnaW5hbElucHV0ID0gY29sb3I7XG4gICAgICAgIGNvbnN0IHJnYiA9IGlucHV0VG9SR0IoY29sb3IpO1xuICAgICAgICB0aGlzLm9yaWdpbmFsSW5wdXQgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5yID0gcmdiLnI7XG4gICAgICAgIHRoaXMuZyA9IHJnYi5nO1xuICAgICAgICB0aGlzLmIgPSByZ2IuYjtcbiAgICAgICAgdGhpcy5hID0gcmdiLmE7XG4gICAgICAgIHRoaXMucm91bmRBID0gTWF0aC5yb3VuZCgxMDAgKiB0aGlzLmEpIC8gMTAwO1xuICAgICAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0IHx8IHJnYi5mb3JtYXQ7XG4gICAgICAgIHRoaXMuZ3JhZGllbnRUeXBlID0gb3B0cy5ncmFkaWVudFR5cGU7XG4gICAgICAgIC8vIERvbid0IGxldCB0aGUgcmFuZ2Ugb2YgWzAsMjU1XSBjb21lIGJhY2sgaW4gWzAsMV0uXG4gICAgICAgIC8vIFBvdGVudGlhbGx5IGxvc2UgYSBsaXR0bGUgYml0IG9mIHByZWNpc2lvbiBoZXJlLCBidXQgd2lsbCBmaXggaXNzdWVzIHdoZXJlXG4gICAgICAgIC8vIC41IGdldHMgaW50ZXJwcmV0ZWQgYXMgaGFsZiBvZiB0aGUgdG90YWwsIGluc3RlYWQgb2YgaGFsZiBvZiAxXG4gICAgICAgIC8vIElmIGl0IHdhcyBzdXBwb3NlZCB0byBiZSAxMjgsIHRoaXMgd2FzIGFscmVhZHkgdGFrZW4gY2FyZSBvZiBieSBgaW5wdXRUb1JnYmBcbiAgICAgICAgaWYgKHRoaXMuciA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuciA9IE1hdGgucm91bmQodGhpcy5yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5nIDwgMSkge1xuICAgICAgICAgICAgdGhpcy5nID0gTWF0aC5yb3VuZCh0aGlzLmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmIgPCAxKSB7XG4gICAgICAgICAgICB0aGlzLmIgPSBNYXRoLnJvdW5kKHRoaXMuYik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1ZhbGlkID0gcmdiLm9rO1xuICAgIH1cbiAgICBpc0RhcmsoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJyaWdodG5lc3MoKSA8IDEyODtcbiAgICB9XG4gICAgaXNMaWdodCgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzRGFyaygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwZXJjZWl2ZWQgYnJpZ2h0bmVzcyBvZiB0aGUgY29sb3IsIGZyb20gMC0yNTUuXG4gICAgICovXG4gICAgZ2V0QnJpZ2h0bmVzcygpIHtcbiAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvQUVSVCNjb2xvci1jb250cmFzdFxuICAgICAgICBjb25zdCByZ2IgPSB0aGlzLnRvUmdiKCk7XG4gICAgICAgIHJldHVybiAocmdiLnIgKiAyOTkgKyByZ2IuZyAqIDU4NyArIHJnYi5iICogMTE0KSAvIDEwMDA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBlcmNlaXZlZCBsdW1pbmFuY2Ugb2YgYSBjb2xvciwgZnJvbSAwLTEuXG4gICAgICovXG4gICAgZ2V0THVtaW5hbmNlKCkge1xuICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy1XQ0FHMjAtMjAwODEyMTEvI3JlbGF0aXZlbHVtaW5hbmNlZGVmXG4gICAgICAgIGNvbnN0IHJnYiA9IHRoaXMudG9SZ2IoKTtcbiAgICAgICAgbGV0IFI7XG4gICAgICAgIGxldCBHO1xuICAgICAgICBsZXQgQjtcbiAgICAgICAgY29uc3QgUnNSR0IgPSByZ2IuciAvIDI1NTtcbiAgICAgICAgY29uc3QgR3NSR0IgPSByZ2IuZyAvIDI1NTtcbiAgICAgICAgY29uc3QgQnNSR0IgPSByZ2IuYiAvIDI1NTtcbiAgICAgICAgaWYgKFJzUkdCIDw9IDAuMDM5MjgpIHtcbiAgICAgICAgICAgIFIgPSBSc1JHQiAvIDEyLjkyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgUiA9IE1hdGgucG93KChSc1JHQiArIDAuMDU1KSAvIDEuMDU1LCAyLjQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChHc1JHQiA8PSAwLjAzOTI4KSB7XG4gICAgICAgICAgICBHID0gR3NSR0IgLyAxMi45MjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIEcgPSBNYXRoLnBvdygoR3NSR0IgKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQnNSR0IgPD0gMC4wMzkyOCkge1xuICAgICAgICAgICAgQiA9IEJzUkdCIC8gMTIuOTI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBCID0gTWF0aC5wb3coKEJzUkdCICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDAuMjEyNiAqIFIgKyAwLjcxNTIgKiBHICsgMC4wNzIyICogQjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgYWxwaGEgdmFsdWUgb24gdGhlIGN1cnJlbnQgY29sb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWxwaGEgLSBUaGUgbmV3IGFscGhhIHZhbHVlLiBUaGUgYWNjZXB0ZWQgcmFuZ2UgaXMgMC0xLlxuICAgICAqL1xuICAgIHNldEFscGhhKGFscGhhKSB7XG4gICAgICAgIHRoaXMuYSA9IGJvdW5kQWxwaGEoYWxwaGEpO1xuICAgICAgICB0aGlzLnJvdW5kQSA9IE1hdGgucm91bmQoMTAwICogdGhpcy5hKSAvIDEwMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIEhTVkEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvSHN2KCkge1xuICAgICAgICBjb25zdCBoc3YgPSByZ2JUb0hzdih0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgcmV0dXJuIHsgaDogaHN2LmggKiAzNjAsIHM6IGhzdi5zLCB2OiBoc3YudiwgYTogdGhpcy5hIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhzdmEgdmFsdWVzIGludGVycG9sYXRlZCBpbnRvIGEgc3RyaW5nIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gICAgICogXCJoc3ZhKHh4eCwgeHh4LCB4eHgsIHh4KVwiLlxuICAgICAqL1xuICAgIHRvSHN2U3RyaW5nKCkge1xuICAgICAgICBjb25zdCBoc3YgPSByZ2JUb0hzdih0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgY29uc3QgaCA9IE1hdGgucm91bmQoaHN2LmggKiAzNjApO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5yb3VuZChoc3YucyAqIDEwMCk7XG4gICAgICAgIGNvbnN0IHYgPSBNYXRoLnJvdW5kKGhzdi52ICogMTAwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMSA/IGBoc3YoJHtofSwgJHtzfSUsICR7dn0lKWAgOiBgaHN2YSgke2h9LCAke3N9JSwgJHt2fSUsICR7dGhpcy5yb3VuZEF9KWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIEhTTEEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvSHNsKCkge1xuICAgICAgICBjb25zdCBoc2wgPSByZ2JUb0hzbCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgcmV0dXJuIHsgaDogaHNsLmggKiAzNjAsIHM6IGhzbC5zLCBsOiBoc2wubCwgYTogdGhpcy5hIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhzbGEgdmFsdWVzIGludGVycG9sYXRlZCBpbnRvIGEgc3RyaW5nIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gICAgICogXCJoc2xhKHh4eCwgeHh4LCB4eHgsIHh4KVwiLlxuICAgICAqL1xuICAgIHRvSHNsU3RyaW5nKCkge1xuICAgICAgICBjb25zdCBoc2wgPSByZ2JUb0hzbCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgICAgY29uc3QgaCA9IE1hdGgucm91bmQoaHNsLmggKiAzNjApO1xuICAgICAgICBjb25zdCBzID0gTWF0aC5yb3VuZChoc2wucyAqIDEwMCk7XG4gICAgICAgIGNvbnN0IGwgPSBNYXRoLnJvdW5kKGhzbC5sICogMTAwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMSA/IGBoc2woJHtofSwgJHtzfSUsICR7bH0lKWAgOiBgaHNsYSgke2h9LCAke3N9JSwgJHtsfSUsICR7dGhpcy5yb3VuZEF9KWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhleCB2YWx1ZSBvZiB0aGUgY29sb3IuXG4gICAgICogQHBhcmFtIGFsbG93M0NoYXIgd2lsbCBzaG9ydGVuIGhleCB2YWx1ZSB0byAzIGNoYXIgaWYgcG9zc2libGVcbiAgICAgKi9cbiAgICB0b0hleChhbGxvdzNDaGFyID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHJnYlRvSGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIsIGFsbG93M0NoYXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZXggdmFsdWUgb2YgdGhlIGNvbG9yIC13aXRoIGEgIyBhcHBlbmVkLlxuICAgICAqIEBwYXJhbSBhbGxvdzNDaGFyIHdpbGwgc2hvcnRlbiBoZXggdmFsdWUgdG8gMyBjaGFyIGlmIHBvc3NpYmxlXG4gICAgICovXG4gICAgdG9IZXhTdHJpbmcoYWxsb3czQ2hhciA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiAnIycgKyB0aGlzLnRvSGV4KGFsbG93M0NoYXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZXggOCB2YWx1ZSBvZiB0aGUgY29sb3IuXG4gICAgICogQHBhcmFtIGFsbG93NENoYXIgd2lsbCBzaG9ydGVuIGhleCB2YWx1ZSB0byA0IGNoYXIgaWYgcG9zc2libGVcbiAgICAgKi9cbiAgICB0b0hleDgoYWxsb3c0Q2hhciA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiByZ2JhVG9IZXgodGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgdGhpcy5hLCBhbGxvdzRDaGFyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaGV4IDggdmFsdWUgb2YgdGhlIGNvbG9yIC13aXRoIGEgIyBhcHBlbmVkLlxuICAgICAqIEBwYXJhbSBhbGxvdzRDaGFyIHdpbGwgc2hvcnRlbiBoZXggdmFsdWUgdG8gNCBjaGFyIGlmIHBvc3NpYmxlXG4gICAgICovXG4gICAgdG9IZXg4U3RyaW5nKGFsbG93NENoYXIgPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gJyMnICsgdGhpcy50b0hleDgoYWxsb3c0Q2hhcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIFJHQkEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvUmdiKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogTWF0aC5yb3VuZCh0aGlzLnIpLFxuICAgICAgICAgICAgZzogTWF0aC5yb3VuZCh0aGlzLmcpLFxuICAgICAgICAgICAgYjogTWF0aC5yb3VuZCh0aGlzLmIpLFxuICAgICAgICAgICAgYTogdGhpcy5hLFxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBSR0JBIHZhbHVlcyBpbnRlcnBvbGF0ZWQgaW50byBhIHN0cmluZyB3aXRoIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICAgICAqIFwiUkdCQSh4eHgsIHh4eCwgeHh4LCB4eClcIi5cbiAgICAgKi9cbiAgICB0b1JnYlN0cmluZygpIHtcbiAgICAgICAgY29uc3QgciA9IE1hdGgucm91bmQodGhpcy5yKTtcbiAgICAgICAgY29uc3QgZyA9IE1hdGgucm91bmQodGhpcy5nKTtcbiAgICAgICAgY29uc3QgYiA9IE1hdGgucm91bmQodGhpcy5iKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMSA/IGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgIDogYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHt0aGlzLnJvdW5kQX0pYDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb2JqZWN0IGFzIGEgUkdCQSBvYmplY3QuXG4gICAgICovXG4gICAgdG9QZXJjZW50YWdlUmdiKCkge1xuICAgICAgICBjb25zdCBmbXQgPSAoeCkgPT4gTWF0aC5yb3VuZChib3VuZDAxKHgsIDI1NSkgKiAxMDApICsgJyUnO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogZm10KHRoaXMuciksXG4gICAgICAgICAgICBnOiBmbXQodGhpcy5nKSxcbiAgICAgICAgICAgIGI6IGZtdCh0aGlzLmIpLFxuICAgICAgICAgICAgYTogdGhpcy5hLFxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBSR0JBIHJlbGF0aXZlIHZhbHVlcyBpbnRlcnBvbGF0ZWQgaW50byBhIHN0cmluZ1xuICAgICAqL1xuICAgIHRvUGVyY2VudGFnZVJnYlN0cmluZygpIHtcbiAgICAgICAgY29uc3Qgcm5kID0gKHgpID0+IE1hdGgucm91bmQoYm91bmQwMSh4LCAyNTUpICogMTAwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYSA9PT0gMVxuICAgICAgICAgICAgPyBgcmdiKCR7cm5kKHRoaXMucil9JSwgJHtybmQodGhpcy5nKX0lLCAke3JuZCh0aGlzLmIpfSUpYFxuICAgICAgICAgICAgOiBgcmdiYSgke3JuZCh0aGlzLnIpfSUsICR7cm5kKHRoaXMuZyl9JSwgJHtybmQodGhpcy5iKX0lLCAke3RoaXMucm91bmRBfSlgO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGUgJ3JlYWwnIG5hbWUgb2YgdGhlIGNvbG9yIC1pZiB0aGVyZSBpcyBvbmUuXG4gICAgICovXG4gICAgdG9OYW1lKCkge1xuICAgICAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5hIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhleCA9ICcjJyArIHJnYlRvSGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIsIGZhbHNlKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMobmFtZXMpKSB7XG4gICAgICAgICAgICBpZiAobmFtZXNba2V5XSA9PT0gaGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybWF0IC0gVGhlIGZvcm1hdCB0byBiZSB1c2VkIHdoZW4gZGlzcGxheWluZyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHRvU3RyaW5nKGZvcm1hdCkge1xuICAgICAgICBjb25zdCBmb3JtYXRTZXQgPSAhIWZvcm1hdDtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8IHRoaXMuZm9ybWF0O1xuICAgICAgICBsZXQgZm9ybWF0dGVkU3RyaW5nID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGhhc0FscGhhID0gdGhpcy5hIDwgMSAmJiB0aGlzLmEgPj0gMDtcbiAgICAgICAgY29uc3QgbmVlZHNBbHBoYUZvcm1hdCA9ICFmb3JtYXRTZXQgJiYgaGFzQWxwaGEgJiYgKGZvcm1hdC5zdGFydHNXaXRoKCdoZXgnKSB8fCBmb3JtYXQgPT09ICduYW1lJyk7XG4gICAgICAgIGlmIChuZWVkc0FscGhhRm9ybWF0KSB7XG4gICAgICAgICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIFwidHJhbnNwYXJlbnRcIiwgYWxsIG90aGVyIG5vbi1hbHBoYSBmb3JtYXRzXG4gICAgICAgICAgICAvLyB3aWxsIHJldHVybiByZ2JhIHdoZW4gdGhlcmUgaXMgdHJhbnNwYXJlbmN5LlxuICAgICAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ25hbWUnICYmIHRoaXMuYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvTmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9SZ2JTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAncmdiJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b1JnYlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdwcmdiJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b1BlcmNlbnRhZ2VSZ2JTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaGV4JyB8fCBmb3JtYXQgPT09ICdoZXg2Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleFN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoZXgzJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleFN0cmluZyh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaGV4NCcpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9IZXg4U3RyaW5nKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoZXg4Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleDhTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnbmFtZScpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9OYW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hzbCcpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9Ic2xTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaHN2Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hzdlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWRTdHJpbmcgfHwgdGhpcy50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IodGhpcy50b1N0cmluZygpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlnaHRlbiB0aGUgY29sb3IgYSBnaXZlbiBhbW91bnQuIFByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIHdoaXRlLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgbGlnaHRlbihhbW91bnQgPSAxMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGhzbC5sICs9IGFtb3VudCAvIDEwMDtcbiAgICAgICAgaHNsLmwgPSBjbGFtcDAxKGhzbC5sKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQnJpZ2h0ZW4gdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgYnJpZ2h0ZW4oYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgcmdiID0gdGhpcy50b1JnYigpO1xuICAgICAgICByZ2IuciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcmdiLnIgLSBNYXRoLnJvdW5kKDI1NSAqIC0oYW1vdW50IC8gMTAwKSkpKTtcbiAgICAgICAgcmdiLmcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHJnYi5nIC0gTWF0aC5yb3VuZCgyNTUgKiAtKGFtb3VudCAvIDEwMCkpKSk7XG4gICAgICAgIHJnYi5iID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByZ2IuYiAtIE1hdGgucm91bmQoMjU1ICogLShhbW91bnQgLyAxMDApKSkpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihyZ2IpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEYXJrZW4gdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIFByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIGJsYWNrLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgZGFya2VuKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLmwgLT0gYW1vdW50IC8gMTAwO1xuICAgICAgICBoc2wubCA9IGNsYW1wMDEoaHNsLmwpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNaXggdGhlIGNvbG9yIHdpdGggcHVyZSB3aGl0ZSwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBQcm92aWRpbmcgMCB3aWxsIGRvIG5vdGhpbmcsIHByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIHdoaXRlLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgdGludChhbW91bnQgPSAxMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taXgoJ3doaXRlJywgYW1vdW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWl4IHRoZSBjb2xvciB3aXRoIHB1cmUgYmxhY2ssIGZyb20gMCB0byAxMDAuXG4gICAgICogUHJvdmlkaW5nIDAgd2lsbCBkbyBub3RoaW5nLCBwcm92aWRpbmcgMTAwIHdpbGwgYWx3YXlzIHJldHVybiBibGFjay5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIHNoYWRlKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1peCgnYmxhY2snLCBhbW91bnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZXNhdHVyYXRlIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudCwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBQcm92aWRpbmcgMTAwIHdpbGwgaXMgdGhlIHNhbWUgYXMgY2FsbGluZyBncmV5c2NhbGVcbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIGRlc2F0dXJhdGUoYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wucyAtPSBhbW91bnQgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAwMShoc2wucyk7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNhdHVyYXRlIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudCwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIHNhdHVyYXRlKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLnMgKz0gYW1vdW50IC8gMTAwO1xuICAgICAgICBoc2wucyA9IGNsYW1wMDEoaHNsLnMpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21wbGV0ZWx5IGRlc2F0dXJhdGVzIGEgY29sb3IgaW50byBncmV5c2NhbGUuXG4gICAgICogU2FtZSBhcyBjYWxsaW5nIGBkZXNhdHVyYXRlKDEwMClgXG4gICAgICovXG4gICAgZ3JleXNjYWxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNhdHVyYXRlKDEwMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNwaW4gdGFrZXMgYSBwb3NpdGl2ZSBvciBuZWdhdGl2ZSBhbW91bnQgd2l0aGluIFstMzYwLCAzNjBdIGluZGljYXRpbmcgdGhlIGNoYW5nZSBvZiBodWUuXG4gICAgICogVmFsdWVzIG91dHNpZGUgb2YgdGhpcyByYW5nZSB3aWxsIGJlIHdyYXBwZWQgaW50byB0aGlzIHJhbmdlLlxuICAgICAqL1xuICAgIHNwaW4oYW1vdW50KSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgaHVlID0gKGhzbC5oICsgYW1vdW50KSAlIDM2MDtcbiAgICAgICAgaHNsLmggPSBodWUgPCAwID8gMzYwICsgaHVlIDogaHVlO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICBtaXgoY29sb3IsIGFtb3VudCA9IDUwKSB7XG4gICAgICAgIGNvbnN0IHJnYjEgPSB0aGlzLnRvUmdiKCk7XG4gICAgICAgIGNvbnN0IHJnYjIgPSBuZXcgVGlueUNvbG9yKGNvbG9yKS50b1JnYigpO1xuICAgICAgICBjb25zdCBwID0gYW1vdW50IC8gMTAwO1xuICAgICAgICBjb25zdCByZ2JhID0ge1xuICAgICAgICAgICAgcjogKHJnYjIuciAtIHJnYjEucikgKiBwICsgcmdiMS5yLFxuICAgICAgICAgICAgZzogKHJnYjIuZyAtIHJnYjEuZykgKiBwICsgcmdiMS5nLFxuICAgICAgICAgICAgYjogKHJnYjIuYiAtIHJnYjEuYikgKiBwICsgcmdiMS5iLFxuICAgICAgICAgICAgYTogKHJnYjIuYSAtIHJnYjEuYSkgKiBwICsgcmdiMS5hLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihyZ2JhKTtcbiAgICB9XG4gICAgYW5hbG9nb3VzKHJlc3VsdHMgPSA2LCBzbGljZXMgPSAzMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGNvbnN0IHBhcnQgPSAzNjAgLyBzbGljZXM7XG4gICAgICAgIGNvbnN0IHJldCA9IFt0aGlzXTtcbiAgICAgICAgZm9yIChoc2wuaCA9IChoc2wuaCAtICgocGFydCAqIHJlc3VsdHMpID4+IDEpICsgNzIwKSAlIDM2MDsgLS1yZXN1bHRzOykge1xuICAgICAgICAgICAgaHNsLmggPSAoaHNsLmggKyBwYXJ0KSAlIDM2MDtcbiAgICAgICAgICAgIHJldC5wdXNoKG5ldyBUaW55Q29sb3IoaHNsKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vaW5mdXNpb24valF1ZXJ5LXhjb2xvci9ibG9iL21hc3Rlci9qcXVlcnkueGNvbG9yLmpzXG4gICAgICovXG4gICAgY29tcGxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wuaCA9IChoc2wuaCArIDE4MCkgJSAzNjA7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIG1vbm9jaHJvbWF0aWMocmVzdWx0cyA9IDYpIHtcbiAgICAgICAgY29uc3QgaHN2ID0gdGhpcy50b0hzdigpO1xuICAgICAgICBjb25zdCBoID0gaHN2Lmg7XG4gICAgICAgIGNvbnN0IHMgPSBoc3YucztcbiAgICAgICAgbGV0IHYgPSBoc3YudjtcbiAgICAgICAgY29uc3QgcmVzID0gW107XG4gICAgICAgIGNvbnN0IG1vZGlmaWNhdGlvbiA9IDEgLyByZXN1bHRzO1xuICAgICAgICB3aGlsZSAocmVzdWx0cy0tKSB7XG4gICAgICAgICAgICByZXMucHVzaChuZXcgVGlueUNvbG9yKHsgaCwgcywgdiB9KSk7XG4gICAgICAgICAgICB2ID0gKHYgKyBtb2RpZmljYXRpb24pICUgMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBzcGxpdGNvbXBsZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgaCA9IGhzbC5oO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIG5ldyBUaW55Q29sb3IoeyBoOiAoaCArIDcyKSAlIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sIH0pLFxuICAgICAgICAgICAgbmV3IFRpbnlDb2xvcih7IGg6IChoICsgMjE2KSAlIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sIH0pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICB0cmlhZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9seWFkKDMpO1xuICAgIH1cbiAgICB0ZXRyYWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvbHlhZCg0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IHBvbHlhZCBjb2xvcnMsIGxpa2UgKGZvciAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCBldGMuLi4pXG4gICAgICogbW9uYWQsIGR5YWQsIHRyaWFkLCB0ZXRyYWQsIHBlbnRhZCwgaGV4YWQsIGhlcHRhZCwgb2N0YWQsIGV0Yy4uLlxuICAgICAqL1xuICAgIHBvbHlhZChuKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgaCA9IGhzbC5oO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbdGhpc107XG4gICAgICAgIGNvbnN0IGluY3JlbWVudCA9IDM2MCAvIG47XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGlueUNvbG9yKHsgaDogKGggKyBpICogaW5jcmVtZW50KSAlIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBjb21wYXJlIGNvbG9yIHZzIGN1cnJlbnQgY29sb3JcbiAgICAgKi9cbiAgICBlcXVhbHMoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9SZ2JTdHJpbmcoKSA9PT0gbmV3IFRpbnlDb2xvcihjb2xvcikudG9SZ2JTdHJpbmcoKTtcbiAgICB9XG59XG5cbi8vIFJlYWRhYmlsaXR5IEZ1bmN0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyA8aHR0cDovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMtV0NBRzIwLTIwMDgxMjExLyNjb250cmFzdC1yYXRpb2RlZiAoV0NBRyBWZXJzaW9uIDIpXG4vKipcbiAqIEFLQSBgY29udHJhc3RgXG4gKlxuICogQW5hbHl6ZSB0aGUgMiBjb2xvcnMgYW5kIHJldHVybnMgdGhlIGNvbG9yIGNvbnRyYXN0IGRlZmluZWQgYnkgKFdDQUcgVmVyc2lvbiAyKVxuICovXG5mdW5jdGlvbiByZWFkYWJpbGl0eShjb2xvcjEsIGNvbG9yMikge1xuICAgIGNvbnN0IGMxID0gbmV3IFRpbnlDb2xvcihjb2xvcjEpO1xuICAgIGNvbnN0IGMyID0gbmV3IFRpbnlDb2xvcihjb2xvcjIpO1xuICAgIHJldHVybiAoKE1hdGgubWF4KGMxLmdldEx1bWluYW5jZSgpLCBjMi5nZXRMdW1pbmFuY2UoKSkgKyAwLjA1KSAvXG4gICAgICAgIChNYXRoLm1pbihjMS5nZXRMdW1pbmFuY2UoKSwgYzIuZ2V0THVtaW5hbmNlKCkpICsgMC4wNSkpO1xufVxuLyoqXG4gKiBFbnN1cmUgdGhhdCBmb3JlZ3JvdW5kIGFuZCBiYWNrZ3JvdW5kIGNvbG9yIGNvbWJpbmF0aW9ucyBtZWV0IFdDQUcyIGd1aWRlbGluZXMuXG4gKiBUaGUgdGhpcmQgYXJndW1lbnQgaXMgYW4gb2JqZWN0LlxuICogICAgICB0aGUgJ2xldmVsJyBwcm9wZXJ0eSBzdGF0ZXMgJ0FBJyBvciAnQUFBJyAtIGlmIG1pc3Npbmcgb3IgaW52YWxpZCwgaXQgZGVmYXVsdHMgdG8gJ0FBJztcbiAqICAgICAgdGhlICdzaXplJyBwcm9wZXJ0eSBzdGF0ZXMgJ2xhcmdlJyBvciAnc21hbGwnIC0gaWYgbWlzc2luZyBvciBpbnZhbGlkLCBpdCBkZWZhdWx0cyB0byAnc21hbGwnLlxuICogSWYgdGhlIGVudGlyZSBvYmplY3QgaXMgYWJzZW50LCBpc1JlYWRhYmxlIGRlZmF1bHRzIHRvIHtsZXZlbDpcIkFBXCIsc2l6ZTpcInNtYWxsXCJ9LlxuICpcbiAqIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBuZXcgVGlueUNvbG9yKCkuaXNSZWFkYWJsZSgnIzAwMCcsICcjMTExJykgPT4gZmFsc2VcbiAqIG5ldyBUaW55Q29sb3IoKS5pc1JlYWRhYmxlKCcjMDAwJywgJyMxMTEnLCB7IGxldmVsOiAnQUEnLCBzaXplOiAnbGFyZ2UnIH0pID0+IGZhbHNlXG4gKiBgYGBcbiAqL1xuZnVuY3Rpb24gaXNSZWFkYWJsZShjb2xvcjEsIGNvbG9yMiwgd2NhZzIgPSB7IGxldmVsOiAnQUEnLCBzaXplOiAnc21hbGwnIH0pIHtcbiAgICBjb25zdCByZWFkYWJpbGl0eUxldmVsID0gcmVhZGFiaWxpdHkoY29sb3IxLCBjb2xvcjIpO1xuICAgIHN3aXRjaCAoKHdjYWcyLmxldmVsIHx8ICdBQScpICsgKHdjYWcyLnNpemUgfHwgJ3NtYWxsJykpIHtcbiAgICAgICAgY2FzZSAnQUFzbWFsbCc6XG4gICAgICAgIGNhc2UgJ0FBQWxhcmdlJzpcbiAgICAgICAgICAgIHJldHVybiByZWFkYWJpbGl0eUxldmVsID49IDQuNTtcbiAgICAgICAgY2FzZSAnQUFsYXJnZSc6XG4gICAgICAgICAgICByZXR1cm4gcmVhZGFiaWxpdHlMZXZlbCA+PSAzO1xuICAgICAgICBjYXNlICdBQUFzbWFsbCc6XG4gICAgICAgICAgICByZXR1cm4gcmVhZGFiaWxpdHlMZXZlbCA+PSA3O1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4vKipcbiAqIEdpdmVuIGEgYmFzZSBjb2xvciBhbmQgYSBsaXN0IG9mIHBvc3NpYmxlIGZvcmVncm91bmQgb3IgYmFja2dyb3VuZFxuICogY29sb3JzIGZvciB0aGF0IGJhc2UsIHJldHVybnMgdGhlIG1vc3QgcmVhZGFibGUgY29sb3IuXG4gKiBPcHRpb25hbGx5IHJldHVybnMgQmxhY2sgb3IgV2hpdGUgaWYgdGhlIG1vc3QgcmVhZGFibGUgY29sb3IgaXMgdW5yZWFkYWJsZS5cbiAqXG4gKiBAcGFyYW0gYmFzZUNvbG9yIC0gdGhlIGJhc2UgY29sb3IuXG4gKiBAcGFyYW0gY29sb3JMaXN0IC0gYXJyYXkgb2YgY29sb3JzIHRvIHBpY2sgdGhlIG1vc3QgcmVhZGFibGUgb25lIGZyb20uXG4gKiBAcGFyYW0gYXJncyAtIGFuZCBvYmplY3Qgd2l0aCBleHRyYSBhcmd1bWVudHNcbiAqXG4gKiBFeGFtcGxlXG4gKiBgYGB0c1xuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnIzEyMycsIFsnIzEyNFwiLCBcIiMxMjUnXSwgeyBpbmNsdWRlRmFsbGJhY2tDb2xvcnM6IGZhbHNlIH0pLnRvSGV4U3RyaW5nKCk7IC8vIFwiIzExMjI1NVwiXG4gKiBuZXcgVGlueUNvbG9yKCkubW9zdFJlYWRhYmxlKCcjMTIzJywgWycjMTI0XCIsIFwiIzEyNSddLHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOiB0cnVlIH0pLnRvSGV4U3RyaW5nKCk7ICAvLyBcIiNmZmZmZmZcIlxuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnI2E4MDE1YScsIFtcIiNmYWYzZjNcIl0sIHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOnRydWUsIGxldmVsOiAnQUFBJywgc2l6ZTogJ2xhcmdlJyB9KS50b0hleFN0cmluZygpOyAvLyBcIiNmYWYzZjNcIlxuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnI2E4MDE1YScsIFtcIiNmYWYzZjNcIl0sIHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOnRydWUsIGxldmVsOiAnQUFBJywgc2l6ZTogJ3NtYWxsJyB9KS50b0hleFN0cmluZygpOyAvLyBcIiNmZmZmZmZcIlxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIG1vc3RSZWFkYWJsZShiYXNlQ29sb3IsIGNvbG9yTGlzdCwgYXJncyA9IHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOiBmYWxzZSwgbGV2ZWw6ICdBQScsIHNpemU6ICdzbWFsbCcgfSkge1xuICAgIGxldCBiZXN0Q29sb3IgPSBudWxsO1xuICAgIGxldCBiZXN0U2NvcmUgPSAwO1xuICAgIGNvbnN0IGluY2x1ZGVGYWxsYmFja0NvbG9ycyA9IGFyZ3MuaW5jbHVkZUZhbGxiYWNrQ29sb3JzO1xuICAgIGNvbnN0IGxldmVsID0gYXJncy5sZXZlbDtcbiAgICBjb25zdCBzaXplID0gYXJncy5zaXplO1xuICAgIGZvciAoY29uc3QgY29sb3Igb2YgY29sb3JMaXN0KSB7XG4gICAgICAgIGNvbnN0IHNjb3JlID0gcmVhZGFiaWxpdHkoYmFzZUNvbG9yLCBjb2xvcik7XG4gICAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgICBiZXN0Q29sb3IgPSBuZXcgVGlueUNvbG9yKGNvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNSZWFkYWJsZShiYXNlQ29sb3IsIGJlc3RDb2xvciwgeyBsZXZlbCwgc2l6ZSB9KSB8fCAhaW5jbHVkZUZhbGxiYWNrQ29sb3JzKSB7XG4gICAgICAgIHJldHVybiBiZXN0Q29sb3I7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhcmdzLmluY2x1ZGVGYWxsYmFja0NvbG9ycyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gbW9zdFJlYWRhYmxlKGJhc2VDb2xvciwgWycjZmZmJywgJyMwMDAnXSwgYXJncyk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbG9yIHJlcHJlc2VudGVkIGFzIGEgTWljcm9zb2Z0IGZpbHRlciBmb3IgdXNlIGluIG9sZCB2ZXJzaW9ucyBvZiBJRS5cbiAqL1xuZnVuY3Rpb24gdG9Nc0ZpbHRlcihmaXJzdENvbG9yLCBzZWNvbmRDb2xvcikge1xuICAgIGNvbnN0IGNvbG9yID0gbmV3IFRpbnlDb2xvcihmaXJzdENvbG9yKTtcbiAgICBjb25zdCBoZXg4U3RyaW5nID0gJyMnICsgcmdiYVRvQXJnYkhleChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iLCBjb2xvci5hKTtcbiAgICBsZXQgc2Vjb25kSGV4OFN0cmluZyA9IGhleDhTdHJpbmc7XG4gICAgY29uc3QgZ3JhZGllbnRUeXBlID0gY29sb3IuZ3JhZGllbnRUeXBlID8gJ0dyYWRpZW50VHlwZSA9IDEsICcgOiAnJztcbiAgICBpZiAoc2Vjb25kQ29sb3IpIHtcbiAgICAgICAgY29uc3QgcyA9IG5ldyBUaW55Q29sb3Ioc2Vjb25kQ29sb3IpO1xuICAgICAgICBzZWNvbmRIZXg4U3RyaW5nID0gJyMnICsgcmdiYVRvQXJnYkhleChzLnIsIHMuZywgcy5iLCBzLmEpO1xuICAgIH1cbiAgICByZXR1cm4gYHByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5ncmFkaWVudCgke2dyYWRpZW50VHlwZX1zdGFydENvbG9yc3RyPSR7aGV4OFN0cmluZ30sZW5kQ29sb3JzdHI9JHtzZWNvbmRIZXg4U3RyaW5nfSlgO1xufVxuXG4vKipcbiAqIElmIGlucHV0IGlzIGFuIG9iamVjdCwgZm9yY2UgMSBpbnRvIFwiMS4wXCIgdG8gaGFuZGxlIHJhdGlvcyBwcm9wZXJseVxuICogU3RyaW5nIGlucHV0IHJlcXVpcmVzIFwiMS4wXCIgYXMgaW5wdXQsIHNvIDEgd2lsbCBiZSB0cmVhdGVkIGFzIDFcbiAqL1xuZnVuY3Rpb24gZnJvbVJhdGlvKHJhdGlvLCBvcHRzKSB7XG4gICAgY29uc3QgbmV3Q29sb3IgPSB7XG4gICAgICAgIHI6IGNvbnZlcnRUb1BlcmNlbnRhZ2UocmF0aW8uciksXG4gICAgICAgIGc6IGNvbnZlcnRUb1BlcmNlbnRhZ2UocmF0aW8uZyksXG4gICAgICAgIGI6IGNvbnZlcnRUb1BlcmNlbnRhZ2UocmF0aW8uYiksXG4gICAgfTtcbiAgICBpZiAocmF0aW8uYSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5ld0NvbG9yLmEgPSArcmF0aW8uYTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUaW55Q29sb3IobmV3Q29sb3IsIG9wdHMpO1xufVxuLyoqIG9sZCByYW5kb20gZnVuY3Rpb24gKi9cbmZ1bmN0aW9uIGxlZ2FjeVJhbmRvbSgpIHtcbiAgICByZXR1cm4gbmV3IFRpbnlDb2xvcih7XG4gICAgICAgIHI6IE1hdGgucmFuZG9tKCksXG4gICAgICAgIGc6IE1hdGgucmFuZG9tKCksXG4gICAgICAgIGI6IE1hdGgucmFuZG9tKCksXG4gICAgfSk7XG59XG5cbi8vIHJhbmRvbUNvbG9yIGJ5IERhdmlkIE1lcmZpZWxkIHVuZGVyIHRoZSBDQzAgbGljZW5zZVxuZnVuY3Rpb24gcmFuZG9tKG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gZ2VuZXJhdGUgbXVsdGlwbGUgY29sb3JzXG4gICAgaWYgKG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmNvdW50ICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsQ29sb3JzID0gb3B0aW9ucy5jb3VudDtcbiAgICAgICAgY29uc3QgY29sb3JzID0gW107XG4gICAgICAgIG9wdGlvbnMuY291bnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHdoaWxlICh0b3RhbENvbG9ycyA+IGNvbG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIFNpbmNlIHdlJ3JlIGdlbmVyYXRpbmcgbXVsdGlwbGUgY29sb3JzLFxuICAgICAgICAgICAgLy8gaW5jcmVtZW1lbnQgdGhlIHNlZWQuIE90aGVyd2lzZSB3ZSdkIGp1c3RcbiAgICAgICAgICAgIC8vIGdlbmVyYXRlIHRoZSBzYW1lIGNvbG9yIGVhY2ggdGltZS4uLlxuICAgICAgICAgICAgb3B0aW9ucy5jb3VudCA9IG51bGw7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zZWVkKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zZWVkICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb2xvcnMucHVzaChyYW5kb20ob3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMuY291bnQgPSB0b3RhbENvbG9ycztcbiAgICAgICAgcmV0dXJuIGNvbG9ycztcbiAgICB9XG4gICAgLy8gRmlyc3Qgd2UgcGljayBhIGh1ZSAoSClcbiAgICBjb25zdCBoID0gcGlja0h1ZShvcHRpb25zLmh1ZSwgb3B0aW9ucy5zZWVkKTtcbiAgICAvLyBUaGVuIHVzZSBIIHRvIGRldGVybWluZSBzYXR1cmF0aW9uIChTKVxuICAgIGNvbnN0IHMgPSBwaWNrU2F0dXJhdGlvbihoLCBvcHRpb25zKTtcbiAgICAvLyBUaGVuIHVzZSBTIGFuZCBIIHRvIGRldGVybWluZSBicmlnaHRuZXNzIChCKS5cbiAgICBjb25zdCB2ID0gcGlja0JyaWdodG5lc3MoaCwgcywgb3B0aW9ucyk7XG4gICAgY29uc3QgcmVzID0geyBoLCBzLCB2IH07XG4gICAgaWYgKG9wdGlvbnMuYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXMuYSA9IG9wdGlvbnMuYWxwaGE7XG4gICAgfVxuICAgIC8vIFRoZW4gd2UgcmV0dXJuIHRoZSBIU0IgY29sb3IgaW4gdGhlIGRlc2lyZWQgZm9ybWF0XG4gICAgcmV0dXJuIG5ldyBUaW55Q29sb3IocmVzKTtcbn1cbmZ1bmN0aW9uIHBpY2tIdWUoaHVlLCBzZWVkKSB7XG4gICAgY29uc3QgaHVlUmFuZ2UgPSBnZXRIdWVSYW5nZShodWUpO1xuICAgIGxldCByZXMgPSByYW5kb21XaXRoaW4oaHVlUmFuZ2UsIHNlZWQpO1xuICAgIC8vIEluc3RlYWQgb2Ygc3RvcmluZyByZWQgYXMgdHdvIHNlcGVyYXRlIHJhbmdlcyxcbiAgICAvLyB3ZSBncm91cCB0aGVtLCB1c2luZyBuZWdhdGl2ZSBudW1iZXJzXG4gICAgaWYgKHJlcyA8IDApIHtcbiAgICAgICAgcmVzID0gMzYwICsgcmVzO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gcGlja1NhdHVyYXRpb24oaHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuaHVlID09PSAnbW9ub2Nocm9tZScpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmx1bWlub3NpdHkgPT09ICdyYW5kb20nKSB7XG4gICAgICAgIHJldHVybiByYW5kb21XaXRoaW4oWzAsIDEwMF0sIG9wdGlvbnMuc2VlZCk7XG4gICAgfVxuICAgIGNvbnN0IHNhdHVyYXRpb25SYW5nZSA9IGdldENvbG9ySW5mbyhodWUpLnNhdHVyYXRpb25SYW5nZTtcbiAgICBsZXQgc01pbiA9IHNhdHVyYXRpb25SYW5nZVswXTtcbiAgICBsZXQgc01heCA9IHNhdHVyYXRpb25SYW5nZVsxXTtcbiAgICBzd2l0Y2ggKG9wdGlvbnMubHVtaW5vc2l0eSkge1xuICAgICAgICBjYXNlICdicmlnaHQnOlxuICAgICAgICAgICAgc01pbiA9IDU1O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2RhcmsnOlxuICAgICAgICAgICAgc01pbiA9IHNNYXggLSAxMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaWdodCc6XG4gICAgICAgICAgICBzTWF4ID0gNTU7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJhbmRvbVdpdGhpbihbc01pbiwgc01heF0sIG9wdGlvbnMuc2VlZCk7XG59XG5mdW5jdGlvbiBwaWNrQnJpZ2h0bmVzcyhILCBTLCBvcHRpb25zKSB7XG4gICAgbGV0IGJNaW4gPSBnZXRNaW5pbXVtQnJpZ2h0bmVzcyhILCBTKTtcbiAgICBsZXQgYk1heCA9IDEwMDtcbiAgICBzd2l0Y2ggKG9wdGlvbnMubHVtaW5vc2l0eSkge1xuICAgICAgICBjYXNlICdkYXJrJzpcbiAgICAgICAgICAgIGJNYXggPSBiTWluICsgMjA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbGlnaHQnOlxuICAgICAgICAgICAgYk1pbiA9IChiTWF4ICsgYk1pbikgLyAyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JhbmRvbSc6XG4gICAgICAgICAgICBiTWluID0gMDtcbiAgICAgICAgICAgIGJNYXggPSAxMDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJhbmRvbVdpdGhpbihbYk1pbiwgYk1heF0sIG9wdGlvbnMuc2VlZCk7XG59XG5mdW5jdGlvbiBnZXRNaW5pbXVtQnJpZ2h0bmVzcyhILCBTKSB7XG4gICAgY29uc3QgbG93ZXJCb3VuZHMgPSBnZXRDb2xvckluZm8oSCkubG93ZXJCb3VuZHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb3dlckJvdW5kcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgY29uc3QgczEgPSBsb3dlckJvdW5kc1tpXVswXTtcbiAgICAgICAgY29uc3QgdjEgPSBsb3dlckJvdW5kc1tpXVsxXTtcbiAgICAgICAgY29uc3QgczIgPSBsb3dlckJvdW5kc1tpICsgMV1bMF07XG4gICAgICAgIGNvbnN0IHYyID0gbG93ZXJCb3VuZHNbaSArIDFdWzFdO1xuICAgICAgICBpZiAoUyA+PSBzMSAmJiBTIDw9IHMyKSB7XG4gICAgICAgICAgICBjb25zdCBtID0gKHYyIC0gdjEpIC8gKHMyIC0gczEpO1xuICAgICAgICAgICAgY29uc3QgYiA9IHYxIC0gbSAqIHMxO1xuICAgICAgICAgICAgcmV0dXJuIG0gKiBTICsgYjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGdldEh1ZVJhbmdlKGNvbG9ySW5wdXQpIHtcbiAgICBjb25zdCBudW0gPSBwYXJzZUludChjb2xvcklucHV0LCAxMCk7XG4gICAgaWYgKCFOdW1iZXIuaXNOYU4obnVtKSAmJiBudW0gPCAzNjAgJiYgbnVtID4gMCkge1xuICAgICAgICByZXR1cm4gW251bSwgbnVtXTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjb2xvcklucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBuYW1lZENvbG9yID0gYm91bmRzLmZpbmQobiA9PiBuLm5hbWUgPT09IGNvbG9ySW5wdXQpO1xuICAgICAgICBpZiAobmFtZWRDb2xvcikge1xuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBkZWZpbmVDb2xvcihuYW1lZENvbG9yKTtcbiAgICAgICAgICAgIGlmIChjb2xvci5odWVSYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvci5odWVSYW5nZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVGlueUNvbG9yKGNvbG9ySW5wdXQpO1xuICAgICAgICBpZiAocGFyc2VkLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGh1ZSA9IHBhcnNlZC50b0hzdigpLmg7XG4gICAgICAgICAgICByZXR1cm4gW2h1ZSwgaHVlXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gWzAsIDM2MF07XG59XG5mdW5jdGlvbiBnZXRDb2xvckluZm8oaHVlKSB7XG4gICAgLy8gTWFwcyByZWQgY29sb3JzIHRvIG1ha2UgcGlja2luZyBodWUgZWFzaWVyXG4gICAgaWYgKGh1ZSA+PSAzMzQgJiYgaHVlIDw9IDM2MCkge1xuICAgICAgICBodWUgLT0gMzYwO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGJvdW5kIG9mIGJvdW5kcykge1xuICAgICAgICBjb25zdCBjb2xvciA9IGRlZmluZUNvbG9yKGJvdW5kKTtcbiAgICAgICAgaWYgKGNvbG9yLmh1ZVJhbmdlICYmIGh1ZSA+PSBjb2xvci5odWVSYW5nZVswXSAmJiBodWUgPD0gY29sb3IuaHVlUmFuZ2VbMV0pIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBFcnJvcignQ29sb3Igbm90IGZvdW5kJyk7XG59XG5mdW5jdGlvbiByYW5kb21XaXRoaW4ocmFuZ2UsIHNlZWQpIHtcbiAgICBpZiAoc2VlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHJhbmdlWzBdICsgTWF0aC5yYW5kb20oKSAqIChyYW5nZVsxXSArIDEgLSByYW5nZVswXSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gU2VlZGVkIHJhbmRvbSBhbGdvcml0aG0gZnJvbSBodHRwOi8vaW5kaWVnYW1yLmNvbS9nZW5lcmF0ZS1yZXBlYXRhYmxlLXJhbmRvbS1udW1iZXJzLWluLWpzL1xuICAgICAgICBjb25zdCBtYXggPSByYW5nZVsxXSB8fCAxO1xuICAgICAgICBjb25zdCBtaW4gPSByYW5nZVswXSB8fCAwO1xuICAgICAgICBzZWVkID0gKHNlZWQgKiA5MzAxICsgNDkyOTcpICUgMjMzMjgwO1xuICAgICAgICBjb25zdCBybmQgPSBzZWVkIC8gMjMzMjgwLjA7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG1pbiArIHJuZCAqIChtYXggLSBtaW4pKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZWZpbmVDb2xvcihib3VuZCkge1xuICAgIGNvbnN0IHNNaW4gPSBib3VuZC5sb3dlckJvdW5kc1swXVswXTtcbiAgICBjb25zdCBzTWF4ID0gYm91bmQubG93ZXJCb3VuZHNbYm91bmQubG93ZXJCb3VuZHMubGVuZ3RoIC0gMV1bMF07XG4gICAgY29uc3QgYk1pbiA9IGJvdW5kLmxvd2VyQm91bmRzW2JvdW5kLmxvd2VyQm91bmRzLmxlbmd0aCAtIDFdWzFdO1xuICAgIGNvbnN0IGJNYXggPSBib3VuZC5sb3dlckJvdW5kc1swXVsxXTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBib3VuZC5uYW1lLFxuICAgICAgICBodWVSYW5nZTogYm91bmQuaHVlUmFuZ2UsXG4gICAgICAgIGxvd2VyQm91bmRzOiBib3VuZC5sb3dlckJvdW5kcyxcbiAgICAgICAgc2F0dXJhdGlvblJhbmdlOiBbc01pbiwgc01heF0sXG4gICAgICAgIGJyaWdodG5lc3NSYW5nZTogW2JNaW4sIGJNYXhdLFxuICAgIH07XG59XG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuY29uc3QgYm91bmRzID0gW1xuICAgIHtcbiAgICAgICAgbmFtZTogJ21vbm9jaHJvbWUnLFxuICAgICAgICBodWVSYW5nZTogbnVsbCxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMCwgMF0sIFsxMDAsIDBdXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3JlZCcsXG4gICAgICAgIGh1ZVJhbmdlOiBbLTI2LCAxOF0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbXG4gICAgICAgICAgICBbMjAsIDEwMF0sXG4gICAgICAgICAgICBbMzAsIDkyXSxcbiAgICAgICAgICAgIFs0MCwgODldLFxuICAgICAgICAgICAgWzUwLCA4NV0sXG4gICAgICAgICAgICBbNjAsIDc4XSxcbiAgICAgICAgICAgIFs3MCwgNzBdLFxuICAgICAgICAgICAgWzgwLCA2MF0sXG4gICAgICAgICAgICBbOTAsIDU1XSxcbiAgICAgICAgICAgIFsxMDAsIDUwXSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ29yYW5nZScsXG4gICAgICAgIGh1ZVJhbmdlOiBbMTksIDQ2XSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMjAsIDEwMF0sIFszMCwgOTNdLCBbNDAsIDg4XSwgWzUwLCA4Nl0sIFs2MCwgODVdLCBbNzAsIDcwXSwgWzEwMCwgNzBdXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3llbGxvdycsXG4gICAgICAgIGh1ZVJhbmdlOiBbNDcsIDYyXSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMjUsIDEwMF0sIFs0MCwgOTRdLCBbNTAsIDg5XSwgWzYwLCA4Nl0sIFs3MCwgODRdLCBbODAsIDgyXSwgWzkwLCA4MF0sIFsxMDAsIDc1XV0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdncmVlbicsXG4gICAgICAgIGh1ZVJhbmdlOiBbNjMsIDE3OF0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbWzMwLCAxMDBdLCBbNDAsIDkwXSwgWzUwLCA4NV0sIFs2MCwgODFdLCBbNzAsIDc0XSwgWzgwLCA2NF0sIFs5MCwgNTBdLCBbMTAwLCA0MF1dLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnYmx1ZScsXG4gICAgICAgIGh1ZVJhbmdlOiBbMTc5LCAyNTddLFxuICAgICAgICBsb3dlckJvdW5kczogW1xuICAgICAgICAgICAgWzIwLCAxMDBdLFxuICAgICAgICAgICAgWzMwLCA4Nl0sXG4gICAgICAgICAgICBbNDAsIDgwXSxcbiAgICAgICAgICAgIFs1MCwgNzRdLFxuICAgICAgICAgICAgWzYwLCA2MF0sXG4gICAgICAgICAgICBbNzAsIDUyXSxcbiAgICAgICAgICAgIFs4MCwgNDRdLFxuICAgICAgICAgICAgWzkwLCAzOV0sXG4gICAgICAgICAgICBbMTAwLCAzNV0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdwdXJwbGUnLFxuICAgICAgICBodWVSYW5nZTogWzI1OCwgMjgyXSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtcbiAgICAgICAgICAgIFsyMCwgMTAwXSxcbiAgICAgICAgICAgIFszMCwgODddLFxuICAgICAgICAgICAgWzQwLCA3OV0sXG4gICAgICAgICAgICBbNTAsIDcwXSxcbiAgICAgICAgICAgIFs2MCwgNjVdLFxuICAgICAgICAgICAgWzcwLCA1OV0sXG4gICAgICAgICAgICBbODAsIDUyXSxcbiAgICAgICAgICAgIFs5MCwgNDVdLFxuICAgICAgICAgICAgWzEwMCwgNDJdLFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncGluaycsXG4gICAgICAgIGh1ZVJhbmdlOiBbMjgzLCAzMzRdLFxuICAgICAgICBsb3dlckJvdW5kczogW1syMCwgMTAwXSwgWzMwLCA5MF0sIFs0MCwgODZdLCBbNjAsIDg0XSwgWzgwLCA4MF0sIFs5MCwgNzVdLCBbMTAwLCA3M11dLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgeyBUaW55Q29sb3IsIG5hbWVzLCByZWFkYWJpbGl0eSwgaXNSZWFkYWJsZSwgbW9zdFJlYWRhYmxlLCB0b01zRmlsdGVyLCBmcm9tUmF0aW8sIGxlZ2FjeVJhbmRvbSwgaW5wdXRUb1JHQiwgc3RyaW5nSW5wdXRUb09iamVjdCwgaXNWYWxpZENTU1VuaXQsIHJhbmRvbSwgYm91bmRzIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aW55Y29sb3IuZXMyMDE1LmpzLm1hcFxuIiwiY29uc3QgY3Vyc29yID0gYFxuICA8c3ZnIGNsYXNzPVwiaWNvbi1jdXJzb3JcIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMzIgMzJcIj5cbiAgICA8cGF0aCBkPVwiTTE2LjY4OSAxNy42NTVsNS4zMTEgMTIuMzQ1LTQgMi00LjY0Ni0xMi42NzgtNy4zNTQgNi42Nzh2LTI2bDIwIDE2LTkuMzExIDEuNjU1elwiPjwvcGF0aD5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IG1vdmUgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTE1IDcuNVYySDl2NS41bDMgMyAzLTN6TTcuNSA5SDJ2Nmg1LjVsMy0zLTMtM3pNOSAxNi41VjIyaDZ2LTUuNWwtMy0zLTMgM3pNMTYuNSA5bC0zIDMgMyAzSDIyVjloLTUuNXpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBzZWFyY2ggPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgbWFyZ2luID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk05IDdIN3YyaDJWN3ptMCA0SDd2Mmgydi0yem0wLThjLTEuMTEgMC0yIC45LTIgMmgyVjN6bTQgMTJoLTJ2Mmgydi0yem02LTEydjJoMmMwLTEuMS0uOS0yLTItMnptLTYgMGgtMnYyaDJWM3pNOSAxN3YtMkg3YzAgMS4xLjg5IDIgMiAyem0xMC00aDJ2LTJoLTJ2MnptMC00aDJWN2gtMnYyem0wIDhjMS4xIDAgMi0uOSAyLTJoLTJ2MnpNNSA3SDN2MTJjMCAxLjEuODkgMiAyIDJoMTJ2LTJINVY3em0xMC0yaDJWM2gtMnYyem0wIDEyaDJ2LTJoLTJ2MnpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBwYWRkaW5nID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0zIDEzaDJ2LTJIM3Yyem0wIDRoMnYtMkgzdjJ6bTIgNHYtMkgzYzAgMS4xLjg5IDIgMiAyek0zIDloMlY3SDN2MnptMTIgMTJoMnYtMmgtMnYyem00LTE4SDljLTEuMTEgMC0yIC45LTIgMnYxMGMwIDEuMS44OSAyIDIgMmgxMGMxLjEgMCAyLS45IDItMlY1YzAtMS4xLS45LTItMi0yem0wIDEySDlWNWgxMHYxMHptLTggNmgydi0yaC0ydjJ6bS00IDBoMnYtMkg3djJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgZm9udCA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNOSA0djNoNXYxMmgzVjdoNVY0SDl6bS02IDhoM3Y3aDN2LTdoM1Y5SDN2M3pcIi8+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCB0eXBlID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0zIDE3LjI1VjIxaDMuNzVMMTcuODEgOS45NGwtMy43NS0zLjc1TDMgMTcuMjV6TTIwLjcxIDcuMDRjLjM5LS4zOS4zOS0xLjAyIDAtMS40MWwtMi4zNC0yLjM0Yy0uMzktLjM5LTEuMDItLjM5LTEuNDEgMGwtMS44MyAxLjgzIDMuNzUgMy43NSAxLjgzLTEuODN6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgYWxpZ24gPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTEwIDIwaDRWNGgtNHYxNnptLTYgMGg0di04SDR2OHpNMTYgOXYxMWg0VjloLTR6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgcmVzaXplID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xOSAxMmgtMnYzaC0zdjJoNXYtNXpNNyA5aDNWN0g1djVoMlY5em0xNC02SDNjLTEuMSAwLTIgLjktMiAydjE0YzAgMS4xLjkgMiAyIDJoMThjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnptMCAxNi4wMUgzVjQuOTloMTh2MTQuMDJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgdHJhbnNmb3JtID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMiw3QzYuNDgsNywyLDkuMjQsMiwxMmMwLDIuMjQsMi45NCw0LjEzLDcsNC43N1YyMGw0LTRsLTQtNHYyLjczYy0zLjE1LTAuNTYtNS0xLjktNS0yLjczYzAtMS4wNiwzLjA0LTMsOC0zczgsMS45NCw4LDNcbiAgICBjMCwwLjczLTEuNDYsMS44OS00LDIuNTN2Mi4wNWMzLjUzLTAuNzcsNi0yLjUzLDYtNC41OEMyMiw5LjI0LDE3LjUyLDcsMTIsN3pcIi8+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBib3JkZXIgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTEzIDdoLTJ2MmgyVjd6bTAgNGgtMnYyaDJ2LTJ6bTQgMGgtMnYyaDJ2LTJ6TTMgM3YxOGgxOFYzSDN6bTE2IDE2SDVWNWgxNHYxNHptLTYtNGgtMnYyaDJ2LTJ6bS00LTRIN3YyaDJ2LTJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgaHVlc2hpZnQgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTEyIDNjLTQuOTcgMC05IDQuMDMtOSA5czQuMDMgOSA5IDljLjgzIDAgMS41LS42NyAxLjUtMS41IDAtLjM5LS4xNS0uNzQtLjM5LTEuMDEtLjIzLS4yNi0uMzgtLjYxLS4zOC0uOTkgMC0uODMuNjctMS41IDEuNS0xLjVIMTZjMi43NiAwIDUtMi4yNCA1LTUgMC00LjQyLTQuMDMtOC05LTh6bS01LjUgOWMtLjgzIDAtMS41LS42Ny0xLjUtMS41UzUuNjcgOSA2LjUgOSA4IDkuNjcgOCAxMC41IDcuMzMgMTIgNi41IDEyem0zLTRDOC42NyA4IDggNy4zMyA4IDYuNVM4LjY3IDUgOS41IDVzMS41LjY3IDEuNSAxLjVTMTAuMzMgOCA5LjUgOHptNSAwYy0uODMgMC0xLjUtLjY3LTEuNS0xLjVTMTMuNjcgNSAxNC41IDVzMS41LjY3IDEuNSAxLjVTMTUuMzMgOCAxNC41IDh6bTMgNGMtLjgzIDAtMS41LS42Ny0xLjUtMS41UzE2LjY3IDkgMTcuNSA5czEuNS42NyAxLjUgMS41LS42NyAxLjUtMS41IDEuNXpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBib3hzaGFkb3cgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTIwIDguNjlWNGgtNC42OUwxMiAuNjkgOC42OSA0SDR2NC42OUwuNjkgMTIgNCAxNS4zMVYyMGg0LjY5TDEyIDIzLjMxIDE1LjMxIDIwSDIwdi00LjY5TDIzLjMxIDEyIDIwIDguNjl6TTEyIDE4Yy0uODkgMC0xLjc0LS4yLTIuNS0uNTVDMTEuNTYgMTYuNSAxMyAxNC40MiAxMyAxMnMtMS40NC00LjUtMy41LTUuNDVDMTAuMjYgNi4yIDExLjExIDYgMTIgNmMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNnpcIi8+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBpbnNwZWN0b3IgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8Zz5cbiAgICAgIDxyZWN0IHg9XCIxMVwiIHk9XCI3XCIgd2lkdGg9XCIyXCIgaGVpZ2h0PVwiMlwiLz5cbiAgICAgIDxyZWN0IHg9XCIxMVwiIHk9XCIxMVwiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjZcIi8+XG4gICAgICA8cGF0aCBkPVwiTTEyLDJDNi40OCwyLDIsNi40OCwyLDEyYzAsNS41Miw0LjQ4LDEwLDEwLDEwczEwLTQuNDgsMTAtMTBDMjIsNi40OCwxNy41MiwyLDEyLDJ6IE0xMiwyMGMtNC40MSwwLTgtMy41OS04LThcbiAgICAgICAgYzAtNC40MSwzLjU5LTgsOC04czgsMy41OSw4LDhDMjAsMTYuNDEsMTYuNDEsMjAsMTIsMjB6XCIvPlxuICAgIDwvZz5cbiAgPC9zdmc+XG5gXG5cbmV4cG9ydCB7XG4gIGN1cnNvcixcbiAgbW92ZSxcbiAgc2VhcmNoLFxuICBtYXJnaW4sXG4gIHBhZGRpbmcsXG4gIGZvbnQsXG4gIHR5cGUsXG4gIGFsaWduLFxuICB0cmFuc2Zvcm0sXG4gIHJlc2l6ZSxcbiAgYm9yZGVyLFxuICBodWVzaGlmdCxcbiAgYm94c2hhZG93LFxuICBpbnNwZWN0b3IsXG59IiwiZXhwb3J0IGZ1bmN0aW9uIGdldFNpZGUoZGlyZWN0aW9uKSB7XG4gIGxldCBzdGFydCA9IGRpcmVjdGlvbi5zcGxpdCgnKycpLnBvcCgpLnJlcGxhY2UoL15cXHcvLCBjID0+IGMudG9VcHBlckNhc2UoKSlcbiAgaWYgKHN0YXJ0ID09ICdVcCcpIHN0YXJ0ID0gJ1RvcCdcbiAgaWYgKHN0YXJ0ID09ICdEb3duJykgc3RhcnQgPSAnQm90dG9tJ1xuICByZXR1cm4gc3RhcnRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxlKGVsLCBuYW1lKSB7XG4gIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJylcbiAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgbGV0IHMgPSBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCAnJylcbiAgICByZXR1cm4gcyAmJiBzLmdldFByb3BlcnR5VmFsdWUobmFtZSlcbiAgfSBcbiAgZWxzZSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGVzKGVsLCBkZXNpcmVkUHJvcE1hcCkge1xuICBjb25zdCBlbFN0eWxlT2JqZWN0ID0gZWwuc3R5bGVcbiAgY29uc3QgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsLCBudWxsKVxuXG4gIGxldCBkZXNpcmVkVmFsdWVzID0gW11cblxuICBmb3IgKHByb3AgaW4gZWwuc3R5bGUpXG4gICAgaWYgKHByb3AgaW4gZGVzaXJlZFByb3BNYXAgJiYgZGVzaXJlZFByb3BNYXBbcHJvcF0gIT0gY29tcHV0ZWRTdHlsZVtwcm9wXSlcbiAgICAgIGRlc2lyZWRWYWx1ZXMucHVzaCh7XG4gICAgICAgIHByb3AsXG4gICAgICAgIHZhbHVlOiBjb21wdXRlZFN0eWxlW3Byb3BdXG4gICAgICB9KVxuXG4gIHJldHVybiBkZXNpcmVkVmFsdWVzXG59XG5cbmxldCB0aW1lb3V0TWFwID0ge31cbmV4cG9ydCBmdW5jdGlvbiBzaG93SGlkZVNlbGVjdGVkKGVsLCBkdXJhdGlvbiA9IDc1MCkge1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2VsZWN0ZWQtaGlkZScsIHRydWUpXG5cbiAgaWYgKHRpbWVvdXRNYXBbZWxdKSBjbGVhclRpbWVvdXQodGltZW91dE1hcFtlbF0pXG5cbiAgdGltZW91dE1hcFtlbF0gPSBzZXRUaW1lb3V0KF8gPT5cbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc2VsZWN0ZWQtaGlkZScpXG4gICwgZHVyYXRpb24pXG4gIFxuICByZXR1cm4gZWxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsVG9EYXNoKGNhbWVsU3RyaW5nID0gXCJcIikge1xuICByZXR1cm4gY2FtZWxTdHJpbmcucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbigkMSl7cmV0dXJuIFwiLVwiKyQxLnRvTG93ZXJDYXNlKCk7fSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh0bWxTdHJpbmdUb0RvbShodG1sU3RyaW5nID0gXCJcIikge1xuICByZXR1cm4gKG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoaHRtbFN0cmluZywgJ3RleHQvaHRtbCcpKS5ib2R5LmZpcnN0Q2hpbGRcbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBnZXRTdHlsZSwgZ2V0U2lkZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4vdXRpbHMuanMnXG5cbi8vIHRvZG86IHNob3cgbWFyZ2luIGNvbG9yXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxhbHQrJHtldmVudH0sc2hpZnQrJHtldmVudH0sc2hpZnQrYWx0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gJ2NtZCt1cCxjbWQrc2hpZnQrdXAsY21kK2Rvd24sY21kK3NoaWZ0K2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBNYXJnaW4oc2VsZWN0b3IpIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHB1c2hFbGVtZW50KCQoc2VsZWN0b3IpLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHB1c2hBbGxFbGVtZW50U2lkZXMoJChzZWxlY3RvciksIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JykgLy8gYnVnIGluIGxpYj9cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHVzaEVsZW1lbnQoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdtYXJnaW4nICsgZ2V0U2lkZShkaXJlY3Rpb24pLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAnbWFyZ2luJyArIGdldFNpZGUoZGlyZWN0aW9uKSksIDEwKSxcbiAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnYWx0JyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgbWFyZ2luOiBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnQgLSBwYXlsb2FkLmFtb3VudCBcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgbWFyZ2lufSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke21hcmdpbiA8IDAgPyAwIDogbWFyZ2lufXB4YClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1c2hBbGxFbGVtZW50U2lkZXMoZWxzLCBrZXljb21tYW5kKSB7XG4gIGNvbnN0IGNvbWJvID0ga2V5Y29tbWFuZC5zcGxpdCgnKycpXG4gIGxldCBzcG9vZiA9ICcnXG5cbiAgaWYgKGNvbWJvLmluY2x1ZGVzKCdzaGlmdCcpKSAgc3Bvb2YgPSAnc2hpZnQrJyArIHNwb29mXG4gIGlmIChjb21iby5pbmNsdWRlcygnZG93bicpKSAgIHNwb29mID0gJ2FsdCsnICsgc3Bvb2ZcblxuICAndXAsZG93bixsZWZ0LHJpZ2h0Jy5zcGxpdCgnLCcpXG4gICAgLmZvckVhY2goc2lkZSA9PiBwdXNoRWxlbWVudChlbHMsIHNwb29mICsgc2lkZSkpXG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuY29uc3QgcmVtb3ZlRWRpdGFiaWxpdHkgPSBlID0+IHtcbiAgZS50YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnKVxuICBlLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgcmVtb3ZlRWRpdGFiaWxpdHkpXG4gIGUudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBzdG9wQnViYmxpbmcpXG59XG5cbmNvbnN0IHN0b3BCdWJibGluZyA9IGUgPT4gZS5rZXkgIT0gJ0VzY2FwZScgJiYgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG5leHBvcnQgZnVuY3Rpb24gRWRpdFRleHQoZWxlbWVudHMsIGZvY3VzPWZhbHNlKSB7XG4gIGlmICghZWxlbWVudHMubGVuZ3RoKSByZXR1cm5cblxuICBlbGVtZW50cy5tYXAoZWwgPT4ge1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgJ3RydWUnKVxuICAgIGZvY3VzICYmIGVsLmZvY3VzKClcbiAgICAkKGVsKS5vbigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgICAkKGVsKS5vbignYmx1cicsIHJlbW92ZUVkaXRhYmlsaXR5KVxuICB9KVxuXG4gIGhvdGtleXMoJ2VzY2FwZSxlc2MnLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGVsZW1lbnRzLmZvckVhY2godGFyZ2V0ID0+IHJlbW92ZUVkaXRhYmlsaXR5KHt0YXJnZXR9KSlcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZW1wdHkoKVxuICAgIGhvdGtleXMudW5iaW5kKCdlc2NhcGUsZXNjJylcbiAgfSlcbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCxiYWNrc3BhY2UnXG4vLyB0b2RvOiBpbmRpY2F0b3IgZm9yIHdoZW4gbm9kZSBjYW4gZGVzY2VuZFxuLy8gdG9kbzogaW5kaWNhdG9yIHdoZXJlIGxlZnQgYW5kIHJpZ2h0IHdpbGwgZ29cbi8vIHRvZG86IGluZGljYXRvciB3aGVuIGxlZnQgb3IgcmlnaHQgaGl0IGRlYWQgZW5kc1xuLy8gdG9kbzogdW5kb1xuZXhwb3J0IGZ1bmN0aW9uIE1vdmVhYmxlKHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgbGV0IGVsID0gJChzZWxlY3RvcilbMF0gLy8gb25seSBhbGxvdyAxIG5vZGUgdG8gYmUgbW92ZWQgYXQgYSB0aW1lXG4gICAgbW92ZUVsZW1lbnQoZWwsIGhhbmRsZXIua2V5KVxuICAgIHVwZGF0ZUZlZWRiYWNrKGVsKVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JylcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbW92ZUVsZW1lbnQoZWwsIGRpcmVjdGlvbikge1xuICBpZiAoIWVsKSByZXR1cm5cblxuICBzd2l0Y2goZGlyZWN0aW9uKSB7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICBpZiAoY2FuTW92ZUxlZnQoZWwpKVxuICAgICAgICBlbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgZWwucHJldmlvdXNFbGVtZW50U2libGluZylcbiAgICAgIGVsc2VcbiAgICAgICAgc2hvd0VkZ2UoZWwucGFyZW50Tm9kZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdyaWdodCc6XG4gICAgICBpZiAoY2FuTW92ZVJpZ2h0KGVsKSAmJiBlbC5uZXh0RWxlbWVudFNpYmxpbmcubmV4dFNpYmxpbmcpXG4gICAgICAgIGVsLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLCBlbC5uZXh0RWxlbWVudFNpYmxpbmcubmV4dFNpYmxpbmcpXG4gICAgICBlbHNlIGlmIChjYW5Nb3ZlUmlnaHQoZWwpKVxuICAgICAgICBlbC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsKVxuICAgICAgZWxzZVxuICAgICAgICBzaG93RWRnZShlbC5wYXJlbnROb2RlKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ3VwJzpcbiAgICAgIGlmIChjYW5Nb3ZlVXAoZWwpKVxuICAgICAgICBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUucHJlcGVuZChlbClcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdkb3duJzpcbiAgICAgIC8vIGVkZ2UgY2FzZSBiZWhhdmlvciwgdXNlciB0ZXN0XG4gICAgICBpZiAoIWVsLm5leHRFbGVtZW50U2libGluZyAmJiBlbC5wYXJlbnROb2RlICYmIGVsLnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLm5vZGVOYW1lICE9ICdCT0RZJylcbiAgICAgICAgZWwucGFyZW50Tm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgZWwucGFyZW50Tm9kZS5wYXJlbnROb2RlLmNoaWxkcmVuW1suLi5lbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2hpbGRyZW5dLmluZGV4T2YoZWwucGFyZW50RWxlbWVudCkgKyAxXSlcbiAgICAgIGlmIChjYW5Nb3ZlRG93bihlbCkpXG4gICAgICAgIGVsLm5leHRFbGVtZW50U2libGluZy5wcmVwZW5kKGVsKVxuICAgICAgYnJlYWtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY2FuTW92ZUxlZnQgPSBlbCA9PiBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nXG5leHBvcnQgY29uc3QgY2FuTW92ZVJpZ2h0ID0gZWwgPT4gZWwubmV4dEVsZW1lbnRTaWJsaW5nXG5leHBvcnQgY29uc3QgY2FuTW92ZURvd24gPSBlbCA9PiBcbiAgZWwubmV4dEVsZW1lbnRTaWJsaW5nICYmIGVsLm5leHRFbGVtZW50U2libGluZy5jaGlsZHJlbi5sZW5ndGhcbmV4cG9ydCBjb25zdCBjYW5Nb3ZlVXAgPSBlbCA9PiBcbiAgZWwucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiYgZWwucGFyZW50Tm9kZS5ub2RlTmFtZSAhPSAnQk9EWSdcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFZGdlKGVsKSB7XG4gIHJldHVybiBlbC5hbmltYXRlKFtcbiAgICB7IG91dGxpbmU6ICcxcHggc29saWQgdHJhbnNwYXJlbnQnIH0sXG4gICAgeyBvdXRsaW5lOiAnMXB4IHNvbGlkIGhzbGEoMzMwLCAxMDAlLCA3MSUsIDgwJSknIH0sXG4gICAgeyBvdXRsaW5lOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyB9LFxuICBdLCA2MDApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVGZWVkYmFjayhlbCkge1xuICBsZXQgb3B0aW9ucyA9ICcnXG4gIC8vIGdldCBjdXJyZW50IGVsZW1lbnRzIG9mZnNldC9zaXplXG4gIGlmIChjYW5Nb3ZlTGVmdChlbCkpICBvcHRpb25zICs9ICfih6AnXG4gIGlmIChjYW5Nb3ZlUmlnaHQoZWwpKSBvcHRpb25zICs9ICfih6InXG4gIGlmIChjYW5Nb3ZlRG93bihlbCkpICBvcHRpb25zICs9ICfih6MnXG4gIGlmIChjYW5Nb3ZlVXAoZWwpKSAgICBvcHRpb25zICs9ICfih6EnXG4gIC8vIGNyZWF0ZS9tb3ZlIGFycm93cyBpbiBhYnNvbHV0ZS9maXhlZCB0byBvdmVybGF5IGVsZW1lbnRcbiAgb3B0aW9ucyAmJiBjb25zb2xlLmluZm8oJyVjJytvcHRpb25zLCBcImZvbnQtc2l6ZTogMnJlbTtcIilcbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5cbmxldCBpbWdzID0gW11cblxuZXhwb3J0IGZ1bmN0aW9uIHdhdGNoSW1hZ2VzRm9yVXBsb2FkKCkge1xuICBpbWdzID0gJCgnaW1nJylcblxuICBjbGVhcldhdGNoZXJzKGltZ3MpXG4gIGluaXRXYXRjaGVycyhpbWdzKVxufVxuXG5jb25zdCBpbml0V2F0Y2hlcnMgPSBpbWdzID0+IHtcbiAgaW1ncy5vbignZHJhZ292ZXInLCBvbkRyYWdFbnRlcilcbiAgaW1ncy5vbignZHJhZ2xlYXZlJywgb25EcmFnTGVhdmUpXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBvbkRyb3ApXG59XG5cbmNvbnN0IHByZXZpZXdGaWxlID0gZmlsZSA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIHJlYWRlci5vbmxvYWRlbmQgPSAoKSA9PiByZXNvbHZlKHJlYWRlci5yZXN1bHQpXG4gIH0pXG59XG5cbmNvbnN0IG9uRHJhZ0VudGVyID0gZSA9PiB7XG4gICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtZHJvcHRhcmdldCcsIHRydWUpXG4gIGUucHJldmVudERlZmF1bHQoKVxufVxuXG5jb25zdCBvbkRyYWdMZWF2ZSA9IGUgPT4ge1xuICAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLWRyb3B0YXJnZXQnLCBudWxsKVxufVxuXG5jb25zdCBvbkRyb3AgPSBhc3luYyAoZSkgPT4ge1xuICBlLnByZXZlbnREZWZhdWx0KClcbiAgJChlLnRhcmdldCkuYXR0cignZGF0YS1kcm9wdGFyZ2V0JywgbnVsbClcblxuICBjb25zdCBzZWxlY3RlZEltYWdlcyA9ICQoJ2ltZ1tkYXRhLXNlbGVjdGVkPXRydWVdJylcblxuICBjb25zdCBzcmNzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgWy4uLmUuZGF0YVRyYW5zZmVyLmZpbGVzXS5tYXAocHJldmlld0ZpbGUpKVxuICBcbiAgaWYgKCFzZWxlY3RlZEltYWdlcy5sZW5ndGggJiYgZS50YXJnZXQubm9kZU5hbWUgPT09ICdJTUcnKVxuICAgIGUudGFyZ2V0LnNyYyA9IHNyY3NbMF1cbiAgZWxzZSB7XG4gICAgbGV0IGkgPSAwXG4gICAgc2VsZWN0ZWRJbWFnZXMuZm9yRWFjaChpbWcgPT4ge1xuICAgICAgaW1nLnNyYyA9IHNyY3NbaSsrXVxuICAgICAgaWYgKGkgPj0gc3Jjcy5sZW5ndGgpIGkgPSAwXG4gICAgfSlcbiAgfVxufVxuXG5jb25zdCBjbGVhcldhdGNoZXJzID0gaW1ncyA9PiB7XG4gIGltZ3Mub2ZmKCdkcmFnZW50ZXInLCBvbkRyYWdFbnRlcilcbiAgaW1ncy5vZmYoJ2RyYWdsZWF2ZScsIG9uRHJhZ0xlYXZlKVxuICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdkcm9wJywgb25Ecm9wKVxuICBpbWdzID0gW11cbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuXG5pbXBvcnQgeyBFZGl0VGV4dCB9IGZyb20gJy4vdGV4dCdcbmltcG9ydCB7IGNhbk1vdmVMZWZ0LCBjYW5Nb3ZlUmlnaHQsIGNhbk1vdmVVcCB9IGZyb20gJy4vbW92ZSdcbmltcG9ydCB7IHdhdGNoSW1hZ2VzRm9yVXBsb2FkIH0gZnJvbSAnLi9pbWFnZXN3YXAnXG5pbXBvcnQgeyBodG1sU3RyaW5nVG9Eb20gfSBmcm9tICcuL3V0aWxzJ1xuXG4vLyB0b2RvOiBhbGlnbm1lbnQgZ3VpZGVzXG5leHBvcnQgZnVuY3Rpb24gU2VsZWN0YWJsZSgpIHtcbiAgY29uc3QgZWxlbWVudHMgICAgICAgICAgPSAkKCdib2R5JylcbiAgbGV0IHNlbGVjdGVkICAgICAgICAgICAgPSBbXVxuICBsZXQgc2VsZWN0ZWRDYWxsYmFja3MgICA9IFtdXG5cbiAgd2F0Y2hJbWFnZXNGb3JVcGxvYWQoKVxuXG4gIGVsZW1lbnRzLm9uKCdjbGljaycsIGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBpZiAoaXNPZmZCb3VuZHMoZS50YXJnZXQpKSByZXR1cm5cbiAgICBpZiAoIWUuc2hpZnRLZXkpIHVuc2VsZWN0X2FsbCgpXG4gICAgc2VsZWN0KGUudGFyZ2V0KVxuICB9KVxuXG4gIGVsZW1lbnRzLm9uKCdkYmxjbGljaycsIGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBpZiAoaXNPZmZCb3VuZHMoZS50YXJnZXQpKSByZXR1cm5cbiAgICBFZGl0VGV4dChbZS50YXJnZXRdLCB7Zm9jdXM6dHJ1ZX0pXG4gICAgJCgndG9vbC1wYWxsZXRlJylbMF0udG9vbFNlbGVjdGVkKCd0ZXh0JylcbiAgfSlcblxuICBob3RrZXlzKCdlc2MnLCBfID0+IFxuICAgIHNlbGVjdGVkLmxlbmd0aCAmJiB1bnNlbGVjdF9hbGwoKSlcblxuICBob3RrZXlzKCdjbWQrZCcsIGUgPT4ge1xuICAgIGNvbnN0IHJvb3Rfbm9kZSA9IHNlbGVjdGVkWzBdXG4gICAgaWYgKCFyb290X25vZGUpIHJldHVyblxuXG4gICAgY29uc3QgZGVlcF9jbG9uZSA9IHJvb3Rfbm9kZS5jbG9uZU5vZGUodHJ1ZSlcbiAgICBzZWxlY3RlZC5wdXNoKGRlZXBfY2xvbmUpXG4gICAgcm9vdF9ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRlZXBfY2xvbmUsIHJvb3Rfbm9kZS5uZXh0U2libGluZylcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfSlcblxuICBob3RrZXlzKCdiYWNrc3BhY2UsZGVsLGRlbGV0ZScsIGUgPT4gXG4gICAgc2VsZWN0ZWQubGVuZ3RoICYmIGRlbGV0ZV9hbGwoKSlcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjb3B5JywgZSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkWzBdICYmIHRoaXMubm9kZV9jbGlwYm9hcmQgIT09IHNlbGVjdGVkWzBdKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCd0ZXh0L2h0bWwnLCBzZWxlY3RlZFswXS5vdXRlckhUTUwpXG4gICAgfVxuICB9KVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgZSA9PiB7XG4gICAgY29uc3QgcG90ZW50aWFsSFRNTCA9IGUuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCd0ZXh0L2h0bWwnKVxuICAgIGlmIChzZWxlY3RlZFswXSAmJiBwb3RlbnRpYWxIVE1MKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHNlbGVjdGVkWzBdLmFwcGVuZENoaWxkKFxuICAgICAgICBodG1sU3RyaW5nVG9Eb20ocG90ZW50aWFsSFRNTCkpXG4gICAgfVxuICB9KVxuXG4gIGhvdGtleXMoJ2NtZCtlLGNtZCtzaGlmdCtlJywgKGUsIHtrZXl9KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAvLyBUT0RPOiBuZWVkIGEgbXVjaCBzbWFydGVyIHN5c3RlbSBoZXJlXG4gICAgLy8gb25seSBleHBhbmRzIGJhc2UgdGFnIG5hbWVzIGF0bVxuICAgIGlmIChzZWxlY3RlZFswXS5ub2RlTmFtZSAhPT0gJ0RJVicpXG4gICAgICBleHBhbmRTZWxlY3Rpb24oe1xuICAgICAgICByb290X25vZGU6IHNlbGVjdGVkWzBdLCBcbiAgICAgICAgYWxsOiBrZXkuaW5jbHVkZXMoJ3NoaWZ0JyksXG4gICAgICB9KVxuICB9KVxuXG4gIGVsZW1lbnRzLm9uKCdzZWxlY3RzdGFydCcsIGUgPT5cbiAgICAhaXNPZmZCb3VuZHMoZS50YXJnZXQpIFxuICAgICYmIHNlbGVjdGVkLmxlbmd0aCBcbiAgICAmJiBzZWxlY3RlZFswXS50ZXh0Q29udGVudCAhPSBlLnRhcmdldC50ZXh0Q29udGVudCBcbiAgICAmJiBlLnByZXZlbnREZWZhdWx0KCkpXG5cbiAgaG90a2V5cygndGFiLHNoaWZ0K3RhYixlbnRlcixzaGlmdCtlbnRlcicsIChlLCB7a2V5fSkgPT4ge1xuICAgIGlmIChzZWxlY3RlZC5sZW5ndGggIT09IDEpIHJldHVyblxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdGVkWzBdXG5cbiAgICBpZiAoa2V5LmluY2x1ZGVzKCdzaGlmdCcpKSB7XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKCd0YWInKSAmJiBjYW5Nb3ZlTGVmdChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY2FuTW92ZUxlZnQoY3VycmVudCkpXG4gICAgICB9XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKCdlbnRlcicpICYmIGNhbk1vdmVVcChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY3VycmVudC5wYXJlbnROb2RlKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChrZXkuaW5jbHVkZXMoJ3RhYicpICYmIGNhbk1vdmVSaWdodChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY2FuTW92ZVJpZ2h0KGN1cnJlbnQpKVxuICAgICAgfVxuICAgICAgaWYgKGtleS5pbmNsdWRlcygnZW50ZXInKSAmJiBjdXJyZW50LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY3VycmVudC5jaGlsZHJlblswXSlcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZWxlbWVudHMub24oJ21vdXNlb3ZlcicsICh7dGFyZ2V0fSkgPT5cbiAgICAhaXNPZmZCb3VuZHModGFyZ2V0KSAmJiB0YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLWhvdmVyJywgdHJ1ZSkpXG5cbiAgZWxlbWVudHMub24oJ21vdXNlb3V0JywgKHt0YXJnZXR9KSA9PlxuICAgIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtaG92ZXInKSlcblxuICBlbGVtZW50cy5vbignY2xpY2snLCAoe3RhcmdldH0pID0+IHtcbiAgICBpZiAoIWlzT2ZmQm91bmRzKHRhcmdldCkgJiYgIXNlbGVjdGVkLmZpbHRlcihlbCA9PiBlbCA9PSB0YXJnZXQpLmxlbmd0aCkgXG4gICAgICB1bnNlbGVjdF9hbGwoKVxuICAgIHRlbGxXYXRjaGVycygpXG4gIH0pXG5cbiAgY29uc3Qgc2VsZWN0ID0gZWwgPT4ge1xuICAgIGlmIChlbC5ub2RlTmFtZSA9PT0gJ3N2ZycgfHwgZWwub3duZXJTVkdFbGVtZW50KSByZXR1cm5cblxuICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcsIHRydWUpXG4gICAgc2VsZWN0ZWQudW5zaGlmdChlbClcbiAgICB0ZWxsV2F0Y2hlcnMoKVxuICB9XG5cbiAgY29uc3QgdW5zZWxlY3RfYWxsID0gKCkgPT4ge1xuICAgIHNlbGVjdGVkXG4gICAgICAuZm9yRWFjaChlbCA9PiBcbiAgICAgICAgJChlbCkuYXR0cih7XG4gICAgICAgICAgJ2RhdGEtc2VsZWN0ZWQnOiBudWxsLFxuICAgICAgICAgICdkYXRhLXNlbGVjdGVkLWhpZGUnOiBudWxsLFxuICAgICAgICB9KSlcblxuICAgIHNlbGVjdGVkID0gW11cbiAgfVxuXG4gIGNvbnN0IGRlbGV0ZV9hbGwgPSAoKSA9PiB7XG4gICAgc2VsZWN0ZWQuZm9yRWFjaChlbCA9PlxuICAgICAgZWwucmVtb3ZlKCkpXG4gICAgc2VsZWN0ZWQgPSBbXVxuICB9XG5cbiAgY29uc3QgZXhwYW5kU2VsZWN0aW9uID0gKHtyb290X25vZGUsIGFsbH0pID0+IHtcbiAgICBpZiAoYWxsKSB7XG4gICAgICBjb25zdCB1bnNlbGVjdGVkcyA9ICQocm9vdF9ub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgKyAnOm5vdChbZGF0YS1zZWxlY3RlZF0pJylcbiAgICAgIHVuc2VsZWN0ZWRzLmZvckVhY2goc2VsZWN0KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHBvdGVudGlhbHMgPSAkKHJvb3Rfbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgaWYgKCFwb3RlbnRpYWxzKSByZXR1cm5cblxuICAgICAgY29uc3Qgcm9vdF9ub2RlX2luZGV4ID0gcG90ZW50aWFscy5yZWR1Y2UoKGluZGV4LCBub2RlLCBpKSA9PlxuICAgICAgICBub2RlID09IHJvb3Rfbm9kZSBcbiAgICAgICAgICA/IGluZGV4ID0gaVxuICAgICAgICAgIDogaW5kZXhcbiAgICAgICwgbnVsbClcblxuICAgICAgaWYgKHJvb3Rfbm9kZV9pbmRleCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoIXBvdGVudGlhbHNbcm9vdF9ub2RlX2luZGV4ICsgMV0pIHtcbiAgICAgICAgICBjb25zdCBwb3RlbnRpYWwgPSBwb3RlbnRpYWxzLmZpbHRlcihlbCA9PiAhZWwuYXR0cignZGF0YS1zZWxlY3RlZCcpKVswXVxuICAgICAgICAgIGlmIChwb3RlbnRpYWwpIHNlbGVjdChwb3RlbnRpYWwpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc2VsZWN0KHBvdGVudGlhbHNbcm9vdF9ub2RlX2luZGV4ICsgMV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBpc09mZkJvdW5kcyA9IG5vZGUgPT5cbiAgICBub2RlLmNsb3Nlc3QgJiYgKG5vZGUuY2xvc2VzdCgndG9vbC1wYWxsZXRlJykgfHwgbm9kZS5jbG9zZXN0KCcubWV0YXRpcCcpKVxuXG4gIGNvbnN0IG9uU2VsZWN0ZWRVcGRhdGUgPSBjYiA9PlxuICAgIHNlbGVjdGVkQ2FsbGJhY2tzLnB1c2goY2IpICYmIGNiKHNlbGVjdGVkKVxuXG4gIGNvbnN0IHJlbW92ZVNlbGVjdGVkQ2FsbGJhY2sgPSBjYiA9PlxuICAgIHNlbGVjdGVkQ2FsbGJhY2tzID0gc2VsZWN0ZWRDYWxsYmFja3MuZmlsdGVyKGNhbGxiYWNrID0+IGNhbGxiYWNrICE9IGNiKVxuXG4gIGNvbnN0IHRlbGxXYXRjaGVycyA9ICgpID0+XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MuZm9yRWFjaChjYiA9PiBjYihzZWxlY3RlZCkpXG5cbiAgcmV0dXJuIHtcbiAgICBzZWxlY3QsXG4gICAgdW5zZWxlY3RfYWxsLFxuICAgIG9uU2VsZWN0ZWRVcGRhdGUsXG4gICAgcmVtb3ZlU2VsZWN0ZWRDYWxsYmFjayxcbiAgfVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBnZXRTdHlsZSwgZ2V0U2lkZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4vdXRpbHMuanMnXG5cbi8vIHRvZG86IHNob3cgcGFkZGluZyBjb2xvclxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sYWx0KyR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9LHNoaWZ0K2FsdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK3NoaWZ0K3VwLGNtZCtkb3duLGNtZCtzaGlmdCtkb3duJ1xuXG5leHBvcnQgZnVuY3Rpb24gUGFkZGluZyhzZWxlY3Rvcikge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcGFkRWxlbWVudCgkKHNlbGVjdG9yKSwgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwYWRBbGxFbGVtZW50U2lkZXMoJChzZWxlY3RvciksIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JykgLy8gYnVnIGluIGxpYj9cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkRWxlbWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ3BhZGRpbmcnICsgZ2V0U2lkZShkaXJlY3Rpb24pLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAncGFkZGluZycgKyBnZXRTaWRlKGRpcmVjdGlvbikpLCAxMCksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2FsdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHBhZGRpbmc6IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCAtIHBheWxvYWQuYW1vdW50IFxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50ICsgcGF5bG9hZC5hbW91bnRcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCBwYWRkaW5nfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke3BhZGRpbmcgPCAwID8gMCA6IHBhZGRpbmd9cHhgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkQWxsRWxlbWVudFNpZGVzKGVscywga2V5Y29tbWFuZCkge1xuICBjb25zdCBjb21ibyA9IGtleWNvbW1hbmQuc3BsaXQoJysnKVxuICBsZXQgc3Bvb2YgPSAnJ1xuXG4gIGlmIChjb21iby5pbmNsdWRlcygnc2hpZnQnKSkgIHNwb29mID0gJ3NoaWZ0KycgKyBzcG9vZlxuICBpZiAoY29tYm8uaW5jbHVkZXMoJ2Rvd24nKSkgICBzcG9vZiA9ICdhbHQrJyArIHNwb29mXG5cbiAgJ3VwLGRvd24sbGVmdCxyaWdodCcuc3BsaXQoJywnKVxuICAgIC5mb3JFYWNoKHNpZGUgPT4gcGFkRWxlbWVudChlbHMsIHNwb29mICsgc2lkZSkpXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxzaGlmdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBGb250KHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VLZXJuaW5nKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZUFsaWdubWVudChzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICBlbHNlXG4gICAgICBrZXlzLmluY2x1ZGVzKCdzaGlmdCcpXG4gICAgICAgID8gY2hhbmdlTGVhZGluZyhzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICAgICAgOiBjaGFuZ2VGb250U2l6ZShzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGxldCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIGNoYW5nZUZvbnRXZWlnaHQoJChzZWxlY3RvciksIGtleXMuaW5jbHVkZXMoJ3VwJykgPyAndXAnIDogJ2Rvd24nKVxuICB9KVxuXG4gIGhvdGtleXMoJ2NtZCtiJywgZSA9PiB7XG4gICAgJChzZWxlY3RvcikuZm9yRWFjaChlbCA9PlxuICAgICAgZWwuc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJylcbiAgfSlcblxuICBob3RrZXlzKCdjbWQraScsIGUgPT4ge1xuICAgICQoc2VsZWN0b3IpLmZvckVhY2goZWwgPT5cbiAgICAgIGVsLnN0eWxlLmZvbnRTdHlsZSA9ICdpdGFsaWMnKVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgnY21kK2IsY21kK2knKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VMZWFkaW5nKGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnbGluZUhlaWdodCcsXG4gICAgICBjdXJyZW50OiAgcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdsaW5lSGVpZ2h0JykpLFxuICAgICAgYW1vdW50OiAgIDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBjdXJyZW50OiBwYXlsb2FkLmN1cnJlbnQgPT0gJ25vcm1hbCcgfHwgaXNOYU4ocGF5bG9hZC5jdXJyZW50KVxuICAgICAgICAgID8gMS4xNCAqIHBhcnNlSW50KGdldFN0eWxlKHBheWxvYWQuZWwsICdmb250U2l6ZScpKSAvLyBkb2N1bWVudCB0aGlzIGNob2ljZVxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50XG4gICAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke3ZhbHVlfXB4YClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUtlcm5pbmcoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdsZXR0ZXJTcGFjaW5nJyxcbiAgICAgIGN1cnJlbnQ6ICBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnbGV0dGVyU3BhY2luZycpKSxcbiAgICAgIGFtb3VudDogICAuMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnbGVmdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGN1cnJlbnQ6IHBheWxvYWQuY3VycmVudCA9PSAnbm9ybWFsJyB8fCBpc05hTihwYXlsb2FkLmN1cnJlbnQpXG4gICAgICAgICAgPyAwXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnRcbiAgICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnQgLSBwYXlsb2FkLmFtb3VudCBcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7dmFsdWUgPD0gLTIgPyAtMiA6IHZhbHVlfXB4YClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUZvbnRTaXplKGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnZm9udFNpemUnLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAnZm9udFNpemUnKSksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBmb250X3NpemU6IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCAtIHBheWxvYWQuYW1vdW50IFxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50ICsgcGF5bG9hZC5hbW91bnRcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCBmb250X3NpemV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7Zm9udF9zaXplIDw9IDYgPyA2IDogZm9udF9zaXplfXB4YClcbn1cblxuY29uc3Qgd2VpZ2h0TWFwID0ge1xuICBub3JtYWw6IDIsXG4gIGJvbGQ6ICAgNSxcbiAgbGlnaHQ6ICAwLFxuICBcIlwiOiAyLFxuICBcIjEwMFwiOjAsXCIyMDBcIjoxLFwiMzAwXCI6MixcIjQwMFwiOjMsXCI1MDBcIjo0LFwiNjAwXCI6NSxcIjcwMFwiOjYsXCI4MDBcIjo3LFwiOTAwXCI6OFxufVxuY29uc3Qgd2VpZ2h0T3B0aW9ucyA9IFsxMDAsMjAwLDMwMCw0MDAsNTAwLDYwMCw3MDAsODAwLDkwMF1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUZvbnRXZWlnaHQoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdmb250V2VpZ2h0JyxcbiAgICAgIGN1cnJlbnQ6ICBnZXRTdHlsZShlbCwgJ2ZvbnRXZWlnaHQnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IHdlaWdodE1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IHdlaWdodE1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IHdlaWdodE9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IHdlaWdodE9wdGlvbnMubGVuZ3RoIFxuICAgICAgICA/IHdlaWdodE9wdGlvbnMubGVuZ3RoXG4gICAgICAgIDogdmFsdWVcbiAgICAgIF0pXG59XG5cbmNvbnN0IGFsaWduTWFwID0ge1xuICBzdGFydDogMCxcbiAgbGVmdDogMCxcbiAgY2VudGVyOiAxLFxuICByaWdodDogMixcbn1cbmNvbnN0IGFsaWduT3B0aW9ucyA9IFsnbGVmdCcsJ2NlbnRlcicsJ3JpZ2h0J11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUFsaWdubWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ3RleHRBbGlnbicsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICd0ZXh0QWxpZ24nKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGFsaWduTWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBhbGlnbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxzaGlmdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK2Rvd24sY21kK2xlZnQsY21kK3JpZ2h0J1xuXG5leHBvcnQgZnVuY3Rpb24gRmxleChzZWxlY3Rvcikge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsZXQgc2VsZWN0ZWROb2RlcyA9ICQoc2VsZWN0b3IpXG4gICAgICAsIGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG5cbiAgICBpZiAoa2V5cy5pbmNsdWRlcygnbGVmdCcpIHx8IGtleXMuaW5jbHVkZXMoJ3JpZ2h0JykpXG4gICAgICBrZXlzLmluY2x1ZGVzKCdzaGlmdCcpXG4gICAgICAgID8gY2hhbmdlSERpc3RyaWJ1dGlvbihzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICAgICAgOiBjaGFuZ2VIQWxpZ25tZW50KHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgIGVsc2VcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VWRGlzdHJpYnV0aW9uKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZVZBbGlnbm1lbnQoc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcbiAgICBcbiAgICBjaGFuZ2VEaXJlY3Rpb24oc2VsZWN0ZWROb2Rlcywga2V5cy5pbmNsdWRlcygnbGVmdCcpID8gJ3JvdycgOiAnY29sdW1uJylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuY29uc3QgZW5zdXJlRmxleCA9IGVsID0+IHtcbiAgZWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICByZXR1cm4gZWxcbn1cblxuY29uc3QgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQgPSAoY3VyLCB3YW50KSA9PiB7XG4gIGlmICh3YW50ID09ICdhbGlnbicgJiYgKGN1ciAhPSAnZmxleC1zdGFydCcgJiYgY3VyICE9ICdjZW50ZXInICYmIGN1ciAhPSAnZmxleC1lbmQnKSlcbiAgICBjdXIgPSAnbm9ybWFsJ1xuICBlbHNlIGlmICh3YW50ID09ICdkaXN0cmlidXRlJyAmJiAoY3VyICE9ICdzcGFjZS1hcm91bmQnICYmIGN1ciAhPSAnc3BhY2UtYmV0d2VlbicpKVxuICAgIGN1ciA9ICdub3JtYWwnXG5cbiAgcmV0dXJuIGN1clxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlRGlyZWN0aW9uKGVscywgdmFsdWUpIHtcbiAgZWxzXG4gICAgLm1hcChlbnN1cmVGbGV4KVxuICAgIC5tYXAoZWwgPT4ge1xuICAgICAgZWwuc3R5bGUuZmxleERpcmVjdGlvbiA9IHZhbHVlXG4gICAgfSlcbn1cblxuY29uc3QgaF9hbGlnbk1hcCAgICAgID0ge25vcm1hbDogMCwnZmxleC1zdGFydCc6IDAsJ2NlbnRlcic6IDEsJ2ZsZXgtZW5kJzogMix9XG5jb25zdCBoX2FsaWduT3B0aW9ucyAgPSBbJ2ZsZXgtc3RhcnQnLCdjZW50ZXInLCdmbGV4LWVuZCddXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VIQWxpZ25tZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlRmxleClcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdqdXN0aWZ5Q29udGVudCcsXG4gICAgICBjdXJyZW50OiAgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQoZ2V0U3R5bGUoZWwsICdqdXN0aWZ5Q29udGVudCcpLCAnYWxpZ24nKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSAtIDEgXG4gICAgICAgICAgOiBoX2FsaWduTWFwW3BheWxvYWQuY3VycmVudF0gKyAxXG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gaF9hbGlnbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG5cbmNvbnN0IHZfYWxpZ25NYXAgICAgICA9IHtub3JtYWw6IDAsJ2ZsZXgtc3RhcnQnOiAwLCdjZW50ZXInOiAxLCdmbGV4LWVuZCc6IDIsfVxuY29uc3Qgdl9hbGlnbk9wdGlvbnMgID0gWydmbGV4LXN0YXJ0JywnY2VudGVyJywnZmxleC1lbmQnXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlVkFsaWdubWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnYWxpZ25JdGVtcycsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICdhbGlnbkl0ZW1zJyksXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbi5zcGxpdCgnKycpLmluY2x1ZGVzKCd1cCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gaF9hbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB2X2FsaWduT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cblxuY29uc3QgaF9kaXN0cmlidXRpb25NYXAgICAgICA9IHtub3JtYWw6IDEsJ3NwYWNlLWFyb3VuZCc6IDAsJyc6IDEsJ3NwYWNlLWJldHdlZW4nOiAyLH1cbmNvbnN0IGhfZGlzdHJpYnV0aW9uT3B0aW9ucyAgPSBbJ3NwYWNlLWFyb3VuZCcsJycsJ3NwYWNlLWJldHdlZW4nXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlSERpc3RyaWJ1dGlvbihlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnanVzdGlmeUNvbnRlbnQnLFxuICAgICAgY3VycmVudDogIGFjY291bnRGb3JPdGhlckp1c3RpZnlDb250ZW50KGdldFN0eWxlKGVsLCAnanVzdGlmeUNvbnRlbnQnKSwgJ2Rpc3RyaWJ1dGUnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGhfZGlzdHJpYnV0aW9uTWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogaF9kaXN0cmlidXRpb25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBoX2Rpc3RyaWJ1dGlvbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG5cbmNvbnN0IHZfZGlzdHJpYnV0aW9uTWFwICAgICAgPSB7bm9ybWFsOiAxLCdzcGFjZS1hcm91bmQnOiAwLCcnOiAxLCdzcGFjZS1iZXR3ZWVuJzogMix9XG5jb25zdCB2X2Rpc3RyaWJ1dGlvbk9wdGlvbnMgID0gWydzcGFjZS1hcm91bmQnLCcnLCdzcGFjZS1iZXR3ZWVuJ11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZVZEaXN0cmlidXRpb24oZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbnN1cmVGbGV4KVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ2FsaWduQ29udGVudCcsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICdhbGlnbkNvbnRlbnQnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3VwJyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgdmFsdWU6IHBheWxvYWQuZGlyZWN0aW9uXG4gICAgICAgICAgPyB2X2Rpc3RyaWJ1dGlvbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IHZfZGlzdHJpYnV0aW9uTWFwW3BheWxvYWQuY3VycmVudF0gKyAxXG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gdl9kaXN0cmlidXRpb25PcHRpb25zW3ZhbHVlIDwgMCA/IDAgOiB2YWx1ZSA+PSAyID8gMjogdmFsdWVdKVxufVxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuLy8gY3JlYXRlIGlucHV0XG5jb25zdCBzZWFyY2hfYmFzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5zZWFyY2hfYmFzZS5jbGFzc0xpc3QuYWRkKCdzZWFyY2gnKVxuc2VhcmNoX2Jhc2UuaW5uZXJIVE1MID0gYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiZXg6IGltYWdlcywgLmJ0biwgZGl2LCBhbmQgbW9yZVwiLz5gXG5cbmNvbnN0IHNlYXJjaCAgICAgICAgPSAkKHNlYXJjaF9iYXNlKVxuY29uc3Qgc2VhcmNoSW5wdXQgICA9ICQoJ2lucHV0Jywgc2VhcmNoX2Jhc2UpXG5cbmNvbnN0IHNob3dTZWFyY2hCYXIgPSAoKSA9PiBzZWFyY2guYXR0cignc3R5bGUnLCAnZGlzcGxheTpibG9jaycpXG5jb25zdCBoaWRlU2VhcmNoQmFyID0gKCkgPT4gc2VhcmNoLmF0dHIoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZScpXG5jb25zdCBzdG9wQnViYmxpbmcgID0gZSA9PiBlLmtleSAhPSAnRXNjYXBlJyAmJiBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbmV4cG9ydCBmdW5jdGlvbiBTZWFyY2goU2VsZWN0b3JFbmdpbmUsIG5vZGUpIHtcbiAgaWYgKG5vZGUpIG5vZGVbMF0uYXBwZW5kQ2hpbGQoc2VhcmNoWzBdKVxuXG4gIGNvbnN0IG9uUXVlcnkgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBsZXQgcXVlcnkgPSBlLnRhcmdldC52YWx1ZVxuXG4gICAgaWYgKHF1ZXJ5ID09ICdsaW5rcycpIHF1ZXJ5ID0gJ2EnXG4gICAgaWYgKHF1ZXJ5ID09ICdidXR0b25zJykgcXVlcnkgPSAnYnV0dG9uJ1xuICAgIGlmIChxdWVyeSA9PSAnaW1hZ2VzJykgcXVlcnkgPSAnaW1nJ1xuICAgIGlmIChxdWVyeSA9PSAndGV4dCcpIHF1ZXJ5ID0gJ3AsY2FwdGlvbixhLGgxLGgyLGgzLGg0LGg1LGg2LHNtYWxsLGRhdGUsdGltZSxsaSxkdCxkZCdcblxuICAgIGlmICghcXVlcnkpIHJldHVybiBTZWxlY3RvckVuZ2luZS51bnNlbGVjdF9hbGwoKVxuICAgIGlmIChxdWVyeSA9PSAnLicgfHwgcXVlcnkgPT0gJyMnKSByZXR1cm5cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYXRjaGVzID0gJChxdWVyeSlcbiAgICAgIFNlbGVjdG9yRW5naW5lLnVuc2VsZWN0X2FsbCgpXG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGgpXG4gICAgICAgIG1hdGNoZXMuZm9yRWFjaChlbCA9PlxuICAgICAgICAgIFNlbGVjdG9yRW5naW5lLnNlbGVjdChlbCkpXG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHt9XG4gIH1cblxuICBzZWFyY2hJbnB1dC5vbignaW5wdXQnLCBvblF1ZXJ5KVxuICBzZWFyY2hJbnB1dC5vbigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgLy8gc2VhcmNoSW5wdXQub24oJ2JsdXInLCBoaWRlU2VhcmNoQmFyKVxuXG4gIHNob3dTZWFyY2hCYXIoKVxuICBzZWFyY2hJbnB1dFswXS5mb2N1cygpXG5cbiAgLy8gaG90a2V5cygnZXNjYXBlLGVzYycsIChlLCBoYW5kbGVyKSA9PiB7XG4gIC8vICAgaGlkZVNlYXJjaEJhcigpXG4gIC8vICAgaG90a2V5cy51bmJpbmQoJ2VzY2FwZSxlc2MnKVxuICAvLyB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaGlkZVNlYXJjaEJhcigpXG4gICAgc2VhcmNoSW5wdXQub2ZmKCdvbmlucHV0Jywgb25RdWVyeSlcbiAgICBzZWFyY2hJbnB1dC5vZmYoJ2tleWRvd24nLCBzdG9wQnViYmxpbmcpXG4gICAgc2VhcmNoSW5wdXQub2ZmKCdibHVyJywgaGlkZVNlYXJjaEJhcilcbiAgfVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcblxuZXhwb3J0IGZ1bmN0aW9uIENoYW5nZUZvcmVncm91bmQoZWxlbWVudHMsIGNvbG9yKSB7XG4gIGVsZW1lbnRzLm1hcChlbCA9PlxuICAgIGVsLnN0eWxlLmNvbG9yID0gY29sb3IpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDaGFuZ2VCYWNrZ3JvdW5kKGVsZW1lbnRzLCBjb2xvcikge1xuICBlbGVtZW50cy5tYXAoZWwgPT5cbiAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcilcbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgVGlueUNvbG9yIH0gZnJvbSAnQGN0cmwvdGlueWNvbG9yJ1xuaW1wb3J0IHsgZ2V0U3R5bGVzLCBjYW1lbFRvRGFzaCB9IGZyb20gJy4vdXRpbHMnXG5cbmNvbnN0IGRlc2lyZWRQcm9wTWFwID0ge1xuICBjb2xvcjogICAgICAgICAgICAncmdiKDAsIDAsIDApJyxcbiAgYmFja2dyb3VuZENvbG9yOiAgJ3JnYmEoMCwgMCwgMCwgMCknLFxuICBib3JkZXJSYWRpdXM6ICAgICAnMHB4JyxcbiAgcGFkZGluZzogICAgICAgICAgJzBweCcsXG4gIG1hcmdpbjogICAgICAgICAgICcwcHgnLFxuICBmb250U2l6ZTogICAgICAgICAnMTZweCcsXG4gIGZvbnRXZWlnaHQ6ICAgICAgICc0MDAnLFxuICB0ZXh0QWxpZ246ICAgICAgICAnc3RhcnQnLFxuICB0ZXh0U2hhZG93OiAgICAgICAnbm9uZScsXG4gIHRleHRUcmFuc2Zvcm06ICAgICdub25lJyxcbiAgbGluZUhlaWdodDogICAgICAgJ25vcm1hbCcsXG4gIGRpc3BsYXk6ICAgICAgICAgICdibG9jaycsXG4gIGFsaWduSXRlbXM6ICAgICAgICdub3JtYWwnLFxuICBqdXN0aWZ5Q29udGVudDogICAnbm9ybWFsJyxcbn1cblxubGV0IHRpcF9tYXAgPSB7fVxuXG4vLyB0b2RvOiBcbi8vIC0gbm9kZSByZWN5Y2xpbmcgKGZvciBuZXcgdGFyZ2V0KSBubyBuZWVkIHRvIGNyZWF0ZS9kZWxldGVcbi8vIC0gbWFrZSBzaW5nbGUgZnVuY3Rpb24gY3JlYXRlL3VwZGF0ZVxuZXhwb3J0IGZ1bmN0aW9uIE1ldGFUaXAoKSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gKHt0YXJnZXQ6IGVsfSkgPT4ge1xuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb25zdCBzdHlsZXMgPSBnZXRTdHlsZXMoZWwsIGRlc2lyZWRQcm9wTWFwKS5tYXAoc3R5bGUgPT4ge1xuICAgICAgc3R5bGUucHJvcCA9IGNhbWVsVG9EYXNoKHN0eWxlLnByb3ApXG5cbiAgICAgIGlmIChzdHlsZS5wcm9wLmluY2x1ZGVzKCdjb2xvcicpIHx8IHN0eWxlLnByb3AuaW5jbHVkZXMoJ0NvbG9yJykpXG4gICAgICAgIHN0eWxlLnZhbHVlID0gYDxzcGFuIGNvbG9yIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogJHtzdHlsZS52YWx1ZX07XCI+PC9zcGFuPiR7bmV3IFRpbnlDb2xvcihzdHlsZS52YWx1ZSkudG9Ic2xTdHJpbmcoKX1gXG5cbiAgICAgIC8vIGNoZWNrIGlmIHN0eWxlIGlzIGlubGluZSBzdHlsZSwgc2hvdyBpbmRpY2F0b3JcbiAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpLmluY2x1ZGVzKHN0eWxlLnByb3ApKVxuICAgICAgICBzdHlsZS52YWx1ZSA9IGA8c3BhbiBsb2NhbC1jaGFuZ2U+JHtzdHlsZS52YWx1ZX08L3NwYW4+YFxuICAgICAgXG4gICAgICByZXR1cm4gc3R5bGVcbiAgICB9KVxuXG4gICAgY29uc3QgbG9jYWxNb2RpZmljYXRpb25zID0gc3R5bGVzLmZpbHRlcihzdHlsZSA9PlxuICAgICAgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpICYmIGVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKS5pbmNsdWRlcyhzdHlsZS5wcm9wKVxuICAgICAgICA/IDFcbiAgICAgICAgOiAwXG4gICAgKVxuXG4gICAgY29uc3Qgbm90TG9jYWxNb2RpZmljYXRpb25zID0gc3R5bGVzLmZpbHRlcihzdHlsZSA9PlxuICAgICAgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpICYmIGVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKS5pbmNsdWRlcyhzdHlsZS5wcm9wKVxuICAgICAgICA/IDBcbiAgICAgICAgOiAxXG4gICAgKVxuICAgIFxuICAgIGxldCB0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRpcC5jbGFzc0xpc3QuYWRkKCdtZXRhdGlwJylcbiAgICB0aXAuaW5uZXJIVE1MID0gYFxuICAgICAgPGg1PiR7ZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKX0ke2VsLmlkICYmICcjJyArIGVsLmlkfSR7ZWwuY2xhc3NOYW1lICYmICcuJytlbC5jbGFzc05hbWUucmVwbGFjZSgvIC9nLCAnLicpfTwvaDU+XG4gICAgICA8c21hbGw+PHNwYW4+JHtNYXRoLnJvdW5kKHdpZHRoKX08L3NwYW4+cHggPHNwYW4gZGl2aWRlcj7Dlzwvc3Bhbj4gPHNwYW4+JHtNYXRoLnJvdW5kKGhlaWdodCl9PC9zcGFuPnB4PC9zbWFsbD5cbiAgICAgIDxkaXY+JHtub3RMb2NhbE1vZGlmaWNhdGlvbnMucmVkdWNlKChpdGVtcywgaXRlbSkgPT4gYFxuICAgICAgICAke2l0ZW1zfVxuICAgICAgICA8c3BhbiBwcm9wPiR7aXRlbS5wcm9wfTo8L3NwYW4+PHNwYW4gdmFsdWU+JHtpdGVtLnZhbHVlfTwvc3Bhbj5cbiAgICAgIGAsICcnKX08L2Rpdj5cbiAgICAgICR7bG9jYWxNb2RpZmljYXRpb25zLmxlbmd0aCA/IGBcbiAgICAgICAgPGg2PkxvY2FsIE1vZGlmaWNhdGlvbnM8L2g2PlxuICAgICAgICA8ZGl2PiR7bG9jYWxNb2RpZmljYXRpb25zLnJlZHVjZSgoaXRlbXMsIGl0ZW0pID0+IGBcbiAgICAgICAgICAke2l0ZW1zfVxuICAgICAgICAgIDxzcGFuIHByb3A+JHtpdGVtLnByb3B9Ojwvc3Bhbj48c3BhbiB2YWx1ZT4ke2l0ZW0udmFsdWV9PC9zcGFuPlxuICAgICAgICBgLCAnJyl9PC9kaXY+XG4gICAgICBgIDogJyd9XG4gICAgYFxuXG4gICAgcmV0dXJuIHRpcFxuICB9XG5cbiAgY29uc3QgdGlwX2tleSA9IG5vZGUgPT5cbiAgICBgJHtub2RlLm5vZGVOYW1lfV8ke25vZGUuY2xhc3NOYW1lfV8ke25vZGUuY2hpbGRyZW4ubGVuZ3RofV8ke25vZGUuY2xpZW50V2lkdGh9YFxuXG4gIGNvbnN0IHRpcF9wb3NpdGlvbiA9IChub2RlLCBlKSA9PiBgXG4gICAgdG9wOiAke2UuY2xpZW50WSA+IHdpbmRvdy5pbm5lckhlaWdodCAvIDJcbiAgICAgID8gZS5wYWdlWSAtIG5vZGUuY2xpZW50SGVpZ2h0XG4gICAgICA6IGUucGFnZVl9cHg7XG4gICAgbGVmdDogJHtlLmNsaWVudFggPiB3aW5kb3cuaW5uZXJXaWR0aCAvIDJcbiAgICAgID8gZS5wYWdlWCAtIG5vZGUuY2xpZW50V2lkdGggLSAyNVxuICAgICAgOiBlLnBhZ2VYICsgMjV9cHg7XG4gIGBcblxuICBjb25zdCBtb3VzZU91dCA9ICh7dGFyZ2V0fSkgPT4ge1xuICAgIGlmICh0aXBfbWFwW3RpcF9rZXkodGFyZ2V0KV0gJiYgIXRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtbWV0YXRpcCcpKSB7XG4gICAgICAkKHRhcmdldCkub2ZmKCdtb3VzZW91dCcsIG1vdXNlT3V0KVxuICAgICAgJCh0YXJnZXQpLm9mZignY2xpY2snLCB0b2dnbGVQaW5uZWQpXG4gICAgICB0aXBfbWFwW3RpcF9rZXkodGFyZ2V0KV0udGlwLnJlbW92ZSgpXG4gICAgICBkZWxldGUgdGlwX21hcFt0aXBfa2V5KHRhcmdldCldXG4gICAgfVxuICB9XG5cbiAgY29uc3QgdG9nZ2xlUGlubmVkID0gZSA9PiB7XG4gICAgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAhZS50YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnKVxuICAgICAgICA/IGUudGFyZ2V0LnNldEF0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJywgdHJ1ZSlcbiAgICAgICAgOiBlLnRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtbWV0YXRpcCcpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgbW91c2VNb3ZlID0gZSA9PiB7XG4gICAgaWYgKGUudGFyZ2V0LmNsb3Nlc3QoJ3Rvb2wtcGFsbGV0ZScpIHx8IGUudGFyZ2V0LmNsb3Nlc3QoJy5tZXRhdGlwJykpIHJldHVyblxuXG4gICAgZS5hbHRLZXlcbiAgICAgID8gZS50YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLXBpbmhvdmVyJywgdHJ1ZSlcbiAgICAgIDogZS50YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBpbmhvdmVyJylcblxuICAgIC8vIGlmIG5vZGUgaXMgaW4gb3VyIGhhc2ggKGFscmVhZHkgY3JlYXRlZClcbiAgICBpZiAodGlwX21hcFt0aXBfa2V5KGUudGFyZ2V0KV0pIHtcbiAgICAgIC8vIHJldHVybiBpZiBpdCdzIHBpbm5lZFxuICAgICAgaWYgKGUudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJykpIFxuICAgICAgICByZXR1cm5cbiAgICAgIC8vIG90aGVyd2lzZSB1cGRhdGUgcG9zaXRpb25cbiAgICAgIGNvbnN0IHRpcCA9IHRpcF9tYXBbdGlwX2tleShlLnRhcmdldCldLnRpcFxuICAgICAgdGlwLnN0eWxlID0gdGlwX3Bvc2l0aW9uKHRpcCwgZSlcbiAgICB9XG4gICAgLy8gY3JlYXRlIG5ldyB0aXBcbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHRpcCA9IHRlbXBsYXRlKGUpXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRpcClcblxuICAgICAgdGlwLnN0eWxlID0gdGlwX3Bvc2l0aW9uKHRpcCwgZSlcblxuICAgICAgJChlLnRhcmdldCkub24oJ21vdXNlb3V0JywgbW91c2VPdXQpXG4gICAgICAkKGUudGFyZ2V0KS5vbignY2xpY2snLCB0b2dnbGVQaW5uZWQpXG5cbiAgICAgIHRpcF9tYXBbdGlwX2tleShlLnRhcmdldCldID0geyB0aXAsIGUgfVxuICAgIH1cbiAgfVxuXG4gICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxuXG4gIGhvdGtleXMoJ2VzYycsIF8gPT4gcmVtb3ZlQWxsKCkpXG5cbiAgY29uc3QgaGlkZUFsbCA9ICgpID0+XG4gICAgT2JqZWN0LnZhbHVlcyh0aXBfbWFwKVxuICAgICAgLmZvckVhY2goKHt0aXB9KSA9PiB7XG4gICAgICAgIHRpcC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICQodGlwKS5vZmYoJ21vdXNlb3V0JywgbW91c2VPdXQpXG4gICAgICAgICQodGlwKS5vZmYoJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuICAgICAgfSlcblxuICBjb25zdCByZW1vdmVBbGwgPSAoKSA9PiB7XG4gICAgT2JqZWN0LnZhbHVlcyh0aXBfbWFwKVxuICAgICAgLmZvckVhY2goKHt0aXB9KSA9PiB7XG4gICAgICAgIHRpcC5yZW1vdmUoKVxuICAgICAgICAkKHRpcCkub2ZmKCdtb3VzZW91dCcsIG1vdXNlT3V0KVxuICAgICAgICAkKHRpcCkub2ZmKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcbiAgICAgIH0pXG4gICAgXG4gICAgJCgnW2RhdGEtbWV0YXRpcF0nKS5hdHRyKCdkYXRhLW1ldGF0aXAnLCBudWxsKVxuXG4gICAgdGlwX21hcCA9IHt9XG4gIH1cblxuICBPYmplY3QudmFsdWVzKHRpcF9tYXApXG4gICAgLmZvckVhY2goKHt0aXAsZX0pID0+IHtcbiAgICAgIHRpcC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGlwLmlubmVySFRNTCA9IHRlbXBsYXRlKGUpLmlubmVySFRNTFxuICAgICAgdGlwLm9uKCdtb3VzZW91dCcsIG1vdXNlT3V0KVxuICAgICAgdGlwLm9uKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcbiAgICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgJCgnYm9keScpLm9mZignbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxuICAgIGhvdGtleXMudW5iaW5kKCdlc2MnKVxuICAgIGhpZGVBbGwoKVxuICB9XG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IGdldFN0eWxlLCBzaG93SGlkZVNlbGVjdGVkIH0gZnJvbSAnLi91dGlscy5qcydcblxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sc2hpZnQrJHtldmVudH1gXG4gICwgJycpXG4gIC5zdWJzdHJpbmcoMSlcblxuY29uc3QgY29tbWFuZF9ldmVudHMgPSAnY21kK3VwLGNtZCtkb3duJ1xuXG5leHBvcnQgZnVuY3Rpb24gQm94U2hhZG93KHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VCb3hTaGFkb3coc2VsZWN0ZWROb2Rlcywga2V5cywgJ3NpemUnKVxuICAgICAgICA6IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAneCcpXG4gICAgZWxzZVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAnYmx1cicpXG4gICAgICAgIDogY2hhbmdlQm94U2hhZG93KHNlbGVjdGVkTm9kZXMsIGtleXMsICd5JylcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGxldCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIGNoYW5nZUJveFNoYWRvdygkKHNlbGVjdG9yKSwga2V5cywgJ2luc2V0JylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuY29uc3QgZW5zdXJlSGFzU2hhZG93ID0gZWwgPT4ge1xuICBpZiAoZWwuc3R5bGUuYm94U2hhZG93ID09ICcnIHx8IGVsLnN0eWxlLmJveFNoYWRvdyA9PSAnbm9uZScpXG4gICAgZWwuc3R5bGUuYm94U2hhZG93ID0gJ2hzbGEoMCwwJSwwJSw1MCUpIDAgMCAwIDAnXG4gIHJldHVybiBlbFxufVxuXG4vLyB0b2RvOiB3b3JrIGFyb3VuZCB0aGlzIHByb3BNYXAgd2l0aCBhIGJldHRlciBzcGxpdFxuY29uc3QgcHJvcE1hcCA9IHtcbiAgJ3gnOiAgICAgIDQsXG4gICd5JzogICAgICA1LFxuICAnYmx1cic6ICAgNixcbiAgJ3NpemUnOiAgIDcsXG4gICdpbnNldCc6ICA4LFxufVxuXG5jb25zdCBwYXJzZUN1cnJlbnRTaGFkb3cgPSBlbCA9PiBnZXRTdHlsZShlbCwgJ2JveFNoYWRvdycpLnNwbGl0KCcgJylcblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUJveFNoYWRvdyhlbHMsIGRpcmVjdGlvbiwgcHJvcCkge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUhhc1NoYWRvdylcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwsIDE1MDApKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgICdib3hTaGFkb3cnLFxuICAgICAgY3VycmVudDogICBwYXJzZUN1cnJlbnRTaGFkb3coZWwpLCAvLyBbXCJyZ2IoMjU1LFwiLCBcIjAsXCIsIFwiMClcIiwgXCIwcHhcIiwgXCIwcHhcIiwgXCIxcHhcIiwgXCIwcHhcIl1cbiAgICAgIHByb3BJbmRleDogcGFyc2VDdXJyZW50U2hhZG93KGVsKVswXS5pbmNsdWRlcygncmdiYScpID8gcHJvcE1hcFtwcm9wXSA6IHByb3BNYXBbcHJvcF0gLSAxXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+IHtcbiAgICAgIGxldCB1cGRhdGVkID0gWy4uLnBheWxvYWQuY3VycmVudF1cbiAgICAgIGxldCBjdXIgICAgID0gcGFyc2VJbnQocGF5bG9hZC5jdXJyZW50W3BheWxvYWQucHJvcEluZGV4XSlcblxuICAgICAgaWYgKHByb3AgPT0gJ2JsdXInKSB7XG4gICAgICAgIHVwZGF0ZWRbcGF5bG9hZC5wcm9wSW5kZXhdID0gZGlyZWN0aW9uLmluY2x1ZGVzKCdkb3duJylcbiAgICAgICAgICA/IGAke2N1ciAtIDF9cHhgXG4gICAgICAgICAgOiBgJHtjdXIgKyAxfXB4YFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAocHJvcCA9PSAnaW5zZXQnKSB7XG4gICAgICAgIHVwZGF0ZWRbcGF5bG9hZC5wcm9wSW5kZXhdID0gZGlyZWN0aW9uLmluY2x1ZGVzKCdkb3duJylcbiAgICAgICAgICA/ICcnXG4gICAgICAgICAgOiAnaW5zZXQnXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdXBkYXRlZFtwYXlsb2FkLnByb3BJbmRleF0gPSBkaXJlY3Rpb24uaW5jbHVkZXMoJ2xlZnQnKSB8fCBkaXJlY3Rpb24uaW5jbHVkZXMoJ3VwJylcbiAgICAgICAgICA/IGAke2N1ciAtIDF9cHhgXG4gICAgICAgICAgOiBgJHtjdXIgKyAxfXB4YFxuICAgICAgfVxuXG4gICAgICBwYXlsb2FkLnZhbHVlID0gdXBkYXRlZFxuICAgICAgcmV0dXJuIHBheWxvYWRcbiAgICB9KVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB2YWx1ZS5qb2luKCcgJykpXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgVGlueUNvbG9yIH0gZnJvbSAnQGN0cmwvdGlueWNvbG9yJ1xuXG5pbXBvcnQgeyBnZXRTdHlsZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4vdXRpbHMuanMnXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuICAuc3BsaXQoJywnKVxuICAucmVkdWNlKChldmVudHMsIGV2ZW50KSA9PiBcbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbi8vIHRvZG86IGFscGhhIGFzIGNtZCtsZWZ0LGNtZCtzaGlmdCtsZWZ0LGNtZCtyaWdodCxjbWQrc2hpZnQrcmlnaHRcbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gJ2NtZCt1cCxjbWQrc2hpZnQrdXAsY21kK2Rvd24sY21kK3NoaWZ0K2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBIdWVTaGlmdChzZWxlY3Rvcikge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsZXQgc2VsZWN0ZWROb2RlcyA9ICQoc2VsZWN0b3IpXG4gICAgICAsIGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG5cbiAgICBpZiAoa2V5cy5pbmNsdWRlcygnbGVmdCcpIHx8IGtleXMuaW5jbHVkZXMoJ3JpZ2h0JykpXG4gICAgICBjaGFuZ2VIdWUoc2VsZWN0ZWROb2Rlcywga2V5cywgJ3MnKVxuICAgIGVsc2VcbiAgICAgIGNoYW5nZUh1ZShzZWxlY3RlZE5vZGVzLCBrZXlzLCAnbCcpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBsZXQga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcbiAgICBjaGFuZ2VIdWUoJChzZWxlY3RvciksIGtleXMsICdoJylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUh1ZShlbHMsIGRpcmVjdGlvbiwgcHJvcCkge1xuICBlbHNcbiAgICAubWFwKHNob3dIaWRlU2VsZWN0ZWQpXG4gICAgLm1hcChlbCA9PiB7XG4gICAgICBjb25zdCBGRyA9IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdjb2xvcicpKVxuICAgICAgY29uc3QgQkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsLCAnYmFja2dyb3VuZENvbG9yJykpXG4gICAgICBcbiAgICAgIHJldHVybiBCRy5vcmlnaW5hbElucHV0ICE9ICdyZ2JhKDAsIDAsIDAsIDApJyAgICAgICAgICAgICAvLyBpZiBiZyBpcyBzZXQgdG8gYSB2YWx1ZVxuICAgICAgICA/IHsgZWwsIGN1cnJlbnQ6IEJHLnRvSHNsKCksIHN0eWxlOiAnYmFja2dyb3VuZENvbG9yJyB9IC8vIHVzZSBiZ1xuICAgICAgICA6IHsgZWwsIGN1cnJlbnQ6IEZHLnRvSHNsKCksIHN0eWxlOiAnY29sb3InIH0gICAgICAgICAgIC8vIGVsc2UgdXNlIGZnXG4gICAgfSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLmluY2x1ZGVzKCdzaGlmdCcpID8gMTAgOiAxLFxuICAgICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLmluY2x1ZGVzKCdkb3duJykgfHwgZGlyZWN0aW9uLmluY2x1ZGVzKCdsZWZ0JyksXG4gICAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT4ge1xuICAgICAgaWYgKHByb3AgPT09ICdzJyB8fCBwcm9wID09PSAnbCcpXG4gICAgICAgIHBheWxvYWQuYW1vdW50ID0gcGF5bG9hZC5hbW91bnQgKiAwLjAxXG5cbiAgICAgIHBheWxvYWQuY3VycmVudFtwcm9wXSA9IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnRbcHJvcF0gLSBwYXlsb2FkLmFtb3VudCBcbiAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnRbcHJvcF0gKyBwYXlsb2FkLmFtb3VudFxuXG4gICAgICByZXR1cm4gcGF5bG9hZFxuICAgIH0pXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIGN1cnJlbnR9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gbmV3IFRpbnlDb2xvcihjdXJyZW50KS50b0hzbFN0cmluZygpKVxufVxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IFRpbnlDb2xvciB9IGZyb20gJ0BjdHJsL3Rpbnljb2xvcidcblxuaW1wb3J0IHsgY3Vyc29yLCBtb3ZlLCBzZWFyY2gsIG1hcmdpbiwgcGFkZGluZywgZm9udCwgaW5zcGVjdG9yLFxuICAgICAgICAgdHlwZSwgYWxpZ24sIHRyYW5zZm9ybSwgcmVzaXplLCBib3JkZXIsIGh1ZXNoaWZ0LCBib3hzaGFkb3cgfSBmcm9tICcuL3Rvb2xwYWxsZXRlLmljb25zJyBcbmltcG9ydCB7IGdldFN0eWxlIH0gZnJvbSAnLi4vZmVhdHVyZXMvdXRpbHMnXG5pbXBvcnQgeyBcbiAgU2VsZWN0YWJsZSwgTW92ZWFibGUsIFBhZGRpbmcsIE1hcmdpbiwgRWRpdFRleHQsIEZvbnQsIEZsZXgsIFNlYXJjaCxcbiAgQ2hhbmdlRm9yZWdyb3VuZCwgQ2hhbmdlQmFja2dyb3VuZCwgQm94U2hhZG93LCBIdWVTaGlmdCwgTWV0YVRpcFxufSBmcm9tICcuLi9mZWF0dXJlcy8nXG5cbi8vIHRvZG86IGNyZWF0ZT9cbi8vIHRvZG86IHJlc2l6ZVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVG9vbFBhbGxldGUgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMudG9vbGJhcl9tb2RlbCA9IHtcbiAgICAgIGk6IHsgdG9vbDogJ2luc3BlY3RvcicsIGljb246IGluc3BlY3RvciwgbGFiZWw6ICdJbnNwZWN0JywgZGVzY3JpcHRpb246ICdQZWFrIGludG8gdGhlIGNvbW1vbi9jdXJyZW50IHN0eWxlcyBvZiBhbiBlbGVtZW50JyB9LFxuICAgICAgdjogeyB0b29sOiAnbW92ZScsIGljb246IG1vdmUsIGxhYmVsOiAnTW92ZScsIGRlc2NyaXB0aW9uOiAnU2hpZnQgdGhpbmdzIGFyb3VuZCwgY29weS9wYXN0ZSwgZHVwbGljYXRlJyB9LFxuICAgICAgLy8gcjogeyB0b29sOiAncmVzaXplJywgaWNvbjogcmVzaXplLCBsYWJlbDogJ1Jlc2l6ZScsIGRlc2NyaXB0aW9uOiAnJyB9LFxuICAgICAgbTogeyB0b29sOiAnbWFyZ2luJywgaWNvbjogbWFyZ2luLCBsYWJlbDogJ01hcmdpbicsIGRlc2NyaXB0aW9uOiAnQ2hhbmdlIHRoZSBtYXJnaW4gYXJvdW5kIDEgb3IgbWFueSBzZWxlY3RlZCBlbGVtZW50cycgfSxcbiAgICAgIHA6IHsgdG9vbDogJ3BhZGRpbmcnLCBpY29uOiBwYWRkaW5nLCBsYWJlbDogJ1BhZGRpbmcnLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSB0aGUgcGFkZGluZyBhcm91bmQgMSBvciBtYW55IHNlbGVjdGVkIGVsZW1lbnRzJyB9LFxuICAgICAgLy8gYjogeyB0b29sOiAnYm9yZGVyJywgaWNvbjogYm9yZGVyLCBsYWJlbDogJ0JvcmRlcicsIGRlc2NyaXB0aW9uOiAnJyB9LFxuICAgICAgYTogeyB0b29sOiAnYWxpZ24nLCBpY29uOiBhbGlnbiwgbGFiZWw6ICdGbGV4Ym94IEFsaWduJywgZGVzY3JpcHRpb246ICdRdWljayBhbGlnbm1lbnQgYWRqdXN0bWVudHMnIH0sXG4gICAgICBoOiB7IHRvb2w6ICdodWVzaGlmdCcsIGljb246IGh1ZXNoaWZ0LCBsYWJlbDogJ0h1ZSBTaGlmdGVyJywgZGVzY3JpcHRpb246ICdTaGlmdCB0aGUgYnJpZ2h0bmVzcywgc2F0dXJhdGlvbiAmIGh1ZScgfSxcbiAgICAgIGQ6IHsgdG9vbDogJ2JveHNoYWRvdycsIGljb246IGJveHNoYWRvdywgbGFiZWw6ICdTaGFkb3cnLCBkZXNjcmlwdGlvbjogJ01vdmUgb3IgY3JlYXRlIGEgc2hhZG93JyB9LFxuICAgICAgLy8gdDogeyB0b29sOiAndHJhbnNmb3JtJywgaWNvbjogdHJhbnNmb3JtLCBsYWJlbDogJzNEIFRyYW5zZm9ybScsIGRlc2NyaXB0aW9uOiAnJyB9LFxuICAgICAgZjogeyB0b29sOiAnZm9udCcsIGljb246IGZvbnQsIGxhYmVsOiAnRm9udCBTdHlsZXMnLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSBzaXplLCBsZWFkaW5nLCBrZXJuaW5nLCAmIHdlaWdodHMnIH0sXG4gICAgICBlOiB7IHRvb2w6ICd0ZXh0JywgaWNvbjogdHlwZSwgbGFiZWw6ICdFZGl0IFRleHQnLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSBhbnkgdGV4dCBvbiB0aGUgcGFnZScgfSxcbiAgICAgIHM6IHsgdG9vbDogJ3NlYXJjaCcsIGljb246IHNlYXJjaCwgbGFiZWw6ICdTZWFyY2gnLCBkZXNjcmlwdGlvbjogJ1NlbGVjdCBlbGVtZW50cyBieSBzZWFyY2hpbmcgZm9yIHRoZW0nIH0sXG4gICAgfVxuXG4gICAgdGhpcy4kc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pXG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCA9IHRoaXMucmVuZGVyKClcblxuICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUgPSBTZWxlY3RhYmxlKClcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICQoJ2xpJywgdGhpcy4kc2hhZG93KS5vbignY2xpY2snLCBlID0+IFxuICAgICAgdGhpcy50b29sU2VsZWN0ZWQoZS5jdXJyZW50VGFyZ2V0KSAmJiBlLnN0b3BQcm9wYWdhdGlvbigpKVxuXG4gICAgdGhpcy5mb3JlZ3JvdW5kUGlja2VyID0gJCgnI2ZvcmVncm91bmQnLCB0aGlzLiRzaGFkb3cpWzBdXG4gICAgdGhpcy5iYWNrZ3JvdW5kUGlja2VyID0gJCgnI2JhY2tncm91bmQnLCB0aGlzLiRzaGFkb3cpWzBdXG5cbiAgICAvLyBzZXQgY29sb3JzXG4gICAgdGhpcy5mb3JlZ3JvdW5kUGlja2VyLm9uKCdpbnB1dCcsIGUgPT5cbiAgICAgIENoYW5nZUZvcmVncm91bmQoJCgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKSwgZS50YXJnZXQudmFsdWUpKVxuXG4gICAgdGhpcy5iYWNrZ3JvdW5kUGlja2VyLm9uKCdpbnB1dCcsIGUgPT5cbiAgICAgIENoYW5nZUJhY2tncm91bmQoJCgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKSwgZS50YXJnZXQudmFsdWUpKVxuXG4gICAgLy8gcmVhZCBjb2xvcnNcbiAgICB0aGlzLnNlbGVjdG9yRW5naW5lLm9uU2VsZWN0ZWRVcGRhdGUoZWxlbWVudHMgPT4ge1xuICAgICAgaWYgKCFlbGVtZW50cy5sZW5ndGgpIHJldHVyblxuXG4gICAgICBpZiAoZWxlbWVudHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgdGhpcy5mb3JlZ3JvdW5kUGlja2VyLnZhbHVlID0gbnVsbFxuICAgICAgICB0aGlzLmJhY2tncm91bmRQaWNrZXIudmFsdWUgPSBudWxsXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgRkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsZW1lbnRzWzBdLCAnY29sb3InKSlcbiAgICAgICAgY29uc3QgQkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsZW1lbnRzWzBdLCAnYmFja2dyb3VuZENvbG9yJykpXG5cbiAgICAgICAgbGV0IGZnID0gJyMnICsgRkcudG9IZXgoKVxuICAgICAgICBsZXQgYmcgPSAnIycgKyBCRy50b0hleCgpXG5cbiAgICAgICAgdGhpcy5mb3JlZ3JvdW5kUGlja2VyLmF0dHIoJ3ZhbHVlJywgKEZHLm9yaWdpbmFsSW5wdXQgPT0gJ3JnYigwLCAwLCAwKScgJiYgZWxlbWVudHNbMF0udGV4dENvbnRlbnQgPT0gJycpID8gJycgOiBmZylcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kUGlja2VyLmF0dHIoJ3ZhbHVlJywgQkcub3JpZ2luYWxJbnB1dCA9PSAncmdiYSgwLCAwLCAwLCAwKScgPyAnJyA6IGJnKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICAvLyB0b29sYmFyIGhvdGtleXNcbiAgICBPYmplY3QuZW50cmllcyh0aGlzLnRvb2xiYXJfbW9kZWwpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT5cbiAgICAgIGhvdGtleXMoa2V5LCBlID0+IFxuICAgICAgICB0aGlzLnRvb2xTZWxlY3RlZChcbiAgICAgICAgICAkKGBbZGF0YS10b29sPVwiJHt2YWx1ZS50b29sfVwiXWAsIHRoaXMuJHNoYWRvdylbMF0pKSlcblxuICAgIC8vIGluaXRpYWwgc2VsZWN0ZWQgbm9kZVxuICAgIHRoaXMudG9vbFNlbGVjdGVkKCQoJ1tkYXRhLXRvb2w9XCJpbnNwZWN0b3JcIl0nLCB0aGlzLiRzaGFkb3cpWzBdKVxuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gIHRvb2xTZWxlY3RlZChlbCkge1xuICAgIGlmICh0eXBlb2YgZWwgPT09ICdzdHJpbmcnKVxuICAgICAgZWwgPSAkKGBbZGF0YS10b29sPVwiJHtlbH1cIl1gLCB0aGlzLiRzaGFkb3cpWzBdXG5cbiAgICBpZiAodGhpcy5hY3RpdmVfdG9vbCkge1xuICAgICAgdGhpcy5hY3RpdmVfdG9vbC5hdHRyKCdkYXRhLWFjdGl2ZScsIG51bGwpXG4gICAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSgpXG4gICAgfVxuXG4gICAgZWwuYXR0cignZGF0YS1hY3RpdmUnLCB0cnVlKVxuICAgIHRoaXMuYWN0aXZlX3Rvb2wgPSBlbFxuICAgIHRoaXNbZWwuZGF0YXNldC50b29sXSgpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICR7dGhpcy5zdHlsZXMoKX1cbiAgICAgIDxvbD5cbiAgICAgICAgJHtPYmplY3QuZW50cmllcyh0aGlzLnRvb2xiYXJfbW9kZWwpLnJlZHVjZSgobGlzdCwgW2tleSwgdmFsdWVdKSA9PiBgXG4gICAgICAgICAgJHtsaXN0fVxuICAgICAgICAgIDxsaSBhcmlhLWxhYmVsPVwiJHt2YWx1ZS5sYWJlbH0gVG9vbFwiIGFyaWEtZGVzY3JpcHRpb249XCIke3ZhbHVlLmRlc2NyaXB0aW9ufVwiIGRhdGEtdG9vbD1cIiR7dmFsdWUudG9vbH1cIiBkYXRhLWFjdGl2ZT1cIiR7a2V5ID09ICdpJ31cIj4ke3ZhbHVlLmljb259PC9saT5cbiAgICAgICAgYCwnJyl9XG4gICAgICAgIDxsaT48L2xpPlxuICAgICAgICA8bGkgY2xhc3M9XCJjb2xvclwiIGFyaWEtbGFiZWw9XCJGb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJjb2xvclwiIGlkPSdmb3JlZ3JvdW5kJyB2YWx1ZT0nJz5cbiAgICAgICAgPC9saT5cbiAgICAgICAgPGxpIGNsYXNzPVwiY29sb3JcIiBhcmlhLWxhYmVsPVwiQmFja2dyb3VuZFwiPlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY29sb3JcIiBpZD0nYmFja2dyb3VuZCcgdmFsdWU9Jyc+XG4gICAgICAgIDwvbGk+XG4gICAgICA8L29sPlxuICAgIGBcbiAgfVxuXG4gIHN0eWxlcygpIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgIHRvcDogMXJlbTtcbiAgICAgICAgICBsZWZ0OiAxcmVtO1xuICAgICAgICAgIHotaW5kZXg6IDk5OTk4OyBcblxuICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgMC4yNXJlbSAwLjVyZW0gaHNsYSgwLDAlLDAlLDEwJSk7XG5cbiAgICAgICAgICAtLWRhcmtlc3QtZ3JleTogaHNsKDAsMCUsMiUpO1xuICAgICAgICAgIC0tZGFya2VyLWdyZXk6IGhzbCgwLDAlLDUlKTtcbiAgICAgICAgICAtLWRhcmstZ3JleTogaHNsKDAsMCUsMjAlKTtcbiAgICAgICAgICAtLWdyZXk6IGhzbCgwLDAlLDUwJSk7XG4gICAgICAgICAgLS1saWdodC1ncmV5OiBoc2woMCwwJSw2MCUpO1xuICAgICAgICAgIC0tbGlnaHRlci1ncmV5OiBoc2woMCwwJSw4MCUpO1xuICAgICAgICAgIC0tbGlnaHRlc3QtZ3JleTogaHNsKDAsMCUsOTUlKTtcbiAgICAgICAgICAtLXRoZW1lLWNvbG9yOiBob3RwaW5rO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgPiBvbCB7XG4gICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xuXG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGkge1xuICAgICAgICAgIGhlaWdodDogMi41cmVtO1xuICAgICAgICAgIHdpZHRoOiAyLjVyZW07XG4gICAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaTpob3ZlciB7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGJhY2tncm91bmQ6IGhzbCgwLDAlLDk4JSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaTpob3ZlcjphZnRlciB7XG4gICAgICAgICAgY29udGVudDogYXR0cihhcmlhLWxhYmVsKSBcIlxcXFxBXCIgYXR0cihhcmlhLWRlc2NyaXB0aW9uKTtcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgbGVmdDogMTAwJTtcbiAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgei1pbmRleDogLTE7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCAwLjFyZW0gMC4xcmVtIGhzbGEoMCwwJSwwJSwxMCUpO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMC41cmVtO1xuICAgICAgICAgIGJhY2tncm91bmQ6IGhvdHBpbms7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMC44cmVtO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaS5jb2xvcjpob3ZlcjphZnRlciB7XG4gICAgICAgICAgdG9wOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sPSdhbGlnbiddID4gc3ZnIHtcbiAgICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZVooOTBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS1hY3RpdmU9dHJ1ZV0ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IGhzbCgwLDAlLDk4JSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLWFjdGl2ZT10cnVlXSA+IHN2Zzpub3QoLmljb24tY3Vyc29yKSB7IFxuICAgICAgICAgIGZpbGw6IHZhcigtLXRoZW1lLWNvbG9yKTsgXG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLWFjdGl2ZT10cnVlXSA+IC5pY29uLWN1cnNvciB7IFxuICAgICAgICAgIHN0cm9rZTogdmFyKC0tdGhlbWUtY29sb3IpOyBcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpOmVtcHR5IHtcbiAgICAgICAgICBoZWlnaHQ6IDAuMjVyZW07XG4gICAgICAgICAgYmFja2dyb3VuZDogaHNsKDAsMCUsOTAlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpLmNvbG9yIHtcbiAgICAgICAgICBoZWlnaHQ6IDIwcHg7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaSA+IHN2ZyB7XG4gICAgICAgICAgd2lkdGg6IDUwJTtcbiAgICAgICAgICBmaWxsOiB2YXIoLS1kYXJrLWdyZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGkgPiBzdmcuaWNvbi1jdXJzb3Ige1xuICAgICAgICAgIHdpZHRoOiAzNSU7XG4gICAgICAgICAgZmlsbDogd2hpdGU7XG4gICAgICAgICAgc3Ryb2tlOiB2YXIoLS1kYXJrLWdyZXkpO1xuICAgICAgICAgIHN0cm9rZS13aWR0aDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sPVwic2VhcmNoXCJdID4gLnNlYXJjaCB7XG4gICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgIGxlZnQ6IDEwMCU7XG4gICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICB6LWluZGV4OiA5OTk5O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sPVwic2VhcmNoXCJdID4gLnNlYXJjaCA+IGlucHV0IHtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgZm9udC1zaXplOiAxcmVtO1xuICAgICAgICAgIHBhZGRpbmc6IDAuNGVtO1xuICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIHdpZHRoOiAyNTBweDtcbiAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICAgIGNhcmV0LWNvbG9yOiBob3RwaW5rO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgaW5wdXRbdHlwZT0nY29sb3InXSB7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgICBib3JkZXI6IHdoaXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgaW5wdXRbdHlwZT0nY29sb3InXVt2YWx1ZT0nJ106Oi13ZWJraXQtY29sb3Itc3dhdGNoIHsgXG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDsgXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgI2ZmZmZmZiAwJSwjZmZmZmZmIDQ2JSwjZmYwMDAwIDQ2JSwjZmYwMDAwIDY0JSwjZmZmZmZmIDY0JSwjZmZmZmZmIDEwMCUpOztcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cblxuICBtb3ZlKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gTW92ZWFibGUoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJylcbiAgfVxuXG4gIG1hcmdpbigpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IE1hcmdpbignW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKSBcbiAgfVxuXG4gIHBhZGRpbmcoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBQYWRkaW5nKCdbZGF0YS1zZWxlY3RlZD10cnVlXScpIFxuICB9XG5cbiAgZm9udCgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IEZvbnQoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJylcbiAgfSBcblxuICB0ZXh0KCkge1xuICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUub25TZWxlY3RlZFVwZGF0ZShFZGl0VGV4dClcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9ICgpID0+IFxuICAgICAgdGhpcy5zZWxlY3RvckVuZ2luZS5yZW1vdmVTZWxlY3RlZENhbGxiYWNrKEVkaXRUZXh0KVxuICB9XG5cbiAgYWxpZ24oKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBGbGV4KCdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG4gIH1cblxuICBzZWFyY2goKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBTZWFyY2godGhpcy5zZWxlY3RvckVuZ2luZSwgJCgnW2RhdGEtdG9vbD1cInNlYXJjaFwiXScsIHRoaXMuJHNoYWRvdykpXG4gIH1cblxuICBib3hzaGFkb3coKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBCb3hTaGFkb3coJ1tkYXRhLXNlbGVjdGVkPXRydWVdJylcbiAgfVxuXG4gIGh1ZXNoaWZ0KCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gSHVlU2hpZnQoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJylcbiAgfVxuXG4gIGluc3BlY3RvcigpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IE1ldGFUaXAoKVxuICB9XG5cbiAgYWN0aXZlVG9vbCgpIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVfdG9vbC5kYXRhc2V0LnRvb2xcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3Rvb2wtcGFsbGV0ZScsIFRvb2xQYWxsZXRlKSJdLCJuYW1lcyI6WyJrZXlfZXZlbnRzIiwiY29tbWFuZF9ldmVudHMiLCJzZWFyY2giLCJzdG9wQnViYmxpbmciXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sS0FBSyxHQUFHO0VBQ1osRUFBRSxFQUFFLFNBQVMsS0FBSyxFQUFFLEVBQUUsRUFBRTtJQUN0QixLQUFLO09BQ0YsS0FBSyxDQUFDLEdBQUcsQ0FBQztPQUNWLE9BQU8sQ0FBQyxJQUFJO1FBQ1gsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBQztJQUNwQyxPQUFPLElBQUk7R0FDWjtFQUNELEdBQUcsRUFBRSxTQUFTLEtBQUssRUFBRSxFQUFFLEVBQUU7SUFDdkIsS0FBSztPQUNGLEtBQUssQ0FBQyxHQUFHLENBQUM7T0FDVixPQUFPLENBQUMsSUFBSTtRQUNYLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUM7SUFDdkMsT0FBTyxJQUFJO0dBQ1o7RUFDRCxJQUFJLEVBQUUsU0FBUyxJQUFJLEVBQUUsR0FBRyxFQUFF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LE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7Q0FDakQ7Ozs7Ozs7QUFPRCxTQUFTLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUU7SUFDbkMsTUFBTSxHQUFHLEdBQUc7UUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNuQyxDQUFDOztJQUVGLElBQUksVUFBVTtRQUNWLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDckMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDdkMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNqRTtJQUNELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUN2Qjs7Ozs7OztBQU9ELFNBQVMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUU7SUFDdkMsTUFBTSxHQUFHLEdBQUc7UUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0IsQ0FBQzs7SUFFRixJQUFJLFVBQVU7UUFDVixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDckMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDdkMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BGO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ3ZCO0FBQ0QsQUFhQTtBQUNBLFNBQVMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFO0lBQzVCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ3ZEOztBQUVELFNBQVMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFO0lBQzVCLE9BQU8sZUFBZSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztDQUNuQzs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxHQUFHLEVBQUU7SUFDMUIsT0FBTyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0NBQzVCOzs7Ozs7QUFNRCxNQUFNLEtBQUssR0FBRztJQUNWLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFlBQVksRUFBRSxTQUFTO0lBQ3ZCLElBQUksRUFBRSxTQUFTO0lBQ2YsVUFBVSxFQUFFLFNBQVM7SUFDckIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsTUFBTSxFQUFFLFNBQVM7SUFDakIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsY0FBYyxFQUFFLFNBQVM7SUFDekIsSUFBSSxFQUFFLFNBQVM7SUFDZixVQUFVLEVBQUUsU0FBUztJQUNyQixLQUFLLEVBQUUsU0FBUztJQUNoQixTQUFTLEVBQUUsU0FBUztJQUNwQixTQUFTLEVBQUUsU0FBUztJQUNwQixVQUFVLEVBQUUsU0FBUztJQUNyQixTQUFTLEVBQUUsU0FBUztJQUNwQixLQUFLLEVBQUUsU0FBUztJQUNoQixjQUFjLEVBQUUsU0FBUztJQUN6QixRQUFRLEVBQUUsU0FBUztJQUNuQixPQUFPLEVBQUUsU0FBUztJQUNsQixJQUFJLEVBQUUsU0FBUztJQUNmLFFBQVEsRUFBRSxTQUFTO0lBQ25CLFFBQVEsRUFBRSxTQUFTO0lBQ25CLGFBQWEsRUFBRSxTQUFTO0lBQ3hCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLGNBQWMsRUFBRSxTQUFTO0lBQ3pCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFlBQVksRUFBRSxTQUFTO0lBQ3ZCLGFBQWEsRUFBRSxTQUFTO0lBQ3hCLGFBQWEsRUFBRSxTQUFTO0lBQ3hCLGFBQWEsRUFBRSxTQUFTO0lBQ3hCLGFBQWEsRUFBRSxTQUFTO0lBQ3hCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLElBQUksRUFBRSxTQUFTO0lBQ2YsU0FBUyxFQUFFLFNBQVM7SUFDcEIsSUFBSSxFQUFFLFNBQVM7SUFDZixLQUFLLEVBQUUsU0FBUztJQUNoQixXQUFXLEVBQUUsU0FBUztJQUN0QixJQUFJLEVBQUUsU0FBUztJQUNmLFFBQVEsRUFBRSxTQUFTO0lBQ25CLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLEtBQUssRUFBRSxTQUFTO0lBQ2hCLEtBQUssRUFBRSxTQUFTO0lBQ2hCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLGFBQWEsRUFBRSxTQUFTO0lBQ3hCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFlBQVksRUFBRSxTQUFTO0lBQ3ZCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLG9CQUFvQixFQUFFLFNBQVM7SUFDL0IsU0FBUyxFQUFFLFNBQVM7SUFDcEIsVUFBVSxFQUFFLFNBQVM7SUFDckIsU0FBUyxFQUFFLFNBQVM7SUFDcEIsU0FBUyxFQUFFLFNBQVM7SUFDcEIsV0FBVyxFQUFFLFNBQVM7SUFDdEIsYUFBYSxFQUFFLFNBQVM7SUFDeEIsWUFBWSxFQUFFLFNBQVM7SUFDdkIsY0FBYyxFQUFFLFNBQVM7SUFDekIsY0FBYyxFQUFFLFNBQVM7SUFDekIsY0FBYyxFQUFFLFNBQVM7SUFDekIsV0FBVyxFQUFFLFNBQVM7SUFDdEIsSUFBSSxFQUFFLFNBQVM7SUFDZixTQUFTLEVBQUUsU0FBUztJQUNwQixLQUFLLEVBQUUsU0FBUztJQUNoQixPQUFPLEVBQUUsU0FBUztJQUNsQixNQUFNLEVBQUUsU0FBUztJQUNqQixnQkFBZ0IsRUFBRSxTQUFTO0lBQzNCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFlBQVksRUFBRSxTQUFTO0lBQ3ZCLFlBQVksRUFBRSxTQUFTO0lBQ3ZCLGNBQWMsRUFBRSxTQUFTO0lBQ3pCLGVBQWUsRUFBRSxTQUFTO0lBQzFCLGlCQUFpQixFQUFFLFNBQVM7SUFDNUIsZUFBZSxFQUFFLFNBQVM7SUFDMUIsZUFBZSxFQUFFLFNBQVM7SUFDMUIsWUFBWSxFQUFFLFNBQVM7SUFDdkIsU0FBUyxFQUFFLFNBQVM7SUFDcEIsU0FBUyxFQUFFLFNBQVM7SUFDcEIsUUFBUSxFQUFFLFNBQVM7SUFDbkIsV0FBVyxFQUFFLFNBQVM7SUFDdEIsSUFBSSxFQUFFLFNBQVM7SUFDZixPQUFPLEVBQUUsU0FBUztJQUNsQixLQUFLLEVBQUUsU0FBUztJQUNoQixTQUFTLEVBQUUsU0FBUztJQUNwQixNQUFNLEVBQUUsU0FBUztJQUNqQixTQUFTLEVBQUUsU0FBUztJQUNwQixNQUFNLEVBQUUsU0FBUztJQUNqQixhQUFhLEVBQUUsU0FBUztJQUN4QixTQUFTLEVBQUUsU0FBUztJQUNwQixhQUFhLEVBQUUsU0FBUztJQUN4QixhQUFhLEVBQUUsU0FBUztJQUN4QixVQUFVLEVBQUUsU0FBUztJQUNyQixTQUFTLEVBQUUsU0FBUztJQUNwQixJQUFJLEVBQUUsU0FBUztJQUNmLElBQUksRUFBRSxTQUFTO0lBQ2YsSUFBSSxFQUFFLFNBQVM7SUFDZixVQUFVLEVBQUUsU0FBUztJQUNyQixNQUFNLEVBQUUsU0FBUztJQUNqQixhQUFhLEVBQUUsU0FBUztJQUN4QixHQUFHLEVBQUUsU0FBUztJQUNkLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFdBQVcsRUFBRSxTQUFTO0lBQ3RCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLFFBQVEsRUFBRSxTQUFTO0lBQ25CLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLElBQUksRUFBRSxTQUFTO0lBQ2YsV0FBVyxFQUFFLFNBQVM7SUFDdEIsU0FBUyxFQUFFLFNBQVM7SUFDcEIsR0FBRyxFQUFFLFNBQVM7SUFDZCxJQUFJLEVBQUUsU0FBUztJQUNmLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLEtBQUssRUFBRSxTQUFTO0lBQ2hCLEtBQUssRUFBRSxTQUFTO0lBQ2hCLFVBQVUsRUFBRSxTQUFTO0lBQ3JCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLFdBQVcsRUFBRSxTQUFTO0NBQ3pCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JGLFNBQVMsVUFBVSxDQUFDLEtBQUssRUFBRTtJQUN2QixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDL0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2IsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2IsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2IsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ2YsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ25CLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN0QztJQUNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDL0UsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDVixNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQztTQUNoRTthQUNJLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDcEYsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxDQUFDLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsRUFBRSxHQUFHLElBQUksQ0FBQztZQUNWLE1BQU0sR0FBRyxLQUFLLENBQUM7U0FDbEI7YUFDSSxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3BGLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDVixNQUFNLEdBQUcsS0FBSyxDQUFDO1NBQ2xCO1FBQ0QsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ2Y7S0FDSjtJQUNELENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsT0FBTztRQUNILEVBQUU7UUFDRixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sSUFBSSxNQUFNO1FBQzlCLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7S0FDSixDQUFDO0NBQ0w7O0FBRUQsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDOztBQUVwQyxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQzs7QUFFMUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7QUFJeEQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RHLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzNILE1BQU0sUUFBUSxHQUFHO0lBQ2IsUUFBUSxFQUFFLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUM5QixHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsS0FBSyxHQUFHLGlCQUFpQixDQUFDO0lBQzFDLElBQUksRUFBRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUM7SUFDNUMsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztJQUMxQyxJQUFJLEVBQUUsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLGlCQUFpQixDQUFDO0lBQzVDLEdBQUcsRUFBRSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEdBQUcsaUJBQWlCLENBQUM7SUFDMUMsSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQztJQUM1QyxJQUFJLEVBQUUsc0RBQXNEO0lBQzVELElBQUksRUFBRSxzREFBc0Q7SUFDNUQsSUFBSSxFQUFFLHNFQUFzRTtJQUM1RSxJQUFJLEVBQUUsc0VBQXNFO0NBQy9FLENBQUM7Ozs7O0FBS0YsU0FBUyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUU7SUFDaEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNuQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLE9BQU8sS0FBSyxDQUFDO0tBQ2hCO0lBQ0QsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2xCLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2QsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQixLQUFLLEdBQUcsSUFBSSxDQUFDO0tBQ2hCO1NBQ0ksSUFBSSxLQUFLLEtBQUssYUFBYSxFQUFFO1FBQzlCLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztLQUNyRDs7Ozs7SUFLRCxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ3BEO0lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLElBQUksS0FBSyxFQUFFO1FBQ1AsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNqRTtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ3BEO0lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLElBQUksS0FBSyxFQUFFO1FBQ1AsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNqRTtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ3BEO0lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLElBQUksS0FBSyxFQUFFO1FBQ1AsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNqRTtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU87WUFDSCxDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDLEVBQUUs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LElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoRzs7OztJQUlELEtBQUssR0FBRztRQUNKLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUM1RDs7Ozs7SUFLRCxXQUFXLEdBQUc7UUFDVixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNsQyxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoRzs7Ozs7SUFLRCxLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUssRUFBRTtRQUN0QixPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN2RDs7Ozs7SUFLRCxXQUFXLENBQUMsVUFBVSxHQUFHLEtBQUssRUFBRTtRQUM1QixPQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3ZDOzs7OztJQUtELE1BQU0sQ0FBQyxVQUFVLEdBQUcsS0FBSyxFQUFFO1FBQ3ZCLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDaEU7Ozs7O0lBS0QsWUFBWSxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUU7UUFDN0IsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUN4Qzs7OztJQUlELEtBQUssR0FBRztRQUNKLE9BQU87WUFDSCxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckIsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDWixDQUFDO0tBQ0w7Ozs7O0lBS0QsV0FBVyxHQUFHO1FBQ1YsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUY7Ozs7SUFJRCxlQUFlLEdBQUc7UUFDZCxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNELE9BQU87WUFDSCxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDWixDQUFDO0tBQ0w7Ozs7SUFJRCxxQkFBcUIsR0FBRztRQUNwQixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxD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
