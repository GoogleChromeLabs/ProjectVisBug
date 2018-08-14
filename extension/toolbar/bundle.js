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
  hotkeys.unbind('escape,esc');
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
  });
}

const key_events$1 = 'up,down,left,right,backspace';
// todo: indicator for when node can descend
// todo: indicator where left and right will go
// todo: indicator when left or right hit dead ends
function Moveable(selector) {
  hotkeys(key_events$1, (e, {key}) => {
    e.preventDefault();
    e.stopPropagation();
    
    $(selector).forEach(el => {
      moveElement(el, key);
      updateFeedback(el);
    });
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
      if (!el.nextElementSibling && el.parentNode && el.parentNode.parentNode)
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
  el.parentNode && el.parentNode.parentNode;

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

  const listen = () => {
    elements.on('click', on_click);
    elements.on('dblclick', on_dblclick);
    elements.on('selectstart', on_selection);
    elements.on('mouseover', on_hover);
    elements.on('mouseout', on_hoverout);

    document.addEventListener('copy', on_copy);
    document.addEventListener('cut', on_cut);
    document.addEventListener('paste', on_paste);

    hotkeys('esc', on_esc);
    hotkeys('cmd+d', on_duplicate);
    hotkeys('backspace,del,delete', on_delete);
    hotkeys('alt+del,alt+backspace', on_clearstyles);
    hotkeys('cmd+e,cmd+shift+e', on_expand_selection);
    hotkeys('cmd+g,cmd+shift+g', on_group);
    hotkeys('tab,shift+tab,enter,shift+enter', on_keyboard_traversal);
  };

  const unlisten = () => {
    elements.off('click', on_click);
    elements.off('dblclick', on_dblclick);
    elements.off('selectstart', on_selection);
    elements.off('mouseover', on_hover);
    elements.off('mouseout', on_hoverout);

    document.removeEventListener('copy', on_copy);
    document.removeEventListener('cut', on_cut);
    document.removeEventListener('paste', on_paste);

    hotkeys.unbind('esc,cmd+d,backspace,del,delete,alt+del,alt+backspace,cmd+e,cmd+shift+e,cmd+g,cmd+shift+g,tab,shift+tab,enter,shift+enter');
  };

  const on_click = e => {
    if (isOffBounds(e.target) && !selected.filter(el => el == e.target).length) 
      return

    e.preventDefault();
    e.stopPropagation();
    if (!e.shiftKey) unselect_all();
    select(e.target);
  };

  const on_dblclick = e => {
    e.preventDefault();
    e.stopPropagation();
    if (isOffBounds(e.target)) return
    EditText([e.target], {focus:true});
    $('tool-pallete')[0].toolSelected('text');
  };

  const on_esc = _ => 
    selected.length && unselect_all();

  const on_duplicate = e => {
    const root_node = selected[0];
    if (!root_node) return

    const deep_clone = root_node.cloneNode(true);
    deep_clone.removeAttribute('data-selected');
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling);
    e.preventDefault();
  };

  const on_delete = e => 
    selected.length && delete_all();

  const on_clearstyles = e =>
    selected.forEach(el =>
      el.attr('style', null));

  const on_copy = e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      e.preventDefault();
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute('data-selected');
      this.copy_backup = $node.outerHTML;
      e.clipboardData.setData('text/html', this.copy_backup);
    }
  };

  const on_cut = e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute('data-selected');
      this.copy_backup = $node.outerHTML;
      e.clipboardData.setData('text/html', this.copy_backup);
      selected[0].remove();
    }
  };

  const on_paste = e => {
    const clipData = e.clipboardData.getData('text/html');
    const potentialHTML = clipData || this.copy_backup;
    if (selected[0] && potentialHTML) {
      e.preventDefault();
      selected[0].appendChild(
        htmlStringToDom(potentialHTML));
    }
  };

  const on_expand_selection = (e, {key}) => {
    e.preventDefault();

    // TODO: need a much smarter system here
    // only expands base tag names atm
    if (selected[0].nodeName !== 'DIV')
      expandSelection({
        root_node: selected[0], 
        all: key.includes('shift'),
      });
  };

  const on_group = (e, {key}) => {
    e.preventDefault();

    if (key.split('+').includes('shift')) {
      let $selected = [...selected];
      unselect_all();
      $selected.reverse().forEach(el => {
        let l = el.children.length;
        while (el.children.length > 0) {
          var node = el.childNodes[el.children.length - 1];
          if (node.nodeName !== '#text')
            select(node);
          el.parentNode.prepend(node);
        }
        el.parentNode.removeChild(el);
      });
    }
    else {
      let div = document.createElement('div');
      selected[0].parentNode.prepend(
        selected.reverse().reduce((div, el) => {
          div.appendChild(el);
          return div
        }, div)
      );
      unselect_all();
      select(div);
    }
  };

  const on_selection = e =>
    !isOffBounds(e.target) 
    && selected.length 
    && selected[0].textContent != e.target.textContent 
    && e.preventDefault();

  const on_keyboard_traversal = (e, {key}) => {
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
  };

  const on_hover = ({target}) =>
    !isOffBounds(target) && target.setAttribute('data-hover', true);

  const on_hoverout = ({target}) =>
    target.removeAttribute('data-hover');

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
    node.closest && (node.closest('tool-pallete') || node.closest('.metatip') || node.closest('hotkey-map'));

  const onSelectedUpdate = cb =>
    selectedCallbacks.push(cb) && cb(selected);

  const removeSelectedCallback = cb =>
    selectedCallbacks = selectedCallbacks.filter(callback => callback != cb);

  const tellWatchers = () =>
    selectedCallbacks.forEach(cb => cb(selected));

  const disconnect = () => {
    unselect_all();
    unlisten();
  };

  watchImagesForUpload();
  listen();

  return {
    select,
    unselect_all,
    onSelectedUpdate,
    removeSelectedCallback,
    disconnect,
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

function ColorPicker(pallete, selectorEngine) {
  const foregroundPicker = $('#foreground', pallete)[0];
  const backgroundPicker = $('#background', pallete)[0];

  // set colors
  foregroundPicker.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style.color = e.target.value));

  backgroundPicker.on('input', e =>
    $('[data-selected=true]').map(el =>
      el.style.backgroundColor = e.target.value));

  // read colors
  selectorEngine.onSelectedUpdate(elements => {
    if (!elements.length) return

    let isMeaningfulForeground = false;
    let isMeaningfulBackground = false;

    if (elements.length <= 2) {
      const el = elements[0];
      const FG = new TinyColor(getStyle(el, 'color'));
      const BG = new TinyColor(getStyle(el, 'backgroundColor'));

      let fg = FG.toHexString();
      let bg = BG.toHexString();

      isMeaningfulForeground = FG.originalInput !== 'rgb(0, 0, 0)' || (el.children.length === 0 && el.textContent !== '');
      isMeaningfulBackground = BG.originalInput !== 'rgba(0, 0, 0, 0)'; 

      foregroundPicker.attr('value', isMeaningfulForeground
        ? fg 
        : '');

      backgroundPicker.attr('value', isMeaningfulBackground
        ? bg 
        : '');
    }

    foregroundPicker.parentNode.style.display = !isMeaningfulForeground ? 'none' : 'block';
    backgroundPicker.parentNode.style.display = !isMeaningfulBackground ? 'none' : 'block';
  });
}

const desiredPropMap = {
  color:                'rgb(0, 0, 0)',
  backgroundColor:      'rgba(0, 0, 0, 0)',
  backgroundImage:      'none',
  backgroundSize:       'auto',
  backgroundPosition:   '0% 0%',
  // border:               '0px none rgb(0, 0, 0)',
  borderRadius:         '0px',
  padding:              '0px',
  margin:               '0px',
  fontFamily:           '',
  fontSize:             '16px',
  fontWeight:           '400',
  textAlign:            'start',
  textShadow:           'none',
  textTransform:        'none',
  lineHeight:           'normal',
  display:              'block',
  alignItems:           'normal',
  justifyContent:       'normal',
};

let tip_map = {};

// todo: 
// - node recycling (for new target) no need to create/delete
// - make single function create/update
function MetaTip() {
  const template = ({target: el}) => {
    const { width, height } = el.getBoundingClientRect();
    const styles = getStyles(el, desiredPropMap)
      .map(style => Object.assign(style, {
        prop: camelToDash(style.prop)
      }))
      .filter(style => 
        style.prop.includes('font-family') 
          ? el.matches('h1,h2,h3,h4,h5,h6,p,a,date,caption,button,figcaption,nav,header,footer') 
          : true
      )
      .map(style => {
        if (style.prop.includes('color') || style.prop.includes('Color'))
          style.value = `<span color style="background-color: ${style.value};"></span>${new TinyColor(style.value).toHslString()}`;

        if (style.prop.includes('font-family') && style.value.length > 25)
          style.value = style.value.slice(0,25) + '...';

        // check if style is inline style, show indicator
        if (el.getAttribute('style') && el.getAttribute('style').includes(style.prop))
          style.value = `<span local-change>${style.value}</span>`;
        
        return style
      });

    const localModifications = styles.filter(style =>
      el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
        ? 1
        : 0);

    const notLocalModifications = styles.filter(style =>
      el.getAttribute('style') && el.getAttribute('style').includes(style.prop)
        ? 0
        : 1);
    
    let tip = document.createElement('div');
    tip.classList.add('metatip');
    tip.innerHTML = `
      <h5>${el.nodeName.toLowerCase()}${el.id && '#' + el.id}${createClassname(el)}</h5>
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

  const createClassname = el => {
    if (!el.className) return ''
    let rawClassname = '.' + el.className.replace(/ /g, '.');

    return rawClassname.length > 30
      ? rawClassname.substring(0,30) + '...'
      : rawClassname
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
    if (e.target.closest('tool-pallete') || e.target.closest('.metatip') || e.target.closest('hotkey-map')) return

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

      $(e.target).on('mouseout DOMNodeRemoved', mouseOut);
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

// todo: more hotkeys
// b: black
// w: white
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

      if (prop === 's' || prop === 'l') {
        if (payload.current[prop] > 1) payload.current[prop] = 1;
        if (payload.current[prop] < 0) payload.current[prop] = 0;
      }

      return payload
    })
    .forEach(({el, style, current}) =>
      el.style[style] = new TinyColor(current).toHslString());
}

// todo: resize
// todo: undo
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
    this.colorPicker    = ColorPicker(this.$shadow, this.selectorEngine);
  }

  connectedCallback() {
    $('li[data-tool]', this.$shadow).on('click', e => 
      this.toolSelected(e.currentTarget) && e.stopPropagation());

    Object.entries(this.toolbar_model).forEach(([key, value]) =>
      hotkeys(key, e => 
        this.toolSelected(
          $(`[data-tool="${value.tool}"]`, this.$shadow)[0])));

    this.toolSelected($('[data-tool="inspector"]', this.$shadow)[0]);
  }

  disconnectedCallback() {
    this.deactivate_feature();
    this.selectorEngine.disconnect();
    hotkeys.unbind(
      Object.keys(this.toolbar_model).reduce((events, key) =>
        events += ',' + key, ''));
  }

  toolSelected(el) {
    if (typeof el === 'string')
      el = $(`[data-tool="${el}"]`, this.$shadow)[0];

    if (this.active_tool && this.active_tool.dataset.tool === el.dataset.tool) return

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
          <li aria-label="${value.label} Tool (${key})" aria-description="${value.description}" data-tool="${value.tool}" data-active="${key == 'i'}">${value.icon}</li>
        `,'')}
        <li class="color" aria-label="Foreground" style="display:none;">
          <input type="color" id='foreground' value=''>
        </li>
        <li class="color" aria-label="Background" style="display:none;">
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

          background: var(--theme-bg);
          box-shadow: 0 0.25rem 0.5rem hsla(0,0%,0%,10%);

          --theme-bg: hsl(0,0%,100%);
          --theme-color: hotpink;
          --theme-icon_color: hsl(0,0%,20%);
          --theme-tool_selected: hsl(0,0%,98%);
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

        :host li[data-tool]:hover {
          cursor: pointer;
          background: hsl(0,0%,98%);
        }

        :host li[data-tool]:hover:after,
        :host li.color:hover:after {
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
          background: var(--theme-tool_selected);
        }

        :host li[data-active=true] > svg:not(.icon-cursor) { 
          fill: var(--theme-color); 
        }

        :host li[data-active=true] > .icon-cursor { 
          stroke: var(--theme-color); 
        }

        :host li.color {
          height: 20px;
        }

        :host li.color {
          border-top: 0.25rem solid hsl(0,0%,90%);
        }

        :host li > svg {
          width: 50%;
          fill: var(--theme-icon_color);
        }

        :host li > svg.icon-cursor {
          width: 35%;
          fill: white;
          stroke: var(--theme-icon_color);
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
          height: 100%;
          box-sizing: border-box;
          border: white;
          padding: 0;
        }

        :host input[type='color']:focus {
          outline: none;
        }

        :host input[type='color']::-webkit-color-swatch-wrapper { 
          padding: 0;
        }

        :host input[type='color']::-webkit-color-swatch { 
          border: none;
        }

        :host input[type='color'][value='']::-webkit-color-swatch { 
          background-color: transparent !important; 
          background-image: linear-gradient(155deg, #ffffff 0%,#ffffff 46%,#ff0000 46%,#ff0000 54%,#ffffff 55%,#ffffff 100%);
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

class HotkeyMap extends HTMLElement {
  
  constructor() {
    super();

    this.keyboard_model = {
      num:    ['`','1','2','3','4','5','6','7','8','9','0','-','=','delete'],
      tab:    ['tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
      caps:   ['caps','a','s','d','f','g','h','j','k','l','\'','return'],
      shift:  ['shift','z','x','c','v','b','n','m',',','.','/','shift'],
      space:  ['ctrl','alt','cmd','spacebar','cmd','alt','ctrl']
    };

    // index:flex
    this.key_size_model = {
      num:    {12:2},
      tab:    {0:2},
      caps:   {0:3,11:3},
      shift:  {0:6,11:6},
      space:  {3:10,4:2},
    };

    this.$shadow            = this.attachShadow({mode: 'open'});
    this.$shadow.innerHTML  = this.render();

    this.tool               = 'padding';
    this.$command           = $('[command]', this.$shadow);
  }

  connectedCallback() {
    this.$shift  = $('[keyboard] > section > [shift]', this.$shadow);
    this.$ctrl   = $('[keyboard] > section > [ctrl]', this.$shadow);
    this.$alt    = $('[keyboard] > section > [alt]', this.$shadow);
    this.$cmd    = $('[keyboard] > section > [cmd]', this.$shadow);
    this.$up     = $('[arrows] [up]', this.$shadow);
    this.$down   = $('[arrows] [down]', this.$shadow);
    this.$left   = $('[arrows] [left]', this.$shadow);
    this.$right  = $('[arrows] [right]', this.$shadow);

    hotkeys('shift+/', e =>
      this.$shadow.host.style.display !== 'flex'
        ? this.show()
        : this.hide());
  }

  disconnectedCallback() {
    hotkeys.unbind('*');
  }

  show() {
    this.$shadow.host.style.display = 'flex';
    hotkeys('*', (e, handler) => 
      this.watchKeys(e, handler));
  }

  hide() {
    this.$shadow.host.style.display = 'none';
    hotkeys.unbind('*');
  }

  setTool(tool) {
    if (tool) this.tool = tool;
  }

  watchKeys(e, handler) {
    e.preventDefault();
    e.stopPropagation();

    this.$shift.attr('pressed', hotkeys.shift);
    this.$ctrl.attr('pressed', hotkeys.ctrl);
    this.$alt.attr('pressed', hotkeys.alt);
    this.$cmd.attr('pressed', hotkeys.cmd);
    this.$up.attr('pressed', e.code === 'ArrowUp');
    this.$down.attr('pressed', e.code === 'ArrowDown');
    this.$left.attr('pressed', e.code === 'ArrowLeft');
    this.$right.attr('pressed', e.code === 'ArrowRight');

    let amount = hotkeys.shift ? 10 : 1;

    let negative = hotkeys.alt ? 'Subtract' : 'Add';
    let negative_modifier = hotkeys.alt ? 'from' : 'to';

    let side = '[arrow key]';
    if (e.code === 'ArrowUp')     side = 'the top side';
    if (e.code === 'ArrowDown')   side = 'the bottom side';
    if (e.code === 'ArrowLeft')   side = 'the left side';
    if (e.code === 'ArrowRight')  side = 'the right side';
    if (hotkeys.cmd)              side = 'all sides';

    this.$command[0].innerHTML = `
      <span negative>${negative} </span>
      <span tool>${this.tool}</span>
      <span light> ${negative_modifier} </span>
      <span side>${side}</span>
      <span light> by </span>
      <span amount>${amount}</span>
    `;
  }

  render() {
    return `
      ${this.styles()}
      <article>
        <div command>&nbsp;</div>
        <div card>
          <div keyboard>
            ${Object.entries(this.keyboard_model).reduce((keyboard, [row_name, row]) => `
              ${keyboard}
              <section ${row_name}>${row.reduce((row, key, i) => `
                ${row}<span ${key} style="flex:${this.key_size_model[row_name][i] || 1};">${key}</span>
              `, '')}
              </section>
            `, '')}
          </div>
          <div>
            <section arrows>
              <span up>↑</span>
              <span down>↓</span>
              <span left>←</span>
              <span right>→</span>
            </section>
          </div>
        </div>
      </article>
    `
  }

  styles() {
    return `
      <style>
        :host {
          display: none;
          position: fixed;
          z-index: 999;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          background: hsl(0,0%,95%);

          --dark-grey: hsl(0,0%,40%);
        }

        :host [command] {
          padding: 1rem;
          text-align: center;
          font-size: 3vw;
          font-weight: lighter;
          letter-spacing: 0.1em;
        }

        :host [command] > [light] {
          color: hsl(0,0%,60%);
        }

        :host [card] {
          padding: 1rem;
          background: white;
          box-shadow: 0 0.25rem 0.25rem hsla(0,0%,0%,20%);
          color: var(--dark-grey);
          display: flex;
        }

        :host section {
          display: flex;
          justify-content: center;
        }

        :host section > span, :host [arrows] > span {
          background: hsl(0,0%,90%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 2px;
          padding: 1.5vw;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        :host span[pressed="true"] {
          background: hsl(200, 90%, 70%);
          color: hsl(200, 90%, 20%);
        }

        :host [card] > div:not([keyboard]) {
          display: flex;
          align-items: flex-end;
          margin-left: 1rem;
        }

        :host [arrows] {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        :host [arrows] > span:nth-child(1) {
          grid-row: 1;
          grid-column: 2;
        }

        :host [arrows] > span:nth-child(2) {
          grid-row: 2;
          grid-column: 2;
        }

        :host [arrows] > span:nth-child(3) {
          grid-row: 2;
          grid-column: 1;
        }

        :host [arrows] > span:nth-child(4) {
          grid-row: 2;
          grid-column: 3;
        }

        :host [caps] > span:nth-child(1) { justify-content: flex-start; }
        :host [shift] > span:nth-child(1) { justify-content: flex-start; }
        :host [shift] > span:nth-child(12) { justify-content: flex-end; }
      </style>
    `
  }
}

customElements.define('hotkey-map', HotkeyMap);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYmxpbmdibGluZ2pzL3NyYy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9ob3RrZXlzLWpzL2Rpc3QvaG90a2V5cy5lc20uanMiLCJjb21wb25lbnRzL3Rvb2xwYWxsZXRlLmljb25zLmpzIiwiZmVhdHVyZXMvdXRpbHMuanMiLCJmZWF0dXJlcy9tYXJnaW4uanMiLCJmZWF0dXJlcy90ZXh0LmpzIiwiZmVhdHVyZXMvbW92ZS5qcyIsImZlYXR1cmVzL2ltYWdlc3dhcC5qcyIsImZlYXR1cmVzL3NlbGVjdGFibGUuanMiLCJmZWF0dXJlcy9wYWRkaW5nLmpzIiwiZmVhdHVyZXMvZm9udC5qcyIsImZlYXR1cmVzL2ZsZXguanMiLCJmZWF0dXJlcy9zZWFyY2guanMiLCIuLi9ub2RlX21vZHVsZXMvQGN0cmwvdGlueWNvbG9yL2J1bmRsZXMvdGlueWNvbG9yLmVzMjAxNS5qcyIsImZlYXR1cmVzL2NvbG9yLmpzIiwiZmVhdHVyZXMvbWV0YXRpcC5qcyIsImZlYXR1cmVzL2JveHNoYWRvdy5qcyIsImZlYXR1cmVzL2h1ZXNoaWZ0LmpzIiwiY29tcG9uZW50cy90b29scGFsbGV0ZS5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwLmVsZW1lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3VnYXIgPSB7XG4gIG9uOiBmdW5jdGlvbihuYW1lcywgZm4pIHtcbiAgICBuYW1lc1xuICAgICAgLnNwbGl0KCcgJylcbiAgICAgIC5mb3JFYWNoKG5hbWUgPT5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZuKSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuICBvZmY6IGZ1bmN0aW9uKG5hbWVzLCBmbikge1xuICAgIG5hbWVzXG4gICAgICAuc3BsaXQoJyAnKVxuICAgICAgLmZvckVhY2gobmFtZSA9PlxuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgZm4pKVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG4gIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbCkge1xuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKGF0dHIpXG5cbiAgICB2YWwgPT0gbnVsbFxuICAgICAgPyB0aGlzLnJlbW92ZUF0dHJpYnV0ZShhdHRyKVxuICAgICAgOiB0aGlzLnNldEF0dHJpYnV0ZShhdHRyLCB2YWwgfHwgJycpXG4gICAgICBcbiAgICByZXR1cm4gdGhpc1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICQocXVlcnksICRjb250ZXh0ID0gZG9jdW1lbnQpIHtcbiAgbGV0ICRub2RlcyA9IHF1ZXJ5IGluc3RhbmNlb2YgTm9kZUxpc3RcbiAgICA/IHF1ZXJ5XG4gICAgOiBxdWVyeSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IFxuICAgICAgPyBbcXVlcnldXG4gICAgICA6ICRjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG5cbiAgaWYgKCEkbm9kZXMubGVuZ3RoKSAkbm9kZXMgPSBbXVxuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKFxuICAgIFsuLi4kbm9kZXNdLm1hcCgkZWwgPT4gT2JqZWN0LmFzc2lnbigkZWwsIHN1Z2FyKSksIFxuICAgIHtcbiAgICAgIG9uOiBmdW5jdGlvbihuYW1lcywgZm4pIHtcbiAgICAgICAgdGhpcy5mb3JFYWNoKCRlbCA9PiAkZWwub24obmFtZXMsIGZuKSlcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH0sXG4gICAgICBvZmY6IGZ1bmN0aW9uKG5hbWVzLCBmbikge1xuICAgICAgICB0aGlzLmZvckVhY2goJGVsID0+ICRlbC5vZmYobmFtZXMsIGZuKSlcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH0sXG4gICAgICBhdHRyOiBmdW5jdGlvbihhdHRycywgdmFsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXR0cnMgPT09ICdzdHJpbmcnICYmIHZhbCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHJldHVybiB0aGlzWzBdLmF0dHIoYXR0cnMpXG5cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGF0dHJzID09PSAnb2JqZWN0JykgXG4gICAgICAgICAgdGhpcy5mb3JFYWNoKCRlbCA9PlxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoYXR0cnMpXG4gICAgICAgICAgICAgIC5mb3JFYWNoKChba2V5LCB2YWxdKSA9PlxuICAgICAgICAgICAgICAgICRlbC5hdHRyKGtleSwgdmFsKSkpXG5cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGF0dHJzID09ICdzdHJpbmcnICYmICh2YWwgfHwgdmFsID09IG51bGwgfHwgdmFsID09ICcnKSlcbiAgICAgICAgICB0aGlzLmZvckVhY2goJGVsID0+ICRlbC5hdHRyKGF0dHJzLCB2YWwpKVxuXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9XG4gICAgfVxuICApXG59IiwiLyohXG4gKiBob3RrZXlzLWpzIHYzLjMuNVxuICogQSBzaW1wbGUgbWljcm8tbGlicmFyeSBmb3IgZGVmaW5pbmcgYW5kIGRpc3BhdGNoaW5nIGtleWJvYXJkIHNob3J0Y3V0cy4gSXQgaGFzIG5vIGRlcGVuZGVuY2llcy5cbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IGtlbm55IHdvbmcgPHdvd29ob29AcXEuY29tPlxuICogaHR0cDovL2pheXdjamxvdmUuZ2l0aHViLmlvL2hvdGtleXNcbiAqIFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBpc2ZmID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgPyBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gMCA6IGZhbHNlO1xuXG4vLyDnu5Hlrprkuovku7ZcbmZ1bmN0aW9uIGFkZEV2ZW50KG9iamVjdCwgZXZlbnQsIG1ldGhvZCkge1xuICBpZiAob2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICBvYmplY3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbWV0aG9kLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAob2JqZWN0LmF0dGFjaEV2ZW50KSB7XG4gICAgb2JqZWN0LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgbWV0aG9kKHdpbmRvdy5ldmVudCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLy8g5L+u6aWw6ZSu6L2s5o2i5oiQ5a+55bqU55qE6ZSu56CBXG5mdW5jdGlvbiBnZXRNb2RzKG1vZGlmaWVyLCBrZXkpIHtcbiAgdmFyIG1vZHMgPSBrZXkuc2xpY2UoMCwga2V5Lmxlbmd0aCAtIDEpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG1vZHMubGVuZ3RoOyBpKyspIHtcbiAgICBtb2RzW2ldID0gbW9kaWZpZXJbbW9kc1tpXS50b0xvd2VyQ2FzZSgpXTtcbiAgfXJldHVybiBtb2RzO1xufVxuXG4vLyDlpITnkIbkvKDnmoRrZXnlrZfnrKbkuLLovazmjaLmiJDmlbDnu4RcbmZ1bmN0aW9uIGdldEtleXMoa2V5KSB7XG4gIGlmICgha2V5KSBrZXkgPSAnJztcblxuICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzL2csICcnKTsgLy8g5Yy56YWN5Lu75L2V56m655m95a2X56ymLOWMheaLrOepuuagvOOAgeWItuihqOespuOAgeaNoumhteespuetieetiVxuICB2YXIga2V5cyA9IGtleS5zcGxpdCgnLCcpOyAvLyDlkIzml7borr7nva7lpJrkuKrlv6vmjbfplK7vvIzku6UnLCfliIblibJcbiAgdmFyIGluZGV4ID0ga2V5cy5sYXN0SW5kZXhPZignJyk7XG5cbiAgLy8g5b+r5o236ZSu5Y+v6IO95YyF5ZCrJywn77yM6ZyA54m55q6K5aSE55CGXG4gIGZvciAoOyBpbmRleCA+PSAwOykge1xuICAgIGtleXNbaW5kZXggLSAxXSArPSAnLCc7XG4gICAga2V5cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIGluZGV4ID0ga2V5cy5sYXN0SW5kZXhPZignJyk7XG4gIH1cblxuICByZXR1cm4ga2V5cztcbn1cblxuLy8g5q+U6L6D5L+u6aWw6ZSu55qE5pWw57uEXG5mdW5jdGlvbiBjb21wYXJlQXJyYXkoYTEsIGEyKSB7XG4gIHZhciBhcnIxID0gYTEubGVuZ3RoID49IGEyLmxlbmd0aCA/IGExIDogYTI7XG4gIHZhciBhcnIyID0gYTEubGVuZ3RoID49IGEyLmxlbmd0aCA/IGEyIDogYTE7XG4gIHZhciBpc0luZGV4ID0gdHJ1ZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycjEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYXJyMi5pbmRleE9mKGFycjFbaV0pID09PSAtMSkgaXNJbmRleCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBpc0luZGV4O1xufVxuXG52YXIgX2tleU1hcCA9IHsgLy8g54m55q6K6ZSuXG4gIGJhY2tzcGFjZTogOCxcbiAgdGFiOiA5LFxuICBjbGVhcjogMTIsXG4gIGVudGVyOiAxMyxcbiAgcmV0dXJuOiAxMyxcbiAgZXNjOiAyNyxcbiAgZXNjYXBlOiAyNyxcbiAgc3BhY2U6IDMyLFxuICBsZWZ0OiAzNyxcbiAgdXA6IDM4LFxuICByaWdodDogMzksXG4gIGRvd246IDQwLFxuICBkZWw6IDQ2LFxuICBkZWxldGU6IDQ2LFxuICBpbnM6IDQ1LFxuICBpbnNlcnQ6IDQ1LFxuICBob21lOiAzNixcbiAgZW5kOiAzNSxcbiAgcGFnZXVwOiAzMyxcbiAgcGFnZWRvd246IDM0LFxuICBjYXBzbG9jazogMjAsXG4gICfih6onOiAyMCxcbiAgJywnOiAxODgsXG4gICcuJzogMTkwLFxuICAnLyc6IDE5MSxcbiAgJ2AnOiAxOTIsXG4gICctJzogaXNmZiA/IDE3MyA6IDE4OSxcbiAgJz0nOiBpc2ZmID8gNjEgOiAxODcsXG4gICc7JzogaXNmZiA/IDU5IDogMTg2LFxuICAnXFwnJzogMjIyLFxuICAnWyc6IDIxOSxcbiAgJ10nOiAyMjEsXG4gICdcXFxcJzogMjIwXG59O1xuXG52YXIgX21vZGlmaWVyID0geyAvLyDkv67ppbDplK5cbiAgJ+KHpyc6IDE2LFxuICBzaGlmdDogMTYsXG4gICfijKUnOiAxOCxcbiAgYWx0OiAxOCxcbiAgb3B0aW9uOiAxOCxcbiAgJ+KMgyc6IDE3LFxuICBjdHJsOiAxNyxcbiAgY29udHJvbDogMTcsXG4gICfijJgnOiBpc2ZmID8gMjI0IDogOTEsXG4gIGNtZDogaXNmZiA/IDIyNCA6IDkxLFxuICBjb21tYW5kOiBpc2ZmID8gMjI0IDogOTFcbn07XG52YXIgX2Rvd25LZXlzID0gW107IC8vIOiusOW9leaRgeS4i+eahOe7keWumumUrlxudmFyIG1vZGlmaWVyTWFwID0ge1xuICAxNjogJ3NoaWZ0S2V5JyxcbiAgMTg6ICdhbHRLZXknLFxuICAxNzogJ2N0cmxLZXknXG59O1xudmFyIF9tb2RzID0geyAxNjogZmFsc2UsIDE4OiBmYWxzZSwgMTc6IGZhbHNlIH07XG52YXIgX2hhbmRsZXJzID0ge307XG5cbi8vIEYxfkYxMiDnibnmrorplK5cbmZvciAodmFyIGsgPSAxOyBrIDwgMjA7IGsrKykge1xuICBfa2V5TWFwWydmJyArIGtdID0gMTExICsgaztcbn1cblxuLy8g5YW85a65RmlyZWZveOWkhOeQhlxubW9kaWZpZXJNYXBbaXNmZiA/IDIyNCA6IDkxXSA9ICdtZXRhS2V5Jztcbl9tb2RzW2lzZmYgPyAyMjQgOiA5MV0gPSBmYWxzZTtcblxudmFyIF9zY29wZSA9ICdhbGwnOyAvLyDpu5jorqTng63plK7ojIPlm7RcbnZhciBpc0JpbmRFbGVtZW50ID0gZmFsc2U7IC8vIOaYr+WQpue7keWumuiKgueCuVxuXG4vLyDov5Tlm57plK7noIFcbnZhciBjb2RlID0gZnVuY3Rpb24gY29kZSh4KSB7XG4gIHJldHVybiBfa2V5TWFwW3gudG9Mb3dlckNhc2UoKV0gfHwgeC50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCk7XG59O1xuXG4vLyDorr7nva7ojrflj5blvZPliY3ojIPlm7TvvIjpu5jorqTkuLon5omA5pyJJ++8iVxuZnVuY3Rpb24gc2V0U2NvcGUoc2NvcGUpIHtcbiAgX3Njb3BlID0gc2NvcGUgfHwgJ2FsbCc7XG59XG4vLyDojrflj5blvZPliY3ojIPlm7RcbmZ1bmN0aW9uIGdldFNjb3BlKCkge1xuICByZXR1cm4gX3Njb3BlIHx8ICdhbGwnO1xufVxuLy8g6I635Y+W5pGB5LiL57uR5a6a6ZSu55qE6ZSu5YC8XG5mdW5jdGlvbiBnZXRQcmVzc2VkS2V5Q29kZXMoKSB7XG4gIHJldHVybiBfZG93bktleXMuc2xpY2UoMCk7XG59XG5cbi8vIOihqOWNleaOp+S7tuaOp+S7tuWIpOaWrSDov5Tlm54gQm9vbGVhblxuZnVuY3Rpb24gZmlsdGVyKGV2ZW50KSB7XG4gIHZhciB0YWdOYW1lID0gZXZlbnQudGFyZ2V0LnRhZ05hbWUgfHwgZXZlbnQuc3JjRWxlbWVudC50YWdOYW1lO1xuICAvLyDlv73nlaXov5nkupvmoIfnrb7mg4XlhrXkuIvlv6vmjbfplK7ml6DmlYhcbiAgcmV0dXJuICEodGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCB0YWdOYW1lID09PSAnU0VMRUNUJyB8fCB0YWdOYW1lID09PSAnVEVYVEFSRUEnKTtcbn1cblxuLy8g5Yik5pat5pGB5LiL55qE6ZSu5piv5ZCm5Li65p+Q5Liq6ZSu77yM6L+U5ZuedHJ1ZeaIluiAhWZhbHNlXG5mdW5jdGlvbiBpc1ByZXNzZWQoa2V5Q29kZSkge1xuICBpZiAodHlwZW9mIGtleUNvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAga2V5Q29kZSA9IGNvZGUoa2V5Q29kZSk7IC8vIOi9rOaNouaIkOmUrueggVxuICB9XG4gIHJldHVybiBfZG93bktleXMuaW5kZXhPZihrZXlDb2RlKSAhPT0gLTE7XG59XG5cbi8vIOW+queOr+WIoOmZpGhhbmRsZXJz5Lit55qE5omA5pyJIHNjb3BlKOiMg+WbtClcbmZ1bmN0aW9uIGRlbGV0ZVNjb3BlKHNjb3BlLCBuZXdTY29wZSkge1xuICB2YXIgaGFuZGxlcnMgPSB2b2lkIDA7XG4gIHZhciBpID0gdm9pZCAwO1xuXG4gIC8vIOayoeacieaMh+WumnNjb3Bl77yM6I635Y+Wc2NvcGVcbiAgaWYgKCFzY29wZSkgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gIGZvciAodmFyIGtleSBpbiBfaGFuZGxlcnMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9oYW5kbGVycywga2V5KSkge1xuICAgICAgaGFuZGxlcnMgPSBfaGFuZGxlcnNba2V5XTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7KSB7XG4gICAgICAgIGlmIChoYW5kbGVyc1tpXS5zY29wZSA9PT0gc2NvcGUpIGhhbmRsZXJzLnNwbGljZShpLCAxKTtlbHNlIGkrKztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyDlpoLmnpxzY29wZeiiq+WIoOmZpO+8jOWwhnNjb3Bl6YeN572u5Li6YWxsXG4gIGlmIChnZXRTY29wZSgpID09PSBzY29wZSkgc2V0U2NvcGUobmV3U2NvcGUgfHwgJ2FsbCcpO1xufVxuXG4vLyDmuIXpmaTkv67ppbDplK5cbmZ1bmN0aW9uIGNsZWFyTW9kaWZpZXIoZXZlbnQpIHtcbiAgdmFyIGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2ggfHwgZXZlbnQuY2hhckNvZGU7XG4gIHZhciBpID0gX2Rvd25LZXlzLmluZGV4T2Yoa2V5KTtcblxuICAvLyDku47liJfooajkuK3muIXpmaTmjInljovov4fnmoTplK5cbiAgaWYgKGkgPj0gMCkgX2Rvd25LZXlzLnNwbGljZShpLCAxKTtcblxuICAvLyDkv67ppbDplK4gc2hpZnRLZXkgYWx0S2V5IGN0cmxLZXkgKGNvbW1hbmR8fG1ldGFLZXkpIOa4hemZpFxuICBpZiAoa2V5ID09PSA5MyB8fCBrZXkgPT09IDIyNCkga2V5ID0gOTE7XG4gIGlmIChrZXkgaW4gX21vZHMpIHtcbiAgICBfbW9kc1trZXldID0gZmFsc2U7XG5cbiAgICAvLyDlsIbkv67ppbDplK7ph43nva7kuLpmYWxzZVxuICAgIGZvciAodmFyIGsgaW4gX21vZGlmaWVyKSB7XG4gICAgICBpZiAoX21vZGlmaWVyW2tdID09PSBrZXkpIGhvdGtleXNba10gPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLy8g6Kej6Zmk57uR5a6a5p+Q5Liq6IyD5Zu055qE5b+r5o236ZSuXG5mdW5jdGlvbiB1bmJpbmQoa2V5LCBzY29wZSkge1xuICB2YXIgbXVsdGlwbGVLZXlzID0gZ2V0S2V5cyhrZXkpO1xuICB2YXIga2V5cyA9IHZvaWQgMDtcbiAgdmFyIG1vZHMgPSBbXTtcbiAgdmFyIG9iaiA9IHZvaWQgMDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG11bHRpcGxlS2V5cy5sZW5ndGg7IGkrKykge1xuICAgIC8vIOWwhue7hOWQiOW/q+aNt+mUruaLhuWIhuS4uuaVsOe7hFxuICAgIGtleXMgPSBtdWx0aXBsZUtleXNbaV0uc3BsaXQoJysnKTtcblxuICAgIC8vIOiusOW9leavj+S4que7hOWQiOmUruS4reeahOS/rumlsOmUrueahOmUrueggSDov5Tlm57mlbDnu4RcbiAgICBpZiAoa2V5cy5sZW5ndGggPiAxKSBtb2RzID0gZ2V0TW9kcyhfbW9kaWZpZXIsIGtleXMpO1xuXG4gICAgLy8g6I635Y+W6Zmk5L+u6aWw6ZSu5aSW55qE6ZSu5YC8a2V5XG4gICAga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgIGtleSA9IGtleSA9PT0gJyonID8gJyonIDogY29kZShrZXkpO1xuXG4gICAgLy8g5Yik5pat5piv5ZCm5Lyg5YWl6IyD5Zu077yM5rKh5pyJ5bCx6I635Y+W6IyD5Zu0XG4gICAgaWYgKCFzY29wZSkgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gICAgLy8g5aaC5L2Va2V55LiN5ZyoIF9oYW5kbGVycyDkuK3ov5Tlm57kuI3lgZrlpITnkIZcbiAgICBpZiAoIV9oYW5kbGVyc1trZXldKSByZXR1cm47XG5cbiAgICAvLyDmuIXnqbogaGFuZGxlcnMg5Lit5pWw5o2u77yMXG4gICAgLy8g6K6p6Kem5Y+R5b+r5o236ZSu6ZSu5LmL5ZCO5rKh5pyJ5LqL5Lu25omn6KGM5Yiw6L6+6Kej6Zmk5b+r5o236ZSu57uR5a6a55qE55uu55qEXG4gICAgZm9yICh2YXIgciA9IDA7IHIgPCBfaGFuZGxlcnNba2V5XS5sZW5ndGg7IHIrKykge1xuICAgICAgb2JqID0gX2hhbmRsZXJzW2tleV1bcl07XG4gICAgICAvLyDliKTmlq3mmK/lkKblnKjojIPlm7TlhoXlubbkuJTplK7lgLznm7jlkIxcbiAgICAgIGlmIChvYmouc2NvcGUgPT09IHNjb3BlICYmIGNvbXBhcmVBcnJheShvYmoubW9kcywgbW9kcykpIHtcbiAgICAgICAgX2hhbmRsZXJzW2tleV1bcl0gPSB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8g5a+555uR5ZCs5a+55bqU5b+r5o236ZSu55qE5Zue6LCD5Ye95pWw6L+b6KGM5aSE55CGXG5mdW5jdGlvbiBldmVudEhhbmRsZXIoZXZlbnQsIGhhbmRsZXIsIHNjb3BlKSB7XG4gIHZhciBtb2RpZmllcnNNYXRjaCA9IHZvaWQgMDtcblxuICAvLyDnnIvlroPmmK/lkKblnKjlvZPliY3ojIPlm7RcbiAgaWYgKGhhbmRsZXIuc2NvcGUgPT09IHNjb3BlIHx8IGhhbmRsZXIuc2NvcGUgPT09ICdhbGwnKSB7XG4gICAgLy8g5qOA5p+l5piv5ZCm5Yy56YWN5L+u6aWw56ym77yI5aaC5p6c5pyJ6L+U5ZuedHJ1Ze+8iVxuICAgIG1vZGlmaWVyc01hdGNoID0gaGFuZGxlci5tb2RzLmxlbmd0aCA+IDA7XG5cbiAgICBmb3IgKHZhciB5IGluIF9tb2RzKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9tb2RzLCB5KSkge1xuICAgICAgICBpZiAoIV9tb2RzW3ldICYmIGhhbmRsZXIubW9kcy5pbmRleE9mKCt5KSA+IC0xIHx8IF9tb2RzW3ldICYmIGhhbmRsZXIubW9kcy5pbmRleE9mKCt5KSA9PT0gLTEpIG1vZGlmaWVyc01hdGNoID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g6LCD55So5aSE55CG56iL5bqP77yM5aaC5p6c5piv5L+u6aWw6ZSu5LiN5YGa5aSE55CGXG4gICAgaWYgKGhhbmRsZXIubW9kcy5sZW5ndGggPT09IDAgJiYgIV9tb2RzWzE2XSAmJiAhX21vZHNbMThdICYmICFfbW9kc1sxN10gJiYgIV9tb2RzWzkxXSB8fCBtb2RpZmllcnNNYXRjaCB8fCBoYW5kbGVyLnNob3J0Y3V0ID09PSAnKicpIHtcbiAgICAgIGlmIChoYW5kbGVyLm1ldGhvZChldmVudCwgaGFuZGxlcikgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtlbHNlIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiAoZXZlbnQuY2FuY2VsQnViYmxlKSBldmVudC5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyDlpITnkIZrZXlkb3du5LqL5Lu2XG5mdW5jdGlvbiBkaXNwYXRjaChldmVudCkge1xuICB2YXIgYXN0ZXJpc2sgPSBfaGFuZGxlcnNbJyonXTtcbiAgdmFyIGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2ggfHwgZXZlbnQuY2hhckNvZGU7XG5cbiAgLy8g5pCc6ZuG57uR5a6a55qE6ZSuXG4gIGlmIChfZG93bktleXMuaW5kZXhPZihrZXkpID09PSAtMSkgX2Rvd25LZXlzLnB1c2goa2V5KTtcblxuICAvLyBHZWNrbyhGaXJlZm94KeeahGNvbW1hbmTplK7lgLwyMjTvvIzlnKhXZWJraXQoQ2hyb21lKeS4reS/neaMgeS4gOiHtFxuICAvLyBXZWJraXTlt6blj7Njb21tYW5k6ZSu5YC85LiN5LiA5qC3XG4gIGlmIChrZXkgPT09IDkzIHx8IGtleSA9PT0gMjI0KSBrZXkgPSA5MTtcblxuICBpZiAoa2V5IGluIF9tb2RzKSB7XG4gICAgX21vZHNba2V5XSA9IHRydWU7XG5cbiAgICAvLyDlsIbnibnmrorlrZfnrKbnmoRrZXnms6jlhozliLAgaG90a2V5cyDkuIpcbiAgICBmb3IgKHZhciBrIGluIF9tb2RpZmllcikge1xuICAgICAgaWYgKF9tb2RpZmllcltrXSA9PT0ga2V5KSBob3RrZXlzW2tdID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWFzdGVyaXNrKSByZXR1cm47XG4gIH1cblxuICAvLyDlsIZtb2RpZmllck1hcOmHjOmdoueahOS/rumlsOmUrue7keWumuWIsGV2ZW505LitXG4gIGZvciAodmFyIGUgaW4gX21vZHMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9tb2RzLCBlKSkge1xuICAgICAgX21vZHNbZV0gPSBldmVudFttb2RpZmllck1hcFtlXV07XG4gICAgfVxuICB9XG5cbiAgLy8g6KGo5Y2V5o6n5Lu26L+H5rukIOm7mOiupOihqOWNleaOp+S7tuS4jeinpuWPkeW/q+aNt+mUrlxuICBpZiAoIWhvdGtleXMuZmlsdGVyLmNhbGwodGhpcywgZXZlbnQpKSByZXR1cm47XG5cbiAgLy8g6I635Y+W6IyD5Zu0IOm7mOiupOS4umFsbFxuICB2YXIgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gIC8vIOWvueS7u+S9leW/q+aNt+mUrumDvemcgOimgeWBmueahOWkhOeQhlxuICBpZiAoYXN0ZXJpc2spIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFzdGVyaXNrLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXN0ZXJpc2tbaV0uc2NvcGUgPT09IHNjb3BlKSBldmVudEhhbmRsZXIoZXZlbnQsIGFzdGVyaXNrW2ldLCBzY29wZSk7XG4gICAgfVxuICB9XG4gIC8vIGtleSDkuI3lnKhfaGFuZGxlcnPkuK3ov5Tlm55cbiAgaWYgKCEoa2V5IGluIF9oYW5kbGVycykpIHJldHVybjtcblxuICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgX2hhbmRsZXJzW2tleV0ubGVuZ3RoOyBfaSsrKSB7XG4gICAgLy8g5om+5Yiw5aSE55CG5YaF5a65XG4gICAgZXZlbnRIYW5kbGVyKGV2ZW50LCBfaGFuZGxlcnNba2V5XVtfaV0sIHNjb3BlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBob3RrZXlzKGtleSwgb3B0aW9uLCBtZXRob2QpIHtcbiAgdmFyIGtleXMgPSBnZXRLZXlzKGtleSk7IC8vIOmcgOimgeWkhOeQhueahOW/q+aNt+mUruWIl+ihqFxuICB2YXIgbW9kcyA9IFtdO1xuICB2YXIgc2NvcGUgPSAnYWxsJzsgLy8gc2NvcGXpu5jorqTkuLphbGzvvIzmiYDmnInojIPlm7Tpg73mnInmlYhcbiAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudDsgLy8g5b+r5o236ZSu5LqL5Lu257uR5a6a6IqC54K5XG4gIHZhciBpID0gMDtcblxuICAvLyDlr7nkuLrorr7lrprojIPlm7TnmoTliKTmlq1cbiAgaWYgKG1ldGhvZCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBtZXRob2QgPSBvcHRpb247XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9wdGlvbikgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgaWYgKG9wdGlvbi5zY29wZSkgc2NvcGUgPSBvcHRpb24uc2NvcGU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICBpZiAob3B0aW9uLmVsZW1lbnQpIGVsZW1lbnQgPSBvcHRpb24uZWxlbWVudDsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICB9XG5cbiAgaWYgKHR5cGVvZiBvcHRpb24gPT09ICdzdHJpbmcnKSBzY29wZSA9IG9wdGlvbjtcblxuICAvLyDlr7nkuo7mr4/kuKrlv6vmjbfplK7ov5vooYzlpITnkIZcbiAgZm9yICg7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXS5zcGxpdCgnKycpOyAvLyDmjInplK7liJfooahcbiAgICBtb2RzID0gW107XG5cbiAgICAvLyDlpoLmnpzmmK/nu4TlkIjlv6vmjbfplK7lj5blvpfnu4TlkIjlv6vmjbfplK5cbiAgICBpZiAoa2V5Lmxlbmd0aCA+IDEpIG1vZHMgPSBnZXRNb2RzKF9tb2RpZmllciwga2V5KTtcblxuICAgIC8vIOWwhumdnuS/rumlsOmUrui9rOWMluS4uumUrueggVxuICAgIGtleSA9IGtleVtrZXkubGVuZ3RoIC0gMV07XG4gICAga2V5ID0ga2V5ID09PSAnKicgPyAnKicgOiBjb2RlKGtleSk7IC8vICrooajnpLrljLnphY3miYDmnInlv6vmjbfplK5cblxuICAgIC8vIOWIpOaWrWtleeaYr+WQpuWcqF9oYW5kbGVyc+S4re+8jOS4jeWcqOWwsei1i+S4gOS4quepuuaVsOe7hFxuICAgIGlmICghKGtleSBpbiBfaGFuZGxlcnMpKSBfaGFuZGxlcnNba2V5XSA9IFtdO1xuXG4gICAgX2hhbmRsZXJzW2tleV0ucHVzaCh7XG4gICAgICBzY29wZTogc2NvcGUsXG4gICAgICBtb2RzOiBtb2RzLFxuICAgICAgc2hvcnRjdXQ6IGtleXNbaV0sXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGtleToga2V5c1tpXVxuICAgIH0pO1xuICB9XG4gIC8vIOWcqOWFqOWxgGRvY3VtZW505LiK6K6+572u5b+r5o236ZSuXG4gIGlmICh0eXBlb2YgZWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgIWlzQmluZEVsZW1lbnQpIHtcbiAgICBpc0JpbmRFbGVtZW50ID0gdHJ1ZTtcbiAgICBhZGRFdmVudChlbGVtZW50LCAna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBkaXNwYXRjaChlKTtcbiAgICB9KTtcbiAgICBhZGRFdmVudChlbGVtZW50LCAna2V5dXAnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgY2xlYXJNb2RpZmllcihlKTtcbiAgICB9KTtcbiAgfVxufVxuXG52YXIgX2FwaSA9IHtcbiAgc2V0U2NvcGU6IHNldFNjb3BlLFxuICBnZXRTY29wZTogZ2V0U2NvcGUsXG4gIGRlbGV0ZVNjb3BlOiBkZWxldGVTY29wZSxcbiAgZ2V0UHJlc3NlZEtleUNvZGVzOiBnZXRQcmVzc2VkS2V5Q29kZXMsXG4gIGlzUHJlc3NlZDogaXNQcmVzc2VkLFxuICBmaWx0ZXI6IGZpbHRlcixcbiAgdW5iaW5kOiB1bmJpbmRcbn07XG5mb3IgKHZhciBhIGluIF9hcGkpIHtcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChfYXBpLCBhKSkge1xuICAgIGhvdGtleXNbYV0gPSBfYXBpW2FdO1xuICB9XG59XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICB2YXIgX2hvdGtleXMgPSB3aW5kb3cuaG90a2V5cztcbiAgaG90a2V5cy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKGRlZXApIHtcbiAgICBpZiAoZGVlcCAmJiB3aW5kb3cuaG90a2V5cyA9PT0gaG90a2V5cykge1xuICAgICAgd2luZG93LmhvdGtleXMgPSBfaG90a2V5cztcbiAgICB9XG4gICAgcmV0dXJuIGhvdGtleXM7XG4gIH07XG4gIHdpbmRvdy5ob3RrZXlzID0gaG90a2V5cztcbn1cblxuZXhwb3J0IGRlZmF1bHQgaG90a2V5cztcbiIsImNvbnN0IGN1cnNvciA9IGBcbiAgPHN2ZyBjbGFzcz1cImljb24tY3Vyc29yXCIgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDMyIDMyXCI+XG4gICAgPHBhdGggZD1cIk0xNi42ODkgMTcuNjU1bDUuMzExIDEyLjM0NS00IDItNC42NDYtMTIuNjc4LTcuMzU0IDYuNjc4di0yNmwyMCAxNi05LjMxMSAxLjY1NXpcIj48L3BhdGg+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBtb3ZlID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xNSA3LjVWMkg5djUuNWwzIDMgMy0zek03LjUgOUgydjZoNS41bDMtMy0zLTN6TTkgMTYuNVYyMmg2di01LjVsLTMtMy0zIDN6TTE2LjUgOWwtMyAzIDMgM0gyMlY5aC01LjV6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3Qgc2VhcmNoID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xNS41IDE0aC0uNzlsLS4yOC0uMjdDMTUuNDEgMTIuNTkgMTYgMTEuMTEgMTYgOS41IDE2IDUuOTEgMTMuMDkgMyA5LjUgM1MzIDUuOTEgMyA5LjUgNS45MSAxNiA5LjUgMTZjMS42MSAwIDMuMDktLjU5IDQuMjMtMS41N2wuMjcuMjh2Ljc5bDUgNC45OUwyMC40OSAxOWwtNC45OS01em0tNiAwQzcuMDEgMTQgNSAxMS45OSA1IDkuNVM3LjAxIDUgOS41IDUgMTQgNy4wMSAxNCA5LjUgMTEuOTkgMTQgOS41IDE0elwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IG1hcmdpbiA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNOSA3SDd2MmgyVjd6bTAgNEg3djJoMnYtMnptMC04Yy0xLjExIDAtMiAuOS0yIDJoMlYzem00IDEyaC0ydjJoMnYtMnptNi0xMnYyaDJjMC0xLjEtLjktMi0yLTJ6bS02IDBoLTJ2MmgyVjN6TTkgMTd2LTJIN2MwIDEuMS44OSAyIDIgMnptMTAtNGgydi0yaC0ydjJ6bTAtNGgyVjdoLTJ2MnptMCA4YzEuMSAwIDItLjkgMi0yaC0ydjJ6TTUgN0gzdjEyYzAgMS4xLjg5IDIgMiAyaDEydi0ySDVWN3ptMTAtMmgyVjNoLTJ2MnptMCAxMmgydi0yaC0ydjJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgcGFkZGluZyA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMyAxM2gydi0ySDN2MnptMCA0aDJ2LTJIM3Yyem0yIDR2LTJIM2MwIDEuMS44OSAyIDIgMnpNMyA5aDJWN0gzdjJ6bTEyIDEyaDJ2LTJoLTJ2MnptNC0xOEg5Yy0xLjExIDAtMiAuOS0yIDJ2MTBjMCAxLjEuODkgMiAyIDJoMTBjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnptMCAxMkg5VjVoMTB2MTB6bS04IDZoMnYtMmgtMnYyem0tNCAwaDJ2LTJIN3YyelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IGZvbnQgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTkgNHYzaDV2MTJoM1Y3aDVWNEg5em0tNiA4aDN2N2gzdi03aDNWOUgzdjN6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgdHlwZSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMyAxNy4yNVYyMWgzLjc1TDE3LjgxIDkuOTRsLTMuNzUtMy43NUwzIDE3LjI1ek0yMC43MSA3LjA0Yy4zOS0uMzkuMzktMS4wMiAwLTEuNDFsLTIuMzQtMi4zNGMtLjM5LS4zOS0xLjAyLS4zOS0xLjQxIDBsLTEuODMgMS44MyAzLjc1IDMuNzUgMS44My0xLjgzelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IGFsaWduID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMCAyMGg0VjRoLTR2MTZ6bS02IDBoNHYtOEg0djh6TTE2IDl2MTFoNFY5aC00elwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IHJlc2l6ZSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTkgMTJoLTJ2M2gtM3YyaDV2LTV6TTcgOWgzVjdINXY1aDJWOXptMTQtNkgzYy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE4YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTYuMDFIM1Y0Ljk5aDE4djE0LjAyelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IHRyYW5zZm9ybSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTIsN0M2LjQ4LDcsMiw5LjI0LDIsMTJjMCwyLjI0LDIuOTQsNC4xMyw3LDQuNzdWMjBsNC00bC00LTR2Mi43M2MtMy4xNS0wLjU2LTUtMS45LTUtMi43M2MwLTEuMDYsMy4wNC0zLDgtM3M4LDEuOTQsOCwzXG4gICAgYzAsMC43My0xLjQ2LDEuODktNCwyLjUzdjIuMDVjMy41My0wLjc3LDYtMi41Myw2LTQuNThDMjIsOS4yNCwxNy41Miw3LDEyLDd6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgYm9yZGVyID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMyA3aC0ydjJoMlY3em0wIDRoLTJ2Mmgydi0yem00IDBoLTJ2Mmgydi0yek0zIDN2MThoMThWM0gzem0xNiAxNkg1VjVoMTR2MTR6bS02LTRoLTJ2Mmgydi0yem0tNC00SDd2Mmgydi0yelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IGh1ZXNoaWZ0ID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMiAzYy00Ljk3IDAtOSA0LjAzLTkgOXM0LjAzIDkgOSA5Yy44MyAwIDEuNS0uNjcgMS41LTEuNSAwLS4zOS0uMTUtLjc0LS4zOS0xLjAxLS4yMy0uMjYtLjM4LS42MS0uMzgtLjk5IDAtLjgzLjY3LTEuNSAxLjUtMS41SDE2YzIuNzYgMCA1LTIuMjQgNS01IDAtNC40Mi00LjAzLTgtOS04em0tNS41IDljLS44MyAwLTEuNS0uNjctMS41LTEuNVM1LjY3IDkgNi41IDkgOCA5LjY3IDggMTAuNSA3LjMzIDEyIDYuNSAxMnptMy00QzguNjcgOCA4IDcuMzMgOCA2LjVTOC42NyA1IDkuNSA1czEuNS42NyAxLjUgMS41UzEwLjMzIDggOS41IDh6bTUgMGMtLjgzIDAtMS41LS42Ny0xLjUtMS41UzEzLjY3IDUgMTQuNSA1czEuNS42NyAxLjUgMS41UzE1LjMzIDggMTQuNSA4em0zIDRjLS44MyAwLTEuNS0uNjctMS41LTEuNVMxNi42NyA5IDE3LjUgOXMxLjUuNjcgMS41IDEuNS0uNjcgMS41LTEuNSAxLjV6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgYm94c2hhZG93ID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0yMCA4LjY5VjRoLTQuNjlMMTIgLjY5IDguNjkgNEg0djQuNjlMLjY5IDEyIDQgMTUuMzFWMjBoNC42OUwxMiAyMy4zMSAxNS4zMSAyMEgyMHYtNC42OUwyMy4zMSAxMiAyMCA4LjY5ek0xMiAxOGMtLjg5IDAtMS43NC0uMi0yLjUtLjU1QzExLjU2IDE2LjUgMTMgMTQuNDIgMTMgMTJzLTEuNDQtNC41LTMuNS01LjQ1QzEwLjI2IDYuMiAxMS4xMSA2IDEyIDZjMy4zMSAwIDYgMi42OSA2IDZzLTIuNjkgNi02IDZ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgaW5zcGVjdG9yID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPGc+XG4gICAgICA8cmVjdCB4PVwiMTFcIiB5PVwiN1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjJcIi8+XG4gICAgICA8cmVjdCB4PVwiMTFcIiB5PVwiMTFcIiB3aWR0aD1cIjJcIiBoZWlnaHQ9XCI2XCIvPlxuICAgICAgPHBhdGggZD1cIk0xMiwyQzYuNDgsMiwyLDYuNDgsMiwxMmMwLDUuNTIsNC40OCwxMCwxMCwxMHMxMC00LjQ4LDEwLTEwQzIyLDYuNDgsMTcuNTIsMiwxMiwyeiBNMTIsMjBjLTQuNDEsMC04LTMuNTktOC04XG4gICAgICAgIGMwLTQuNDEsMy41OS04LDgtOHM4LDMuNTksOCw4QzIwLDE2LjQxLDE2LjQxLDIwLDEyLDIwelwiLz5cbiAgICA8L2c+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQge1xuICBjdXJzb3IsXG4gIG1vdmUsXG4gIHNlYXJjaCxcbiAgbWFyZ2luLFxuICBwYWRkaW5nLFxuICBmb250LFxuICB0eXBlLFxuICBhbGlnbixcbiAgdHJhbnNmb3JtLFxuICByZXNpemUsXG4gIGJvcmRlcixcbiAgaHVlc2hpZnQsXG4gIGJveHNoYWRvdyxcbiAgaW5zcGVjdG9yLFxufSIsImV4cG9ydCBmdW5jdGlvbiBnZXRTaWRlKGRpcmVjdGlvbikge1xuICBsZXQgc3RhcnQgPSBkaXJlY3Rpb24uc3BsaXQoJysnKS5wb3AoKS5yZXBsYWNlKC9eXFx3LywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpXG4gIGlmIChzdGFydCA9PSAnVXAnKSBzdGFydCA9ICdUb3AnXG4gIGlmIChzdGFydCA9PSAnRG93bicpIHN0YXJ0ID0gJ0JvdHRvbSdcbiAgcmV0dXJuIHN0YXJ0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsZShlbCwgbmFtZSkge1xuICBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkge1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpXG4gICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKVxuICAgIGxldCBzID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpXG4gICAgcmV0dXJuIHMgJiYgcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpXG4gIH0gXG4gIGVsc2Uge1xuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxlcyhlbCwgZGVzaXJlZFByb3BNYXApIHtcbiAgY29uc3QgZWxTdHlsZU9iamVjdCA9IGVsLnN0eWxlXG4gIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbClcblxuICBsZXQgZGVzaXJlZFZhbHVlcyA9IFtdXG5cbiAgZm9yIChwcm9wIGluIGVsLnN0eWxlKVxuICAgIGlmIChwcm9wIGluIGRlc2lyZWRQcm9wTWFwICYmIGRlc2lyZWRQcm9wTWFwW3Byb3BdICE9IGNvbXB1dGVkU3R5bGVbcHJvcF0pXG4gICAgICBkZXNpcmVkVmFsdWVzLnB1c2goe1xuICAgICAgICBwcm9wLFxuICAgICAgICB2YWx1ZTogY29tcHV0ZWRTdHlsZVtwcm9wXVxuICAgICAgfSlcblxuICByZXR1cm4gZGVzaXJlZFZhbHVlc1xufVxuXG5sZXQgdGltZW91dE1hcCA9IHt9XG5leHBvcnQgZnVuY3Rpb24gc2hvd0hpZGVTZWxlY3RlZChlbCwgZHVyYXRpb24gPSA3NTApIHtcbiAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkLWhpZGUnLCB0cnVlKVxuXG4gIGlmICh0aW1lb3V0TWFwW2VsXSkgY2xlYXJUaW1lb3V0KHRpbWVvdXRNYXBbZWxdKVxuXG4gIHRpbWVvdXRNYXBbZWxdID0gc2V0VGltZW91dChfID0+XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkLWhpZGUnKVxuICAsIGR1cmF0aW9uKVxuICBcbiAgcmV0dXJuIGVsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbFRvRGFzaChjYW1lbFN0cmluZyA9IFwiXCIpIHtcbiAgcmV0dXJuIGNhbWVsU3RyaW5nLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oJDEpe3JldHVybiBcIi1cIiskMS50b0xvd2VyQ2FzZSgpO30pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sU3RyaW5nVG9Eb20oaHRtbFN0cmluZyA9IFwiXCIpIHtcbiAgcmV0dXJuIChuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGh0bWxTdHJpbmcsICd0ZXh0L2h0bWwnKSkuYm9keS5maXJzdENoaWxkXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUsIGdldFNpZGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG4vLyB0b2RvOiBzaG93IG1hcmdpbiBjb2xvclxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sYWx0KyR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9LHNoaWZ0K2FsdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK3NoaWZ0K3VwLGNtZCtkb3duLGNtZCtzaGlmdCtkb3duJ1xuXG5leHBvcnQgZnVuY3Rpb24gTWFyZ2luKHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwdXNoRWxlbWVudCgkKHNlbGVjdG9yKSwgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwdXNoQWxsRWxlbWVudFNpZGVzKCQoc2VsZWN0b3IpLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpIC8vIGJ1ZyBpbiBsaWI/XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1c2hFbGVtZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnbWFyZ2luJyArIGdldFNpZGUoZGlyZWN0aW9uKSxcbiAgICAgIGN1cnJlbnQ6ICBwYXJzZUludChnZXRTdHlsZShlbCwgJ21hcmdpbicgKyBnZXRTaWRlKGRpcmVjdGlvbikpLCAxMCksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2FsdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIG1hcmdpbjogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIG1hcmdpbn0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBgJHttYXJnaW4gPCAwID8gMCA6IG1hcmdpbn1weGApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdXNoQWxsRWxlbWVudFNpZGVzKGVscywga2V5Y29tbWFuZCkge1xuICBjb25zdCBjb21ibyA9IGtleWNvbW1hbmQuc3BsaXQoJysnKVxuICBsZXQgc3Bvb2YgPSAnJ1xuXG4gIGlmIChjb21iby5pbmNsdWRlcygnc2hpZnQnKSkgIHNwb29mID0gJ3NoaWZ0KycgKyBzcG9vZlxuICBpZiAoY29tYm8uaW5jbHVkZXMoJ2Rvd24nKSkgICBzcG9vZiA9ICdhbHQrJyArIHNwb29mXG5cbiAgJ3VwLGRvd24sbGVmdCxyaWdodCcuc3BsaXQoJywnKVxuICAgIC5mb3JFYWNoKHNpZGUgPT4gcHVzaEVsZW1lbnQoZWxzLCBzcG9vZiArIHNpZGUpKVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5cbmNvbnN0IHJlbW92ZUVkaXRhYmlsaXR5ID0gZSA9PiB7XG4gIGUudGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJylcbiAgZS50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHJlbW92ZUVkaXRhYmlsaXR5KVxuICBlLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgc3RvcEJ1YmJsaW5nKVxuICBob3RrZXlzLnVuYmluZCgnZXNjYXBlLGVzYycpXG59XG5cbmNvbnN0IHN0b3BCdWJibGluZyA9IGUgPT4gZS5rZXkgIT0gJ0VzY2FwZScgJiYgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG5leHBvcnQgZnVuY3Rpb24gRWRpdFRleHQoZWxlbWVudHMsIGZvY3VzPWZhbHNlKSB7XG4gIGlmICghZWxlbWVudHMubGVuZ3RoKSByZXR1cm5cblxuICBlbGVtZW50cy5tYXAoZWwgPT4ge1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgJ3RydWUnKVxuICAgIGZvY3VzICYmIGVsLmZvY3VzKClcbiAgICAkKGVsKS5vbigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgICAkKGVsKS5vbignYmx1cicsIHJlbW92ZUVkaXRhYmlsaXR5KVxuICB9KVxuXG4gIGhvdGtleXMoJ2VzY2FwZSxlc2MnLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGVsZW1lbnRzLmZvckVhY2godGFyZ2V0ID0+IHJlbW92ZUVkaXRhYmlsaXR5KHt0YXJnZXR9KSlcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZW1wdHkoKVxuICB9KVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0LGJhY2tzcGFjZSdcbi8vIHRvZG86IGluZGljYXRvciBmb3Igd2hlbiBub2RlIGNhbiBkZXNjZW5kXG4vLyB0b2RvOiBpbmRpY2F0b3Igd2hlcmUgbGVmdCBhbmQgcmlnaHQgd2lsbCBnb1xuLy8gdG9kbzogaW5kaWNhdG9yIHdoZW4gbGVmdCBvciByaWdodCBoaXQgZGVhZCBlbmRzXG5leHBvcnQgZnVuY3Rpb24gTW92ZWFibGUoc2VsZWN0b3IpIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwge2tleX0pID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgXG4gICAgJChzZWxlY3RvcikuZm9yRWFjaChlbCA9PiB7XG4gICAgICBtb3ZlRWxlbWVudChlbCwga2V5KVxuICAgICAgdXBkYXRlRmVlZGJhY2soZWwpXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdmVFbGVtZW50KGVsLCBkaXJlY3Rpb24pIHtcbiAgaWYgKCFlbCkgcmV0dXJuXG5cbiAgc3dpdGNoKGRpcmVjdGlvbikge1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgaWYgKGNhbk1vdmVMZWZ0KGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwsIGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpXG4gICAgICBlbHNlXG4gICAgICAgIHNob3dFZGdlKGVsLnBhcmVudE5vZGUpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAncmlnaHQnOlxuICAgICAgaWYgKGNhbk1vdmVSaWdodChlbCkgJiYgZWwubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRTaWJsaW5nKVxuICAgICAgICBlbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgZWwubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRTaWJsaW5nKVxuICAgICAgZWxzZSBpZiAoY2FuTW92ZVJpZ2h0KGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbClcbiAgICAgIGVsc2VcbiAgICAgICAgc2hvd0VkZ2UoZWwucGFyZW50Tm9kZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICd1cCc6XG4gICAgICBpZiAoY2FuTW92ZVVwKGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5wYXJlbnROb2RlLnByZXBlbmQoZWwpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZG93bic6XG4gICAgICAvLyBlZGdlIGNhc2UgYmVoYXZpb3IsIHVzZXIgdGVzdFxuICAgICAgaWYgKCFlbC5uZXh0RWxlbWVudFNpYmxpbmcgJiYgZWwucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUpXG4gICAgICAgIGVsLnBhcmVudE5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwsIGVsLnBhcmVudE5vZGUucGFyZW50Tm9kZS5jaGlsZHJlbltbLi4uZWwucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNoaWxkcmVuXS5pbmRleE9mKGVsLnBhcmVudEVsZW1lbnQpICsgMV0pXG4gICAgICBpZiAoY2FuTW92ZURvd24oZWwpKVxuICAgICAgICBlbC5uZXh0RWxlbWVudFNpYmxpbmcucHJlcGVuZChlbClcbiAgICAgIGJyZWFrXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNhbk1vdmVMZWZ0ID0gZWwgPT4gZWwucHJldmlvdXNFbGVtZW50U2libGluZ1xuZXhwb3J0IGNvbnN0IGNhbk1vdmVSaWdodCA9IGVsID0+IGVsLm5leHRFbGVtZW50U2libGluZ1xuZXhwb3J0IGNvbnN0IGNhbk1vdmVEb3duID0gZWwgPT4gXG4gIGVsLm5leHRFbGVtZW50U2libGluZyAmJiBlbC5uZXh0RWxlbWVudFNpYmxpbmcuY2hpbGRyZW4ubGVuZ3RoXG5leHBvcnQgY29uc3QgY2FuTW92ZVVwID0gZWwgPT4gXG4gIGVsLnBhcmVudE5vZGUgJiYgZWwucGFyZW50Tm9kZS5wYXJlbnROb2RlXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RWRnZShlbCkge1xuICByZXR1cm4gZWwuYW5pbWF0ZShbXG4gICAgeyBvdXRsaW5lOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyB9LFxuICAgIHsgb3V0bGluZTogJzFweCBzb2xpZCBoc2xhKDMzMCwgMTAwJSwgNzElLCA4MCUpJyB9LFxuICAgIHsgb3V0bGluZTogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcgfSxcbiAgXSwgNjAwKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlRmVlZGJhY2soZWwpIHtcbiAgbGV0IG9wdGlvbnMgPSAnJ1xuICAvLyBnZXQgY3VycmVudCBlbGVtZW50cyBvZmZzZXQvc2l6ZVxuICBpZiAoY2FuTW92ZUxlZnQoZWwpKSAgb3B0aW9ucyArPSAn4oegJ1xuICBpZiAoY2FuTW92ZVJpZ2h0KGVsKSkgb3B0aW9ucyArPSAn4oeiJ1xuICBpZiAoY2FuTW92ZURvd24oZWwpKSAgb3B0aW9ucyArPSAn4oejJ1xuICBpZiAoY2FuTW92ZVVwKGVsKSkgICAgb3B0aW9ucyArPSAn4oehJ1xuICAvLyBjcmVhdGUvbW92ZSBhcnJvd3MgaW4gYWJzb2x1dGUvZml4ZWQgdG8gb3ZlcmxheSBlbGVtZW50XG4gIG9wdGlvbnMgJiYgY29uc29sZS5pbmZvKCclYycrb3B0aW9ucywgXCJmb250LXNpemU6IDJyZW07XCIpXG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuXG5sZXQgaW1ncyA9IFtdXG5cbmV4cG9ydCBmdW5jdGlvbiB3YXRjaEltYWdlc0ZvclVwbG9hZCgpIHtcbiAgaW1ncyA9ICQoJ2ltZycpXG5cbiAgY2xlYXJXYXRjaGVycyhpbWdzKVxuICBpbml0V2F0Y2hlcnMoaW1ncylcbn1cblxuY29uc3QgaW5pdFdhdGNoZXJzID0gaW1ncyA9PiB7XG4gIGltZ3Mub24oJ2RyYWdvdmVyJywgb25EcmFnRW50ZXIpXG4gIGltZ3Mub24oJ2RyYWdsZWF2ZScsIG9uRHJhZ0xlYXZlKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgb25Ecm9wKVxufVxuXG5jb25zdCBwcmV2aWV3RmlsZSA9IGZpbGUgPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSlcbiAgICByZWFkZXIub25sb2FkZW5kID0gKCkgPT4gcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICB9KVxufVxuXG5jb25zdCBvbkRyYWdFbnRlciA9IGUgPT4ge1xuICAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLWRyb3B0YXJnZXQnLCB0cnVlKVxuICBlLnByZXZlbnREZWZhdWx0KClcbn1cblxuY29uc3Qgb25EcmFnTGVhdmUgPSBlID0+IHtcbiAgJChlLnRhcmdldCkuYXR0cignZGF0YS1kcm9wdGFyZ2V0JywgbnVsbClcbn1cblxuY29uc3Qgb25Ecm9wID0gYXN5bmMgKGUpID0+IHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtZHJvcHRhcmdldCcsIG51bGwpXG5cbiAgY29uc3Qgc2VsZWN0ZWRJbWFnZXMgPSAkKCdpbWdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG5cbiAgY29uc3Qgc3JjcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgIFsuLi5lLmRhdGFUcmFuc2Zlci5maWxlc10ubWFwKHByZXZpZXdGaWxlKSlcbiAgXG4gIGlmICghc2VsZWN0ZWRJbWFnZXMubGVuZ3RoICYmIGUudGFyZ2V0Lm5vZGVOYW1lID09PSAnSU1HJylcbiAgICBlLnRhcmdldC5zcmMgPSBzcmNzWzBdXG4gIGVsc2Uge1xuICAgIGxldCBpID0gMFxuICAgIHNlbGVjdGVkSW1hZ2VzLmZvckVhY2goaW1nID0+IHtcbiAgICAgIGltZy5zcmMgPSBzcmNzW2krK11cbiAgICAgIGlmIChpID49IHNyY3MubGVuZ3RoKSBpID0gMFxuICAgIH0pXG4gIH1cbn1cblxuY29uc3QgY2xlYXJXYXRjaGVycyA9IGltZ3MgPT4ge1xuICBpbWdzLm9mZignZHJhZ2VudGVyJywgb25EcmFnRW50ZXIpXG4gIGltZ3Mub2ZmKCdkcmFnbGVhdmUnLCBvbkRyYWdMZWF2ZSlcbiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJvcCcsIG9uRHJvcClcbiAgaW1ncyA9IFtdXG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuaW1wb3J0IHsgRWRpdFRleHQgfSBmcm9tICcuL3RleHQnXG5pbXBvcnQgeyBjYW5Nb3ZlTGVmdCwgY2FuTW92ZVJpZ2h0LCBjYW5Nb3ZlVXAgfSBmcm9tICcuL21vdmUnXG5pbXBvcnQgeyB3YXRjaEltYWdlc0ZvclVwbG9hZCB9IGZyb20gJy4vaW1hZ2Vzd2FwJ1xuaW1wb3J0IHsgaHRtbFN0cmluZ1RvRG9tIH0gZnJvbSAnLi91dGlscydcblxuLy8gdG9kbzogYWxpZ25tZW50IGd1aWRlc1xuZXhwb3J0IGZ1bmN0aW9uIFNlbGVjdGFibGUoKSB7XG4gIGNvbnN0IGVsZW1lbnRzICAgICAgICAgID0gJCgnYm9keScpXG4gIGxldCBzZWxlY3RlZCAgICAgICAgICAgID0gW11cbiAgbGV0IHNlbGVjdGVkQ2FsbGJhY2tzICAgPSBbXVxuXG4gIGNvbnN0IGxpc3RlbiA9ICgpID0+IHtcbiAgICBlbGVtZW50cy5vbignY2xpY2snLCBvbl9jbGljaylcbiAgICBlbGVtZW50cy5vbignZGJsY2xpY2snLCBvbl9kYmxjbGljaylcbiAgICBlbGVtZW50cy5vbignc2VsZWN0c3RhcnQnLCBvbl9zZWxlY3Rpb24pXG4gICAgZWxlbWVudHMub24oJ21vdXNlb3ZlcicsIG9uX2hvdmVyKVxuICAgIGVsZW1lbnRzLm9uKCdtb3VzZW91dCcsIG9uX2hvdmVyb3V0KVxuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY29weScsIG9uX2NvcHkpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY3V0Jywgb25fY3V0KVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgb25fcGFzdGUpXG5cbiAgICBob3RrZXlzKCdlc2MnLCBvbl9lc2MpXG4gICAgaG90a2V5cygnY21kK2QnLCBvbl9kdXBsaWNhdGUpXG4gICAgaG90a2V5cygnYmFja3NwYWNlLGRlbCxkZWxldGUnLCBvbl9kZWxldGUpXG4gICAgaG90a2V5cygnYWx0K2RlbCxhbHQrYmFja3NwYWNlJywgb25fY2xlYXJzdHlsZXMpXG4gICAgaG90a2V5cygnY21kK2UsY21kK3NoaWZ0K2UnLCBvbl9leHBhbmRfc2VsZWN0aW9uKVxuICAgIGhvdGtleXMoJ2NtZCtnLGNtZCtzaGlmdCtnJywgb25fZ3JvdXApXG4gICAgaG90a2V5cygndGFiLHNoaWZ0K3RhYixlbnRlcixzaGlmdCtlbnRlcicsIG9uX2tleWJvYXJkX3RyYXZlcnNhbClcbiAgfVxuXG4gIGNvbnN0IHVubGlzdGVuID0gKCkgPT4ge1xuICAgIGVsZW1lbnRzLm9mZignY2xpY2snLCBvbl9jbGljaylcbiAgICBlbGVtZW50cy5vZmYoJ2RibGNsaWNrJywgb25fZGJsY2xpY2spXG4gICAgZWxlbWVudHMub2ZmKCdzZWxlY3RzdGFydCcsIG9uX3NlbGVjdGlvbilcbiAgICBlbGVtZW50cy5vZmYoJ21vdXNlb3ZlcicsIG9uX2hvdmVyKVxuICAgIGVsZW1lbnRzLm9mZignbW91c2VvdXQnLCBvbl9ob3Zlcm91dClcblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvcHknLCBvbl9jb3B5KVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2N1dCcsIG9uX2N1dClcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwYXN0ZScsIG9uX3Bhc3RlKVxuXG4gICAgaG90a2V5cy51bmJpbmQoJ2VzYyxjbWQrZCxiYWNrc3BhY2UsZGVsLGRlbGV0ZSxhbHQrZGVsLGFsdCtiYWNrc3BhY2UsY21kK2UsY21kK3NoaWZ0K2UsY21kK2csY21kK3NoaWZ0K2csdGFiLHNoaWZ0K3RhYixlbnRlcixzaGlmdCtlbnRlcicpXG4gIH1cblxuICBjb25zdCBvbl9jbGljayA9IGUgPT4ge1xuICAgIGlmIChpc09mZkJvdW5kcyhlLnRhcmdldCkgJiYgIXNlbGVjdGVkLmZpbHRlcihlbCA9PiBlbCA9PSBlLnRhcmdldCkubGVuZ3RoKSBcbiAgICAgIHJldHVyblxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGlmICghZS5zaGlmdEtleSkgdW5zZWxlY3RfYWxsKClcbiAgICBzZWxlY3QoZS50YXJnZXQpXG4gIH1cblxuICBjb25zdCBvbl9kYmxjbGljayA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBpZiAoaXNPZmZCb3VuZHMoZS50YXJnZXQpKSByZXR1cm5cbiAgICBFZGl0VGV4dChbZS50YXJnZXRdLCB7Zm9jdXM6dHJ1ZX0pXG4gICAgJCgndG9vbC1wYWxsZXRlJylbMF0udG9vbFNlbGVjdGVkKCd0ZXh0JylcbiAgfVxuXG4gIGNvbnN0IG9uX2VzYyA9IF8gPT4gXG4gICAgc2VsZWN0ZWQubGVuZ3RoICYmIHVuc2VsZWN0X2FsbCgpXG5cbiAgY29uc3Qgb25fZHVwbGljYXRlID0gZSA9PiB7XG4gICAgY29uc3Qgcm9vdF9ub2RlID0gc2VsZWN0ZWRbMF1cbiAgICBpZiAoIXJvb3Rfbm9kZSkgcmV0dXJuXG5cbiAgICBjb25zdCBkZWVwX2Nsb25lID0gcm9vdF9ub2RlLmNsb25lTm9kZSh0cnVlKVxuICAgIGRlZXBfY2xvbmUucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkJylcbiAgICByb290X25vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZGVlcF9jbG9uZSwgcm9vdF9ub2RlLm5leHRTaWJsaW5nKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICB9XG5cbiAgY29uc3Qgb25fZGVsZXRlID0gZSA9PiBcbiAgICBzZWxlY3RlZC5sZW5ndGggJiYgZGVsZXRlX2FsbCgpXG5cbiAgY29uc3Qgb25fY2xlYXJzdHlsZXMgPSBlID0+XG4gICAgc2VsZWN0ZWQuZm9yRWFjaChlbCA9PlxuICAgICAgZWwuYXR0cignc3R5bGUnLCBudWxsKSlcblxuICBjb25zdCBvbl9jb3B5ID0gZSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkWzBdICYmIHRoaXMubm9kZV9jbGlwYm9hcmQgIT09IHNlbGVjdGVkWzBdKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGxldCAkbm9kZSA9IHNlbGVjdGVkWzBdLmNsb25lTm9kZSh0cnVlKVxuICAgICAgJG5vZGUucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkJylcbiAgICAgIHRoaXMuY29weV9iYWNrdXAgPSAkbm9kZS5vdXRlckhUTUxcbiAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCd0ZXh0L2h0bWwnLCB0aGlzLmNvcHlfYmFja3VwKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9uX2N1dCA9IGUgPT4ge1xuICAgIGlmIChzZWxlY3RlZFswXSAmJiB0aGlzLm5vZGVfY2xpcGJvYXJkICE9PSBzZWxlY3RlZFswXSkge1xuICAgICAgbGV0ICRub2RlID0gc2VsZWN0ZWRbMF0uY2xvbmVOb2RlKHRydWUpXG4gICAgICAkbm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc2VsZWN0ZWQnKVxuICAgICAgdGhpcy5jb3B5X2JhY2t1cCA9ICRub2RlLm91dGVySFRNTFxuICAgICAgZS5jbGlwYm9hcmREYXRhLnNldERhdGEoJ3RleHQvaHRtbCcsIHRoaXMuY29weV9iYWNrdXApXG4gICAgICBzZWxlY3RlZFswXS5yZW1vdmUoKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9uX3Bhc3RlID0gZSA9PiB7XG4gICAgY29uc3QgY2xpcERhdGEgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9odG1sJylcbiAgICBjb25zdCBwb3RlbnRpYWxIVE1MID0gY2xpcERhdGEgfHwgdGhpcy5jb3B5X2JhY2t1cFxuICAgIGlmIChzZWxlY3RlZFswXSAmJiBwb3RlbnRpYWxIVE1MKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHNlbGVjdGVkWzBdLmFwcGVuZENoaWxkKFxuICAgICAgICBodG1sU3RyaW5nVG9Eb20ocG90ZW50aWFsSFRNTCkpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb25fZXhwYW5kX3NlbGVjdGlvbiA9IChlLCB7a2V5fSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgLy8gVE9ETzogbmVlZCBhIG11Y2ggc21hcnRlciBzeXN0ZW0gaGVyZVxuICAgIC8vIG9ubHkgZXhwYW5kcyBiYXNlIHRhZyBuYW1lcyBhdG1cbiAgICBpZiAoc2VsZWN0ZWRbMF0ubm9kZU5hbWUgIT09ICdESVYnKVxuICAgICAgZXhwYW5kU2VsZWN0aW9uKHtcbiAgICAgICAgcm9vdF9ub2RlOiBzZWxlY3RlZFswXSwgXG4gICAgICAgIGFsbDoga2V5LmluY2x1ZGVzKCdzaGlmdCcpLFxuICAgICAgfSlcbiAgfVxuXG4gIGNvbnN0IG9uX2dyb3VwID0gKGUsIHtrZXl9KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoa2V5LnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykpIHtcbiAgICAgIGxldCAkc2VsZWN0ZWQgPSBbLi4uc2VsZWN0ZWRdXG4gICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgJHNlbGVjdGVkLnJldmVyc2UoKS5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgbGV0IGwgPSBlbC5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgd2hpbGUgKGVsLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgbm9kZSA9IGVsLmNoaWxkTm9kZXNbZWwuY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSAhPT0gJyN0ZXh0JylcbiAgICAgICAgICAgIHNlbGVjdChub2RlKVxuICAgICAgICAgIGVsLnBhcmVudE5vZGUucHJlcGVuZChub2RlKVxuICAgICAgICB9XG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgc2VsZWN0ZWRbMF0ucGFyZW50Tm9kZS5wcmVwZW5kKFxuICAgICAgICBzZWxlY3RlZC5yZXZlcnNlKCkucmVkdWNlKChkaXYsIGVsKSA9PiB7XG4gICAgICAgICAgZGl2LmFwcGVuZENoaWxkKGVsKVxuICAgICAgICAgIHJldHVybiBkaXZcbiAgICAgICAgfSwgZGl2KVxuICAgICAgKVxuICAgICAgdW5zZWxlY3RfYWxsKClcbiAgICAgIHNlbGVjdChkaXYpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb25fc2VsZWN0aW9uID0gZSA9PlxuICAgICFpc09mZkJvdW5kcyhlLnRhcmdldCkgXG4gICAgJiYgc2VsZWN0ZWQubGVuZ3RoIFxuICAgICYmIHNlbGVjdGVkWzBdLnRleHRDb250ZW50ICE9IGUudGFyZ2V0LnRleHRDb250ZW50IFxuICAgICYmIGUucHJldmVudERlZmF1bHQoKVxuXG4gIGNvbnN0IG9uX2tleWJvYXJkX3RyYXZlcnNhbCA9IChlLCB7a2V5fSkgPT4ge1xuICAgIGlmIChzZWxlY3RlZC5sZW5ndGggIT09IDEpIHJldHVyblxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdGVkWzBdXG5cbiAgICBpZiAoa2V5LmluY2x1ZGVzKCdzaGlmdCcpKSB7XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKCd0YWInKSAmJiBjYW5Nb3ZlTGVmdChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY2FuTW92ZUxlZnQoY3VycmVudCkpXG4gICAgICB9XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKCdlbnRlcicpICYmIGNhbk1vdmVVcChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY3VycmVudC5wYXJlbnROb2RlKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChrZXkuaW5jbHVkZXMoJ3RhYicpICYmIGNhbk1vdmVSaWdodChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY2FuTW92ZVJpZ2h0KGN1cnJlbnQpKVxuICAgICAgfVxuICAgICAgaWYgKGtleS5pbmNsdWRlcygnZW50ZXInKSAmJiBjdXJyZW50LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY3VycmVudC5jaGlsZHJlblswXSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBvbl9ob3ZlciA9ICh7dGFyZ2V0fSkgPT5cbiAgICAhaXNPZmZCb3VuZHModGFyZ2V0KSAmJiB0YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLWhvdmVyJywgdHJ1ZSlcblxuICBjb25zdCBvbl9ob3Zlcm91dCA9ICh7dGFyZ2V0fSkgPT5cbiAgICB0YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWhvdmVyJylcblxuICBjb25zdCBzZWxlY3QgPSBlbCA9PiB7XG4gICAgaWYgKGVsLm5vZGVOYW1lID09PSAnc3ZnJyB8fCBlbC5vd25lclNWR0VsZW1lbnQpIHJldHVyblxuXG4gICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkJywgdHJ1ZSlcbiAgICBzZWxlY3RlZC51bnNoaWZ0KGVsKVxuICAgIHRlbGxXYXRjaGVycygpXG4gIH1cblxuICBjb25zdCB1bnNlbGVjdF9hbGwgPSAoKSA9PiB7XG4gICAgc2VsZWN0ZWRcbiAgICAgIC5mb3JFYWNoKGVsID0+IFxuICAgICAgICAkKGVsKS5hdHRyKHtcbiAgICAgICAgICAnZGF0YS1zZWxlY3RlZCc6IG51bGwsXG4gICAgICAgICAgJ2RhdGEtc2VsZWN0ZWQtaGlkZSc6IG51bGwsXG4gICAgICAgIH0pKVxuXG4gICAgc2VsZWN0ZWQgPSBbXVxuICB9XG5cbiAgY29uc3QgZGVsZXRlX2FsbCA9ICgpID0+IHtcbiAgICBzZWxlY3RlZC5mb3JFYWNoKGVsID0+XG4gICAgICBlbC5yZW1vdmUoKSlcbiAgICBzZWxlY3RlZCA9IFtdXG4gIH1cblxuICBjb25zdCBleHBhbmRTZWxlY3Rpb24gPSAoe3Jvb3Rfbm9kZSwgYWxsfSkgPT4ge1xuICAgIGlmIChhbGwpIHtcbiAgICAgIGNvbnN0IHVuc2VsZWN0ZWRzID0gJChyb290X25vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSArICc6bm90KFtkYXRhLXNlbGVjdGVkXSknKVxuICAgICAgdW5zZWxlY3RlZHMuZm9yRWFjaChzZWxlY3QpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgcG90ZW50aWFscyA9ICQocm9vdF9ub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpXG4gICAgICBpZiAoIXBvdGVudGlhbHMpIHJldHVyblxuXG4gICAgICBjb25zdCByb290X25vZGVfaW5kZXggPSBwb3RlbnRpYWxzLnJlZHVjZSgoaW5kZXgsIG5vZGUsIGkpID0+XG4gICAgICAgIG5vZGUgPT0gcm9vdF9ub2RlIFxuICAgICAgICAgID8gaW5kZXggPSBpXG4gICAgICAgICAgOiBpbmRleFxuICAgICAgLCBudWxsKVxuXG4gICAgICBpZiAocm9vdF9ub2RlX2luZGV4ICE9PSBudWxsKSB7XG4gICAgICAgIGlmICghcG90ZW50aWFsc1tyb290X25vZGVfaW5kZXggKyAxXSkge1xuICAgICAgICAgIGNvbnN0IHBvdGVudGlhbCA9IHBvdGVudGlhbHMuZmlsdGVyKGVsID0+ICFlbC5hdHRyKCdkYXRhLXNlbGVjdGVkJykpWzBdXG4gICAgICAgICAgaWYgKHBvdGVudGlhbCkgc2VsZWN0KHBvdGVudGlhbClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzZWxlY3QocG90ZW50aWFsc1tyb290X25vZGVfaW5kZXggKyAxXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzT2ZmQm91bmRzID0gbm9kZSA9PlxuICAgIG5vZGUuY2xvc2VzdCAmJiAobm9kZS5jbG9zZXN0KCd0b29sLXBhbGxldGUnKSB8fCBub2RlLmNsb3Nlc3QoJy5tZXRhdGlwJykgfHwgbm9kZS5jbG9zZXN0KCdob3RrZXktbWFwJykpXG5cbiAgY29uc3Qgb25TZWxlY3RlZFVwZGF0ZSA9IGNiID0+XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MucHVzaChjYikgJiYgY2Ioc2VsZWN0ZWQpXG5cbiAgY29uc3QgcmVtb3ZlU2VsZWN0ZWRDYWxsYmFjayA9IGNiID0+XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MgPSBzZWxlY3RlZENhbGxiYWNrcy5maWx0ZXIoY2FsbGJhY2sgPT4gY2FsbGJhY2sgIT0gY2IpXG5cbiAgY29uc3QgdGVsbFdhdGNoZXJzID0gKCkgPT5cbiAgICBzZWxlY3RlZENhbGxiYWNrcy5mb3JFYWNoKGNiID0+IGNiKHNlbGVjdGVkKSlcblxuICBjb25zdCBkaXNjb25uZWN0ID0gKCkgPT4ge1xuICAgIHVuc2VsZWN0X2FsbCgpXG4gICAgdW5saXN0ZW4oKVxuICB9XG5cbiAgd2F0Y2hJbWFnZXNGb3JVcGxvYWQoKVxuICBsaXN0ZW4oKVxuXG4gIHJldHVybiB7XG4gICAgc2VsZWN0LFxuICAgIHVuc2VsZWN0X2FsbCxcbiAgICBvblNlbGVjdGVkVXBkYXRlLFxuICAgIHJlbW92ZVNlbGVjdGVkQ2FsbGJhY2ssXG4gICAgZGlzY29ubmVjdCxcbiAgfVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBnZXRTdHlsZSwgZ2V0U2lkZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4vdXRpbHMuanMnXG5cbi8vIHRvZG86IHNob3cgcGFkZGluZyBjb2xvclxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sYWx0KyR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9LHNoaWZ0K2FsdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK3NoaWZ0K3VwLGNtZCtkb3duLGNtZCtzaGlmdCtkb3duJ1xuXG5leHBvcnQgZnVuY3Rpb24gUGFkZGluZyhzZWxlY3Rvcikge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcGFkRWxlbWVudCgkKHNlbGVjdG9yKSwgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwYWRBbGxFbGVtZW50U2lkZXMoJChzZWxlY3RvciksIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JykgLy8gYnVnIGluIGxpYj9cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkRWxlbWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ3BhZGRpbmcnICsgZ2V0U2lkZShkaXJlY3Rpb24pLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAncGFkZGluZycgKyBnZXRTaWRlKGRpcmVjdGlvbikpLCAxMCksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2FsdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHBhZGRpbmc6IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCAtIHBheWxvYWQuYW1vdW50IFxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50ICsgcGF5bG9hZC5hbW91bnRcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCBwYWRkaW5nfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke3BhZGRpbmcgPCAwID8gMCA6IHBhZGRpbmd9cHhgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkQWxsRWxlbWVudFNpZGVzKGVscywga2V5Y29tbWFuZCkge1xuICBjb25zdCBjb21ibyA9IGtleWNvbW1hbmQuc3BsaXQoJysnKVxuICBsZXQgc3Bvb2YgPSAnJ1xuXG4gIGlmIChjb21iby5pbmNsdWRlcygnc2hpZnQnKSkgIHNwb29mID0gJ3NoaWZ0KycgKyBzcG9vZlxuICBpZiAoY29tYm8uaW5jbHVkZXMoJ2Rvd24nKSkgICBzcG9vZiA9ICdhbHQrJyArIHNwb29mXG5cbiAgJ3VwLGRvd24sbGVmdCxyaWdodCcuc3BsaXQoJywnKVxuICAgIC5mb3JFYWNoKHNpZGUgPT4gcGFkRWxlbWVudChlbHMsIHNwb29mICsgc2lkZSkpXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxzaGlmdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBGb250KHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VLZXJuaW5nKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZUFsaWdubWVudChzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICBlbHNlXG4gICAgICBrZXlzLmluY2x1ZGVzKCdzaGlmdCcpXG4gICAgICAgID8gY2hhbmdlTGVhZGluZyhzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICAgICAgOiBjaGFuZ2VGb250U2l6ZShzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGxldCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIGNoYW5nZUZvbnRXZWlnaHQoJChzZWxlY3RvciksIGtleXMuaW5jbHVkZXMoJ3VwJykgPyAndXAnIDogJ2Rvd24nKVxuICB9KVxuXG4gIGhvdGtleXMoJ2NtZCtiJywgZSA9PiB7XG4gICAgJChzZWxlY3RvcikuZm9yRWFjaChlbCA9PlxuICAgICAgZWwuc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJylcbiAgfSlcblxuICBob3RrZXlzKCdjbWQraScsIGUgPT4ge1xuICAgICQoc2VsZWN0b3IpLmZvckVhY2goZWwgPT5cbiAgICAgIGVsLnN0eWxlLmZvbnRTdHlsZSA9ICdpdGFsaWMnKVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgnY21kK2IsY21kK2knKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VMZWFkaW5nKGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnbGluZUhlaWdodCcsXG4gICAgICBjdXJyZW50OiAgcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdsaW5lSGVpZ2h0JykpLFxuICAgICAgYW1vdW50OiAgIDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBjdXJyZW50OiBwYXlsb2FkLmN1cnJlbnQgPT0gJ25vcm1hbCcgfHwgaXNOYU4ocGF5bG9hZC5jdXJyZW50KVxuICAgICAgICAgID8gMS4xNCAqIHBhcnNlSW50KGdldFN0eWxlKHBheWxvYWQuZWwsICdmb250U2l6ZScpKSAvLyBkb2N1bWVudCB0aGlzIGNob2ljZVxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50XG4gICAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGAke3ZhbHVlfXB4YClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUtlcm5pbmcoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdsZXR0ZXJTcGFjaW5nJyxcbiAgICAgIGN1cnJlbnQ6ICBwYXJzZUZsb2F0KGdldFN0eWxlKGVsLCAnbGV0dGVyU3BhY2luZycpKSxcbiAgICAgIGFtb3VudDogICAuMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnbGVmdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGN1cnJlbnQ6IHBheWxvYWQuY3VycmVudCA9PSAnbm9ybWFsJyB8fCBpc05hTihwYXlsb2FkLmN1cnJlbnQpXG4gICAgICAgICAgPyAwXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnRcbiAgICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnQgLSBwYXlsb2FkLmFtb3VudCBcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7dmFsdWUgPD0gLTIgPyAtMiA6IHZhbHVlfXB4YClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUZvbnRTaXplKGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnZm9udFNpemUnLFxuICAgICAgY3VycmVudDogIHBhcnNlSW50KGdldFN0eWxlKGVsLCAnZm9udFNpemUnKSksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBmb250X3NpemU6IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCAtIHBheWxvYWQuYW1vdW50IFxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50ICsgcGF5bG9hZC5hbW91bnRcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCBmb250X3NpemV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7Zm9udF9zaXplIDw9IDYgPyA2IDogZm9udF9zaXplfXB4YClcbn1cblxuY29uc3Qgd2VpZ2h0TWFwID0ge1xuICBub3JtYWw6IDIsXG4gIGJvbGQ6ICAgNSxcbiAgbGlnaHQ6ICAwLFxuICBcIlwiOiAyLFxuICBcIjEwMFwiOjAsXCIyMDBcIjoxLFwiMzAwXCI6MixcIjQwMFwiOjMsXCI1MDBcIjo0LFwiNjAwXCI6NSxcIjcwMFwiOjYsXCI4MDBcIjo3LFwiOTAwXCI6OFxufVxuY29uc3Qgd2VpZ2h0T3B0aW9ucyA9IFsxMDAsMjAwLDMwMCw0MDAsNTAwLDYwMCw3MDAsODAwLDkwMF1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUZvbnRXZWlnaHQoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdmb250V2VpZ2h0JyxcbiAgICAgIGN1cnJlbnQ6ICBnZXRTdHlsZShlbCwgJ2ZvbnRXZWlnaHQnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2Rvd24nKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IHdlaWdodE1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IHdlaWdodE1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IHdlaWdodE9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IHdlaWdodE9wdGlvbnMubGVuZ3RoIFxuICAgICAgICA/IHdlaWdodE9wdGlvbnMubGVuZ3RoXG4gICAgICAgIDogdmFsdWVcbiAgICAgIF0pXG59XG5cbmNvbnN0IGFsaWduTWFwID0ge1xuICBzdGFydDogMCxcbiAgbGVmdDogMCxcbiAgY2VudGVyOiAxLFxuICByaWdodDogMixcbn1cbmNvbnN0IGFsaWduT3B0aW9ucyA9IFsnbGVmdCcsJ2NlbnRlcicsJ3JpZ2h0J11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUFsaWdubWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ3RleHRBbGlnbicsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICd0ZXh0QWxpZ24nKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGFsaWduTWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBhbGlnbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxzaGlmdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK2Rvd24sY21kK2xlZnQsY21kK3JpZ2h0J1xuXG5leHBvcnQgZnVuY3Rpb24gRmxleChzZWxlY3Rvcikge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsZXQgc2VsZWN0ZWROb2RlcyA9ICQoc2VsZWN0b3IpXG4gICAgICAsIGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG5cbiAgICBpZiAoa2V5cy5pbmNsdWRlcygnbGVmdCcpIHx8IGtleXMuaW5jbHVkZXMoJ3JpZ2h0JykpXG4gICAgICBrZXlzLmluY2x1ZGVzKCdzaGlmdCcpXG4gICAgICAgID8gY2hhbmdlSERpc3RyaWJ1dGlvbihzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgICAgICAgOiBjaGFuZ2VIQWxpZ25tZW50KHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgIGVsc2VcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VWRGlzdHJpYnV0aW9uKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZVZBbGlnbm1lbnQoc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcbiAgICBcbiAgICBjaGFuZ2VEaXJlY3Rpb24oc2VsZWN0ZWROb2Rlcywga2V5cy5pbmNsdWRlcygnbGVmdCcpID8gJ3JvdycgOiAnY29sdW1uJylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuY29uc3QgZW5zdXJlRmxleCA9IGVsID0+IHtcbiAgZWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuICByZXR1cm4gZWxcbn1cblxuY29uc3QgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQgPSAoY3VyLCB3YW50KSA9PiB7XG4gIGlmICh3YW50ID09ICdhbGlnbicgJiYgKGN1ciAhPSAnZmxleC1zdGFydCcgJiYgY3VyICE9ICdjZW50ZXInICYmIGN1ciAhPSAnZmxleC1lbmQnKSlcbiAgICBjdXIgPSAnbm9ybWFsJ1xuICBlbHNlIGlmICh3YW50ID09ICdkaXN0cmlidXRlJyAmJiAoY3VyICE9ICdzcGFjZS1hcm91bmQnICYmIGN1ciAhPSAnc3BhY2UtYmV0d2VlbicpKVxuICAgIGN1ciA9ICdub3JtYWwnXG5cbiAgcmV0dXJuIGN1clxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlRGlyZWN0aW9uKGVscywgdmFsdWUpIHtcbiAgZWxzXG4gICAgLm1hcChlbnN1cmVGbGV4KVxuICAgIC5tYXAoZWwgPT4ge1xuICAgICAgZWwuc3R5bGUuZmxleERpcmVjdGlvbiA9IHZhbHVlXG4gICAgfSlcbn1cblxuY29uc3QgaF9hbGlnbk1hcCAgICAgID0ge25vcm1hbDogMCwnZmxleC1zdGFydCc6IDAsJ2NlbnRlcic6IDEsJ2ZsZXgtZW5kJzogMix9XG5jb25zdCBoX2FsaWduT3B0aW9ucyAgPSBbJ2ZsZXgtc3RhcnQnLCdjZW50ZXInLCdmbGV4LWVuZCddXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VIQWxpZ25tZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlRmxleClcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdqdXN0aWZ5Q29udGVudCcsXG4gICAgICBjdXJyZW50OiAgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQoZ2V0U3R5bGUoZWwsICdqdXN0aWZ5Q29udGVudCcpLCAnYWxpZ24nKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSAtIDEgXG4gICAgICAgICAgOiBoX2FsaWduTWFwW3BheWxvYWQuY3VycmVudF0gKyAxXG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gaF9hbGlnbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG5cbmNvbnN0IHZfYWxpZ25NYXAgICAgICA9IHtub3JtYWw6IDAsJ2ZsZXgtc3RhcnQnOiAwLCdjZW50ZXInOiAxLCdmbGV4LWVuZCc6IDIsfVxuY29uc3Qgdl9hbGlnbk9wdGlvbnMgID0gWydmbGV4LXN0YXJ0JywnY2VudGVyJywnZmxleC1lbmQnXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlVkFsaWdubWVudChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnYWxpZ25JdGVtcycsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICdhbGlnbkl0ZW1zJyksXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbi5zcGxpdCgnKycpLmluY2x1ZGVzKCd1cCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gaF9hbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB2X2FsaWduT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cblxuY29uc3QgaF9kaXN0cmlidXRpb25NYXAgICAgICA9IHtub3JtYWw6IDEsJ3NwYWNlLWFyb3VuZCc6IDAsJyc6IDEsJ3NwYWNlLWJldHdlZW4nOiAyLH1cbmNvbnN0IGhfZGlzdHJpYnV0aW9uT3B0aW9ucyAgPSBbJ3NwYWNlLWFyb3VuZCcsJycsJ3NwYWNlLWJldHdlZW4nXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlSERpc3RyaWJ1dGlvbihlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnanVzdGlmeUNvbnRlbnQnLFxuICAgICAgY3VycmVudDogIGFjY291bnRGb3JPdGhlckp1c3RpZnlDb250ZW50KGdldFN0eWxlKGVsLCAnanVzdGlmeUNvbnRlbnQnKSwgJ2Rpc3RyaWJ1dGUnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2xlZnQnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IGhfZGlzdHJpYnV0aW9uTWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogaF9kaXN0cmlidXRpb25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBoX2Rpc3RyaWJ1dGlvbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG5cbmNvbnN0IHZfZGlzdHJpYnV0aW9uTWFwICAgICAgPSB7bm9ybWFsOiAxLCdzcGFjZS1hcm91bmQnOiAwLCcnOiAxLCdzcGFjZS1iZXR3ZWVuJzogMix9XG5jb25zdCB2X2Rpc3RyaWJ1dGlvbk9wdGlvbnMgID0gWydzcGFjZS1hcm91bmQnLCcnLCdzcGFjZS1iZXR3ZWVuJ11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZVZEaXN0cmlidXRpb24oZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbnN1cmVGbGV4KVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ2FsaWduQ29udGVudCcsXG4gICAgICBjdXJyZW50OiAgZ2V0U3R5bGUoZWwsICdhbGlnbkNvbnRlbnQnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3VwJyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgdmFsdWU6IHBheWxvYWQuZGlyZWN0aW9uXG4gICAgICAgICAgPyB2X2Rpc3RyaWJ1dGlvbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IHZfZGlzdHJpYnV0aW9uTWFwW3BheWxvYWQuY3VycmVudF0gKyAxXG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gdl9kaXN0cmlidXRpb25PcHRpb25zW3ZhbHVlIDwgMCA/IDAgOiB2YWx1ZSA+PSAyID8gMjogdmFsdWVdKVxufVxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuLy8gY3JlYXRlIGlucHV0XG5jb25zdCBzZWFyY2hfYmFzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5zZWFyY2hfYmFzZS5jbGFzc0xpc3QuYWRkKCdzZWFyY2gnKVxuc2VhcmNoX2Jhc2UuaW5uZXJIVE1MID0gYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiZXg6IGltYWdlcywgLmJ0biwgZGl2LCBhbmQgbW9yZVwiLz5gXG5cbmNvbnN0IHNlYXJjaCAgICAgICAgPSAkKHNlYXJjaF9iYXNlKVxuY29uc3Qgc2VhcmNoSW5wdXQgICA9ICQoJ2lucHV0Jywgc2VhcmNoX2Jhc2UpXG5cbmNvbnN0IHNob3dTZWFyY2hCYXIgPSAoKSA9PiBzZWFyY2guYXR0cignc3R5bGUnLCAnZGlzcGxheTpibG9jaycpXG5jb25zdCBoaWRlU2VhcmNoQmFyID0gKCkgPT4gc2VhcmNoLmF0dHIoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZScpXG5jb25zdCBzdG9wQnViYmxpbmcgID0gZSA9PiBlLmtleSAhPSAnRXNjYXBlJyAmJiBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbmV4cG9ydCBmdW5jdGlvbiBTZWFyY2goU2VsZWN0b3JFbmdpbmUsIG5vZGUpIHtcbiAgaWYgKG5vZGUpIG5vZGVbMF0uYXBwZW5kQ2hpbGQoc2VhcmNoWzBdKVxuXG4gIGNvbnN0IG9uUXVlcnkgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBsZXQgcXVlcnkgPSBlLnRhcmdldC52YWx1ZVxuXG4gICAgaWYgKHF1ZXJ5ID09ICdsaW5rcycpIHF1ZXJ5ID0gJ2EnXG4gICAgaWYgKHF1ZXJ5ID09ICdidXR0b25zJykgcXVlcnkgPSAnYnV0dG9uJ1xuICAgIGlmIChxdWVyeSA9PSAnaW1hZ2VzJykgcXVlcnkgPSAnaW1nJ1xuICAgIGlmIChxdWVyeSA9PSAndGV4dCcpIHF1ZXJ5ID0gJ3AsY2FwdGlvbixhLGgxLGgyLGgzLGg0LGg1LGg2LHNtYWxsLGRhdGUsdGltZSxsaSxkdCxkZCdcblxuICAgIGlmICghcXVlcnkpIHJldHVybiBTZWxlY3RvckVuZ2luZS51bnNlbGVjdF9hbGwoKVxuICAgIGlmIChxdWVyeSA9PSAnLicgfHwgcXVlcnkgPT0gJyMnKSByZXR1cm5cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYXRjaGVzID0gJChxdWVyeSlcbiAgICAgIFNlbGVjdG9yRW5naW5lLnVuc2VsZWN0X2FsbCgpXG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGgpXG4gICAgICAgIG1hdGNoZXMuZm9yRWFjaChlbCA9PlxuICAgICAgICAgIFNlbGVjdG9yRW5naW5lLnNlbGVjdChlbCkpXG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHt9XG4gIH1cblxuICBzZWFyY2hJbnB1dC5vbignaW5wdXQnLCBvblF1ZXJ5KVxuICBzZWFyY2hJbnB1dC5vbigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgLy8gc2VhcmNoSW5wdXQub24oJ2JsdXInLCBoaWRlU2VhcmNoQmFyKVxuXG4gIHNob3dTZWFyY2hCYXIoKVxuICBzZWFyY2hJbnB1dFswXS5mb2N1cygpXG5cbiAgLy8gaG90a2V5cygnZXNjYXBlLGVzYycsIChlLCBoYW5kbGVyKSA9PiB7XG4gIC8vICAgaGlkZVNlYXJjaEJhcigpXG4gIC8vICAgaG90a2V5cy51bmJpbmQoJ2VzY2FwZSxlc2MnKVxuICAvLyB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaGlkZVNlYXJjaEJhcigpXG4gICAgc2VhcmNoSW5wdXQub2ZmKCdvbmlucHV0Jywgb25RdWVyeSlcbiAgICBzZWFyY2hJbnB1dC5vZmYoJ2tleWRvd24nLCBzdG9wQnViYmxpbmcpXG4gICAgc2VhcmNoSW5wdXQub2ZmKCdibHVyJywgaGlkZVNlYXJjaEJhcilcbiAgfVxufSIsIi8qKlxuICogVGFrZSBpbnB1dCBmcm9tIFswLCBuXSBhbmQgcmV0dXJuIGl0IGFzIFswLCAxXVxuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBib3VuZDAxKG4sIG1heCkge1xuICAgIGlmIChpc09uZVBvaW50WmVybyhuKSkge1xuICAgICAgICBuID0gJzEwMCUnO1xuICAgIH1cbiAgICBjb25zdCBwcm9jZXNzUGVyY2VudCA9IGlzUGVyY2VudGFnZShuKTtcbiAgICBuID0gbWF4ID09PSAzNjAgPyBuIDogTWF0aC5taW4obWF4LCBNYXRoLm1heCgwLCBwYXJzZUZsb2F0KG4pKSk7XG4gICAgLy8gQXV0b21hdGljYWxseSBjb252ZXJ0IHBlcmNlbnRhZ2UgaW50byBudW1iZXJcbiAgICBpZiAocHJvY2Vzc1BlcmNlbnQpIHtcbiAgICAgICAgbiA9IHBhcnNlSW50KFN0cmluZyhuICogbWF4KSwgMTApIC8gMTAwO1xuICAgIH1cbiAgICAvLyBIYW5kbGUgZmxvYXRpbmcgcG9pbnQgcm91bmRpbmcgZXJyb3JzXG4gICAgaWYgKE1hdGguYWJzKG4gLSBtYXgpIDwgMC4wMDAwMDEpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIC8vIENvbnZlcnQgaW50byBbMCwgMV0gcmFuZ2UgaWYgaXQgaXNuJ3QgYWxyZWFkeVxuICAgIGlmIChtYXggPT09IDM2MCkge1xuICAgICAgICAvLyBJZiBuIGlzIGEgaHVlIGdpdmVuIGluIGRlZ3JlZXMsXG4gICAgICAgIC8vIHdyYXAgYXJvdW5kIG91dC1vZi1yYW5nZSB2YWx1ZXMgaW50byBbMCwgMzYwXSByYW5nZVxuICAgICAgICAvLyB0aGVuIGNvbnZlcnQgaW50byBbMCwgMV0uXG4gICAgICAgIG4gPSAobiA8IDAgPyBuICUgbWF4ICsgbWF4IDogbiAlIG1heCkgLyBwYXJzZUZsb2F0KFN0cmluZyhtYXgpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIElmIG4gbm90IGEgaHVlIGdpdmVuIGluIGRlZ3JlZXNcbiAgICAgICAgLy8gQ29udmVydCBpbnRvIFswLCAxXSByYW5nZSBpZiBpdCBpc24ndCBhbHJlYWR5LlxuICAgICAgICBuID0gKG4gJSBtYXgpIC8gcGFyc2VGbG9hdChTdHJpbmcobWF4KSk7XG4gICAgfVxuICAgIHJldHVybiBuO1xufVxuLyoqXG4gKiBGb3JjZSBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDFcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gY2xhbXAwMSh2YWwpIHtcbiAgICByZXR1cm4gTWF0aC5taW4oMSwgTWF0aC5tYXgoMCwgdmFsKSk7XG59XG4vKipcbiAqIE5lZWQgdG8gaGFuZGxlIDEuMCBhcyAxMDAlLCBzaW5jZSBvbmNlIGl0IGlzIGEgbnVtYmVyLCB0aGVyZSBpcyBubyBkaWZmZXJlbmNlIGJldHdlZW4gaXQgYW5kIDFcbiAqIDxodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzc0MjIwNzIvamF2YXNjcmlwdC1ob3ctdG8tZGV0ZWN0LW51bWJlci1hcy1hLWRlY2ltYWwtaW5jbHVkaW5nLTEtMD5cbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gaXNPbmVQb2ludFplcm8obikge1xuICAgIHJldHVybiB0eXBlb2YgbiA9PT0gJ3N0cmluZycgJiYgbi5pbmRleE9mKCcuJykgIT09IC0xICYmIHBhcnNlRmxvYXQobikgPT09IDE7XG59XG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiBzdHJpbmcgcGFzc2VkIGluIGlzIGEgcGVyY2VudGFnZVxuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBpc1BlcmNlbnRhZ2Uobikge1xuICAgIHJldHVybiB0eXBlb2YgbiA9PT0gJ3N0cmluZycgJiYgbi5pbmRleE9mKCclJykgIT09IC0xO1xufVxuLyoqXG4gKiBSZXR1cm4gYSB2YWxpZCBhbHBoYSB2YWx1ZSBbMCwxXSB3aXRoIGFsbCBpbnZhbGlkIHZhbHVlcyBiZWluZyBzZXQgdG8gMVxuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBib3VuZEFscGhhKGEpIHtcbiAgICBhID0gcGFyc2VGbG9hdChhKTtcbiAgICBpZiAoaXNOYU4oYSkgfHwgYSA8IDAgfHwgYSA+IDEpIHtcbiAgICAgICAgYSA9IDE7XG4gICAgfVxuICAgIHJldHVybiBhO1xufVxuLyoqXG4gKiBSZXBsYWNlIGEgZGVjaW1hbCB3aXRoIGl0J3MgcGVyY2VudGFnZSB2YWx1ZVxuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBjb252ZXJ0VG9QZXJjZW50YWdlKG4pIHtcbiAgICBpZiAobiA8PSAxKSB7XG4gICAgICAgIHJldHVybiArbiAqIDEwMCArICclJztcbiAgICB9XG4gICAgcmV0dXJuIG47XG59XG4vKipcbiAqIEZvcmNlIGEgaGV4IHZhbHVlIHRvIGhhdmUgMiBjaGFyYWN0ZXJzXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIHBhZDIoYykge1xuICAgIHJldHVybiBjLmxlbmd0aCA9PT0gMSA/ICcwJyArIGMgOiAnJyArIGM7XG59XG5cbi8vIGByZ2JUb0hzbGAsIGByZ2JUb0hzdmAsIGBoc2xUb1JnYmAsIGBoc3ZUb1JnYmAgbW9kaWZpZWQgZnJvbTpcbi8vIDxodHRwOi8vbWppamFja3Nvbi5jb20vMjAwOC8wMi9yZ2ItdG8taHNsLWFuZC1yZ2ItdG8taHN2LWNvbG9yLW1vZGVsLWNvbnZlcnNpb24tYWxnb3JpdGhtcy1pbi1qYXZhc2NyaXB0PlxuLyoqXG4gKiBIYW5kbGUgYm91bmRzIC8gcGVyY2VudGFnZSBjaGVja2luZyB0byBjb25mb3JtIHRvIENTUyBjb2xvciBzcGVjXG4gKiA8aHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1jb2xvci8+XG4gKiAqQXNzdW1lczoqIHIsIGcsIGIgaW4gWzAsIDI1NV0gb3IgWzAsIDFdXG4gKiAqUmV0dXJuczoqIHsgciwgZywgYiB9IGluIFswLCAyNTVdXG4gKi9cbmZ1bmN0aW9uIHJnYlRvUmdiKHIsIGcsIGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByOiBib3VuZDAxKHIsIDI1NSkgKiAyNTUsXG4gICAgICAgIGc6IGJvdW5kMDEoZywgMjU1KSAqIDI1NSxcbiAgICAgICAgYjogYm91bmQwMShiLCAyNTUpICogMjU1LFxuICAgIH07XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQiBjb2xvciB2YWx1ZSB0byBIU0wuXG4gKiAqQXNzdW1lczoqIHIsIGcsIGFuZCBiIGFyZSBjb250YWluZWQgaW4gWzAsIDI1NV0gb3IgWzAsIDFdXG4gKiAqUmV0dXJuczoqIHsgaCwgcywgbCB9IGluIFswLDFdXG4gKi9cbmZ1bmN0aW9uIHJnYlRvSHNsKHIsIGcsIGIpIHtcbiAgICByID0gYm91bmQwMShyLCAyNTUpO1xuICAgIGcgPSBib3VuZDAxKGcsIDI1NSk7XG4gICAgYiA9IGJvdW5kMDEoYiwgMjU1KTtcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICBjb25zdCBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICBsZXQgaCA9IDA7XG4gICAgbGV0IHMgPSAwO1xuICAgIGNvbnN0IGwgPSAobWF4ICsgbWluKSAvIDI7XG4gICAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgICAgIGggPSBzID0gMDsgLy8gYWNocm9tYXRpY1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgZCA9IG1heCAtIG1pbjtcbiAgICAgICAgcyA9IGwgPiAwLjUgPyBkIC8gKDIgLSBtYXggLSBtaW4pIDogZCAvIChtYXggKyBtaW4pO1xuICAgICAgICBzd2l0Y2ggKG1heCkge1xuICAgICAgICAgICAgY2FzZSByOlxuICAgICAgICAgICAgICAgIGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgZzpcbiAgICAgICAgICAgICAgICBoID0gKGIgLSByKSAvIGQgKyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBiOlxuICAgICAgICAgICAgICAgIGggPSAociAtIGcpIC8gZCArIDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaCAvPSA2O1xuICAgIH1cbiAgICByZXR1cm4geyBoLCBzLCBsIH07XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIEhTTCBjb2xvciB2YWx1ZSB0byBSR0IuXG4gKlxuICogKkFzc3VtZXM6KiBoIGlzIGNvbnRhaW5lZCBpbiBbMCwgMV0gb3IgWzAsIDM2MF0gYW5kIHMgYW5kIGwgYXJlIGNvbnRhaW5lZCBbMCwgMV0gb3IgWzAsIDEwMF1cbiAqICpSZXR1cm5zOiogeyByLCBnLCBiIH0gaW4gdGhlIHNldCBbMCwgMjU1XVxuICovXG5mdW5jdGlvbiBoc2xUb1JnYihoLCBzLCBsKSB7XG4gICAgbGV0IHI7XG4gICAgbGV0IGc7XG4gICAgbGV0IGI7XG4gICAgaCA9IGJvdW5kMDEoaCwgMzYwKTtcbiAgICBzID0gYm91bmQwMShzLCAxMDApO1xuICAgIGwgPSBib3VuZDAxKGwsIDEwMCk7XG4gICAgZnVuY3Rpb24gaHVlMnJnYihwLCBxLCB0KSB7XG4gICAgICAgIGlmICh0IDwgMClcbiAgICAgICAgICAgIHQgKz0gMTtcbiAgICAgICAgaWYgKHQgPiAxKVxuICAgICAgICAgICAgdCAtPSAxO1xuICAgICAgICBpZiAodCA8IDEgLyA2KSB7XG4gICAgICAgICAgICByZXR1cm4gcCArIChxIC0gcCkgKiA2ICogdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodCA8IDEgLyAyKSB7XG4gICAgICAgICAgICByZXR1cm4gcTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodCA8IDIgLyAzKSB7XG4gICAgICAgICAgICByZXR1cm4gcCArIChxIC0gcCkgKiAoMiAvIDMgLSB0KSAqIDY7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIGlmIChzID09PSAwKSB7XG4gICAgICAgIHIgPSBnID0gYiA9IGw7IC8vIGFjaHJvbWF0aWNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IHEgPSBsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICAgICAgICBjb25zdCBwID0gMiAqIGwgLSBxO1xuICAgICAgICByID0gaHVlMnJnYihwLCBxLCBoICsgMSAvIDMpO1xuICAgICAgICBnID0gaHVlMnJnYihwLCBxLCBoKTtcbiAgICAgICAgYiA9IGh1ZTJyZ2IocCwgcSwgaCAtIDEgLyAzKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgcjogciAqIDI1NSwgZzogZyAqIDI1NSwgYjogYiAqIDI1NSB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSR0IgY29sb3IgdmFsdWUgdG8gSFNWXG4gKlxuICogKkFzc3VtZXM6KiByLCBnLCBhbmQgYiBhcmUgY29udGFpbmVkIGluIHRoZSBzZXQgWzAsIDI1NV0gb3IgWzAsIDFdXG4gKiAqUmV0dXJuczoqIHsgaCwgcywgdiB9IGluIFswLDFdXG4gKi9cbmZ1bmN0aW9uIHJnYlRvSHN2KHIsIGcsIGIpIHtcbiAgICByID0gYm91bmQwMShyLCAyNTUpO1xuICAgIGcgPSBib3VuZDAxKGcsIDI1NSk7XG4gICAgYiA9IGJvdW5kMDEoYiwgMjU1KTtcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICBjb25zdCBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICBsZXQgaCA9IDA7XG4gICAgY29uc3QgdiA9IG1heDtcbiAgICBjb25zdCBkID0gbWF4IC0gbWluO1xuICAgIGNvbnN0IHMgPSBtYXggPT09IDAgPyAwIDogZCAvIG1heDtcbiAgICBpZiAobWF4ID09PSBtaW4pIHtcbiAgICAgICAgaCA9IDA7IC8vIGFjaHJvbWF0aWNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHN3aXRjaCAobWF4KSB7XG4gICAgICAgICAgICBjYXNlIHI6XG4gICAgICAgICAgICAgICAgaCA9IChnIC0gYikgLyBkICsgKGcgPCBiID8gNiA6IDApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgICAgIGggPSAoYiAtIHIpIC8gZCArIDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGI6XG4gICAgICAgICAgICAgICAgaCA9IChyIC0gZykgLyBkICsgNDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBoIC89IDY7XG4gICAgfVxuICAgIHJldHVybiB7IGg6IGgsIHM6IHMsIHY6IHYgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gSFNWIGNvbG9yIHZhbHVlIHRvIFJHQi5cbiAqXG4gKiAqQXNzdW1lczoqIGggaXMgY29udGFpbmVkIGluIFswLCAxXSBvciBbMCwgMzYwXSBhbmQgcyBhbmQgdiBhcmUgY29udGFpbmVkIGluIFswLCAxXSBvciBbMCwgMTAwXVxuICogKlJldHVybnM6KiB7IHIsIGcsIGIgfSBpbiB0aGUgc2V0IFswLCAyNTVdXG4gKi9cbmZ1bmN0aW9uIGhzdlRvUmdiKGgsIHMsIHYpIHtcbiAgICBoID0gYm91bmQwMShoLCAzNjApICogNjtcbiAgICBzID0gYm91bmQwMShzLCAxMDApO1xuICAgIHYgPSBib3VuZDAxKHYsIDEwMCk7XG4gICAgY29uc3QgaSA9IE1hdGguZmxvb3IoaCk7XG4gICAgY29uc3QgZiA9IGggLSBpO1xuICAgIGNvbnN0IHAgPSB2ICogKDEgLSBzKTtcbiAgICBjb25zdCBxID0gdiAqICgxIC0gZiAqIHMpO1xuICAgIGNvbnN0IHQgPSB2ICogKDEgLSAoMSAtIGYpICogcyk7XG4gICAgY29uc3QgbW9kID0gaSAlIDY7XG4gICAgY29uc3QgciA9IFt2LCBxLCBwLCBwLCB0LCB2XVttb2RdO1xuICAgIGNvbnN0IGcgPSBbdCwgdiwgdiwgcSwgcCwgcF1bbW9kXTtcbiAgICBjb25zdCBiID0gW3AsIHAsIHQsIHYsIHYsIHFdW21vZF07XG4gICAgcmV0dXJuIHsgcjogciAqIDI1NSwgZzogZyAqIDI1NSwgYjogYiAqIDI1NSB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSR0IgY29sb3IgdG8gaGV4XG4gKlxuICogQXNzdW1lcyByLCBnLCBhbmQgYiBhcmUgY29udGFpbmVkIGluIHRoZSBzZXQgWzAsIDI1NV1cbiAqIFJldHVybnMgYSAzIG9yIDYgY2hhcmFjdGVyIGhleFxuICovXG5mdW5jdGlvbiByZ2JUb0hleChyLCBnLCBiLCBhbGxvdzNDaGFyKSB7XG4gICAgY29uc3QgaGV4ID0gW1xuICAgICAgICBwYWQyKE1hdGgucm91bmQocikudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGcpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChiKS50b1N0cmluZygxNikpLFxuICAgIF07XG4gICAgLy8gUmV0dXJuIGEgMyBjaGFyYWN0ZXIgaGV4IGlmIHBvc3NpYmxlXG4gICAgaWYgKGFsbG93M0NoYXIgJiZcbiAgICAgICAgaGV4WzBdLmNoYXJBdCgwKSA9PT0gaGV4WzBdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbMV0uY2hhckF0KDApID09PSBoZXhbMV0uY2hhckF0KDEpICYmXG4gICAgICAgIGhleFsyXS5jaGFyQXQoMCkgPT09IGhleFsyXS5jaGFyQXQoMSkpIHtcbiAgICAgICAgcmV0dXJuIGhleFswXS5jaGFyQXQoMCkgKyBoZXhbMV0uY2hhckF0KDApICsgaGV4WzJdLmNoYXJBdCgwKTtcbiAgICB9XG4gICAgcmV0dXJuIGhleC5qb2luKCcnKTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCQSBjb2xvciBwbHVzIGFscGhhIHRyYW5zcGFyZW5jeSB0byBoZXhcbiAqXG4gKiBBc3N1bWVzIHIsIGcsIGIgYXJlIGNvbnRhaW5lZCBpbiB0aGUgc2V0IFswLCAyNTVdIGFuZFxuICogYSBpbiBbMCwgMV0uIFJldHVybnMgYSA0IG9yIDggY2hhcmFjdGVyIHJnYmEgaGV4XG4gKi9cbmZ1bmN0aW9uIHJnYmFUb0hleChyLCBnLCBiLCBhLCBhbGxvdzRDaGFyKSB7XG4gICAgY29uc3QgaGV4ID0gW1xuICAgICAgICBwYWQyKE1hdGgucm91bmQocikudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGcpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChiKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKGNvbnZlcnREZWNpbWFsVG9IZXgoYSkpLFxuICAgIF07XG4gICAgLy8gUmV0dXJuIGEgNCBjaGFyYWN0ZXIgaGV4IGlmIHBvc3NpYmxlXG4gICAgaWYgKGFsbG93NENoYXIgJiZcbiAgICAgICAgaGV4WzBdLmNoYXJBdCgwKSA9PT0gaGV4WzBdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbMV0uY2hhckF0KDApID09PSBoZXhbMV0uY2hhckF0KDEpICYmXG4gICAgICAgIGhleFsyXS5jaGFyQXQoMCkgPT09IGhleFsyXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzNdLmNoYXJBdCgwKSA9PT0gaGV4WzNdLmNoYXJBdCgxKSkge1xuICAgICAgICByZXR1cm4gaGV4WzBdLmNoYXJBdCgwKSArIGhleFsxXS5jaGFyQXQoMCkgKyBoZXhbMl0uY2hhckF0KDApICsgaGV4WzNdLmNoYXJBdCgwKTtcbiAgICB9XG4gICAgcmV0dXJuIGhleC5qb2luKCcnKTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCQSBjb2xvciB0byBhbiBBUkdCIEhleDggc3RyaW5nXG4gKiBSYXJlbHkgdXNlZCwgYnV0IHJlcXVpcmVkIGZvciBcInRvRmlsdGVyKClcIlxuICovXG5mdW5jdGlvbiByZ2JhVG9BcmdiSGV4KHIsIGcsIGIsIGEpIHtcbiAgICBjb25zdCBoZXggPSBbXG4gICAgICAgIHBhZDIoY29udmVydERlY2ltYWxUb0hleChhKSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChyKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoZykudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGIpLnRvU3RyaW5nKDE2KSksXG4gICAgXTtcbiAgICByZXR1cm4gaGV4LmpvaW4oJycpO1xufVxuLyoqIENvbnZlcnRzIGEgZGVjaW1hbCB0byBhIGhleCB2YWx1ZSAqL1xuZnVuY3Rpb24gY29udmVydERlY2ltYWxUb0hleChkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQocGFyc2VGbG9hdChkKSAqIDI1NSkudG9TdHJpbmcoMTYpO1xufVxuLyoqIENvbnZlcnRzIGEgaGV4IHZhbHVlIHRvIGEgZGVjaW1hbCAqL1xuZnVuY3Rpb24gY29udmVydEhleFRvRGVjaW1hbChoKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50RnJvbUhleChoKSAvIDI1NTtcbn1cbi8qKiBQYXJzZSBhIGJhc2UtMTYgaGV4IHZhbHVlIGludG8gYSBiYXNlLTEwIGludGVnZXIgKi9cbmZ1bmN0aW9uIHBhcnNlSW50RnJvbUhleCh2YWwpIHtcbiAgICByZXR1cm4gcGFyc2VJbnQodmFsLCAxNik7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iYWhhbWFzMTAvY3NzLWNvbG9yLW5hbWVzL2Jsb2IvbWFzdGVyL2Nzcy1jb2xvci1uYW1lcy5qc29uXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuY29uc3QgbmFtZXMgPSB7XG4gICAgYWxpY2VibHVlOiAnI2YwZjhmZicsXG4gICAgYW50aXF1ZXdoaXRlOiAnI2ZhZWJkNycsXG4gICAgYXF1YTogJyMwMGZmZmYnLFxuICAgIGFxdWFtYXJpbmU6ICcjN2ZmZmQ0JyxcbiAgICBhenVyZTogJyNmMGZmZmYnLFxuICAgIGJlaWdlOiAnI2Y1ZjVkYycsXG4gICAgYmlzcXVlOiAnI2ZmZTRjNCcsXG4gICAgYmxhY2s6ICcjMDAwMDAwJyxcbiAgICBibGFuY2hlZGFsbW9uZDogJyNmZmViY2QnLFxuICAgIGJsdWU6ICcjMDAwMGZmJyxcbiAgICBibHVldmlvbGV0OiAnIzhhMmJlMicsXG4gICAgYnJvd246ICcjYTUyYTJhJyxcbiAgICBidXJseXdvb2Q6ICcjZGViODg3JyxcbiAgICBjYWRldGJsdWU6ICcjNWY5ZWEwJyxcbiAgICBjaGFydHJldXNlOiAnIzdmZmYwMCcsXG4gICAgY2hvY29sYXRlOiAnI2QyNjkxZScsXG4gICAgY29yYWw6ICcjZmY3ZjUwJyxcbiAgICBjb3JuZmxvd2VyYmx1ZTogJyM2NDk1ZWQnLFxuICAgIGNvcm5zaWxrOiAnI2ZmZjhkYycsXG4gICAgY3JpbXNvbjogJyNkYzE0M2MnLFxuICAgIGN5YW46ICcjMDBmZmZmJyxcbiAgICBkYXJrYmx1ZTogJyMwMDAwOGInLFxuICAgIGRhcmtjeWFuOiAnIzAwOGI4YicsXG4gICAgZGFya2dvbGRlbnJvZDogJyNiODg2MGInLFxuICAgIGRhcmtncmF5OiAnI2E5YTlhOScsXG4gICAgZGFya2dyZWVuOiAnIzAwNjQwMCcsXG4gICAgZGFya2dyZXk6ICcjYTlhOWE5JyxcbiAgICBkYXJra2hha2k6ICcjYmRiNzZiJyxcbiAgICBkYXJrbWFnZW50YTogJyM4YjAwOGInLFxuICAgIGRhcmtvbGl2ZWdyZWVuOiAnIzU1NmIyZicsXG4gICAgZGFya29yYW5nZTogJyNmZjhjMDAnLFxuICAgIGRhcmtvcmNoaWQ6ICcjOTkzMmNjJyxcbiAgICBkYXJrcmVkOiAnIzhiMDAwMCcsXG4gICAgZGFya3NhbG1vbjogJyNlOTk2N2EnLFxuICAgIGRhcmtzZWFncmVlbjogJyM4ZmJjOGYnLFxuICAgIGRhcmtzbGF0ZWJsdWU6ICcjNDgzZDhiJyxcbiAgICBkYXJrc2xhdGVncmF5OiAnIzJmNGY0ZicsXG4gICAgZGFya3NsYXRlZ3JleTogJyMyZjRmNGYnLFxuICAgIGRhcmt0dXJxdW9pc2U6ICcjMDBjZWQxJyxcbiAgICBkYXJrdmlvbGV0OiAnIzk0MDBkMycsXG4gICAgZGVlcHBpbms6ICcjZmYxNDkzJyxcbiAgICBkZWVwc2t5Ymx1ZTogJyMwMGJmZmYnLFxuICAgIGRpbWdyYXk6ICcjNjk2OTY5JyxcbiAgICBkaW1ncmV5OiAnIzY5Njk2OScsXG4gICAgZG9kZ2VyYmx1ZTogJyMxZTkwZmYnLFxuICAgIGZpcmVicmljazogJyNiMjIyMjInLFxuICAgIGZsb3JhbHdoaXRlOiAnI2ZmZmFmMCcsXG4gICAgZm9yZXN0Z3JlZW46ICcjMjI4YjIyJyxcbiAgICBmdWNoc2lhOiAnI2ZmMDBmZicsXG4gICAgZ2FpbnNib3JvOiAnI2RjZGNkYycsXG4gICAgZ2hvc3R3aGl0ZTogJyNmOGY4ZmYnLFxuICAgIGdvbGQ6ICcjZmZkNzAwJyxcbiAgICBnb2xkZW5yb2Q6ICcjZGFhNTIwJyxcbiAgICBncmF5OiAnIzgwODA4MCcsXG4gICAgZ3JlZW46ICcjMDA4MDAwJyxcbiAgICBncmVlbnllbGxvdzogJyNhZGZmMmYnLFxuICAgIGdyZXk6ICcjODA4MDgwJyxcbiAgICBob25leWRldzogJyNmMGZmZjAnLFxuICAgIGhvdHBpbms6ICcjZmY2OWI0JyxcbiAgICBpbmRpYW5yZWQ6ICcjY2Q1YzVjJyxcbiAgICBpbmRpZ286ICcjNGIwMDgyJyxcbiAgICBpdm9yeTogJyNmZmZmZjAnLFxuICAgIGtoYWtpOiAnI2YwZTY4YycsXG4gICAgbGF2ZW5kZXI6ICcjZTZlNmZhJyxcbiAgICBsYXZlbmRlcmJsdXNoOiAnI2ZmZjBmNScsXG4gICAgbGF3bmdyZWVuOiAnIzdjZmMwMCcsXG4gICAgbGVtb25jaGlmZm9uOiAnI2ZmZmFjZCcsXG4gICAgbGlnaHRibHVlOiAnI2FkZDhlNicsXG4gICAgbGlnaHRjb3JhbDogJyNmMDgwODAnLFxuICAgIGxpZ2h0Y3lhbjogJyNlMGZmZmYnLFxuICAgIGxpZ2h0Z29sZGVucm9keWVsbG93OiAnI2ZhZmFkMicsXG4gICAgbGlnaHRncmF5OiAnI2QzZDNkMycsXG4gICAgbGlnaHRncmVlbjogJyM5MGVlOTAnLFxuICAgIGxpZ2h0Z3JleTogJyNkM2QzZDMnLFxuICAgIGxpZ2h0cGluazogJyNmZmI2YzEnLFxuICAgIGxpZ2h0c2FsbW9uOiAnI2ZmYTA3YScsXG4gICAgbGlnaHRzZWFncmVlbjogJyMyMGIyYWEnLFxuICAgIGxpZ2h0c2t5Ymx1ZTogJyM4N2NlZmEnLFxuICAgIGxpZ2h0c2xhdGVncmF5OiAnIzc3ODg5OScsXG4gICAgbGlnaHRzbGF0ZWdyZXk6ICcjNzc4ODk5JyxcbiAgICBsaWdodHN0ZWVsYmx1ZTogJyNiMGM0ZGUnLFxuICAgIGxpZ2h0eWVsbG93OiAnI2ZmZmZlMCcsXG4gICAgbGltZTogJyMwMGZmMDAnLFxuICAgIGxpbWVncmVlbjogJyMzMmNkMzInLFxuICAgIGxpbmVuOiAnI2ZhZjBlNicsXG4gICAgbWFnZW50YTogJyNmZjAwZmYnLFxuICAgIG1hcm9vbjogJyM4MDAwMDAnLFxuICAgIG1lZGl1bWFxdWFtYXJpbmU6ICcjNjZjZGFhJyxcbiAgICBtZWRpdW1ibHVlOiAnIzAwMDBjZCcsXG4gICAgbWVkaXVtb3JjaGlkOiAnI2JhNTVkMycsXG4gICAgbWVkaXVtcHVycGxlOiAnIzkzNzBkYicsXG4gICAgbWVkaXVtc2VhZ3JlZW46ICcjM2NiMzcxJyxcbiAgICBtZWRpdW1zbGF0ZWJsdWU6ICcjN2I2OGVlJyxcbiAgICBtZWRpdW1zcHJpbmdncmVlbjogJyMwMGZhOWEnLFxuICAgIG1lZGl1bXR1cnF1b2lzZTogJyM0OGQxY2MnLFxuICAgIG1lZGl1bXZpb2xldHJlZDogJyNjNzE1ODUnLFxuICAgIG1pZG5pZ2h0Ymx1ZTogJyMxOTE5NzAnLFxuICAgIG1pbnRjcmVhbTogJyNmNWZmZmEnLFxuICAgIG1pc3R5cm9zZTogJyNmZmU0ZTEnLFxuICAgIG1vY2Nhc2luOiAnI2ZmZTRiNScsXG4gICAgbmF2YWpvd2hpdGU6ICcjZmZkZWFkJyxcbiAgICBuYXZ5OiAnIzAwMDA4MCcsXG4gICAgb2xkbGFjZTogJyNmZGY1ZTYnLFxuICAgIG9saXZlOiAnIzgwODAwMCcsXG4gICAgb2xpdmVkcmFiOiAnIzZiOGUyMycsXG4gICAgb3JhbmdlOiAnI2ZmYTUwMCcsXG4gICAgb3JhbmdlcmVkOiAnI2ZmNDUwMCcsXG4gICAgb3JjaGlkOiAnI2RhNzBkNicsXG4gICAgcGFsZWdvbGRlbnJvZDogJyNlZWU4YWEnLFxuICAgIHBhbGVncmVlbjogJyM5OGZiOTgnLFxuICAgIHBhbGV0dXJxdW9pc2U6ICcjYWZlZWVlJyxcbiAgICBwYWxldmlvbGV0cmVkOiAnI2RiNzA5MycsXG4gICAgcGFwYXlhd2hpcDogJyNmZmVmZDUnLFxuICAgIHBlYWNocHVmZjogJyNmZmRhYjknLFxuICAgIHBlcnU6ICcjY2Q4NTNmJyxcbiAgICBwaW5rOiAnI2ZmYzBjYicsXG4gICAgcGx1bTogJyNkZGEwZGQnLFxuICAgIHBvd2RlcmJsdWU6ICcjYjBlMGU2JyxcbiAgICBwdXJwbGU6ICcjODAwMDgwJyxcbiAgICByZWJlY2NhcHVycGxlOiAnIzY2MzM5OScsXG4gICAgcmVkOiAnI2ZmMDAwMCcsXG4gICAgcm9zeWJyb3duOiAnI2JjOGY4ZicsXG4gICAgcm95YWxibHVlOiAnIzQxNjllMScsXG4gICAgc2FkZGxlYnJvd246ICcjOGI0NTEzJyxcbiAgICBzYWxtb246ICcjZmE4MDcyJyxcbiAgICBzYW5keWJyb3duOiAnI2Y0YTQ2MCcsXG4gICAgc2VhZ3JlZW46ICcjMmU4YjU3JyxcbiAgICBzZWFzaGVsbDogJyNmZmY1ZWUnLFxuICAgIHNpZW5uYTogJyNhMDUyMmQnLFxuICAgIHNpbHZlcjogJyNjMGMwYzAnLFxuICAgIHNreWJsdWU6ICcjODdjZWViJyxcbiAgICBzbGF0ZWJsdWU6ICcjNmE1YWNkJyxcbiAgICBzbGF0ZWdyYXk6ICcjNzA4MDkwJyxcbiAgICBzbGF0ZWdyZXk6ICcjNzA4MDkwJyxcbiAgICBzbm93OiAnI2ZmZmFmYScsXG4gICAgc3ByaW5nZ3JlZW46ICcjMDBmZjdmJyxcbiAgICBzdGVlbGJsdWU6ICcjNDY4MmI0JyxcbiAgICB0YW46ICcjZDJiNDhjJyxcbiAgICB0ZWFsOiAnIzAwODA4MCcsXG4gICAgdGhpc3RsZTogJyNkOGJmZDgnLFxuICAgIHRvbWF0bzogJyNmZjYzNDcnLFxuICAgIHR1cnF1b2lzZTogJyM0MGUwZDAnLFxuICAgIHZpb2xldDogJyNlZTgyZWUnLFxuICAgIHdoZWF0OiAnI2Y1ZGViMycsXG4gICAgd2hpdGU6ICcjZmZmZmZmJyxcbiAgICB3aGl0ZXNtb2tlOiAnI2Y1ZjVmNScsXG4gICAgeWVsbG93OiAnI2ZmZmYwMCcsXG4gICAgeWVsbG93Z3JlZW46ICcjOWFjZDMyJyxcbn07XG5cbi8qKlxuICogR2l2ZW4gYSBzdHJpbmcgb3Igb2JqZWN0LCBjb252ZXJ0IHRoYXQgaW5wdXQgdG8gUkdCXG4gKlxuICogUG9zc2libGUgc3RyaW5nIGlucHV0czpcbiAqIGBgYFxuICogXCJyZWRcIlxuICogXCIjZjAwXCIgb3IgXCJmMDBcIlxuICogXCIjZmYwMDAwXCIgb3IgXCJmZjAwMDBcIlxuICogXCIjZmYwMDAwMDBcIiBvciBcImZmMDAwMDAwXCJcbiAqIFwicmdiIDI1NSAwIDBcIiBvciBcInJnYiAoMjU1LCAwLCAwKVwiXG4gKiBcInJnYiAxLjAgMCAwXCIgb3IgXCJyZ2IgKDEsIDAsIDApXCJcbiAqIFwicmdiYSAoMjU1LCAwLCAwLCAxKVwiIG9yIFwicmdiYSAyNTUsIDAsIDAsIDFcIlxuICogXCJyZ2JhICgxLjAsIDAsIDAsIDEpXCIgb3IgXCJyZ2JhIDEuMCwgMCwgMCwgMVwiXG4gKiBcImhzbCgwLCAxMDAlLCA1MCUpXCIgb3IgXCJoc2wgMCAxMDAlIDUwJVwiXG4gKiBcImhzbGEoMCwgMTAwJSwgNTAlLCAxKVwiIG9yIFwiaHNsYSAwIDEwMCUgNTAlLCAxXCJcbiAqIFwiaHN2KDAsIDEwMCUsIDEwMCUpXCIgb3IgXCJoc3YgMCAxMDAlIDEwMCVcIlxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIGlucHV0VG9SR0IoY29sb3IpIHtcbiAgICBsZXQgcmdiID0geyByOiAwLCBnOiAwLCBiOiAwIH07XG4gICAgbGV0IGEgPSAxO1xuICAgIGxldCBzID0gbnVsbDtcbiAgICBsZXQgdiA9IG51bGw7XG4gICAgbGV0IGwgPSBudWxsO1xuICAgIGxldCBvayA9IGZhbHNlO1xuICAgIGxldCBmb3JtYXQgPSBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGNvbG9yID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb2xvciA9IHN0cmluZ0lucHV0VG9PYmplY3QoY29sb3IpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGNvbG9yID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoaXNWYWxpZENTU1VuaXQoY29sb3IucikgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IuZykgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IuYikpIHtcbiAgICAgICAgICAgIHJnYiA9IHJnYlRvUmdiKGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpO1xuICAgICAgICAgICAgb2sgPSB0cnVlO1xuICAgICAgICAgICAgZm9ybWF0ID0gU3RyaW5nKGNvbG9yLnIpLnN1YnN0cigtMSkgPT09ICclJyA/ICdwcmdiJyA6ICdyZ2InO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzVmFsaWRDU1NVbml0KGNvbG9yLmgpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLnMpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLnYpKSB7XG4gICAgICAgICAgICBzID0gY29udmVydFRvUGVyY2VudGFnZShjb2xvci5zKTtcbiAgICAgICAgICAgIHYgPSBjb252ZXJ0VG9QZXJjZW50YWdlKGNvbG9yLnYpO1xuICAgICAgICAgICAgcmdiID0gaHN2VG9SZ2IoY29sb3IuaCwgcywgdik7XG4gICAgICAgICAgICBvayA9IHRydWU7XG4gICAgICAgICAgICBmb3JtYXQgPSAnaHN2JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1ZhbGlkQ1NTVW5pdChjb2xvci5oKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci5zKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci5sKSkge1xuICAgICAgICAgICAgcyA9IGNvbnZlcnRUb1BlcmNlbnRhZ2UoY29sb3Iucyk7XG4gICAgICAgICAgICBsID0gY29udmVydFRvUGVyY2VudGFnZShjb2xvci5sKTtcbiAgICAgICAgICAgIHJnYiA9IGhzbFRvUmdiKGNvbG9yLmgsIHMsIGwpO1xuICAgICAgICAgICAgb2sgPSB0cnVlO1xuICAgICAgICAgICAgZm9ybWF0ID0gJ2hzbCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbG9yLmhhc093blByb3BlcnR5KCdhJykpIHtcbiAgICAgICAgICAgIGEgPSBjb2xvci5hO1xuICAgICAgICB9XG4gICAgfVxuICAgIGEgPSBib3VuZEFscGhhKGEpO1xuICAgIHJldHVybiB7XG4gICAgICAgIG9rLFxuICAgICAgICBmb3JtYXQ6IGNvbG9yLmZvcm1hdCB8fCBmb3JtYXQsXG4gICAgICAgIHI6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgocmdiLnIsIDApKSxcbiAgICAgICAgZzogTWF0aC5taW4oMjU1LCBNYXRoLm1heChyZ2IuZywgMCkpLFxuICAgICAgICBiOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KHJnYi5iLCAwKSksXG4gICAgICAgIGEsXG4gICAgfTtcbn1cbi8vIDxodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXZhbHVlcy8jaW50ZWdlcnM+XG5jb25zdCBDU1NfSU5URUdFUiA9ICdbLVxcXFwrXT9cXFxcZCslPyc7XG4vLyA8aHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy12YWx1ZXMvI251bWJlci12YWx1ZT5cbmNvbnN0IENTU19OVU1CRVIgPSAnWy1cXFxcK10/XFxcXGQqXFxcXC5cXFxcZCslPyc7XG4vLyBBbGxvdyBwb3NpdGl2ZS9uZWdhdGl2ZSBpbnRlZ2VyL251bWJlci4gIERvbid0IGNhcHR1cmUgdGhlIGVpdGhlci9vciwganVzdCB0aGUgZW50aXJlIG91dGNvbWUuXG5jb25zdCBDU1NfVU5JVCA9IGAoPzoke0NTU19OVU1CRVJ9KXwoPzoke0NTU19JTlRFR0VSfSlgO1xuLy8gQWN0dWFsIG1hdGNoaW5nLlxuLy8gUGFyZW50aGVzZXMgYW5kIGNvbW1hcyBhcmUgb3B0aW9uYWwsIGJ1dCBub3QgcmVxdWlyZWQuXG4vLyBXaGl0ZXNwYWNlIGNhbiB0YWtlIHRoZSBwbGFjZSBvZiBjb21tYXMgb3Igb3BlbmluZyBwYXJlblxuY29uc3QgUEVSTUlTU0lWRV9NQVRDSDMgPSBgW1xcXFxzfFxcXFwoXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlbLHxcXFxcc10rKCR7Q1NTX1VOSVR9KVxcXFxzKlxcXFwpP2A7XG5jb25zdCBQRVJNSVNTSVZFX01BVENINCA9IGBbXFxcXHN8XFxcXChdKygke0NTU19VTklUfSlbLHxcXFxcc10rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlcXFxccypcXFxcKT9gO1xuY29uc3QgbWF0Y2hlcnMgPSB7XG4gICAgQ1NTX1VOSVQ6IG5ldyBSZWdFeHAoQ1NTX1VOSVQpLFxuICAgIHJnYjogbmV3IFJlZ0V4cCgncmdiJyArIFBFUk1JU1NJVkVfTUFUQ0gzKSxcbiAgICByZ2JhOiBuZXcgUmVnRXhwKCdyZ2JhJyArIFBFUk1JU1NJVkVfTUFUQ0g0KSxcbiAgICBoc2w6IG5ldyBSZWdFeHAoJ2hzbCcgKyBQRVJNSVNTSVZFX01BVENIMyksXG4gICAgaHNsYTogbmV3IFJlZ0V4cCgnaHNsYScgKyBQRVJNSVNTSVZFX01BVENINCksXG4gICAgaHN2OiBuZXcgUmVnRXhwKCdoc3YnICsgUEVSTUlTU0lWRV9NQVRDSDMpLFxuICAgIGhzdmE6IG5ldyBSZWdFeHAoJ2hzdmEnICsgUEVSTUlTU0lWRV9NQVRDSDQpLFxuICAgIGhleDM6IC9eIz8oWzAtOWEtZkEtRl17MX0pKFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkkLyxcbiAgICBoZXg2OiAvXiM/KFswLTlhLWZBLUZdezJ9KShbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pJC8sXG4gICAgaGV4NDogL14jPyhbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pKFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkkLyxcbiAgICBoZXg4OiAvXiM/KFswLTlhLWZBLUZdezJ9KShbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KSQvLFxufTtcbi8qKlxuICogUGVybWlzc2l2ZSBzdHJpbmcgcGFyc2luZy4gIFRha2UgaW4gYSBudW1iZXIgb2YgZm9ybWF0cywgYW5kIG91dHB1dCBhbiBvYmplY3RcbiAqIGJhc2VkIG9uIGRldGVjdGVkIGZvcm1hdC4gIFJldHVybnMgYHsgciwgZywgYiB9YCBvciBgeyBoLCBzLCBsIH1gIG9yIGB7IGgsIHMsIHZ9YFxuICovXG5mdW5jdGlvbiBzdHJpbmdJbnB1dFRvT2JqZWN0KGNvbG9yKSB7XG4gICAgY29sb3IgPSBjb2xvci50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY29sb3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgbGV0IG5hbWVkID0gZmFsc2U7XG4gICAgaWYgKG5hbWVzW2NvbG9yXSkge1xuICAgICAgICBjb2xvciA9IG5hbWVzW2NvbG9yXTtcbiAgICAgICAgbmFtZWQgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChjb2xvciA9PT0gJ3RyYW5zcGFyZW50Jykge1xuICAgICAgICByZXR1cm4geyByOiAwLCBnOiAwLCBiOiAwLCBhOiAwLCBmb3JtYXQ6ICduYW1lJyB9O1xuICAgIH1cbiAgICAvLyBUcnkgdG8gbWF0Y2ggc3RyaW5nIGlucHV0IHVzaW5nIHJlZ3VsYXIgZXhwcmVzc2lvbnMuXG4gICAgLy8gS2VlcCBtb3N0IG9mIHRoZSBudW1iZXIgYm91bmRpbmcgb3V0IG9mIHRoaXMgZnVuY3Rpb24gLSBkb24ndCB3b3JyeSBhYm91dCBbMCwxXSBvciBbMCwxMDBdIG9yIFswLDM2MF1cbiAgICAvLyBKdXN0IHJldHVybiBhbiBvYmplY3QgYW5kIGxldCB0aGUgY29udmVyc2lvbiBmdW5jdGlvbnMgaGFuZGxlIHRoYXQuXG4gICAgLy8gVGhpcyB3YXkgdGhlIHJlc3VsdCB3aWxsIGJlIHRoZSBzYW1lIHdoZXRoZXIgdGhlIHRpbnljb2xvciBpcyBpbml0aWFsaXplZCB3aXRoIHN0cmluZyBvciBvYmplY3QuXG4gICAgbGV0IG1hdGNoID0gbWF0Y2hlcnMucmdiLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyByOiBtYXRjaFsxXSwgZzogbWF0Y2hbMl0sIGI6IG1hdGNoWzNdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMucmdiYS5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgcjogbWF0Y2hbMV0sIGc6IG1hdGNoWzJdLCBiOiBtYXRjaFszXSwgYTogbWF0Y2hbNF0gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oc2wuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IGg6IG1hdGNoWzFdLCBzOiBtYXRjaFsyXSwgbDogbWF0Y2hbM10gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oc2xhLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyBoOiBtYXRjaFsxXSwgczogbWF0Y2hbMl0sIGw6IG1hdGNoWzNdLCBhOiBtYXRjaFs0XSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhzdi5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgaDogbWF0Y2hbMV0sIHM6IG1hdGNoWzJdLCB2OiBtYXRjaFszXSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhzdmEuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IGg6IG1hdGNoWzFdLCBzOiBtYXRjaFsyXSwgdjogbWF0Y2hbM10sIGE6IG1hdGNoWzRdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaGV4OC5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50RnJvbUhleChtYXRjaFsxXSksXG4gICAgICAgICAgICBnOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMl0pLFxuICAgICAgICAgICAgYjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzNdKSxcbiAgICAgICAgICAgIGE6IGNvbnZlcnRIZXhUb0RlY2ltYWwobWF0Y2hbNF0pLFxuICAgICAgICAgICAgZm9ybWF0OiBuYW1lZCA/ICduYW1lJyA6ICdoZXg4JyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oZXg2LmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGc6IHBhcnNlSW50RnJvbUhleChtYXRjaFsyXSksXG4gICAgICAgICAgICBiOiBwYXJzZUludEZyb21IZXgobWF0Y2hbM10pLFxuICAgICAgICAgICAgZm9ybWF0OiBuYW1lZCA/ICduYW1lJyA6ICdoZXgnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhleDQuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMV0gKyBtYXRjaFsxXSksXG4gICAgICAgICAgICBnOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMl0gKyBtYXRjaFsyXSksXG4gICAgICAgICAgICBiOiBwYXJzZUludEZyb21IZXgobWF0Y2hbM10gKyBtYXRjaFszXSksXG4gICAgICAgICAgICBhOiBjb252ZXJ0SGV4VG9EZWNpbWFsKG1hdGNoWzRdICsgbWF0Y2hbNF0pLFxuICAgICAgICAgICAgZm9ybWF0OiBuYW1lZCA/ICduYW1lJyA6ICdoZXg4JyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oZXgzLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzFdICsgbWF0Y2hbMV0pLFxuICAgICAgICAgICAgZzogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzJdICsgbWF0Y2hbMl0pLFxuICAgICAgICAgICAgYjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzNdICsgbWF0Y2hbM10pLFxuICAgICAgICAgICAgZm9ybWF0OiBuYW1lZCA/ICduYW1lJyA6ICdoZXgnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiBpdCBsb29rcyBsaWtlIGEgQ1NTIHVuaXRcbiAqIChzZWUgYG1hdGNoZXJzYCBhYm92ZSBmb3IgZGVmaW5pdGlvbikuXG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRDU1NVbml0KGNvbG9yKSB7XG4gICAgcmV0dXJuICEhbWF0Y2hlcnMuQ1NTX1VOSVQuZXhlYyhTdHJpbmcoY29sb3IpKTtcbn1cblxuY2xhc3MgVGlueUNvbG9yIHtcbiAgICBjb25zdHJ1Y3Rvcihjb2xvciA9ICcnLCBvcHRzID0ge30pIHtcbiAgICAgICAgLy8gSWYgaW5wdXQgaXMgYWxyZWFkeSBhIHRpbnljb2xvciwgcmV0dXJuIGl0c2VsZlxuICAgICAgICBpZiAoY29sb3IgaW5zdGFuY2VvZiBUaW55Q29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9yaWdpbmFsSW5wdXQgPSBjb2xvcjtcbiAgICAgICAgY29uc3QgcmdiID0gaW5wdXRUb1JHQihjb2xvcik7XG4gICAgICAgIHRoaXMub3JpZ2luYWxJbnB1dCA9IGNvbG9yO1xuICAgICAgICB0aGlzLnIgPSByZ2IucjtcbiAgICAgICAgdGhpcy5nID0gcmdiLmc7XG4gICAgICAgIHRoaXMuYiA9IHJnYi5iO1xuICAgICAgICB0aGlzLmEgPSByZ2IuYTtcbiAgICAgICAgdGhpcy5yb3VuZEEgPSBNYXRoLnJvdW5kKDEwMCAqIHRoaXMuYSkgLyAxMDA7XG4gICAgICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgcmdiLmZvcm1hdDtcbiAgICAgICAgdGhpcy5ncmFkaWVudFR5cGUgPSBvcHRzLmdyYWRpZW50VHlwZTtcbiAgICAgICAgLy8gRG9uJ3QgbGV0IHRoZSByYW5nZSBvZiBbMCwyNTVdIGNvbWUgYmFjayBpbiBbMCwxXS5cbiAgICAgICAgLy8gUG90ZW50aWFsbHkgbG9zZSBhIGxpdHRsZSBiaXQgb2YgcHJlY2lzaW9uIGhlcmUsIGJ1dCB3aWxsIGZpeCBpc3N1ZXMgd2hlcmVcbiAgICAgICAgLy8gLjUgZ2V0cyBpbnRlcnByZXRlZCBhcyBoYWxmIG9mIHRoZSB0b3RhbCwgaW5zdGVhZCBvZiBoYWxmIG9mIDFcbiAgICAgICAgLy8gSWYgaXQgd2FzIHN1cHBvc2VkIHRvIGJlIDEyOCwgdGhpcyB3YXMgYWxyZWFkeSB0YWtlbiBjYXJlIG9mIGJ5IGBpbnB1dFRvUmdiYFxuICAgICAgICBpZiAodGhpcy5yIDwgMSkge1xuICAgICAgICAgICAgdGhpcy5yID0gTWF0aC5yb3VuZCh0aGlzLnIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmcgPCAxKSB7XG4gICAgICAgICAgICB0aGlzLmcgPSBNYXRoLnJvdW5kKHRoaXMuZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYiA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuYiA9IE1hdGgucm91bmQodGhpcy5iKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzVmFsaWQgPSByZ2Iub2s7XG4gICAgfVxuICAgIGlzRGFyaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QnJpZ2h0bmVzcygpIDwgMTI4O1xuICAgIH1cbiAgICBpc0xpZ2h0KCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuaXNEYXJrKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBlcmNlaXZlZCBicmlnaHRuZXNzIG9mIHRoZSBjb2xvciwgZnJvbSAwLTI1NS5cbiAgICAgKi9cbiAgICBnZXRCcmlnaHRuZXNzKCkge1xuICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9BRVJUI2NvbG9yLWNvbnRyYXN0XG4gICAgICAgIGNvbnN0IHJnYiA9IHRoaXMudG9SZ2IoKTtcbiAgICAgICAgcmV0dXJuIChyZ2IuciAqIDI5OSArIHJnYi5nICogNTg3ICsgcmdiLmIgKiAxMTQpIC8gMTAwMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGVyY2VpdmVkIGx1bWluYW5jZSBvZiBhIGNvbG9yLCBmcm9tIDAtMS5cbiAgICAgKi9cbiAgICBnZXRMdW1pbmFuY2UoKSB7XG4gICAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLVdDQUcyMC0yMDA4MTIxMS8jcmVsYXRpdmVsdW1pbmFuY2VkZWZcbiAgICAgICAgY29uc3QgcmdiID0gdGhpcy50b1JnYigpO1xuICAgICAgICBsZXQgUjtcbiAgICAgICAgbGV0IEc7XG4gICAgICAgIGxldCBCO1xuICAgICAgICBjb25zdCBSc1JHQiA9IHJnYi5yIC8gMjU1O1xuICAgICAgICBjb25zdCBHc1JHQiA9IHJnYi5nIC8gMjU1O1xuICAgICAgICBjb25zdCBCc1JHQiA9IHJnYi5iIC8gMjU1O1xuICAgICAgICBpZiAoUnNSR0IgPD0gMC4wMzkyOCkge1xuICAgICAgICAgICAgUiA9IFJzUkdCIC8gMTIuOTI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBSID0gTWF0aC5wb3coKFJzUkdCICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEdzUkdCIDw9IDAuMDM5MjgpIHtcbiAgICAgICAgICAgIEcgPSBHc1JHQiAvIDEyLjkyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgRyA9IE1hdGgucG93KChHc1JHQiArIDAuMDU1KSAvIDEuMDU1LCAyLjQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChCc1JHQiA8PSAwLjAzOTI4KSB7XG4gICAgICAgICAgICBCID0gQnNSR0IgLyAxMi45MjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIEIgPSBNYXRoLnBvdygoQnNSR0IgKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMC4yMTI2ICogUiArIDAuNzE1MiAqIEcgKyAwLjA3MjIgKiBCO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBhbHBoYSB2YWx1ZSBvbiB0aGUgY3VycmVudCBjb2xvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhbHBoYSAtIFRoZSBuZXcgYWxwaGEgdmFsdWUuIFRoZSBhY2NlcHRlZCByYW5nZSBpcyAwLTEuXG4gICAgICovXG4gICAgc2V0QWxwaGEoYWxwaGEpIHtcbiAgICAgICAgdGhpcy5hID0gYm91bmRBbHBoYShhbHBoYSk7XG4gICAgICAgIHRoaXMucm91bmRBID0gTWF0aC5yb3VuZCgxMDAgKiB0aGlzLmEpIC8gMTAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb2JqZWN0IGFzIGEgSFNWQSBvYmplY3QuXG4gICAgICovXG4gICAgdG9Ic3YoKSB7XG4gICAgICAgIGNvbnN0IGhzdiA9IHJnYlRvSHN2KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgICAgICByZXR1cm4geyBoOiBoc3YuaCAqIDM2MCwgczogaHN2LnMsIHY6IGhzdi52LCBhOiB0aGlzLmEgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaHN2YSB2YWx1ZXMgaW50ZXJwb2xhdGVkIGludG8gYSBzdHJpbmcgd2l0aCB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAgICAgKiBcImhzdmEoeHh4LCB4eHgsIHh4eCwgeHgpXCIuXG4gICAgICovXG4gICAgdG9Ic3ZTdHJpbmcoKSB7XG4gICAgICAgIGNvbnN0IGhzdiA9IHJnYlRvSHN2KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgICAgICBjb25zdCBoID0gTWF0aC5yb3VuZChoc3YuaCAqIDM2MCk7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLnJvdW5kKGhzdi5zICogMTAwKTtcbiAgICAgICAgY29uc3QgdiA9IE1hdGgucm91bmQoaHN2LnYgKiAxMDApO1xuICAgICAgICByZXR1cm4gdGhpcy5hID09PSAxID8gYGhzdigke2h9LCAke3N9JSwgJHt2fSUpYCA6IGBoc3ZhKCR7aH0sICR7c30lLCAke3Z9JSwgJHt0aGlzLnJvdW5kQX0pYDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb2JqZWN0IGFzIGEgSFNMQSBvYmplY3QuXG4gICAgICovXG4gICAgdG9Ic2woKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHJnYlRvSHNsKHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgICAgICByZXR1cm4geyBoOiBoc2wuaCAqIDM2MCwgczogaHNsLnMsIGw6IGhzbC5sLCBhOiB0aGlzLmEgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaHNsYSB2YWx1ZXMgaW50ZXJwb2xhdGVkIGludG8gYSBzdHJpbmcgd2l0aCB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAgICAgKiBcImhzbGEoeHh4LCB4eHgsIHh4eCwgeHgpXCIuXG4gICAgICovXG4gICAgdG9Ic2xTdHJpbmcoKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHJnYlRvSHNsKHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xuICAgICAgICBjb25zdCBoID0gTWF0aC5yb3VuZChoc2wuaCAqIDM2MCk7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLnJvdW5kKGhzbC5zICogMTAwKTtcbiAgICAgICAgY29uc3QgbCA9IE1hdGgucm91bmQoaHNsLmwgKiAxMDApO1xuICAgICAgICByZXR1cm4gdGhpcy5hID09PSAxID8gYGhzbCgke2h9LCAke3N9JSwgJHtsfSUpYCA6IGBoc2xhKCR7aH0sICR7c30lLCAke2x9JSwgJHt0aGlzLnJvdW5kQX0pYDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaGV4IHZhbHVlIG9mIHRoZSBjb2xvci5cbiAgICAgKiBAcGFyYW0gYWxsb3czQ2hhciB3aWxsIHNob3J0ZW4gaGV4IHZhbHVlIHRvIDMgY2hhciBpZiBwb3NzaWJsZVxuICAgICAqL1xuICAgIHRvSGV4KGFsbG93M0NoYXIgPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gcmdiVG9IZXgodGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgYWxsb3czQ2hhcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhleCB2YWx1ZSBvZiB0aGUgY29sb3IgLXdpdGggYSAjIGFwcGVuZWQuXG4gICAgICogQHBhcmFtIGFsbG93M0NoYXIgd2lsbCBzaG9ydGVuIGhleCB2YWx1ZSB0byAzIGNoYXIgaWYgcG9zc2libGVcbiAgICAgKi9cbiAgICB0b0hleFN0cmluZyhhbGxvdzNDaGFyID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuICcjJyArIHRoaXMudG9IZXgoYWxsb3czQ2hhcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhleCA4IHZhbHVlIG9mIHRoZSBjb2xvci5cbiAgICAgKiBAcGFyYW0gYWxsb3c0Q2hhciB3aWxsIHNob3J0ZW4gaGV4IHZhbHVlIHRvIDQgY2hhciBpZiBwb3NzaWJsZVxuICAgICAqL1xuICAgIHRvSGV4OChhbGxvdzRDaGFyID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHJnYmFUb0hleCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCB0aGlzLmEsIGFsbG93NENoYXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZXggOCB2YWx1ZSBvZiB0aGUgY29sb3IgLXdpdGggYSAjIGFwcGVuZWQuXG4gICAgICogQHBhcmFtIGFsbG93NENoYXIgd2lsbCBzaG9ydGVuIGhleCB2YWx1ZSB0byA0IGNoYXIgaWYgcG9zc2libGVcbiAgICAgKi9cbiAgICB0b0hleDhTdHJpbmcoYWxsb3c0Q2hhciA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiAnIycgKyB0aGlzLnRvSGV4OChhbGxvdzRDaGFyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb2JqZWN0IGFzIGEgUkdCQSBvYmplY3QuXG4gICAgICovXG4gICAgdG9SZ2IoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBNYXRoLnJvdW5kKHRoaXMuciksXG4gICAgICAgICAgICBnOiBNYXRoLnJvdW5kKHRoaXMuZyksXG4gICAgICAgICAgICBiOiBNYXRoLnJvdW5kKHRoaXMuYiksXG4gICAgICAgICAgICBhOiB0aGlzLmEsXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIFJHQkEgdmFsdWVzIGludGVycG9sYXRlZCBpbnRvIGEgc3RyaW5nIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gICAgICogXCJSR0JBKHh4eCwgeHh4LCB4eHgsIHh4KVwiLlxuICAgICAqL1xuICAgIHRvUmdiU3RyaW5nKCkge1xuICAgICAgICBjb25zdCByID0gTWF0aC5yb3VuZCh0aGlzLnIpO1xuICAgICAgICBjb25zdCBnID0gTWF0aC5yb3VuZCh0aGlzLmcpO1xuICAgICAgICBjb25zdCBiID0gTWF0aC5yb3VuZCh0aGlzLmIpO1xuICAgICAgICByZXR1cm4gdGhpcy5hID09PSAxID8gYHJnYigke3J9LCAke2d9LCAke2J9KWAgOiBgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke3RoaXMucm91bmRBfSlgO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBvYmplY3QgYXMgYSBSR0JBIG9iamVjdC5cbiAgICAgKi9cbiAgICB0b1BlcmNlbnRhZ2VSZ2IoKSB7XG4gICAgICAgIGNvbnN0IGZtdCA9ICh4KSA9PiBNYXRoLnJvdW5kKGJvdW5kMDEoeCwgMjU1KSAqIDEwMCkgKyAnJSc7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBmbXQodGhpcy5yKSxcbiAgICAgICAgICAgIGc6IGZtdCh0aGlzLmcpLFxuICAgICAgICAgICAgYjogZm10KHRoaXMuYiksXG4gICAgICAgICAgICBhOiB0aGlzLmEsXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIFJHQkEgcmVsYXRpdmUgdmFsdWVzIGludGVycG9sYXRlZCBpbnRvIGEgc3RyaW5nXG4gICAgICovXG4gICAgdG9QZXJjZW50YWdlUmdiU3RyaW5nKCkge1xuICAgICAgICBjb25zdCBybmQgPSAoeCkgPT4gTWF0aC5yb3VuZChib3VuZDAxKHgsIDI1NSkgKiAxMDApO1xuICAgICAgICByZXR1cm4gdGhpcy5hID09PSAxXG4gICAgICAgICAgICA/IGByZ2IoJHtybmQodGhpcy5yKX0lLCAke3JuZCh0aGlzLmcpfSUsICR7cm5kKHRoaXMuYil9JSlgXG4gICAgICAgICAgICA6IGByZ2JhKCR7cm5kKHRoaXMucil9JSwgJHtybmQodGhpcy5nKX0lLCAke3JuZCh0aGlzLmIpfSUsICR7dGhpcy5yb3VuZEF9KWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRoZSAncmVhbCcgbmFtZSBvZiB0aGUgY29sb3IgLWlmIHRoZXJlIGlzIG9uZS5cbiAgICAgKi9cbiAgICB0b05hbWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNwYXJlbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmEgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGV4ID0gJyMnICsgcmdiVG9IZXgodGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgZmFsc2UpO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhuYW1lcykpIHtcbiAgICAgICAgICAgIGlmIChuYW1lc1trZXldID09PSBoZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtYXQgLSBUaGUgZm9ybWF0IHRvIGJlIHVzZWQgd2hlbiBkaXNwbGF5aW5nIHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAgICovXG4gICAgdG9TdHJpbmcoZm9ybWF0KSB7XG4gICAgICAgIGNvbnN0IGZvcm1hdFNldCA9ICEhZm9ybWF0O1xuICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgdGhpcy5mb3JtYXQ7XG4gICAgICAgIGxldCBmb3JtYXR0ZWRTdHJpbmcgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgaGFzQWxwaGEgPSB0aGlzLmEgPCAxICYmIHRoaXMuYSA+PSAwO1xuICAgICAgICBjb25zdCBuZWVkc0FscGhhRm9ybWF0ID0gIWZvcm1hdFNldCAmJiBoYXNBbHBoYSAmJiAoZm9ybWF0LnN0YXJ0c1dpdGgoJ2hleCcpIHx8IGZvcm1hdCA9PT0gJ25hbWUnKTtcbiAgICAgICAgaWYgKG5lZWRzQWxwaGFGb3JtYXQpIHtcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgY2FzZSBmb3IgXCJ0cmFuc3BhcmVudFwiLCBhbGwgb3RoZXIgbm9uLWFscGhhIGZvcm1hdHNcbiAgICAgICAgICAgIC8vIHdpbGwgcmV0dXJuIHJnYmEgd2hlbiB0aGVyZSBpcyB0cmFuc3BhcmVuY3kuXG4gICAgICAgICAgICBpZiAoZm9ybWF0ID09PSAnbmFtZScgJiYgdGhpcy5hID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9OYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b1JnYlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdyZ2InKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvUmdiU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ3ByZ2InKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvUGVyY2VudGFnZVJnYlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoZXgnIHx8IGZvcm1hdCA9PT0gJ2hleDYnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvSGV4U3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hleDMnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvSGV4U3RyaW5nKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoZXg0Jykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hleDhTdHJpbmcodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hleDgnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvSGV4OFN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICduYW1lJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b05hbWUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaHNsJykge1xuICAgICAgICAgICAgZm9ybWF0dGVkU3RyaW5nID0gdGhpcy50b0hzbFN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoc3YnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvSHN2U3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlZFN0cmluZyB8fCB0aGlzLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGNsb25lKCkge1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcih0aGlzLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaWdodGVuIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudC4gUHJvdmlkaW5nIDEwMCB3aWxsIGFsd2F5cyByZXR1cm4gd2hpdGUuXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICBsaWdodGVuKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLmwgKz0gYW1vdW50IC8gMTAwO1xuICAgICAgICBoc2wubCA9IGNsYW1wMDEoaHNsLmwpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBCcmlnaHRlbiB0aGUgY29sb3IgYSBnaXZlbiBhbW91bnQsIGZyb20gMCB0byAxMDAuXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICBicmlnaHRlbihhbW91bnQgPSAxMCkge1xuICAgICAgICBjb25zdCByZ2IgPSB0aGlzLnRvUmdiKCk7XG4gICAgICAgIHJnYi5yID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByZ2IuciAtIE1hdGgucm91bmQoMjU1ICogLShhbW91bnQgLyAxMDApKSkpO1xuICAgICAgICByZ2IuZyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcmdiLmcgLSBNYXRoLnJvdW5kKDI1NSAqIC0oYW1vdW50IC8gMTAwKSkpKTtcbiAgICAgICAgcmdiLmIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHJnYi5iIC0gTWF0aC5yb3VuZCgyNTUgKiAtKGFtb3VudCAvIDEwMCkpKSk7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKHJnYik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERhcmtlbiB0aGUgY29sb3IgYSBnaXZlbiBhbW91bnQsIGZyb20gMCB0byAxMDAuXG4gICAgICogUHJvdmlkaW5nIDEwMCB3aWxsIGFsd2F5cyByZXR1cm4gYmxhY2suXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICBkYXJrZW4oYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wubCAtPSBhbW91bnQgLyAxMDA7XG4gICAgICAgIGhzbC5sID0gY2xhbXAwMShoc2wubCk7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1peCB0aGUgY29sb3Igd2l0aCBwdXJlIHdoaXRlLCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIFByb3ZpZGluZyAwIHdpbGwgZG8gbm90aGluZywgcHJvdmlkaW5nIDEwMCB3aWxsIGFsd2F5cyByZXR1cm4gd2hpdGUuXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICB0aW50KGFtb3VudCA9IDEwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1peCgnd2hpdGUnLCBhbW91bnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNaXggdGhlIGNvbG9yIHdpdGggcHVyZSBibGFjaywgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBQcm92aWRpbmcgMCB3aWxsIGRvIG5vdGhpbmcsIHByb3ZpZGluZyAxMDAgd2lsbCBhbHdheXMgcmV0dXJuIGJsYWNrLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgc2hhZGUoYW1vdW50ID0gMTApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWl4KCdibGFjaycsIGFtb3VudCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlc2F0dXJhdGUgdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIFByb3ZpZGluZyAxMDAgd2lsbCBpcyB0aGUgc2FtZSBhcyBjYWxsaW5nIGdyZXlzY2FsZVxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgZGVzYXR1cmF0ZShhbW91bnQgPSAxMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGhzbC5zIC09IGFtb3VudCAvIDEwMDtcbiAgICAgICAgaHNsLnMgPSBjbGFtcDAxKGhzbC5zKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2F0dXJhdGUgdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIEBwYXJhbSBhbW91bnQgLSB2YWxpZCBiZXR3ZWVuIDEtMTAwXG4gICAgICovXG4gICAgc2F0dXJhdGUoYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wucyArPSBhbW91bnQgLyAxMDA7XG4gICAgICAgIGhzbC5zID0gY2xhbXAwMShoc2wucyk7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBsZXRlbHkgZGVzYXR1cmF0ZXMgYSBjb2xvciBpbnRvIGdyZXlzY2FsZS5cbiAgICAgKiBTYW1lIGFzIGNhbGxpbmcgYGRlc2F0dXJhdGUoMTAwKWBcbiAgICAgKi9cbiAgICBncmV5c2NhbGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2F0dXJhdGUoMTAwKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3BpbiB0YWtlcyBhIHBvc2l0aXZlIG9yIG5lZ2F0aXZlIGFtb3VudCB3aXRoaW4gWy0zNjAsIDM2MF0gaW5kaWNhdGluZyB0aGUgY2hhbmdlIG9mIGh1ZS5cbiAgICAgKiBWYWx1ZXMgb3V0c2lkZSBvZiB0aGlzIHJhbmdlIHdpbGwgYmUgd3JhcHBlZCBpbnRvIHRoaXMgcmFuZ2UuXG4gICAgICovXG4gICAgc3BpbihhbW91bnQpIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBjb25zdCBodWUgPSAoaHNsLmggKyBhbW91bnQpICUgMzYwO1xuICAgICAgICBoc2wuaCA9IGh1ZSA8IDAgPyAzNjAgKyBodWUgOiBodWU7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIG1peChjb2xvciwgYW1vdW50ID0gNTApIHtcbiAgICAgICAgY29uc3QgcmdiMSA9IHRoaXMudG9SZ2IoKTtcbiAgICAgICAgY29uc3QgcmdiMiA9IG5ldyBUaW55Q29sb3IoY29sb3IpLnRvUmdiKCk7XG4gICAgICAgIGNvbnN0IHAgPSBhbW91bnQgLyAxMDA7XG4gICAgICAgIGNvbnN0IHJnYmEgPSB7XG4gICAgICAgICAgICByOiAocmdiMi5yIC0gcmdiMS5yKSAqIHAgKyByZ2IxLnIsXG4gICAgICAgICAgICBnOiAocmdiMi5nIC0gcmdiMS5nKSAqIHAgKyByZ2IxLmcsXG4gICAgICAgICAgICBiOiAocmdiMi5iIC0gcmdiMS5iKSAqIHAgKyByZ2IxLmIsXG4gICAgICAgICAgICBhOiAocmdiMi5hIC0gcmdiMS5hKSAqIHAgKyByZ2IxLmEsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKHJnYmEpO1xuICAgIH1cbiAgICBhbmFsb2dvdXMocmVzdWx0cyA9IDYsIHNsaWNlcyA9IDMwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgY29uc3QgcGFydCA9IDM2MCAvIHNsaWNlcztcbiAgICAgICAgY29uc3QgcmV0ID0gW3RoaXNdO1xuICAgICAgICBmb3IgKGhzbC5oID0gKGhzbC5oIC0gKChwYXJ0ICogcmVzdWx0cykgPj4gMSkgKyA3MjApICUgMzYwOyAtLXJlc3VsdHM7KSB7XG4gICAgICAgICAgICBoc2wuaCA9IChoc2wuaCArIHBhcnQpICUgMzYwO1xuICAgICAgICAgICAgcmV0LnB1c2gobmV3IFRpbnlDb2xvcihoc2wpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmZ1c2lvbi9qUXVlcnkteGNvbG9yL2Jsb2IvbWFzdGVyL2pxdWVyeS54Y29sb3IuanNcbiAgICAgKi9cbiAgICBjb21wbGVtZW50KCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGhzbC5oID0gKGhzbC5oICsgMTgwKSAlIDM2MDtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgbW9ub2Nocm9tYXRpYyhyZXN1bHRzID0gNikge1xuICAgICAgICBjb25zdCBoc3YgPSB0aGlzLnRvSHN2KCk7XG4gICAgICAgIGNvbnN0IGggPSBoc3YuaDtcbiAgICAgICAgY29uc3QgcyA9IGhzdi5zO1xuICAgICAgICBsZXQgdiA9IGhzdi52O1xuICAgICAgICBjb25zdCByZXMgPSBbXTtcbiAgICAgICAgY29uc3QgbW9kaWZpY2F0aW9uID0gMSAvIHJlc3VsdHM7XG4gICAgICAgIHdoaWxlIChyZXN1bHRzLS0pIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKG5ldyBUaW55Q29sb3IoeyBoLCBzLCB2IH0pKTtcbiAgICAgICAgICAgIHYgPSAodiArIG1vZGlmaWNhdGlvbikgJSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHNwbGl0Y29tcGxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBjb25zdCBoID0gaHNsLmg7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgbmV3IFRpbnlDb2xvcih7IGg6IChoICsgNzIpICUgMzYwLCBzOiBoc2wucywgbDogaHNsLmwgfSksXG4gICAgICAgICAgICBuZXcgVGlueUNvbG9yKHsgaDogKGggKyAyMTYpICUgMzYwLCBzOiBoc2wucywgbDogaHNsLmwgfSksXG4gICAgICAgIF07XG4gICAgfVxuICAgIHRyaWFkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb2x5YWQoMyk7XG4gICAgfVxuICAgIHRldHJhZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9seWFkKDQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgcG9seWFkIGNvbG9ycywgbGlrZSAoZm9yIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIGV0Yy4uLilcbiAgICAgKiBtb25hZCwgZHlhZCwgdHJpYWQsIHRldHJhZCwgcGVudGFkLCBoZXhhZCwgaGVwdGFkLCBvY3RhZCwgZXRjLi4uXG4gICAgICovXG4gICAgcG9seWFkKG4pIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBjb25zdCBoID0gaHNsLmg7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFt0aGlzXTtcbiAgICAgICAgY29uc3QgaW5jcmVtZW50ID0gMzYwIC8gbjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBUaW55Q29sb3IoeyBoOiAoaCArIGkgKiBpbmNyZW1lbnQpICUgMzYwLCBzOiBoc2wucywgbDogaHNsLmwgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIGNvbXBhcmUgY29sb3IgdnMgY3VycmVudCBjb2xvclxuICAgICAqL1xuICAgIGVxdWFscyhjb2xvcikge1xuICAgICAgICByZXR1cm4gdGhpcy50b1JnYlN0cmluZygpID09PSBuZXcgVGlueUNvbG9yKGNvbG9yKS50b1JnYlN0cmluZygpO1xuICAgIH1cbn1cblxuLy8gUmVhZGFiaWxpdHkgRnVuY3Rpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIDxodHRwOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy1XQ0FHMjAtMjAwODEyMTEvI2NvbnRyYXN0LXJhdGlvZGVmIChXQ0FHIFZlcnNpb24gMilcbi8qKlxuICogQUtBIGBjb250cmFzdGBcbiAqXG4gKiBBbmFseXplIHRoZSAyIGNvbG9ycyBhbmQgcmV0dXJucyB0aGUgY29sb3IgY29udHJhc3QgZGVmaW5lZCBieSAoV0NBRyBWZXJzaW9uIDIpXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmlsaXR5KGNvbG9yMSwgY29sb3IyKSB7XG4gICAgY29uc3QgYzEgPSBuZXcgVGlueUNvbG9yKGNvbG9yMSk7XG4gICAgY29uc3QgYzIgPSBuZXcgVGlueUNvbG9yKGNvbG9yMik7XG4gICAgcmV0dXJuICgoTWF0aC5tYXgoYzEuZ2V0THVtaW5hbmNlKCksIGMyLmdldEx1bWluYW5jZSgpKSArIDAuMDUpIC9cbiAgICAgICAgKE1hdGgubWluKGMxLmdldEx1bWluYW5jZSgpLCBjMi5nZXRMdW1pbmFuY2UoKSkgKyAwLjA1KSk7XG59XG4vKipcbiAqIEVuc3VyZSB0aGF0IGZvcmVncm91bmQgYW5kIGJhY2tncm91bmQgY29sb3IgY29tYmluYXRpb25zIG1lZXQgV0NBRzIgZ3VpZGVsaW5lcy5cbiAqIFRoZSB0aGlyZCBhcmd1bWVudCBpcyBhbiBvYmplY3QuXG4gKiAgICAgIHRoZSAnbGV2ZWwnIHByb3BlcnR5IHN0YXRlcyAnQUEnIG9yICdBQUEnIC0gaWYgbWlzc2luZyBvciBpbnZhbGlkLCBpdCBkZWZhdWx0cyB0byAnQUEnO1xuICogICAgICB0aGUgJ3NpemUnIHByb3BlcnR5IHN0YXRlcyAnbGFyZ2UnIG9yICdzbWFsbCcgLSBpZiBtaXNzaW5nIG9yIGludmFsaWQsIGl0IGRlZmF1bHRzIHRvICdzbWFsbCcuXG4gKiBJZiB0aGUgZW50aXJlIG9iamVjdCBpcyBhYnNlbnQsIGlzUmVhZGFibGUgZGVmYXVsdHMgdG8ge2xldmVsOlwiQUFcIixzaXplOlwic21hbGxcIn0uXG4gKlxuICogRXhhbXBsZVxuICogYGBgdHNcbiAqIG5ldyBUaW55Q29sb3IoKS5pc1JlYWRhYmxlKCcjMDAwJywgJyMxMTEnKSA9PiBmYWxzZVxuICogbmV3IFRpbnlDb2xvcigpLmlzUmVhZGFibGUoJyMwMDAnLCAnIzExMScsIHsgbGV2ZWw6ICdBQScsIHNpemU6ICdsYXJnZScgfSkgPT4gZmFsc2VcbiAqIGBgYFxuICovXG5mdW5jdGlvbiBpc1JlYWRhYmxlKGNvbG9yMSwgY29sb3IyLCB3Y2FnMiA9IHsgbGV2ZWw6ICdBQScsIHNpemU6ICdzbWFsbCcgfSkge1xuICAgIGNvbnN0IHJlYWRhYmlsaXR5TGV2ZWwgPSByZWFkYWJpbGl0eShjb2xvcjEsIGNvbG9yMik7XG4gICAgc3dpdGNoICgod2NhZzIubGV2ZWwgfHwgJ0FBJykgKyAod2NhZzIuc2l6ZSB8fCAnc21hbGwnKSkge1xuICAgICAgICBjYXNlICdBQXNtYWxsJzpcbiAgICAgICAgY2FzZSAnQUFBbGFyZ2UnOlxuICAgICAgICAgICAgcmV0dXJuIHJlYWRhYmlsaXR5TGV2ZWwgPj0gNC41O1xuICAgICAgICBjYXNlICdBQWxhcmdlJzpcbiAgICAgICAgICAgIHJldHVybiByZWFkYWJpbGl0eUxldmVsID49IDM7XG4gICAgICAgIGNhc2UgJ0FBQXNtYWxsJzpcbiAgICAgICAgICAgIHJldHVybiByZWFkYWJpbGl0eUxldmVsID49IDc7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbi8qKlxuICogR2l2ZW4gYSBiYXNlIGNvbG9yIGFuZCBhIGxpc3Qgb2YgcG9zc2libGUgZm9yZWdyb3VuZCBvciBiYWNrZ3JvdW5kXG4gKiBjb2xvcnMgZm9yIHRoYXQgYmFzZSwgcmV0dXJucyB0aGUgbW9zdCByZWFkYWJsZSBjb2xvci5cbiAqIE9wdGlvbmFsbHkgcmV0dXJucyBCbGFjayBvciBXaGl0ZSBpZiB0aGUgbW9zdCByZWFkYWJsZSBjb2xvciBpcyB1bnJlYWRhYmxlLlxuICpcbiAqIEBwYXJhbSBiYXNlQ29sb3IgLSB0aGUgYmFzZSBjb2xvci5cbiAqIEBwYXJhbSBjb2xvckxpc3QgLSBhcnJheSBvZiBjb2xvcnMgdG8gcGljayB0aGUgbW9zdCByZWFkYWJsZSBvbmUgZnJvbS5cbiAqIEBwYXJhbSBhcmdzIC0gYW5kIG9iamVjdCB3aXRoIGV4dHJhIGFyZ3VtZW50c1xuICpcbiAqIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBuZXcgVGlueUNvbG9yKCkubW9zdFJlYWRhYmxlKCcjMTIzJywgWycjMTI0XCIsIFwiIzEyNSddLCB7IGluY2x1ZGVGYWxsYmFja0NvbG9yczogZmFsc2UgfSkudG9IZXhTdHJpbmcoKTsgLy8gXCIjMTEyMjU1XCJcbiAqIG5ldyBUaW55Q29sb3IoKS5tb3N0UmVhZGFibGUoJyMxMjMnLCBbJyMxMjRcIiwgXCIjMTI1J10seyBpbmNsdWRlRmFsbGJhY2tDb2xvcnM6IHRydWUgfSkudG9IZXhTdHJpbmcoKTsgIC8vIFwiI2ZmZmZmZlwiXG4gKiBuZXcgVGlueUNvbG9yKCkubW9zdFJlYWRhYmxlKCcjYTgwMTVhJywgW1wiI2ZhZjNmM1wiXSwgeyBpbmNsdWRlRmFsbGJhY2tDb2xvcnM6dHJ1ZSwgbGV2ZWw6ICdBQUEnLCBzaXplOiAnbGFyZ2UnIH0pLnRvSGV4U3RyaW5nKCk7IC8vIFwiI2ZhZjNmM1wiXG4gKiBuZXcgVGlueUNvbG9yKCkubW9zdFJlYWRhYmxlKCcjYTgwMTVhJywgW1wiI2ZhZjNmM1wiXSwgeyBpbmNsdWRlRmFsbGJhY2tDb2xvcnM6dHJ1ZSwgbGV2ZWw6ICdBQUEnLCBzaXplOiAnc21hbGwnIH0pLnRvSGV4U3RyaW5nKCk7IC8vIFwiI2ZmZmZmZlwiXG4gKiBgYGBcbiAqL1xuZnVuY3Rpb24gbW9zdFJlYWRhYmxlKGJhc2VDb2xvciwgY29sb3JMaXN0LCBhcmdzID0geyBpbmNsdWRlRmFsbGJhY2tDb2xvcnM6IGZhbHNlLCBsZXZlbDogJ0FBJywgc2l6ZTogJ3NtYWxsJyB9KSB7XG4gICAgbGV0IGJlc3RDb2xvciA9IG51bGw7XG4gICAgbGV0IGJlc3RTY29yZSA9IDA7XG4gICAgY29uc3QgaW5jbHVkZUZhbGxiYWNrQ29sb3JzID0gYXJncy5pbmNsdWRlRmFsbGJhY2tDb2xvcnM7XG4gICAgY29uc3QgbGV2ZWwgPSBhcmdzLmxldmVsO1xuICAgIGNvbnN0IHNpemUgPSBhcmdzLnNpemU7XG4gICAgZm9yIChjb25zdCBjb2xvciBvZiBjb2xvckxpc3QpIHtcbiAgICAgICAgY29uc3Qgc2NvcmUgPSByZWFkYWJpbGl0eShiYXNlQ29sb3IsIGNvbG9yKTtcbiAgICAgICAgaWYgKHNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgICAgIGJlc3RDb2xvciA9IG5ldyBUaW55Q29sb3IoY29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc1JlYWRhYmxlKGJhc2VDb2xvciwgYmVzdENvbG9yLCB7IGxldmVsLCBzaXplIH0pIHx8ICFpbmNsdWRlRmFsbGJhY2tDb2xvcnMpIHtcbiAgICAgICAgcmV0dXJuIGJlc3RDb2xvcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGFyZ3MuaW5jbHVkZUZhbGxiYWNrQ29sb3JzID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBtb3N0UmVhZGFibGUoYmFzZUNvbG9yLCBbJyNmZmYnLCAnIzAwMCddLCBhcmdzKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29sb3IgcmVwcmVzZW50ZWQgYXMgYSBNaWNyb3NvZnQgZmlsdGVyIGZvciB1c2UgaW4gb2xkIHZlcnNpb25zIG9mIElFLlxuICovXG5mdW5jdGlvbiB0b01zRmlsdGVyKGZpcnN0Q29sb3IsIHNlY29uZENvbG9yKSB7XG4gICAgY29uc3QgY29sb3IgPSBuZXcgVGlueUNvbG9yKGZpcnN0Q29sb3IpO1xuICAgIGNvbnN0IGhleDhTdHJpbmcgPSAnIycgKyByZ2JhVG9BcmdiSGV4KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIGNvbG9yLmEpO1xuICAgIGxldCBzZWNvbmRIZXg4U3RyaW5nID0gaGV4OFN0cmluZztcbiAgICBjb25zdCBncmFkaWVudFR5cGUgPSBjb2xvci5ncmFkaWVudFR5cGUgPyAnR3JhZGllbnRUeXBlID0gMSwgJyA6ICcnO1xuICAgIGlmIChzZWNvbmRDb2xvcikge1xuICAgICAgICBjb25zdCBzID0gbmV3IFRpbnlDb2xvcihzZWNvbmRDb2xvcik7XG4gICAgICAgIHNlY29uZEhleDhTdHJpbmcgPSAnIycgKyByZ2JhVG9BcmdiSGV4KHMuciwgcy5nLCBzLmIsIHMuYSk7XG4gICAgfVxuICAgIHJldHVybiBgcHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LmdyYWRpZW50KCR7Z3JhZGllbnRUeXBlfXN0YXJ0Q29sb3JzdHI9JHtoZXg4U3RyaW5nfSxlbmRDb2xvcnN0cj0ke3NlY29uZEhleDhTdHJpbmd9KWA7XG59XG5cbi8qKlxuICogSWYgaW5wdXQgaXMgYW4gb2JqZWN0LCBmb3JjZSAxIGludG8gXCIxLjBcIiB0byBoYW5kbGUgcmF0aW9zIHByb3Blcmx5XG4gKiBTdHJpbmcgaW5wdXQgcmVxdWlyZXMgXCIxLjBcIiBhcyBpbnB1dCwgc28gMSB3aWxsIGJlIHRyZWF0ZWQgYXMgMVxuICovXG5mdW5jdGlvbiBmcm9tUmF0aW8ocmF0aW8sIG9wdHMpIHtcbiAgICBjb25zdCBuZXdDb2xvciA9IHtcbiAgICAgICAgcjogY29udmVydFRvUGVyY2VudGFnZShyYXRpby5yKSxcbiAgICAgICAgZzogY29udmVydFRvUGVyY2VudGFnZShyYXRpby5nKSxcbiAgICAgICAgYjogY29udmVydFRvUGVyY2VudGFnZShyYXRpby5iKSxcbiAgICB9O1xuICAgIGlmIChyYXRpby5hICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbmV3Q29sb3IuYSA9ICtyYXRpby5hO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihuZXdDb2xvciwgb3B0cyk7XG59XG4vKiogb2xkIHJhbmRvbSBmdW5jdGlvbiAqL1xuZnVuY3Rpb24gbGVnYWN5UmFuZG9tKCkge1xuICAgIHJldHVybiBuZXcgVGlueUNvbG9yKHtcbiAgICAgICAgcjogTWF0aC5yYW5kb20oKSxcbiAgICAgICAgZzogTWF0aC5yYW5kb20oKSxcbiAgICAgICAgYjogTWF0aC5yYW5kb20oKSxcbiAgICB9KTtcbn1cblxuLy8gcmFuZG9tQ29sb3IgYnkgRGF2aWQgTWVyZmllbGQgdW5kZXIgdGhlIENDMCBsaWNlbnNlXG5mdW5jdGlvbiByYW5kb20ob3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gQ2hlY2sgaWYgd2UgbmVlZCB0byBnZW5lcmF0ZSBtdWx0aXBsZSBjb2xvcnNcbiAgICBpZiAob3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuY291bnQgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgdG90YWxDb2xvcnMgPSBvcHRpb25zLmNvdW50O1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBbXTtcbiAgICAgICAgb3B0aW9ucy5jb3VudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgd2hpbGUgKHRvdGFsQ29sb3JzID4gY29sb3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gU2luY2Ugd2UncmUgZ2VuZXJhdGluZyBtdWx0aXBsZSBjb2xvcnMsXG4gICAgICAgICAgICAvLyBpbmNyZW1lbWVudCB0aGUgc2VlZC4gT3RoZXJ3aXNlIHdlJ2QganVzdFxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgdGhlIHNhbWUgY29sb3IgZWFjaCB0aW1lLi4uXG4gICAgICAgICAgICBvcHRpb25zLmNvdW50ID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNlZWQpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnNlZWQgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbG9ycy5wdXNoKHJhbmRvbShvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucy5jb3VudCA9IHRvdGFsQ29sb3JzO1xuICAgICAgICByZXR1cm4gY29sb3JzO1xuICAgIH1cbiAgICAvLyBGaXJzdCB3ZSBwaWNrIGEgaHVlIChIKVxuICAgIGNvbnN0IGggPSBwaWNrSHVlKG9wdGlvbnMuaHVlLCBvcHRpb25zLnNlZWQpO1xuICAgIC8vIFRoZW4gdXNlIEggdG8gZGV0ZXJtaW5lIHNhdHVyYXRpb24gKFMpXG4gICAgY29uc3QgcyA9IHBpY2tTYXR1cmF0aW9uKGgsIG9wdGlvbnMpO1xuICAgIC8vIFRoZW4gdXNlIFMgYW5kIEggdG8gZGV0ZXJtaW5lIGJyaWdodG5lc3MgKEIpLlxuICAgIGNvbnN0IHYgPSBwaWNrQnJpZ2h0bmVzcyhoLCBzLCBvcHRpb25zKTtcbiAgICBjb25zdCByZXMgPSB7IGgsIHMsIHYgfTtcbiAgICBpZiAob3B0aW9ucy5hbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlcy5hID0gb3B0aW9ucy5hbHBoYTtcbiAgICB9XG4gICAgLy8gVGhlbiB3ZSByZXR1cm4gdGhlIEhTQiBjb2xvciBpbiB0aGUgZGVzaXJlZCBmb3JtYXRcbiAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihyZXMpO1xufVxuZnVuY3Rpb24gcGlja0h1ZShodWUsIHNlZWQpIHtcbiAgICBjb25zdCBodWVSYW5nZSA9IGdldEh1ZVJhbmdlKGh1ZSk7XG4gICAgbGV0IHJlcyA9IHJhbmRvbVdpdGhpbihodWVSYW5nZSwgc2VlZCk7XG4gICAgLy8gSW5zdGVhZCBvZiBzdG9yaW5nIHJlZCBhcyB0d28gc2VwZXJhdGUgcmFuZ2VzLFxuICAgIC8vIHdlIGdyb3VwIHRoZW0sIHVzaW5nIG5lZ2F0aXZlIG51bWJlcnNcbiAgICBpZiAocmVzIDwgMCkge1xuICAgICAgICByZXMgPSAzNjAgKyByZXM7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5mdW5jdGlvbiBwaWNrU2F0dXJhdGlvbihodWUsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5odWUgPT09ICdtb25vY2hyb21lJykge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubHVtaW5vc2l0eSA9PT0gJ3JhbmRvbScpIHtcbiAgICAgICAgcmV0dXJuIHJhbmRvbVdpdGhpbihbMCwgMTAwXSwgb3B0aW9ucy5zZWVkKTtcbiAgICB9XG4gICAgY29uc3Qgc2F0dXJhdGlvblJhbmdlID0gZ2V0Q29sb3JJbmZvKGh1ZSkuc2F0dXJhdGlvblJhbmdlO1xuICAgIGxldCBzTWluID0gc2F0dXJhdGlvblJhbmdlWzBdO1xuICAgIGxldCBzTWF4ID0gc2F0dXJhdGlvblJhbmdlWzFdO1xuICAgIHN3aXRjaCAob3B0aW9ucy5sdW1pbm9zaXR5KSB7XG4gICAgICAgIGNhc2UgJ2JyaWdodCc6XG4gICAgICAgICAgICBzTWluID0gNTU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGFyayc6XG4gICAgICAgICAgICBzTWluID0gc01heCAtIDEwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2xpZ2h0JzpcbiAgICAgICAgICAgIHNNYXggPSA1NTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZG9tV2l0aGluKFtzTWluLCBzTWF4XSwgb3B0aW9ucy5zZWVkKTtcbn1cbmZ1bmN0aW9uIHBpY2tCcmlnaHRuZXNzKEgsIFMsIG9wdGlvbnMpIHtcbiAgICBsZXQgYk1pbiA9IGdldE1pbmltdW1CcmlnaHRuZXNzKEgsIFMpO1xuICAgIGxldCBiTWF4ID0gMTAwO1xuICAgIHN3aXRjaCAob3B0aW9ucy5sdW1pbm9zaXR5KSB7XG4gICAgICAgIGNhc2UgJ2RhcmsnOlxuICAgICAgICAgICAgYk1heCA9IGJNaW4gKyAyMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaWdodCc6XG4gICAgICAgICAgICBiTWluID0gKGJNYXggKyBiTWluKSAvIDI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmFuZG9tJzpcbiAgICAgICAgICAgIGJNaW4gPSAwO1xuICAgICAgICAgICAgYk1heCA9IDEwMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZG9tV2l0aGluKFtiTWluLCBiTWF4XSwgb3B0aW9ucy5zZWVkKTtcbn1cbmZ1bmN0aW9uIGdldE1pbmltdW1CcmlnaHRuZXNzKEgsIFMpIHtcbiAgICBjb25zdCBsb3dlckJvdW5kcyA9IGdldENvbG9ySW5mbyhIKS5sb3dlckJvdW5kcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvd2VyQm91bmRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICBjb25zdCBzMSA9IGxvd2VyQm91bmRzW2ldWzBdO1xuICAgICAgICBjb25zdCB2MSA9IGxvd2VyQm91bmRzW2ldWzFdO1xuICAgICAgICBjb25zdCBzMiA9IGxvd2VyQm91bmRzW2kgKyAxXVswXTtcbiAgICAgICAgY29uc3QgdjIgPSBsb3dlckJvdW5kc1tpICsgMV1bMV07XG4gICAgICAgIGlmIChTID49IHMxICYmIFMgPD0gczIpIHtcbiAgICAgICAgICAgIGNvbnN0IG0gPSAodjIgLSB2MSkgLyAoczIgLSBzMSk7XG4gICAgICAgICAgICBjb25zdCBiID0gdjEgLSBtICogczE7XG4gICAgICAgICAgICByZXR1cm4gbSAqIFMgKyBiO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAwO1xufVxuZnVuY3Rpb24gZ2V0SHVlUmFuZ2UoY29sb3JJbnB1dCkge1xuICAgIGNvbnN0IG51bSA9IHBhcnNlSW50KGNvbG9ySW5wdXQsIDEwKTtcbiAgICBpZiAoIU51bWJlci5pc05hTihudW0pICYmIG51bSA8IDM2MCAmJiBudW0gPiAwKSB7XG4gICAgICAgIHJldHVybiBbbnVtLCBudW1dO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGNvbG9ySW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IG5hbWVkQ29sb3IgPSBib3VuZHMuZmluZChuID0+IG4ubmFtZSA9PT0gY29sb3JJbnB1dCk7XG4gICAgICAgIGlmIChuYW1lZENvbG9yKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IGRlZmluZUNvbG9yKG5hbWVkQ29sb3IpO1xuICAgICAgICAgICAgaWYgKGNvbG9yLmh1ZVJhbmdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yLmh1ZVJhbmdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBUaW55Q29sb3IoY29sb3JJbnB1dCk7XG4gICAgICAgIGlmIChwYXJzZWQuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc3QgaHVlID0gcGFyc2VkLnRvSHN2KCkuaDtcbiAgICAgICAgICAgIHJldHVybiBbaHVlLCBodWVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbMCwgMzYwXTtcbn1cbmZ1bmN0aW9uIGdldENvbG9ySW5mbyhodWUpIHtcbiAgICAvLyBNYXBzIHJlZCBjb2xvcnMgdG8gbWFrZSBwaWNraW5nIGh1ZSBlYXNpZXJcbiAgICBpZiAoaHVlID49IDMzNCAmJiBodWUgPD0gMzYwKSB7XG4gICAgICAgIGh1ZSAtPSAzNjA7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYm91bmQgb2YgYm91bmRzKSB7XG4gICAgICAgIGNvbnN0IGNvbG9yID0gZGVmaW5lQ29sb3IoYm91bmQpO1xuICAgICAgICBpZiAoY29sb3IuaHVlUmFuZ2UgJiYgaHVlID49IGNvbG9yLmh1ZVJhbmdlWzBdICYmIGh1ZSA8PSBjb2xvci5odWVSYW5nZVsxXSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRocm93IEVycm9yKCdDb2xvciBub3QgZm91bmQnKTtcbn1cbmZ1bmN0aW9uIHJhbmRvbVdpdGhpbihyYW5nZSwgc2VlZCkge1xuICAgIGlmIChzZWVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IocmFuZ2VbMF0gKyBNYXRoLnJhbmRvbSgpICogKHJhbmdlWzFdICsgMSAtIHJhbmdlWzBdKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyBTZWVkZWQgcmFuZG9tIGFsZ29yaXRobSBmcm9tIGh0dHA6Ly9pbmRpZWdhbXIuY29tL2dlbmVyYXRlLXJlcGVhdGFibGUtcmFuZG9tLW51bWJlcnMtaW4tanMvXG4gICAgICAgIGNvbnN0IG1heCA9IHJhbmdlWzFdIHx8IDE7XG4gICAgICAgIGNvbnN0IG1pbiA9IHJhbmdlWzBdIHx8IDA7XG4gICAgICAgIHNlZWQgPSAoc2VlZCAqIDkzMDEgKyA0OTI5NykgJSAyMzMyODA7XG4gICAgICAgIGNvbnN0IHJuZCA9IHNlZWQgLyAyMzMyODAuMDtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobWluICsgcm5kICogKG1heCAtIG1pbikpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRlZmluZUNvbG9yKGJvdW5kKSB7XG4gICAgY29uc3Qgc01pbiA9IGJvdW5kLmxvd2VyQm91bmRzWzBdWzBdO1xuICAgIGNvbnN0IHNNYXggPSBib3VuZC5sb3dlckJvdW5kc1tib3VuZC5sb3dlckJvdW5kcy5sZW5ndGggLSAxXVswXTtcbiAgICBjb25zdCBiTWluID0gYm91bmQubG93ZXJCb3VuZHNbYm91bmQubG93ZXJCb3VuZHMubGVuZ3RoIC0gMV1bMV07XG4gICAgY29uc3QgYk1heCA9IGJvdW5kLmxvd2VyQm91bmRzWzBdWzFdO1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGJvdW5kLm5hbWUsXG4gICAgICAgIGh1ZVJhbmdlOiBib3VuZC5odWVSYW5nZSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IGJvdW5kLmxvd2VyQm91bmRzLFxuICAgICAgICBzYXR1cmF0aW9uUmFuZ2U6IFtzTWluLCBzTWF4XSxcbiAgICAgICAgYnJpZ2h0bmVzc1JhbmdlOiBbYk1pbiwgYk1heF0sXG4gICAgfTtcbn1cbi8qKlxuICogQGhpZGRlblxuICovXG5jb25zdCBib3VuZHMgPSBbXG4gICAge1xuICAgICAgICBuYW1lOiAnbW9ub2Nocm9tZScsXG4gICAgICAgIGh1ZVJhbmdlOiBudWxsLFxuICAgICAgICBsb3dlckJvdW5kczogW1swLCAwXSwgWzEwMCwgMF1dLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncmVkJyxcbiAgICAgICAgaHVlUmFuZ2U6IFstMjYsIDE4XSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtcbiAgICAgICAgICAgIFsyMCwgMTAwXSxcbiAgICAgICAgICAgIFszMCwgOTJdLFxuICAgICAgICAgICAgWzQwLCA4OV0sXG4gICAgICAgICAgICBbNTAsIDg1XSxcbiAgICAgICAgICAgIFs2MCwgNzhdLFxuICAgICAgICAgICAgWzcwLCA3MF0sXG4gICAgICAgICAgICBbODAsIDYwXSxcbiAgICAgICAgICAgIFs5MCwgNTVdLFxuICAgICAgICAgICAgWzEwMCwgNTBdLFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnb3JhbmdlJyxcbiAgICAgICAgaHVlUmFuZ2U6IFsxOSwgNDZdLFxuICAgICAgICBsb3dlckJvdW5kczogW1syMCwgMTAwXSwgWzMwLCA5M10sIFs0MCwgODhdLCBbNTAsIDg2XSwgWzYwLCA4NV0sIFs3MCwgNzBdLCBbMTAwLCA3MF1dLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAneWVsbG93JyxcbiAgICAgICAgaHVlUmFuZ2U6IFs0NywgNjJdLFxuICAgICAgICBsb3dlckJvdW5kczogW1syNSwgMTAwXSwgWzQwLCA5NF0sIFs1MCwgODldLCBbNjAsIDg2XSwgWzcwLCA4NF0sIFs4MCwgODJdLCBbOTAsIDgwXSwgWzEwMCwgNzVdXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2dyZWVuJyxcbiAgICAgICAgaHVlUmFuZ2U6IFs2MywgMTc4XSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMzAsIDEwMF0sIFs0MCwgOTBdLCBbNTAsIDg1XSwgWzYwLCA4MV0sIFs3MCwgNzRdLCBbODAsIDY0XSwgWzkwLCA1MF0sIFsxMDAsIDQwXV0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdibHVlJyxcbiAgICAgICAgaHVlUmFuZ2U6IFsxNzksIDI1N10sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbXG4gICAgICAgICAgICBbMjAsIDEwMF0sXG4gICAgICAgICAgICBbMzAsIDg2XSxcbiAgICAgICAgICAgIFs0MCwgODBdLFxuICAgICAgICAgICAgWzUwLCA3NF0sXG4gICAgICAgICAgICBbNjAsIDYwXSxcbiAgICAgICAgICAgIFs3MCwgNTJdLFxuICAgICAgICAgICAgWzgwLCA0NF0sXG4gICAgICAgICAgICBbOTAsIDM5XSxcbiAgICAgICAgICAgIFsxMDAsIDM1XSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3B1cnBsZScsXG4gICAgICAgIGh1ZVJhbmdlOiBbMjU4LCAyODJdLFxuICAgICAgICBsb3dlckJvdW5kczogW1xuICAgICAgICAgICAgWzIwLCAxMDBdLFxuICAgICAgICAgICAgWzMwLCA4N10sXG4gICAgICAgICAgICBbNDAsIDc5XSxcbiAgICAgICAgICAgIFs1MCwgNzBdLFxuICAgICAgICAgICAgWzYwLCA2NV0sXG4gICAgICAgICAgICBbNzAsIDU5XSxcbiAgICAgICAgICAgIFs4MCwgNTJdLFxuICAgICAgICAgICAgWzkwLCA0NV0sXG4gICAgICAgICAgICBbMTAwLCA0Ml0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdwaW5rJyxcbiAgICAgICAgaHVlUmFuZ2U6IFsyODMsIDMzNF0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbWzIwLCAxMDBdLCBbMzAsIDkwXSwgWzQwLCA4Nl0sIFs2MCwgODRdLCBbODAsIDgwXSwgWzkwLCA3NV0sIFsxMDAsIDczXV0sXG4gICAgfSxcbl07XG5cbmV4cG9ydCB7IFRpbnlDb2xvciwgbmFtZXMsIHJlYWRhYmlsaXR5LCBpc1JlYWRhYmxlLCBtb3N0UmVhZGFibGUsIHRvTXNGaWx0ZXIsIGZyb21SYXRpbywgbGVnYWN5UmFuZG9tLCBpbnB1dFRvUkdCLCBzdHJpbmdJbnB1dFRvT2JqZWN0LCBpc1ZhbGlkQ1NTVW5pdCwgcmFuZG9tLCBib3VuZHMgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRpbnljb2xvci5lczIwMTUuanMubWFwXG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgeyBUaW55Q29sb3IgfSBmcm9tICdAY3RybC90aW55Y29sb3InXG5pbXBvcnQgeyBnZXRTdHlsZSB9IGZyb20gJy4uL2ZlYXR1cmVzL3V0aWxzJ1xuXG5leHBvcnQgZnVuY3Rpb24gQ29sb3JQaWNrZXIocGFsbGV0ZSwgc2VsZWN0b3JFbmdpbmUpIHtcbiAgY29uc3QgZm9yZWdyb3VuZFBpY2tlciA9ICQoJyNmb3JlZ3JvdW5kJywgcGFsbGV0ZSlbMF1cbiAgY29uc3QgYmFja2dyb3VuZFBpY2tlciA9ICQoJyNiYWNrZ3JvdW5kJywgcGFsbGV0ZSlbMF1cblxuICAvLyBzZXQgY29sb3JzXG4gIGZvcmVncm91bmRQaWNrZXIub24oJ2lucHV0JywgZSA9PlxuICAgICQoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJykubWFwKGVsID0+XG4gICAgICBlbC5zdHlsZS5jb2xvciA9IGUudGFyZ2V0LnZhbHVlKSlcblxuICBiYWNrZ3JvdW5kUGlja2VyLm9uKCdpbnB1dCcsIGUgPT5cbiAgICAkKCdbZGF0YS1zZWxlY3RlZD10cnVlXScpLm1hcChlbCA9PlxuICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gZS50YXJnZXQudmFsdWUpKVxuXG4gIC8vIHJlYWQgY29sb3JzXG4gIHNlbGVjdG9yRW5naW5lLm9uU2VsZWN0ZWRVcGRhdGUoZWxlbWVudHMgPT4ge1xuICAgIGlmICghZWxlbWVudHMubGVuZ3RoKSByZXR1cm5cblxuICAgIGxldCBpc01lYW5pbmdmdWxGb3JlZ3JvdW5kID0gZmFsc2VcbiAgICBsZXQgaXNNZWFuaW5nZnVsQmFja2dyb3VuZCA9IGZhbHNlXG5cbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoIDw9IDIpIHtcbiAgICAgIGNvbnN0IGVsID0gZWxlbWVudHNbMF1cbiAgICAgIGNvbnN0IEZHID0gbmV3IFRpbnlDb2xvcihnZXRTdHlsZShlbCwgJ2NvbG9yJykpXG4gICAgICBjb25zdCBCRyA9IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdiYWNrZ3JvdW5kQ29sb3InKSlcblxuICAgICAgbGV0IGZnID0gRkcudG9IZXhTdHJpbmcoKVxuICAgICAgbGV0IGJnID0gQkcudG9IZXhTdHJpbmcoKVxuXG4gICAgICBpc01lYW5pbmdmdWxGb3JlZ3JvdW5kID0gRkcub3JpZ2luYWxJbnB1dCAhPT0gJ3JnYigwLCAwLCAwKScgfHwgKGVsLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCAmJiBlbC50ZXh0Q29udGVudCAhPT0gJycpXG4gICAgICBpc01lYW5pbmdmdWxCYWNrZ3JvdW5kID0gQkcub3JpZ2luYWxJbnB1dCAhPT0gJ3JnYmEoMCwgMCwgMCwgMCknIFxuXG4gICAgICBmb3JlZ3JvdW5kUGlja2VyLmF0dHIoJ3ZhbHVlJywgaXNNZWFuaW5nZnVsRm9yZWdyb3VuZFxuICAgICAgICA/IGZnIFxuICAgICAgICA6ICcnKVxuXG4gICAgICBiYWNrZ3JvdW5kUGlja2VyLmF0dHIoJ3ZhbHVlJywgaXNNZWFuaW5nZnVsQmFja2dyb3VuZFxuICAgICAgICA/IGJnIFxuICAgICAgICA6ICcnKVxuICAgIH1cblxuICAgIGZvcmVncm91bmRQaWNrZXIucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gIWlzTWVhbmluZ2Z1bEZvcmVncm91bmQgPyAnbm9uZScgOiAnYmxvY2snXG4gICAgYmFja2dyb3VuZFBpY2tlci5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXkgPSAhaXNNZWFuaW5nZnVsQmFja2dyb3VuZCA/ICdub25lJyA6ICdibG9jaydcbiAgfSlcbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgVGlueUNvbG9yIH0gZnJvbSAnQGN0cmwvdGlueWNvbG9yJ1xuaW1wb3J0IHsgZ2V0U3R5bGVzLCBjYW1lbFRvRGFzaCB9IGZyb20gJy4vdXRpbHMnXG5cbmNvbnN0IGRlc2lyZWRQcm9wTWFwID0ge1xuICBjb2xvcjogICAgICAgICAgICAgICAgJ3JnYigwLCAwLCAwKScsXG4gIGJhY2tncm91bmRDb2xvcjogICAgICAncmdiYSgwLCAwLCAwLCAwKScsXG4gIGJhY2tncm91bmRJbWFnZTogICAgICAnbm9uZScsXG4gIGJhY2tncm91bmRTaXplOiAgICAgICAnYXV0bycsXG4gIGJhY2tncm91bmRQb3NpdGlvbjogICAnMCUgMCUnLFxuICAvLyBib3JkZXI6ICAgICAgICAgICAgICAgJzBweCBub25lIHJnYigwLCAwLCAwKScsXG4gIGJvcmRlclJhZGl1czogICAgICAgICAnMHB4JyxcbiAgcGFkZGluZzogICAgICAgICAgICAgICcwcHgnLFxuICBtYXJnaW46ICAgICAgICAgICAgICAgJzBweCcsXG4gIGZvbnRGYW1pbHk6ICAgICAgICAgICAnJyxcbiAgZm9udFNpemU6ICAgICAgICAgICAgICcxNnB4JyxcbiAgZm9udFdlaWdodDogICAgICAgICAgICc0MDAnLFxuICB0ZXh0QWxpZ246ICAgICAgICAgICAgJ3N0YXJ0JyxcbiAgdGV4dFNoYWRvdzogICAgICAgICAgICdub25lJyxcbiAgdGV4dFRyYW5zZm9ybTogICAgICAgICdub25lJyxcbiAgbGluZUhlaWdodDogICAgICAgICAgICdub3JtYWwnLFxuICBkaXNwbGF5OiAgICAgICAgICAgICAgJ2Jsb2NrJyxcbiAgYWxpZ25JdGVtczogICAgICAgICAgICdub3JtYWwnLFxuICBqdXN0aWZ5Q29udGVudDogICAgICAgJ25vcm1hbCcsXG59XG5cbmxldCB0aXBfbWFwID0ge31cblxuLy8gdG9kbzogXG4vLyAtIG5vZGUgcmVjeWNsaW5nIChmb3IgbmV3IHRhcmdldCkgbm8gbmVlZCB0byBjcmVhdGUvZGVsZXRlXG4vLyAtIG1ha2Ugc2luZ2xlIGZ1bmN0aW9uIGNyZWF0ZS91cGRhdGVcbmV4cG9ydCBmdW5jdGlvbiBNZXRhVGlwKCkge1xuICBjb25zdCB0ZW1wbGF0ZSA9ICh7dGFyZ2V0OiBlbH0pID0+IHtcbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgY29uc3Qgc3R5bGVzID0gZ2V0U3R5bGVzKGVsLCBkZXNpcmVkUHJvcE1hcClcbiAgICAgIC5tYXAoc3R5bGUgPT4gT2JqZWN0LmFzc2lnbihzdHlsZSwge1xuICAgICAgICBwcm9wOiBjYW1lbFRvRGFzaChzdHlsZS5wcm9wKVxuICAgICAgfSkpXG4gICAgICAuZmlsdGVyKHN0eWxlID0+IFxuICAgICAgICBzdHlsZS5wcm9wLmluY2x1ZGVzKCdmb250LWZhbWlseScpIFxuICAgICAgICAgID8gZWwubWF0Y2hlcygnaDEsaDIsaDMsaDQsaDUsaDYscCxhLGRhdGUsY2FwdGlvbixidXR0b24sZmlnY2FwdGlvbixuYXYsaGVhZGVyLGZvb3RlcicpIFxuICAgICAgICAgIDogdHJ1ZVxuICAgICAgKVxuICAgICAgLm1hcChzdHlsZSA9PiB7XG4gICAgICAgIGlmIChzdHlsZS5wcm9wLmluY2x1ZGVzKCdjb2xvcicpIHx8IHN0eWxlLnByb3AuaW5jbHVkZXMoJ0NvbG9yJykpXG4gICAgICAgICAgc3R5bGUudmFsdWUgPSBgPHNwYW4gY29sb3Igc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAke3N0eWxlLnZhbHVlfTtcIj48L3NwYW4+JHtuZXcgVGlueUNvbG9yKHN0eWxlLnZhbHVlKS50b0hzbFN0cmluZygpfWBcblxuICAgICAgICBpZiAoc3R5bGUucHJvcC5pbmNsdWRlcygnZm9udC1mYW1pbHknKSAmJiBzdHlsZS52YWx1ZS5sZW5ndGggPiAyNSlcbiAgICAgICAgICBzdHlsZS52YWx1ZSA9IHN0eWxlLnZhbHVlLnNsaWNlKDAsMjUpICsgJy4uLidcblxuICAgICAgICAvLyBjaGVjayBpZiBzdHlsZSBpcyBpbmxpbmUgc3R5bGUsIHNob3cgaW5kaWNhdG9yXG4gICAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpLmluY2x1ZGVzKHN0eWxlLnByb3ApKVxuICAgICAgICAgIHN0eWxlLnZhbHVlID0gYDxzcGFuIGxvY2FsLWNoYW5nZT4ke3N0eWxlLnZhbHVlfTwvc3Bhbj5gXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3R5bGVcbiAgICAgIH0pXG5cbiAgICBjb25zdCBsb2NhbE1vZGlmaWNhdGlvbnMgPSBzdHlsZXMuZmlsdGVyKHN0eWxlID0+XG4gICAgICBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpLmluY2x1ZGVzKHN0eWxlLnByb3ApXG4gICAgICAgID8gMVxuICAgICAgICA6IDApXG5cbiAgICBjb25zdCBub3RMb2NhbE1vZGlmaWNhdGlvbnMgPSBzdHlsZXMuZmlsdGVyKHN0eWxlID0+XG4gICAgICBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdzdHlsZScpLmluY2x1ZGVzKHN0eWxlLnByb3ApXG4gICAgICAgID8gMFxuICAgICAgICA6IDEpXG4gICAgXG4gICAgbGV0IHRpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGlwLmNsYXNzTGlzdC5hZGQoJ21ldGF0aXAnKVxuICAgIHRpcC5pbm5lckhUTUwgPSBgXG4gICAgICA8aDU+JHtlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpfSR7ZWwuaWQgJiYgJyMnICsgZWwuaWR9JHtjcmVhdGVDbGFzc25hbWUoZWwpfTwvaDU+XG4gICAgICA8c21hbGw+PHNwYW4+JHtNYXRoLnJvdW5kKHdpZHRoKX08L3NwYW4+cHggPHNwYW4gZGl2aWRlcj7Dlzwvc3Bhbj4gPHNwYW4+JHtNYXRoLnJvdW5kKGhlaWdodCl9PC9zcGFuPnB4PC9zbWFsbD5cbiAgICAgIDxkaXY+JHtub3RMb2NhbE1vZGlmaWNhdGlvbnMucmVkdWNlKChpdGVtcywgaXRlbSkgPT4gYFxuICAgICAgICAke2l0ZW1zfVxuICAgICAgICA8c3BhbiBwcm9wPiR7aXRlbS5wcm9wfTo8L3NwYW4+PHNwYW4gdmFsdWU+JHtpdGVtLnZhbHVlfTwvc3Bhbj5cbiAgICAgIGAsICcnKX08L2Rpdj5cbiAgICAgICR7bG9jYWxNb2RpZmljYXRpb25zLmxlbmd0aCA/IGBcbiAgICAgICAgPGg2PkxvY2FsIE1vZGlmaWNhdGlvbnM8L2g2PlxuICAgICAgICA8ZGl2PiR7bG9jYWxNb2RpZmljYXRpb25zLnJlZHVjZSgoaXRlbXMsIGl0ZW0pID0+IGBcbiAgICAgICAgICAke2l0ZW1zfVxuICAgICAgICAgIDxzcGFuIHByb3A+JHtpdGVtLnByb3B9Ojwvc3Bhbj48c3BhbiB2YWx1ZT4ke2l0ZW0udmFsdWV9PC9zcGFuPlxuICAgICAgICBgLCAnJyl9PC9kaXY+XG4gICAgICBgIDogJyd9XG4gICAgYFxuXG4gICAgcmV0dXJuIHRpcFxuICB9XG5cbiAgY29uc3QgY3JlYXRlQ2xhc3NuYW1lID0gZWwgPT4ge1xuICAgIGlmICghZWwuY2xhc3NOYW1lKSByZXR1cm4gJydcbiAgICBsZXQgcmF3Q2xhc3NuYW1lID0gJy4nICsgZWwuY2xhc3NOYW1lLnJlcGxhY2UoLyAvZywgJy4nKVxuXG4gICAgcmV0dXJuIHJhd0NsYXNzbmFtZS5sZW5ndGggPiAzMFxuICAgICAgPyByYXdDbGFzc25hbWUuc3Vic3RyaW5nKDAsMzApICsgJy4uLidcbiAgICAgIDogcmF3Q2xhc3NuYW1lXG4gIH1cblxuICBjb25zdCB0aXBfa2V5ID0gbm9kZSA9PlxuICAgIGAke25vZGUubm9kZU5hbWV9XyR7bm9kZS5jbGFzc05hbWV9XyR7bm9kZS5jaGlsZHJlbi5sZW5ndGh9XyR7bm9kZS5jbGllbnRXaWR0aH1gXG5cbiAgY29uc3QgdGlwX3Bvc2l0aW9uID0gKG5vZGUsIGUpID0+IGBcbiAgICB0b3A6ICR7ZS5jbGllbnRZID4gd2luZG93LmlubmVySGVpZ2h0IC8gMlxuICAgICAgPyBlLnBhZ2VZIC0gbm9kZS5jbGllbnRIZWlnaHRcbiAgICAgIDogZS5wYWdlWX1weDtcbiAgICBsZWZ0OiAke2UuY2xpZW50WCA+IHdpbmRvdy5pbm5lcldpZHRoIC8gMlxuICAgICAgPyBlLnBhZ2VYIC0gbm9kZS5jbGllbnRXaWR0aCAtIDI1XG4gICAgICA6IGUucGFnZVggKyAyNX1weDtcbiAgYFxuXG4gIGNvbnN0IG1vdXNlT3V0ID0gKHt0YXJnZXR9KSA9PiB7XG4gICAgaWYgKHRpcF9tYXBbdGlwX2tleSh0YXJnZXQpXSAmJiAhdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJykpIHtcbiAgICAgICQodGFyZ2V0KS5vZmYoJ21vdXNlb3V0JywgbW91c2VPdXQpXG4gICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcbiAgICAgIHRpcF9tYXBbdGlwX2tleSh0YXJnZXQpXS50aXAucmVtb3ZlKClcbiAgICAgIGRlbGV0ZSB0aXBfbWFwW3RpcF9rZXkodGFyZ2V0KV1cbiAgICB9XG4gIH1cblxuICBjb25zdCB0b2dnbGVQaW5uZWQgPSBlID0+IHtcbiAgICBpZiAoZS5hbHRLZXkpIHtcbiAgICAgICFlLnRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtbWV0YXRpcCcpXG4gICAgICAgID8gZS50YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnLCB0cnVlKVxuICAgICAgICA6IGUudGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJylcbiAgICB9XG4gIH1cblxuICBjb25zdCBtb3VzZU1vdmUgPSBlID0+IHtcbiAgICBpZiAoZS50YXJnZXQuY2xvc2VzdCgndG9vbC1wYWxsZXRlJykgfHwgZS50YXJnZXQuY2xvc2VzdCgnLm1ldGF0aXAnKSB8fCBlLnRhcmdldC5jbG9zZXN0KCdob3RrZXktbWFwJykpIHJldHVyblxuXG4gICAgZS5hbHRLZXlcbiAgICAgID8gZS50YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLXBpbmhvdmVyJywgdHJ1ZSlcbiAgICAgIDogZS50YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBpbmhvdmVyJylcblxuICAgIC8vIGlmIG5vZGUgaXMgaW4gb3VyIGhhc2ggKGFscmVhZHkgY3JlYXRlZClcbiAgICBpZiAodGlwX21hcFt0aXBfa2V5KGUudGFyZ2V0KV0pIHtcbiAgICAgIC8vIHJldHVybiBpZiBpdCdzIHBpbm5lZFxuICAgICAgaWYgKGUudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJykpIFxuICAgICAgICByZXR1cm5cbiAgICAgIC8vIG90aGVyd2lzZSB1cGRhdGUgcG9zaXRpb25cbiAgICAgIGNvbnN0IHRpcCA9IHRpcF9tYXBbdGlwX2tleShlLnRhcmdldCldLnRpcFxuICAgICAgdGlwLnN0eWxlID0gdGlwX3Bvc2l0aW9uKHRpcCwgZSlcbiAgICB9XG4gICAgLy8gY3JlYXRlIG5ldyB0aXBcbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHRpcCA9IHRlbXBsYXRlKGUpXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRpcClcblxuICAgICAgdGlwLnN0eWxlID0gdGlwX3Bvc2l0aW9uKHRpcCwgZSlcblxuICAgICAgJChlLnRhcmdldCkub24oJ21vdXNlb3V0IERPTU5vZGVSZW1vdmVkJywgbW91c2VPdXQpXG4gICAgICAkKGUudGFyZ2V0KS5vbignY2xpY2snLCB0b2dnbGVQaW5uZWQpXG5cbiAgICAgIHRpcF9tYXBbdGlwX2tleShlLnRhcmdldCldID0geyB0aXAsIGUgfVxuICAgIH1cbiAgfVxuXG4gICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxuXG4gIGhvdGtleXMoJ2VzYycsIF8gPT4gcmVtb3ZlQWxsKCkpXG5cbiAgY29uc3QgaGlkZUFsbCA9ICgpID0+XG4gICAgT2JqZWN0LnZhbHVlcyh0aXBfbWFwKVxuICAgICAgLmZvckVhY2goKHt0aXB9KSA9PiB7XG4gICAgICAgIHRpcC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICQodGlwKS5vZmYoJ21vdXNlb3V0JywgbW91c2VPdXQpXG4gICAgICAgICQodGlwKS5vZmYoJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuICAgICAgfSlcblxuICBjb25zdCByZW1vdmVBbGwgPSAoKSA9PiB7XG4gICAgT2JqZWN0LnZhbHVlcyh0aXBfbWFwKVxuICAgICAgLmZvckVhY2goKHt0aXB9KSA9PiB7XG4gICAgICAgIHRpcC5yZW1vdmUoKVxuICAgICAgICAkKHRpcCkub2ZmKCdtb3VzZW91dCcsIG1vdXNlT3V0KVxuICAgICAgICAkKHRpcCkub2ZmKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcbiAgICAgIH0pXG4gICAgXG4gICAgJCgnW2RhdGEtbWV0YXRpcF0nKS5hdHRyKCdkYXRhLW1ldGF0aXAnLCBudWxsKVxuXG4gICAgdGlwX21hcCA9IHt9XG4gIH1cblxuICBPYmplY3QudmFsdWVzKHRpcF9tYXApXG4gICAgLmZvckVhY2goKHt0aXAsZX0pID0+IHtcbiAgICAgIHRpcC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGlwLmlubmVySFRNTCA9IHRlbXBsYXRlKGUpLmlubmVySFRNTFxuICAgICAgdGlwLm9uKCdtb3VzZW91dCcsIG1vdXNlT3V0KVxuICAgICAgdGlwLm9uKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcbiAgICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgJCgnYm9keScpLm9mZignbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxuICAgIGhvdGtleXMudW5iaW5kKCdlc2MnKVxuICAgIGhpZGVBbGwoKVxuICB9XG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IGdldFN0eWxlLCBzaG93SGlkZVNlbGVjdGVkIH0gZnJvbSAnLi91dGlscy5qcydcblxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sc2hpZnQrJHtldmVudH1gXG4gICwgJycpXG4gIC5zdWJzdHJpbmcoMSlcblxuY29uc3QgY29tbWFuZF9ldmVudHMgPSAnY21kK3VwLGNtZCtkb3duJ1xuXG5leHBvcnQgZnVuY3Rpb24gQm94U2hhZG93KHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VCb3hTaGFkb3coc2VsZWN0ZWROb2Rlcywga2V5cywgJ3NpemUnKVxuICAgICAgICA6IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAneCcpXG4gICAgZWxzZVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAnYmx1cicpXG4gICAgICAgIDogY2hhbmdlQm94U2hhZG93KHNlbGVjdGVkTm9kZXMsIGtleXMsICd5JylcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGxldCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIGNoYW5nZUJveFNoYWRvdygkKHNlbGVjdG9yKSwga2V5cywgJ2luc2V0JylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuY29uc3QgZW5zdXJlSGFzU2hhZG93ID0gZWwgPT4ge1xuICBpZiAoZWwuc3R5bGUuYm94U2hhZG93ID09ICcnIHx8IGVsLnN0eWxlLmJveFNoYWRvdyA9PSAnbm9uZScpXG4gICAgZWwuc3R5bGUuYm94U2hhZG93ID0gJ2hzbGEoMCwwJSwwJSw1MCUpIDAgMCAwIDAnXG4gIHJldHVybiBlbFxufVxuXG4vLyB0b2RvOiB3b3JrIGFyb3VuZCB0aGlzIHByb3BNYXAgd2l0aCBhIGJldHRlciBzcGxpdFxuY29uc3QgcHJvcE1hcCA9IHtcbiAgJ3gnOiAgICAgIDQsXG4gICd5JzogICAgICA1LFxuICAnYmx1cic6ICAgNixcbiAgJ3NpemUnOiAgIDcsXG4gICdpbnNldCc6ICA4LFxufVxuXG5jb25zdCBwYXJzZUN1cnJlbnRTaGFkb3cgPSBlbCA9PiBnZXRTdHlsZShlbCwgJ2JveFNoYWRvdycpLnNwbGl0KCcgJylcblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUJveFNoYWRvdyhlbHMsIGRpcmVjdGlvbiwgcHJvcCkge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUhhc1NoYWRvdylcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwsIDE1MDApKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgICdib3hTaGFkb3cnLFxuICAgICAgY3VycmVudDogICBwYXJzZUN1cnJlbnRTaGFkb3coZWwpLCAvLyBbXCJyZ2IoMjU1LFwiLCBcIjAsXCIsIFwiMClcIiwgXCIwcHhcIiwgXCIwcHhcIiwgXCIxcHhcIiwgXCIwcHhcIl1cbiAgICAgIHByb3BJbmRleDogcGFyc2VDdXJyZW50U2hhZG93KGVsKVswXS5pbmNsdWRlcygncmdiYScpID8gcHJvcE1hcFtwcm9wXSA6IHByb3BNYXBbcHJvcF0gLSAxXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+IHtcbiAgICAgIGxldCB1cGRhdGVkID0gWy4uLnBheWxvYWQuY3VycmVudF1cbiAgICAgIGxldCBjdXIgICAgID0gcGFyc2VJbnQocGF5bG9hZC5jdXJyZW50W3BheWxvYWQucHJvcEluZGV4XSlcblxuICAgICAgaWYgKHByb3AgPT0gJ2JsdXInKSB7XG4gICAgICAgIHVwZGF0ZWRbcGF5bG9hZC5wcm9wSW5kZXhdID0gZGlyZWN0aW9uLmluY2x1ZGVzKCdkb3duJylcbiAgICAgICAgICA/IGAke2N1ciAtIDF9cHhgXG4gICAgICAgICAgOiBgJHtjdXIgKyAxfXB4YFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAocHJvcCA9PSAnaW5zZXQnKSB7XG4gICAgICAgIHVwZGF0ZWRbcGF5bG9hZC5wcm9wSW5kZXhdID0gZGlyZWN0aW9uLmluY2x1ZGVzKCdkb3duJylcbiAgICAgICAgICA/ICcnXG4gICAgICAgICAgOiAnaW5zZXQnXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdXBkYXRlZFtwYXlsb2FkLnByb3BJbmRleF0gPSBkaXJlY3Rpb24uaW5jbHVkZXMoJ2xlZnQnKSB8fCBkaXJlY3Rpb24uaW5jbHVkZXMoJ3VwJylcbiAgICAgICAgICA/IGAke2N1ciAtIDF9cHhgXG4gICAgICAgICAgOiBgJHtjdXIgKyAxfXB4YFxuICAgICAgfVxuXG4gICAgICBwYXlsb2FkLnZhbHVlID0gdXBkYXRlZFxuICAgICAgcmV0dXJuIHBheWxvYWRcbiAgICB9KVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB2YWx1ZS5qb2luKCcgJykpXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgVGlueUNvbG9yIH0gZnJvbSAnQGN0cmwvdGlueWNvbG9yJ1xuXG5pbXBvcnQgeyBnZXRTdHlsZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4vdXRpbHMuanMnXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuICAuc3BsaXQoJywnKVxuICAucmVkdWNlKChldmVudHMsIGV2ZW50KSA9PiBcbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbi8vIHRvZG86IGFscGhhIGFzIGNtZCtsZWZ0LGNtZCtzaGlmdCtsZWZ0LGNtZCtyaWdodCxjbWQrc2hpZnQrcmlnaHRcbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gJ2NtZCt1cCxjbWQrc2hpZnQrdXAsY21kK2Rvd24sY21kK3NoaWZ0K2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBIdWVTaGlmdChzZWxlY3Rvcikge1xuICBob3RrZXlzKGtleV9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBsZXQgc2VsZWN0ZWROb2RlcyA9ICQoc2VsZWN0b3IpXG4gICAgICAsIGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG5cbiAgICBpZiAoa2V5cy5pbmNsdWRlcygnbGVmdCcpIHx8IGtleXMuaW5jbHVkZXMoJ3JpZ2h0JykpXG4gICAgICBjaGFuZ2VIdWUoc2VsZWN0ZWROb2Rlcywga2V5cywgJ3MnKVxuICAgIGVsc2VcbiAgICAgIGNoYW5nZUh1ZShzZWxlY3RlZE5vZGVzLCBrZXlzLCAnbCcpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBsZXQga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcbiAgICBjaGFuZ2VIdWUoJChzZWxlY3RvciksIGtleXMsICdoJylcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuLy8gdG9kbzogbW9yZSBob3RrZXlzXG4vLyBiOiBibGFja1xuLy8gdzogd2hpdGVcbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VIdWUoZWxzLCBkaXJlY3Rpb24sIHByb3ApIHtcbiAgZWxzXG4gICAgLm1hcChzaG93SGlkZVNlbGVjdGVkKVxuICAgIC5tYXAoZWwgPT4ge1xuICAgICAgY29uc3QgRkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsLCAnY29sb3InKSlcbiAgICAgIGNvbnN0IEJHID0gbmV3IFRpbnlDb2xvcihnZXRTdHlsZShlbCwgJ2JhY2tncm91bmRDb2xvcicpKVxuICAgICAgXG4gICAgICByZXR1cm4gQkcub3JpZ2luYWxJbnB1dCAhPSAncmdiYSgwLCAwLCAwLCAwKScgICAgICAgICAgICAgLy8gaWYgYmcgaXMgc2V0IHRvIGEgdmFsdWVcbiAgICAgICAgPyB7IGVsLCBjdXJyZW50OiBCRy50b0hzbCgpLCBzdHlsZTogJ2JhY2tncm91bmRDb2xvcicgfSAvLyB1c2UgYmdcbiAgICAgICAgOiB7IGVsLCBjdXJyZW50OiBGRy50b0hzbCgpLCBzdHlsZTogJ2NvbG9yJyB9ICAgICAgICAgICAvLyBlbHNlIHVzZSBmZ1xuICAgIH0pXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgYW1vdW50OiAgIGRpcmVjdGlvbi5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgICAgbmVnYXRpdmU6IGRpcmVjdGlvbi5pbmNsdWRlcygnZG93bicpIHx8IGRpcmVjdGlvbi5pbmNsdWRlcygnbGVmdCcpLFxuICAgICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+IHtcbiAgICAgIGlmIChwcm9wID09PSAncycgfHwgcHJvcCA9PT0gJ2wnKVxuICAgICAgICBwYXlsb2FkLmFtb3VudCA9IHBheWxvYWQuYW1vdW50ICogMC4wMVxuXG4gICAgICBwYXlsb2FkLmN1cnJlbnRbcHJvcF0gPSBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgID8gcGF5bG9hZC5jdXJyZW50W3Byb3BdIC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgIDogcGF5bG9hZC5jdXJyZW50W3Byb3BdICsgcGF5bG9hZC5hbW91bnRcblxuICAgICAgaWYgKHByb3AgPT09ICdzJyB8fCBwcm9wID09PSAnbCcpIHtcbiAgICAgICAgaWYgKHBheWxvYWQuY3VycmVudFtwcm9wXSA+IDEpIHBheWxvYWQuY3VycmVudFtwcm9wXSA9IDFcbiAgICAgICAgaWYgKHBheWxvYWQuY3VycmVudFtwcm9wXSA8IDApIHBheWxvYWQuY3VycmVudFtwcm9wXSA9IDBcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBheWxvYWRcbiAgICB9KVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCBjdXJyZW50fSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IG5ldyBUaW55Q29sb3IoY3VycmVudCkudG9Ic2xTdHJpbmcoKSlcbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5cbmltcG9ydCB7IGN1cnNvciwgbW92ZSwgc2VhcmNoLCBtYXJnaW4sIHBhZGRpbmcsIGZvbnQsIGluc3BlY3RvcixcbiAgICAgICAgIHR5cGUsIGFsaWduLCB0cmFuc2Zvcm0sIHJlc2l6ZSwgYm9yZGVyLCBodWVzaGlmdCwgYm94c2hhZG93IH0gZnJvbSAnLi90b29scGFsbGV0ZS5pY29ucycgXG5pbXBvcnQgeyBcbiAgU2VsZWN0YWJsZSwgTW92ZWFibGUsIFBhZGRpbmcsIE1hcmdpbiwgRWRpdFRleHQsIEZvbnQsIEZsZXgsIFNlYXJjaCxcbiAgQ29sb3JQaWNrZXIsIEJveFNoYWRvdywgSHVlU2hpZnQsIE1ldGFUaXBcbn0gZnJvbSAnLi4vZmVhdHVyZXMvJ1xuXG4vLyB0b2RvOiByZXNpemVcbi8vIHRvZG86IHVuZG9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRvb2xQYWxsZXRlIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLnRvb2xiYXJfbW9kZWwgPSB7XG4gICAgICBpOiB7IHRvb2w6ICdpbnNwZWN0b3InLCBpY29uOiBpbnNwZWN0b3IsIGxhYmVsOiAnSW5zcGVjdCcsIGRlc2NyaXB0aW9uOiAnUGVhayBpbnRvIHRoZSBjb21tb24vY3VycmVudCBzdHlsZXMgb2YgYW4gZWxlbWVudCcgfSxcbiAgICAgIHY6IHsgdG9vbDogJ21vdmUnLCBpY29uOiBtb3ZlLCBsYWJlbDogJ01vdmUnLCBkZXNjcmlwdGlvbjogJ1NoaWZ0IHRoaW5ncyBhcm91bmQsIGNvcHkvcGFzdGUsIGR1cGxpY2F0ZScgfSxcbiAgICAgIC8vIHI6IHsgdG9vbDogJ3Jlc2l6ZScsIGljb246IHJlc2l6ZSwgbGFiZWw6ICdSZXNpemUnLCBkZXNjcmlwdGlvbjogJycgfSxcbiAgICAgIG06IHsgdG9vbDogJ21hcmdpbicsIGljb246IG1hcmdpbiwgbGFiZWw6ICdNYXJnaW4nLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSB0aGUgbWFyZ2luIGFyb3VuZCAxIG9yIG1hbnkgc2VsZWN0ZWQgZWxlbWVudHMnIH0sXG4gICAgICBwOiB7IHRvb2w6ICdwYWRkaW5nJywgaWNvbjogcGFkZGluZywgbGFiZWw6ICdQYWRkaW5nJywgZGVzY3JpcHRpb246ICdDaGFuZ2UgdGhlIHBhZGRpbmcgYXJvdW5kIDEgb3IgbWFueSBzZWxlY3RlZCBlbGVtZW50cycgfSxcbiAgICAgIC8vIGI6IHsgdG9vbDogJ2JvcmRlcicsIGljb246IGJvcmRlciwgbGFiZWw6ICdCb3JkZXInLCBkZXNjcmlwdGlvbjogJycgfSxcbiAgICAgIGE6IHsgdG9vbDogJ2FsaWduJywgaWNvbjogYWxpZ24sIGxhYmVsOiAnRmxleGJveCBBbGlnbicsIGRlc2NyaXB0aW9uOiAnUXVpY2sgYWxpZ25tZW50IGFkanVzdG1lbnRzJyB9LFxuICAgICAgaDogeyB0b29sOiAnaHVlc2hpZnQnLCBpY29uOiBodWVzaGlmdCwgbGFiZWw6ICdIdWUgU2hpZnRlcicsIGRlc2NyaXB0aW9uOiAnU2hpZnQgdGhlIGJyaWdodG5lc3MsIHNhdHVyYXRpb24gJiBodWUnIH0sXG4gICAgICBkOiB7IHRvb2w6ICdib3hzaGFkb3cnLCBpY29uOiBib3hzaGFkb3csIGxhYmVsOiAnU2hhZG93JywgZGVzY3JpcHRpb246ICdNb3ZlIG9yIGNyZWF0ZSBhIHNoYWRvdycgfSxcbiAgICAgIC8vIHQ6IHsgdG9vbDogJ3RyYW5zZm9ybScsIGljb246IHRyYW5zZm9ybSwgbGFiZWw6ICczRCBUcmFuc2Zvcm0nLCBkZXNjcmlwdGlvbjogJycgfSxcbiAgICAgIGY6IHsgdG9vbDogJ2ZvbnQnLCBpY29uOiBmb250LCBsYWJlbDogJ0ZvbnQgU3R5bGVzJywgZGVzY3JpcHRpb246ICdDaGFuZ2Ugc2l6ZSwgbGVhZGluZywga2VybmluZywgJiB3ZWlnaHRzJyB9LFxuICAgICAgZTogeyB0b29sOiAndGV4dCcsIGljb246IHR5cGUsIGxhYmVsOiAnRWRpdCBUZXh0JywgZGVzY3JpcHRpb246ICdDaGFuZ2UgYW55IHRleHQgb24gdGhlIHBhZ2UnIH0sXG4gICAgICBzOiB7IHRvb2w6ICdzZWFyY2gnLCBpY29uOiBzZWFyY2gsIGxhYmVsOiAnU2VhcmNoJywgZGVzY3JpcHRpb246ICdTZWxlY3QgZWxlbWVudHMgYnkgc2VhcmNoaW5nIGZvciB0aGVtJyB9LFxuICAgIH1cblxuICAgIHRoaXMuJHNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnb3Blbid9KVxuICAgIHRoaXMuJHNoYWRvdy5pbm5lckhUTUwgPSB0aGlzLnJlbmRlcigpXG5cbiAgICB0aGlzLnNlbGVjdG9yRW5naW5lID0gU2VsZWN0YWJsZSgpXG4gICAgdGhpcy5jb2xvclBpY2tlciAgICA9IENvbG9yUGlja2VyKHRoaXMuJHNoYWRvdywgdGhpcy5zZWxlY3RvckVuZ2luZSlcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICQoJ2xpW2RhdGEtdG9vbF0nLCB0aGlzLiRzaGFkb3cpLm9uKCdjbGljaycsIGUgPT4gXG4gICAgICB0aGlzLnRvb2xTZWxlY3RlZChlLmN1cnJlbnRUYXJnZXQpICYmIGUuc3RvcFByb3BhZ2F0aW9uKCkpXG5cbiAgICBPYmplY3QuZW50cmllcyh0aGlzLnRvb2xiYXJfbW9kZWwpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT5cbiAgICAgIGhvdGtleXMoa2V5LCBlID0+IFxuICAgICAgICB0aGlzLnRvb2xTZWxlY3RlZChcbiAgICAgICAgICAkKGBbZGF0YS10b29sPVwiJHt2YWx1ZS50b29sfVwiXWAsIHRoaXMuJHNoYWRvdylbMF0pKSlcblxuICAgIHRoaXMudG9vbFNlbGVjdGVkKCQoJ1tkYXRhLXRvb2w9XCJpbnNwZWN0b3JcIl0nLCB0aGlzLiRzaGFkb3cpWzBdKVxuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUoKVxuICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUuZGlzY29ubmVjdCgpXG4gICAgaG90a2V5cy51bmJpbmQoXG4gICAgICBPYmplY3Qua2V5cyh0aGlzLnRvb2xiYXJfbW9kZWwpLnJlZHVjZSgoZXZlbnRzLCBrZXkpID0+XG4gICAgICAgIGV2ZW50cyArPSAnLCcgKyBrZXksICcnKSlcbiAgfVxuXG4gIHRvb2xTZWxlY3RlZChlbCkge1xuICAgIGlmICh0eXBlb2YgZWwgPT09ICdzdHJpbmcnKVxuICAgICAgZWwgPSAkKGBbZGF0YS10b29sPVwiJHtlbH1cIl1gLCB0aGlzLiRzaGFkb3cpWzBdXG5cbiAgICBpZiAodGhpcy5hY3RpdmVfdG9vbCAmJiB0aGlzLmFjdGl2ZV90b29sLmRhdGFzZXQudG9vbCA9PT0gZWwuZGF0YXNldC50b29sKSByZXR1cm5cblxuICAgIGlmICh0aGlzLmFjdGl2ZV90b29sKSB7XG4gICAgICB0aGlzLmFjdGl2ZV90b29sLmF0dHIoJ2RhdGEtYWN0aXZlJywgbnVsbClcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlKClcbiAgICB9XG5cbiAgICBlbC5hdHRyKCdkYXRhLWFjdGl2ZScsIHRydWUpXG4gICAgdGhpcy5hY3RpdmVfdG9vbCA9IGVsXG4gICAgdGhpc1tlbC5kYXRhc2V0LnRvb2xdKClcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gYFxuICAgICAgJHt0aGlzLnN0eWxlcygpfVxuICAgICAgPG9sPlxuICAgICAgICAke09iamVjdC5lbnRyaWVzKHRoaXMudG9vbGJhcl9tb2RlbCkucmVkdWNlKChsaXN0LCBba2V5LCB2YWx1ZV0pID0+IGBcbiAgICAgICAgICAke2xpc3R9XG4gICAgICAgICAgPGxpIGFyaWEtbGFiZWw9XCIke3ZhbHVlLmxhYmVsfSBUb29sICgke2tleX0pXCIgYXJpYS1kZXNjcmlwdGlvbj1cIiR7dmFsdWUuZGVzY3JpcHRpb259XCIgZGF0YS10b29sPVwiJHt2YWx1ZS50b29sfVwiIGRhdGEtYWN0aXZlPVwiJHtrZXkgPT0gJ2knfVwiPiR7dmFsdWUuaWNvbn08L2xpPlxuICAgICAgICBgLCcnKX1cbiAgICAgICAgPGxpIGNsYXNzPVwiY29sb3JcIiBhcmlhLWxhYmVsPVwiRm9yZWdyb3VuZFwiIHN0eWxlPVwiZGlzcGxheTpub25lO1wiPlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY29sb3JcIiBpZD0nZm9yZWdyb3VuZCcgdmFsdWU9Jyc+XG4gICAgICAgIDwvbGk+XG4gICAgICAgIDxsaSBjbGFzcz1cImNvbG9yXCIgYXJpYS1sYWJlbD1cIkJhY2tncm91bmRcIiBzdHlsZT1cImRpc3BsYXk6bm9uZTtcIj5cbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImNvbG9yXCIgaWQ9J2JhY2tncm91bmQnIHZhbHVlPScnPlxuICAgICAgICA8L2xpPlxuICAgICAgPC9vbD5cbiAgICBgXG4gIH1cblxuICBzdHlsZXMoKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICB0b3A6IDFyZW07XG4gICAgICAgICAgbGVmdDogMXJlbTtcbiAgICAgICAgICB6LWluZGV4OiA5OTk5ODsgXG5cbiAgICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS10aGVtZS1iZyk7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCAwLjI1cmVtIDAuNXJlbSBoc2xhKDAsMCUsMCUsMTAlKTtcblxuICAgICAgICAgIC0tdGhlbWUtYmc6IGhzbCgwLDAlLDEwMCUpO1xuICAgICAgICAgIC0tdGhlbWUtY29sb3I6IGhvdHBpbms7XG4gICAgICAgICAgLS10aGVtZS1pY29uX2NvbG9yOiBoc2woMCwwJSwyMCUpO1xuICAgICAgICAgIC0tdGhlbWUtdG9vbF9zZWxlY3RlZDogaHNsKDAsMCUsOTglKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0ID4gb2wge1xuICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcblxuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpIHtcbiAgICAgICAgICBoZWlnaHQ6IDIuNXJlbTtcbiAgICAgICAgICB3aWR0aDogMi41cmVtO1xuICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sXTpob3ZlciB7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGJhY2tncm91bmQ6IGhzbCgwLDAlLDk4JSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLXRvb2xdOmhvdmVyOmFmdGVyLFxuICAgICAgICA6aG9zdCBsaS5jb2xvcjpob3ZlcjphZnRlciB7XG4gICAgICAgICAgY29udGVudDogYXR0cihhcmlhLWxhYmVsKSBcIlxcXFxBXCIgYXR0cihhcmlhLWRlc2NyaXB0aW9uKTtcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgbGVmdDogMTAwJTtcbiAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgei1pbmRleDogLTE7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCAwLjFyZW0gMC4xcmVtIGhzbGEoMCwwJSwwJSwxMCUpO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMC41cmVtO1xuICAgICAgICAgIGJhY2tncm91bmQ6IGhvdHBpbms7XG4gICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMC44cmVtO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaS5jb2xvcjpob3ZlcjphZnRlciB7XG4gICAgICAgICAgdG9wOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sPSdhbGlnbiddID4gc3ZnIHtcbiAgICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZVooOTBkZWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS1hY3RpdmU9dHJ1ZV0ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLXRoZW1lLXRvb2xfc2VsZWN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS1hY3RpdmU9dHJ1ZV0gPiBzdmc6bm90KC5pY29uLWN1cnNvcikgeyBcbiAgICAgICAgICBmaWxsOiB2YXIoLS10aGVtZS1jb2xvcik7IFxuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS1hY3RpdmU9dHJ1ZV0gPiAuaWNvbi1jdXJzb3IgeyBcbiAgICAgICAgICBzdHJva2U6IHZhcigtLXRoZW1lLWNvbG9yKTsgXG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaS5jb2xvciB7XG4gICAgICAgICAgaGVpZ2h0OiAyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGkuY29sb3Ige1xuICAgICAgICAgIGJvcmRlci10b3A6IDAuMjVyZW0gc29saWQgaHNsKDAsMCUsOTAlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpID4gc3ZnIHtcbiAgICAgICAgICB3aWR0aDogNTAlO1xuICAgICAgICAgIGZpbGw6IHZhcigtLXRoZW1lLWljb25fY29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGkgPiBzdmcuaWNvbi1jdXJzb3Ige1xuICAgICAgICAgIHdpZHRoOiAzNSU7XG4gICAgICAgICAgZmlsbDogd2hpdGU7XG4gICAgICAgICAgc3Ryb2tlOiB2YXIoLS10aGVtZS1pY29uX2NvbG9yKTtcbiAgICAgICAgICBzdHJva2Utd2lkdGg6IDJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpW2RhdGEtdG9vbD1cInNlYXJjaFwiXSA+IC5zZWFyY2gge1xuICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICBsZWZ0OiAxMDAlO1xuICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgei1pbmRleDogOTk5OTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpW2RhdGEtdG9vbD1cInNlYXJjaFwiXSA+IC5zZWFyY2ggPiBpbnB1dCB7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMXJlbTtcbiAgICAgICAgICBwYWRkaW5nOiAwLjRlbTtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICB3aWR0aDogMjUwcHg7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgICBjYXJldC1jb2xvcjogaG90cGluaztcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGlucHV0W3R5cGU9J2NvbG9yJ10ge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICAgIGJvcmRlcjogd2hpdGU7XG4gICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGlucHV0W3R5cGU9J2NvbG9yJ106Zm9jdXMge1xuICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBpbnB1dFt0eXBlPSdjb2xvciddOjotd2Via2l0LWNvbG9yLXN3YXRjaC13cmFwcGVyIHsgXG4gICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGlucHV0W3R5cGU9J2NvbG9yJ106Oi13ZWJraXQtY29sb3Itc3dhdGNoIHsgXG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgaW5wdXRbdHlwZT0nY29sb3InXVt2YWx1ZT0nJ106Oi13ZWJraXQtY29sb3Itc3dhdGNoIHsgXG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDsgXG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE1NWRlZywgI2ZmZmZmZiAwJSwjZmZmZmZmIDQ2JSwjZmYwMDAwIDQ2JSwjZmYwMDAwIDU0JSwjZmZmZmZmIDU1JSwjZmZmZmZmIDEwMCUpO1xuICAgICAgICB9XG4gICAgICA8L3N0eWxlPlxuICAgIGBcbiAgfVxuXG4gIG1vdmUoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBNb3ZlYWJsZSgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKVxuICB9XG5cbiAgbWFyZ2luKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gTWFyZ2luKCdbZGF0YS1zZWxlY3RlZD10cnVlXScpIFxuICB9XG5cbiAgcGFkZGluZygpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IFBhZGRpbmcoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJykgXG4gIH1cblxuICBmb250KCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gRm9udCgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKVxuICB9IFxuXG4gIHRleHQoKSB7XG4gICAgdGhpcy5zZWxlY3RvckVuZ2luZS5vblNlbGVjdGVkVXBkYXRlKEVkaXRUZXh0KVxuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gKCkgPT4gXG4gICAgICB0aGlzLnNlbGVjdG9yRW5naW5lLnJlbW92ZVNlbGVjdGVkQ2FsbGJhY2soRWRpdFRleHQpXG4gIH1cblxuICBhbGlnbigpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IEZsZXgoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJylcbiAgfVxuXG4gIHNlYXJjaCgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IFNlYXJjaCh0aGlzLnNlbGVjdG9yRW5naW5lLCAkKCdbZGF0YS10b29sPVwic2VhcmNoXCJdJywgdGhpcy4kc2hhZG93KSlcbiAgfVxuXG4gIGJveHNoYWRvdygpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IEJveFNoYWRvdygnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKVxuICB9XG5cbiAgaHVlc2hpZnQoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBIdWVTaGlmdCgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKVxuICB9XG5cbiAgaW5zcGVjdG9yKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gTWV0YVRpcCgpXG4gIH1cblxuICBhY3RpdmVUb29sKCkge1xuICAgIHJldHVybiB0aGlzLmFjdGl2ZV90b29sLmRhdGFzZXQudG9vbFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndG9vbC1wYWxsZXRlJywgVG9vbFBhbGxldGUpIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSG90a2V5TWFwIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgdGhpcy5rZXlib2FyZF9tb2RlbCA9IHtcbiAgICAgIG51bTogICAgWydgJywnMScsJzInLCczJywnNCcsJzUnLCc2JywnNycsJzgnLCc5JywnMCcsJy0nLCc9JywnZGVsZXRlJ10sXG4gICAgICB0YWI6ICAgIFsndGFiJywncScsJ3cnLCdlJywncicsJ3QnLCd5JywndScsJ2knLCdvJywncCcsJ1snLCddJywnXFxcXCddLFxuICAgICAgY2FwczogICBbJ2NhcHMnLCdhJywncycsJ2QnLCdmJywnZycsJ2gnLCdqJywnaycsJ2wnLCdcXCcnLCdyZXR1cm4nXSxcbiAgICAgIHNoaWZ0OiAgWydzaGlmdCcsJ3onLCd4JywnYycsJ3YnLCdiJywnbicsJ20nLCcsJywnLicsJy8nLCdzaGlmdCddLFxuICAgICAgc3BhY2U6ICBbJ2N0cmwnLCdhbHQnLCdjbWQnLCdzcGFjZWJhcicsJ2NtZCcsJ2FsdCcsJ2N0cmwnXVxuICAgIH1cblxuICAgIC8vIGluZGV4OmZsZXhcbiAgICB0aGlzLmtleV9zaXplX21vZGVsID0ge1xuICAgICAgbnVtOiAgICB7MTI6Mn0sXG4gICAgICB0YWI6ICAgIHswOjJ9LFxuICAgICAgY2FwczogICB7MDozLDExOjN9LFxuICAgICAgc2hpZnQ6ICB7MDo2LDExOjZ9LFxuICAgICAgc3BhY2U6ICB7MzoxMCw0OjJ9LFxuICAgIH1cblxuICAgIHRoaXMuJHNoYWRvdyAgICAgICAgICAgID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pXG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCAgPSB0aGlzLnJlbmRlcigpXG5cbiAgICB0aGlzLnRvb2wgICAgICAgICAgICAgICA9ICdwYWRkaW5nJ1xuICAgIHRoaXMuJGNvbW1hbmQgICAgICAgICAgID0gJCgnW2NvbW1hbmRdJywgdGhpcy4kc2hhZG93KVxuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy4kc2hpZnQgID0gJCgnW2tleWJvYXJkXSA+IHNlY3Rpb24gPiBbc2hpZnRdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJGN0cmwgICA9ICQoJ1trZXlib2FyZF0gPiBzZWN0aW9uID4gW2N0cmxdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJGFsdCAgICA9ICQoJ1trZXlib2FyZF0gPiBzZWN0aW9uID4gW2FsdF0nLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kY21kICAgID0gJCgnW2tleWJvYXJkXSA+IHNlY3Rpb24gPiBbY21kXScsIHRoaXMuJHNoYWRvdylcbiAgICB0aGlzLiR1cCAgICAgPSAkKCdbYXJyb3dzXSBbdXBdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJGRvd24gICA9ICQoJ1thcnJvd3NdIFtkb3duXScsIHRoaXMuJHNoYWRvdylcbiAgICB0aGlzLiRsZWZ0ICAgPSAkKCdbYXJyb3dzXSBbbGVmdF0nLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kcmlnaHQgID0gJCgnW2Fycm93c10gW3JpZ2h0XScsIHRoaXMuJHNoYWRvdylcblxuICAgIGhvdGtleXMoJ3NoaWZ0Ky8nLCBlID0+XG4gICAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ICE9PSAnZmxleCdcbiAgICAgICAgPyB0aGlzLnNob3coKVxuICAgICAgICA6IHRoaXMuaGlkZSgpKVxuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgaG90a2V5cy51bmJpbmQoJyonKVxuICB9XG5cbiAgc2hvdygpIHtcbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnXG4gICAgaG90a2V5cygnKicsIChlLCBoYW5kbGVyKSA9PiBcbiAgICAgIHRoaXMud2F0Y2hLZXlzKGUsIGhhbmRsZXIpKVxuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLiRzaGFkb3cuaG9zdC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgaG90a2V5cy51bmJpbmQoJyonKVxuICB9XG5cbiAgc2V0VG9vbCh0b29sKSB7XG4gICAgaWYgKHRvb2wpIHRoaXMudG9vbCA9IHRvb2xcbiAgfVxuXG4gIHdhdGNoS2V5cyhlLCBoYW5kbGVyKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgdGhpcy4kc2hpZnQuYXR0cigncHJlc3NlZCcsIGhvdGtleXMuc2hpZnQpXG4gICAgdGhpcy4kY3RybC5hdHRyKCdwcmVzc2VkJywgaG90a2V5cy5jdHJsKVxuICAgIHRoaXMuJGFsdC5hdHRyKCdwcmVzc2VkJywgaG90a2V5cy5hbHQpXG4gICAgdGhpcy4kY21kLmF0dHIoJ3ByZXNzZWQnLCBob3RrZXlzLmNtZClcbiAgICB0aGlzLiR1cC5hdHRyKCdwcmVzc2VkJywgZS5jb2RlID09PSAnQXJyb3dVcCcpXG4gICAgdGhpcy4kZG93bi5hdHRyKCdwcmVzc2VkJywgZS5jb2RlID09PSAnQXJyb3dEb3duJylcbiAgICB0aGlzLiRsZWZ0LmF0dHIoJ3ByZXNzZWQnLCBlLmNvZGUgPT09ICdBcnJvd0xlZnQnKVxuICAgIHRoaXMuJHJpZ2h0LmF0dHIoJ3ByZXNzZWQnLCBlLmNvZGUgPT09ICdBcnJvd1JpZ2h0JylcblxuICAgIGxldCBhbW91bnQgPSBob3RrZXlzLnNoaWZ0ID8gMTAgOiAxXG5cbiAgICBsZXQgbmVnYXRpdmUgPSBob3RrZXlzLmFsdCA/ICdTdWJ0cmFjdCcgOiAnQWRkJ1xuICAgIGxldCBuZWdhdGl2ZV9tb2RpZmllciA9IGhvdGtleXMuYWx0ID8gJ2Zyb20nIDogJ3RvJ1xuXG4gICAgbGV0IHNpZGUgPSAnW2Fycm93IGtleV0nXG4gICAgaWYgKGUuY29kZSA9PT0gJ0Fycm93VXAnKSAgICAgc2lkZSA9ICd0aGUgdG9wIHNpZGUnXG4gICAgaWYgKGUuY29kZSA9PT0gJ0Fycm93RG93bicpICAgc2lkZSA9ICd0aGUgYm90dG9tIHNpZGUnXG4gICAgaWYgKGUuY29kZSA9PT0gJ0Fycm93TGVmdCcpICAgc2lkZSA9ICd0aGUgbGVmdCBzaWRlJ1xuICAgIGlmIChlLmNvZGUgPT09ICdBcnJvd1JpZ2h0JykgIHNpZGUgPSAndGhlIHJpZ2h0IHNpZGUnXG4gICAgaWYgKGhvdGtleXMuY21kKSAgICAgICAgICAgICAgc2lkZSA9ICdhbGwgc2lkZXMnXG5cbiAgICB0aGlzLiRjb21tYW5kWzBdLmlubmVySFRNTCA9IGBcbiAgICAgIDxzcGFuIG5lZ2F0aXZlPiR7bmVnYXRpdmV9IDwvc3Bhbj5cbiAgICAgIDxzcGFuIHRvb2w+JHt0aGlzLnRvb2x9PC9zcGFuPlxuICAgICAgPHNwYW4gbGlnaHQ+ICR7bmVnYXRpdmVfbW9kaWZpZXJ9IDwvc3Bhbj5cbiAgICAgIDxzcGFuIHNpZGU+JHtzaWRlfTwvc3Bhbj5cbiAgICAgIDxzcGFuIGxpZ2h0PiBieSA8L3NwYW4+XG4gICAgICA8c3BhbiBhbW91bnQ+JHthbW91bnR9PC9zcGFuPlxuICAgIGBcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gYFxuICAgICAgJHt0aGlzLnN0eWxlcygpfVxuICAgICAgPGFydGljbGU+XG4gICAgICAgIDxkaXYgY29tbWFuZD4mbmJzcDs8L2Rpdj5cbiAgICAgICAgPGRpdiBjYXJkPlxuICAgICAgICAgIDxkaXYga2V5Ym9hcmQ+XG4gICAgICAgICAgICAke09iamVjdC5lbnRyaWVzKHRoaXMua2V5Ym9hcmRfbW9kZWwpLnJlZHVjZSgoa2V5Ym9hcmQsIFtyb3dfbmFtZSwgcm93XSkgPT4gYFxuICAgICAgICAgICAgICAke2tleWJvYXJkfVxuICAgICAgICAgICAgICA8c2VjdGlvbiAke3Jvd19uYW1lfT4ke3Jvdy5yZWR1Y2UoKHJvdywga2V5LCBpKSA9PiBgXG4gICAgICAgICAgICAgICAgJHtyb3d9PHNwYW4gJHtrZXl9IHN0eWxlPVwiZmxleDoke3RoaXMua2V5X3NpemVfbW9kZWxbcm93X25hbWVdW2ldIHx8IDF9O1wiPiR7a2V5fTwvc3Bhbj5cbiAgICAgICAgICAgICAgYCwgJycpfVxuICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICBgLCAnJyl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxzZWN0aW9uIGFycm93cz5cbiAgICAgICAgICAgICAgPHNwYW4gdXA+4oaRPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBkb3duPuKGkzwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gbGVmdD7ihpA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIHJpZ2h0PuKGkjwvc3Bhbj5cbiAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2FydGljbGU+XG4gICAgYFxuICB9XG5cbiAgc3R5bGVzKCkge1xuICAgIHJldHVybiBgXG4gICAgICA8c3R5bGU+XG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICAgICAgICB6LWluZGV4OiA5OTk7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICB3aWR0aDogMTAwdnc7XG4gICAgICAgICAgaGVpZ2h0OiAxMDB2aDtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBoc2woMCwwJSw5NSUpO1xuXG4gICAgICAgICAgLS1kYXJrLWdyZXk6IGhzbCgwLDAlLDQwJSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbY29tbWFuZF0ge1xuICAgICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIGZvbnQtc2l6ZTogM3Z3O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiBsaWdodGVyO1xuICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAwLjFlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFtjb21tYW5kXSA+IFtsaWdodF0ge1xuICAgICAgICAgIGNvbG9yOiBoc2woMCwwJSw2MCUpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgW2NhcmRdIHtcbiAgICAgICAgICBwYWRkaW5nOiAxcmVtO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgMC4yNXJlbSAwLjI1cmVtIGhzbGEoMCwwJSwwJSwyMCUpO1xuICAgICAgICAgIGNvbG9yOiB2YXIoLS1kYXJrLWdyZXkpO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBzZWN0aW9uIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3Qgc2VjdGlvbiA+IHNwYW4sIDpob3N0IFthcnJvd3NdID4gc3BhbiB7XG4gICAgICAgICAgYmFja2dyb3VuZDogaHNsKDAsMCUsOTAlKTtcbiAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIG1hcmdpbjogMnB4O1xuICAgICAgICAgIHBhZGRpbmc6IDEuNXZ3O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMC43NXJlbTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3Qgc3BhbltwcmVzc2VkPVwidHJ1ZVwiXSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogaHNsKDIwMCwgOTAlLCA3MCUpO1xuICAgICAgICAgIGNvbG9yOiBoc2woMjAwLCA5MCUsIDIwJSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbY2FyZF0gPiBkaXY6bm90KFtrZXlib2FyZF0pIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LWVuZDtcbiAgICAgICAgICBtYXJnaW4tbGVmdDogMXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFthcnJvd3NdIHtcbiAgICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmciAxZnI7XG4gICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiAxZnIgMWZyO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgW2Fycm93c10gPiBzcGFuOm50aC1jaGlsZCgxKSB7XG4gICAgICAgICAgZ3JpZC1yb3c6IDE7XG4gICAgICAgICAgZ3JpZC1jb2x1bW46IDI7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbYXJyb3dzXSA+IHNwYW46bnRoLWNoaWxkKDIpIHtcbiAgICAgICAgICBncmlkLXJvdzogMjtcbiAgICAgICAgICBncmlkLWNvbHVtbjogMjtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFthcnJvd3NdID4gc3BhbjpudGgtY2hpbGQoMykge1xuICAgICAgICAgIGdyaWQtcm93OiAyO1xuICAgICAgICAgIGdyaWQtY29sdW1uOiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgW2Fycm93c10gPiBzcGFuOm50aC1jaGlsZCg0KSB7XG4gICAgICAgICAgZ3JpZC1yb3c6IDI7XG4gICAgICAgICAgZ3JpZC1jb2x1bW46IDM7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbY2Fwc10gPiBzcGFuOm50aC1jaGlsZCgxKSB7IGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsgfVxuICAgICAgICA6aG9zdCBbc2hpZnRdID4gc3BhbjpudGgtY2hpbGQoMSkgeyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7IH1cbiAgICAgICAgOmhvc3QgW3NoaWZ0XSA+IHNwYW46bnRoLWNoaWxkKDEyKSB7IGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7IH1cbiAgICAgIDwvc3R5bGU+XG4gICAgYFxuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgnaG90a2V5LW1hcCcsIEhvdGtleU1hcCkiXSwibmFtZXMiOlsia2V5X2V2ZW50cyIsImNvbW1hbmRfZXZlbnRzIiwic2VhcmNoIiwic3RvcEJ1YmJsaW5nIl0sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEtBQUssR0FBRztFQUNaLEVBQUUsRUFBRSxTQUFTLEtBQUssRUFBRSxFQUFFLEVBQUU7SUFDdEIsS0FBSztPQUNGLEtBQUssQ0FBQyxHQUFHLENBQUM7T0FDVixPQUFPLENBQUMsSUFBSTtRQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUM7SUFDcEMsT0FBTyxJQUFJO0dBQ1o7RUFDRCxHQUFHLEVBQUUsU0FBUyxLQUFLLEVBQUUsRUFBRSxFQUFFO0lBQ3ZCLEtBQUs7T0FDRixLQUFLLENBQUMsR0FBRyxDQUFDO09BQ1YsT0FBTyxDQUFDLElBQUk7UUFDWCxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFD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QUFDLEVBQUU7UUFDVCxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7U0FDSTtRQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ2hDO0lBQ0QsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7Q0FDakQ7Ozs7Ozs7QUFPRCxTQUFTLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUN2QixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FB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LENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDO0tBQ0osQ0FBQztDQUNMOztBQUVELE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQzs7QUFFcEMsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLENBQUM7O0FBRTFDLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7O0FBSXhELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0RyxNQUFNLGlCQUFpQixHQUFHLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMzSCxNQUFNLFFBQVEsR0FBRztJQUNiLFFBQVEsRUFBRSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDOUIsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztJQUMxQyxJQUFJLEVBQUUsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLGlCQUFpQixDQUFDO0lBQzVDLEdBQUcsRUFBRSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEdBQUcsaUJBQWlCLENBQUM7SUFDMUMsSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQztJQUM1QyxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsS0FBSyxHQUFHLGlCQUFpQixDQUFDO0lBQzFDLElBQUksRUFBRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUM7SUFDNUMsSUFBSSxFQUFFLHNEQUFzRDtJQUM1RCxJQUFJLEVBQUUsc0RBQXNEO0lBQzVELElBQUksRUFBRSxzRUFBc0U7SUFDNUUsSUFBSSxFQUFFLHNFQUFzRTtDQUMvRSxDQUFDOzs7OztBQUtGLFNBQVMsbUJBQW1CLENBQUMsS0FBSyxFQUFFO0lBQ2hDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbkMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNwQixPQUFPLEtBQUssQ0FBQztLQUNoQjtJQUNELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNsQixJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNkLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckIsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNoQjtTQUNJLElBQUksS0FBSyxLQUFLLGFBQWEsRUFBRTtRQUM5QixPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7S0FDckQ7Ozs7O0lBS0QsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNwRDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDakU7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNwRDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDakU7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNwRDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMs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Q0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEc7Ozs7SUFJRCxLQUFLLEdBQUc7UUFDSixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDNUQ7Ozs7O0lBS0QsV0FBVyxHQUFHO1FBQ1YsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEc7Ozs7O0lBS0QsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUU7UUFDdEIsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdkQ7Ozs7O0lBS0QsV0FBVyxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUU7UUFDNUIsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUN2Qzs7Ozs7SUFLRCxNQUFNLENBQUMsVUFBVSxHQUFHLEtBQUssRUFBRTtRQUN2QixPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ2hFOzs7OztJQUtELFlBQVksQ0FBQyxVQUFVLEdBQUcsS0FBSyxFQUFFO1FBQzdCLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FB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Qjs7Ozs7SUFLRCxRQUFRLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRTtRQUNsQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekIsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEVBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUM3Qjs7Ozs7O0lBTUQsTUFBTSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUU7UUFDaEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUN0QixHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFH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
