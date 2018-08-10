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

  watchImagesForUpload();

  elements.on('click', e => {
    if (isOffBounds(e.target) && !selected.filter(el => el == e.target).length) 
      return

    e.preventDefault();
    e.stopPropagation();
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
    deep_clone.removeAttribute('data-selected');
    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling);
    e.preventDefault();
  });

  hotkeys('backspace,del,delete', e => 
    selected.length && delete_all());

  hotkeys('alt+del,alt+backspace', e =>
    selected.forEach(el =>
      el.attr('style', null)));

  document.addEventListener('copy', e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      e.preventDefault();
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute('data-selected');
      this.copy_backup = $node.outerHTML;
      e.clipboardData.setData('text/html', this.copy_backup);
    }
  });

  document.addEventListener('cut', e => {
    if (selected[0] && this.node_clipboard !== selected[0]) {
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute('data-selected');
      this.copy_backup = $node.outerHTML;
      e.clipboardData.setData('text/html', this.copy_backup);
      selected[0].remove();
    }
  });

  document.addEventListener('paste', e => {
    const clipData = e.clipboardData.getData('text/html');
    const potentialHTML = clipData || this.copy_backup;
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

  hotkeys('cmd+g,cmd+shift+g', (e, {key}) => {
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

  disconnectedCallback() {}

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYmxpbmdibGluZ2pzL3NyYy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9ob3RrZXlzLWpzL2Rpc3QvaG90a2V5cy5lc20uanMiLCJjb21wb25lbnRzL3Rvb2xwYWxsZXRlLmljb25zLmpzIiwiZmVhdHVyZXMvdXRpbHMuanMiLCJmZWF0dXJlcy9tYXJnaW4uanMiLCJmZWF0dXJlcy90ZXh0LmpzIiwiZmVhdHVyZXMvbW92ZS5qcyIsImZlYXR1cmVzL2ltYWdlc3dhcC5qcyIsImZlYXR1cmVzL3NlbGVjdGFibGUuanMiLCJmZWF0dXJlcy9wYWRkaW5nLmpzIiwiZmVhdHVyZXMvZm9udC5qcyIsImZlYXR1cmVzL2ZsZXguanMiLCJmZWF0dXJlcy9zZWFyY2guanMiLCIuLi9ub2RlX21vZHVsZXMvQGN0cmwvdGlueWNvbG9yL2J1bmRsZXMvdGlueWNvbG9yLmVzMjAxNS5qcyIsImZlYXR1cmVzL2NvbG9yLmpzIiwiZmVhdHVyZXMvbWV0YXRpcC5qcyIsImZlYXR1cmVzL2JveHNoYWRvdy5qcyIsImZlYXR1cmVzL2h1ZXNoaWZ0LmpzIiwiY29tcG9uZW50cy90b29scGFsbGV0ZS5lbGVtZW50LmpzIiwiY29tcG9uZW50cy9ob3RrZXktbWFwLmVsZW1lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3VnYXIgPSB7XG4gIG9uOiBmdW5jdGlvbihuYW1lcywgZm4pIHtcbiAgICBuYW1lc1xuICAgICAgLnNwbGl0KCcgJylcbiAgICAgIC5mb3JFYWNoKG5hbWUgPT5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZuKSlcbiAgICByZXR1cm4gdGhpc1xuICB9LFxuICBvZmY6IGZ1bmN0aW9uKG5hbWVzLCBmbikge1xuICAgIG5hbWVzXG4gICAgICAuc3BsaXQoJyAnKVxuICAgICAgLmZvckVhY2gobmFtZSA9PlxuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgZm4pKVxuICAgIHJldHVybiB0aGlzXG4gIH0sXG4gIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbCkge1xuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKGF0dHIpXG5cbiAgICB2YWwgPT0gbnVsbFxuICAgICAgPyB0aGlzLnJlbW92ZUF0dHJpYnV0ZShhdHRyKVxuICAgICAgOiB0aGlzLnNldEF0dHJpYnV0ZShhdHRyLCB2YWwgfHwgJycpXG4gICAgICBcbiAgICByZXR1cm4gdGhpc1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICQocXVlcnksICRjb250ZXh0ID0gZG9jdW1lbnQpIHtcbiAgbGV0ICRub2RlcyA9IHF1ZXJ5IGluc3RhbmNlb2YgTm9kZUxpc3RcbiAgICA/IHF1ZXJ5XG4gICAgOiBxdWVyeSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IFxuICAgICAgPyBbcXVlcnldXG4gICAgICA6ICRjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG5cbiAgaWYgKCEkbm9kZXMubGVuZ3RoKSAkbm9kZXMgPSBbXVxuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKFxuICAgIFsuLi4kbm9kZXNdLm1hcCgkZWwgPT4gT2JqZWN0LmFzc2lnbigkZWwsIHN1Z2FyKSksIFxuICAgIHtcbiAgICAgIG9uOiBmdW5jdGlvbihuYW1lcywgZm4pIHtcbiAgICAgICAgdGhpcy5mb3JFYWNoKCRlbCA9PiAkZWwub24obmFtZXMsIGZuKSlcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH0sXG4gICAgICBvZmY6IGZ1bmN0aW9uKG5hbWVzLCBmbikge1xuICAgICAgICB0aGlzLmZvckVhY2goJGVsID0+ICRlbC5vZmYobmFtZXMsIGZuKSlcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH0sXG4gICAgICBhdHRyOiBmdW5jdGlvbihhdHRycywgdmFsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXR0cnMgPT09ICdzdHJpbmcnICYmIHZhbCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHJldHVybiB0aGlzWzBdLmF0dHIoYXR0cnMpXG5cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGF0dHJzID09PSAnb2JqZWN0JykgXG4gICAgICAgICAgdGhpcy5mb3JFYWNoKCRlbCA9PlxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoYXR0cnMpXG4gICAgICAgICAgICAgIC5mb3JFYWNoKChba2V5LCB2YWxdKSA9PlxuICAgICAgICAgICAgICAgICRlbC5hdHRyKGtleSwgdmFsKSkpXG5cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGF0dHJzID09ICdzdHJpbmcnICYmICh2YWwgfHwgdmFsID09IG51bGwgfHwgdmFsID09ICcnKSlcbiAgICAgICAgICB0aGlzLmZvckVhY2goJGVsID0+ICRlbC5hdHRyKGF0dHJzLCB2YWwpKVxuXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9XG4gICAgfVxuICApXG59IiwiLyohXG4gKiBob3RrZXlzLWpzIHYzLjMuNVxuICogQSBzaW1wbGUgbWljcm8tbGlicmFyeSBmb3IgZGVmaW5pbmcgYW5kIGRpc3BhdGNoaW5nIGtleWJvYXJkIHNob3J0Y3V0cy4gSXQgaGFzIG5vIGRlcGVuZGVuY2llcy5cbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE4IGtlbm55IHdvbmcgPHdvd29ob29AcXEuY29tPlxuICogaHR0cDovL2pheXdjamxvdmUuZ2l0aHViLmlvL2hvdGtleXNcbiAqIFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbnZhciBpc2ZmID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgPyBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gMCA6IGZhbHNlO1xuXG4vLyDnu5Hlrprkuovku7ZcbmZ1bmN0aW9uIGFkZEV2ZW50KG9iamVjdCwgZXZlbnQsIG1ldGhvZCkge1xuICBpZiAob2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICBvYmplY3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbWV0aG9kLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAob2JqZWN0LmF0dGFjaEV2ZW50KSB7XG4gICAgb2JqZWN0LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgbWV0aG9kKHdpbmRvdy5ldmVudCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLy8g5L+u6aWw6ZSu6L2s5o2i5oiQ5a+55bqU55qE6ZSu56CBXG5mdW5jdGlvbiBnZXRNb2RzKG1vZGlmaWVyLCBrZXkpIHtcbiAgdmFyIG1vZHMgPSBrZXkuc2xpY2UoMCwga2V5Lmxlbmd0aCAtIDEpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG1vZHMubGVuZ3RoOyBpKyspIHtcbiAgICBtb2RzW2ldID0gbW9kaWZpZXJbbW9kc1tpXS50b0xvd2VyQ2FzZSgpXTtcbiAgfXJldHVybiBtb2RzO1xufVxuXG4vLyDlpITnkIbkvKDnmoRrZXnlrZfnrKbkuLLovazmjaLmiJDmlbDnu4RcbmZ1bmN0aW9uIGdldEtleXMoa2V5KSB7XG4gIGlmICgha2V5KSBrZXkgPSAnJztcblxuICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzL2csICcnKTsgLy8g5Yy56YWN5Lu75L2V56m655m95a2X56ymLOWMheaLrOepuuagvOOAgeWItuihqOespuOAgeaNoumhteespuetieetiVxuICB2YXIga2V5cyA9IGtleS5zcGxpdCgnLCcpOyAvLyDlkIzml7borr7nva7lpJrkuKrlv6vmjbfplK7vvIzku6UnLCfliIblibJcbiAgdmFyIGluZGV4ID0ga2V5cy5sYXN0SW5kZXhPZignJyk7XG5cbiAgLy8g5b+r5o236ZSu5Y+v6IO95YyF5ZCrJywn77yM6ZyA54m55q6K5aSE55CGXG4gIGZvciAoOyBpbmRleCA+PSAwOykge1xuICAgIGtleXNbaW5kZXggLSAxXSArPSAnLCc7XG4gICAga2V5cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIGluZGV4ID0ga2V5cy5sYXN0SW5kZXhPZignJyk7XG4gIH1cblxuICByZXR1cm4ga2V5cztcbn1cblxuLy8g5q+U6L6D5L+u6aWw6ZSu55qE5pWw57uEXG5mdW5jdGlvbiBjb21wYXJlQXJyYXkoYTEsIGEyKSB7XG4gIHZhciBhcnIxID0gYTEubGVuZ3RoID49IGEyLmxlbmd0aCA/IGExIDogYTI7XG4gIHZhciBhcnIyID0gYTEubGVuZ3RoID49IGEyLmxlbmd0aCA/IGEyIDogYTE7XG4gIHZhciBpc0luZGV4ID0gdHJ1ZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycjEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYXJyMi5pbmRleE9mKGFycjFbaV0pID09PSAtMSkgaXNJbmRleCA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBpc0luZGV4O1xufVxuXG52YXIgX2tleU1hcCA9IHsgLy8g54m55q6K6ZSuXG4gIGJhY2tzcGFjZTogOCxcbiAgdGFiOiA5LFxuICBjbGVhcjogMTIsXG4gIGVudGVyOiAxMyxcbiAgcmV0dXJuOiAxMyxcbiAgZXNjOiAyNyxcbiAgZXNjYXBlOiAyNyxcbiAgc3BhY2U6IDMyLFxuICBsZWZ0OiAzNyxcbiAgdXA6IDM4LFxuICByaWdodDogMzksXG4gIGRvd246IDQwLFxuICBkZWw6IDQ2LFxuICBkZWxldGU6IDQ2LFxuICBpbnM6IDQ1LFxuICBpbnNlcnQ6IDQ1LFxuICBob21lOiAzNixcbiAgZW5kOiAzNSxcbiAgcGFnZXVwOiAzMyxcbiAgcGFnZWRvd246IDM0LFxuICBjYXBzbG9jazogMjAsXG4gICfih6onOiAyMCxcbiAgJywnOiAxODgsXG4gICcuJzogMTkwLFxuICAnLyc6IDE5MSxcbiAgJ2AnOiAxOTIsXG4gICctJzogaXNmZiA/IDE3MyA6IDE4OSxcbiAgJz0nOiBpc2ZmID8gNjEgOiAxODcsXG4gICc7JzogaXNmZiA/IDU5IDogMTg2LFxuICAnXFwnJzogMjIyLFxuICAnWyc6IDIxOSxcbiAgJ10nOiAyMjEsXG4gICdcXFxcJzogMjIwXG59O1xuXG52YXIgX21vZGlmaWVyID0geyAvLyDkv67ppbDplK5cbiAgJ+KHpyc6IDE2LFxuICBzaGlmdDogMTYsXG4gICfijKUnOiAxOCxcbiAgYWx0OiAxOCxcbiAgb3B0aW9uOiAxOCxcbiAgJ+KMgyc6IDE3LFxuICBjdHJsOiAxNyxcbiAgY29udHJvbDogMTcsXG4gICfijJgnOiBpc2ZmID8gMjI0IDogOTEsXG4gIGNtZDogaXNmZiA/IDIyNCA6IDkxLFxuICBjb21tYW5kOiBpc2ZmID8gMjI0IDogOTFcbn07XG52YXIgX2Rvd25LZXlzID0gW107IC8vIOiusOW9leaRgeS4i+eahOe7keWumumUrlxudmFyIG1vZGlmaWVyTWFwID0ge1xuICAxNjogJ3NoaWZ0S2V5JyxcbiAgMTg6ICdhbHRLZXknLFxuICAxNzogJ2N0cmxLZXknXG59O1xudmFyIF9tb2RzID0geyAxNjogZmFsc2UsIDE4OiBmYWxzZSwgMTc6IGZhbHNlIH07XG52YXIgX2hhbmRsZXJzID0ge307XG5cbi8vIEYxfkYxMiDnibnmrorplK5cbmZvciAodmFyIGsgPSAxOyBrIDwgMjA7IGsrKykge1xuICBfa2V5TWFwWydmJyArIGtdID0gMTExICsgaztcbn1cblxuLy8g5YW85a65RmlyZWZveOWkhOeQhlxubW9kaWZpZXJNYXBbaXNmZiA/IDIyNCA6IDkxXSA9ICdtZXRhS2V5Jztcbl9tb2RzW2lzZmYgPyAyMjQgOiA5MV0gPSBmYWxzZTtcblxudmFyIF9zY29wZSA9ICdhbGwnOyAvLyDpu5jorqTng63plK7ojIPlm7RcbnZhciBpc0JpbmRFbGVtZW50ID0gZmFsc2U7IC8vIOaYr+WQpue7keWumuiKgueCuVxuXG4vLyDov5Tlm57plK7noIFcbnZhciBjb2RlID0gZnVuY3Rpb24gY29kZSh4KSB7XG4gIHJldHVybiBfa2V5TWFwW3gudG9Mb3dlckNhc2UoKV0gfHwgeC50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCk7XG59O1xuXG4vLyDorr7nva7ojrflj5blvZPliY3ojIPlm7TvvIjpu5jorqTkuLon5omA5pyJJ++8iVxuZnVuY3Rpb24gc2V0U2NvcGUoc2NvcGUpIHtcbiAgX3Njb3BlID0gc2NvcGUgfHwgJ2FsbCc7XG59XG4vLyDojrflj5blvZPliY3ojIPlm7RcbmZ1bmN0aW9uIGdldFNjb3BlKCkge1xuICByZXR1cm4gX3Njb3BlIHx8ICdhbGwnO1xufVxuLy8g6I635Y+W5pGB5LiL57uR5a6a6ZSu55qE6ZSu5YC8XG5mdW5jdGlvbiBnZXRQcmVzc2VkS2V5Q29kZXMoKSB7XG4gIHJldHVybiBfZG93bktleXMuc2xpY2UoMCk7XG59XG5cbi8vIOihqOWNleaOp+S7tuaOp+S7tuWIpOaWrSDov5Tlm54gQm9vbGVhblxuZnVuY3Rpb24gZmlsdGVyKGV2ZW50KSB7XG4gIHZhciB0YWdOYW1lID0gZXZlbnQudGFyZ2V0LnRhZ05hbWUgfHwgZXZlbnQuc3JjRWxlbWVudC50YWdOYW1lO1xuICAvLyDlv73nlaXov5nkupvmoIfnrb7mg4XlhrXkuIvlv6vmjbfplK7ml6DmlYhcbiAgcmV0dXJuICEodGFnTmFtZSA9PT0gJ0lOUFVUJyB8fCB0YWdOYW1lID09PSAnU0VMRUNUJyB8fCB0YWdOYW1lID09PSAnVEVYVEFSRUEnKTtcbn1cblxuLy8g5Yik5pat5pGB5LiL55qE6ZSu5piv5ZCm5Li65p+Q5Liq6ZSu77yM6L+U5ZuedHJ1ZeaIluiAhWZhbHNlXG5mdW5jdGlvbiBpc1ByZXNzZWQoa2V5Q29kZSkge1xuICBpZiAodHlwZW9mIGtleUNvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAga2V5Q29kZSA9IGNvZGUoa2V5Q29kZSk7IC8vIOi9rOaNouaIkOmUrueggVxuICB9XG4gIHJldHVybiBfZG93bktleXMuaW5kZXhPZihrZXlDb2RlKSAhPT0gLTE7XG59XG5cbi8vIOW+queOr+WIoOmZpGhhbmRsZXJz5Lit55qE5omA5pyJIHNjb3BlKOiMg+WbtClcbmZ1bmN0aW9uIGRlbGV0ZVNjb3BlKHNjb3BlLCBuZXdTY29wZSkge1xuICB2YXIgaGFuZGxlcnMgPSB2b2lkIDA7XG4gIHZhciBpID0gdm9pZCAwO1xuXG4gIC8vIOayoeacieaMh+WumnNjb3Bl77yM6I635Y+Wc2NvcGVcbiAgaWYgKCFzY29wZSkgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gIGZvciAodmFyIGtleSBpbiBfaGFuZGxlcnMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9oYW5kbGVycywga2V5KSkge1xuICAgICAgaGFuZGxlcnMgPSBfaGFuZGxlcnNba2V5XTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7KSB7XG4gICAgICAgIGlmIChoYW5kbGVyc1tpXS5zY29wZSA9PT0gc2NvcGUpIGhhbmRsZXJzLnNwbGljZShpLCAxKTtlbHNlIGkrKztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyDlpoLmnpxzY29wZeiiq+WIoOmZpO+8jOWwhnNjb3Bl6YeN572u5Li6YWxsXG4gIGlmIChnZXRTY29wZSgpID09PSBzY29wZSkgc2V0U2NvcGUobmV3U2NvcGUgfHwgJ2FsbCcpO1xufVxuXG4vLyDmuIXpmaTkv67ppbDplK5cbmZ1bmN0aW9uIGNsZWFyTW9kaWZpZXIoZXZlbnQpIHtcbiAgdmFyIGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2ggfHwgZXZlbnQuY2hhckNvZGU7XG4gIHZhciBpID0gX2Rvd25LZXlzLmluZGV4T2Yoa2V5KTtcblxuICAvLyDku47liJfooajkuK3muIXpmaTmjInljovov4fnmoTplK5cbiAgaWYgKGkgPj0gMCkgX2Rvd25LZXlzLnNwbGljZShpLCAxKTtcblxuICAvLyDkv67ppbDplK4gc2hpZnRLZXkgYWx0S2V5IGN0cmxLZXkgKGNvbW1hbmR8fG1ldGFLZXkpIOa4hemZpFxuICBpZiAoa2V5ID09PSA5MyB8fCBrZXkgPT09IDIyNCkga2V5ID0gOTE7XG4gIGlmIChrZXkgaW4gX21vZHMpIHtcbiAgICBfbW9kc1trZXldID0gZmFsc2U7XG5cbiAgICAvLyDlsIbkv67ppbDplK7ph43nva7kuLpmYWxzZVxuICAgIGZvciAodmFyIGsgaW4gX21vZGlmaWVyKSB7XG4gICAgICBpZiAoX21vZGlmaWVyW2tdID09PSBrZXkpIGhvdGtleXNba10gPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLy8g6Kej6Zmk57uR5a6a5p+Q5Liq6IyD5Zu055qE5b+r5o236ZSuXG5mdW5jdGlvbiB1bmJpbmQoa2V5LCBzY29wZSkge1xuICB2YXIgbXVsdGlwbGVLZXlzID0gZ2V0S2V5cyhrZXkpO1xuICB2YXIga2V5cyA9IHZvaWQgMDtcbiAgdmFyIG1vZHMgPSBbXTtcbiAgdmFyIG9iaiA9IHZvaWQgMDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG11bHRpcGxlS2V5cy5sZW5ndGg7IGkrKykge1xuICAgIC8vIOWwhue7hOWQiOW/q+aNt+mUruaLhuWIhuS4uuaVsOe7hFxuICAgIGtleXMgPSBtdWx0aXBsZUtleXNbaV0uc3BsaXQoJysnKTtcblxuICAgIC8vIOiusOW9leavj+S4que7hOWQiOmUruS4reeahOS/rumlsOmUrueahOmUrueggSDov5Tlm57mlbDnu4RcbiAgICBpZiAoa2V5cy5sZW5ndGggPiAxKSBtb2RzID0gZ2V0TW9kcyhfbW9kaWZpZXIsIGtleXMpO1xuXG4gICAgLy8g6I635Y+W6Zmk5L+u6aWw6ZSu5aSW55qE6ZSu5YC8a2V5XG4gICAga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICAgIGtleSA9IGtleSA9PT0gJyonID8gJyonIDogY29kZShrZXkpO1xuXG4gICAgLy8g5Yik5pat5piv5ZCm5Lyg5YWl6IyD5Zu077yM5rKh5pyJ5bCx6I635Y+W6IyD5Zu0XG4gICAgaWYgKCFzY29wZSkgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gICAgLy8g5aaC5L2Va2V55LiN5ZyoIF9oYW5kbGVycyDkuK3ov5Tlm57kuI3lgZrlpITnkIZcbiAgICBpZiAoIV9oYW5kbGVyc1trZXldKSByZXR1cm47XG5cbiAgICAvLyDmuIXnqbogaGFuZGxlcnMg5Lit5pWw5o2u77yMXG4gICAgLy8g6K6p6Kem5Y+R5b+r5o236ZSu6ZSu5LmL5ZCO5rKh5pyJ5LqL5Lu25omn6KGM5Yiw6L6+6Kej6Zmk5b+r5o236ZSu57uR5a6a55qE55uu55qEXG4gICAgZm9yICh2YXIgciA9IDA7IHIgPCBfaGFuZGxlcnNba2V5XS5sZW5ndGg7IHIrKykge1xuICAgICAgb2JqID0gX2hhbmRsZXJzW2tleV1bcl07XG4gICAgICAvLyDliKTmlq3mmK/lkKblnKjojIPlm7TlhoXlubbkuJTplK7lgLznm7jlkIxcbiAgICAgIGlmIChvYmouc2NvcGUgPT09IHNjb3BlICYmIGNvbXBhcmVBcnJheShvYmoubW9kcywgbW9kcykpIHtcbiAgICAgICAgX2hhbmRsZXJzW2tleV1bcl0gPSB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8g5a+555uR5ZCs5a+55bqU5b+r5o236ZSu55qE5Zue6LCD5Ye95pWw6L+b6KGM5aSE55CGXG5mdW5jdGlvbiBldmVudEhhbmRsZXIoZXZlbnQsIGhhbmRsZXIsIHNjb3BlKSB7XG4gIHZhciBtb2RpZmllcnNNYXRjaCA9IHZvaWQgMDtcblxuICAvLyDnnIvlroPmmK/lkKblnKjlvZPliY3ojIPlm7RcbiAgaWYgKGhhbmRsZXIuc2NvcGUgPT09IHNjb3BlIHx8IGhhbmRsZXIuc2NvcGUgPT09ICdhbGwnKSB7XG4gICAgLy8g5qOA5p+l5piv5ZCm5Yy56YWN5L+u6aWw56ym77yI5aaC5p6c5pyJ6L+U5ZuedHJ1Ze+8iVxuICAgIG1vZGlmaWVyc01hdGNoID0gaGFuZGxlci5tb2RzLmxlbmd0aCA+IDA7XG5cbiAgICBmb3IgKHZhciB5IGluIF9tb2RzKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9tb2RzLCB5KSkge1xuICAgICAgICBpZiAoIV9tb2RzW3ldICYmIGhhbmRsZXIubW9kcy5pbmRleE9mKCt5KSA+IC0xIHx8IF9tb2RzW3ldICYmIGhhbmRsZXIubW9kcy5pbmRleE9mKCt5KSA9PT0gLTEpIG1vZGlmaWVyc01hdGNoID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g6LCD55So5aSE55CG56iL5bqP77yM5aaC5p6c5piv5L+u6aWw6ZSu5LiN5YGa5aSE55CGXG4gICAgaWYgKGhhbmRsZXIubW9kcy5sZW5ndGggPT09IDAgJiYgIV9tb2RzWzE2XSAmJiAhX21vZHNbMThdICYmICFfbW9kc1sxN10gJiYgIV9tb2RzWzkxXSB8fCBtb2RpZmllcnNNYXRjaCB8fCBoYW5kbGVyLnNob3J0Y3V0ID09PSAnKicpIHtcbiAgICAgIGlmIChoYW5kbGVyLm1ldGhvZChldmVudCwgaGFuZGxlcikgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtlbHNlIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiAoZXZlbnQuY2FuY2VsQnViYmxlKSBldmVudC5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyDlpITnkIZrZXlkb3du5LqL5Lu2XG5mdW5jdGlvbiBkaXNwYXRjaChldmVudCkge1xuICB2YXIgYXN0ZXJpc2sgPSBfaGFuZGxlcnNbJyonXTtcbiAgdmFyIGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2ggfHwgZXZlbnQuY2hhckNvZGU7XG5cbiAgLy8g5pCc6ZuG57uR5a6a55qE6ZSuXG4gIGlmIChfZG93bktleXMuaW5kZXhPZihrZXkpID09PSAtMSkgX2Rvd25LZXlzLnB1c2goa2V5KTtcblxuICAvLyBHZWNrbyhGaXJlZm94KeeahGNvbW1hbmTplK7lgLwyMjTvvIzlnKhXZWJraXQoQ2hyb21lKeS4reS/neaMgeS4gOiHtFxuICAvLyBXZWJraXTlt6blj7Njb21tYW5k6ZSu5YC85LiN5LiA5qC3XG4gIGlmIChrZXkgPT09IDkzIHx8IGtleSA9PT0gMjI0KSBrZXkgPSA5MTtcblxuICBpZiAoa2V5IGluIF9tb2RzKSB7XG4gICAgX21vZHNba2V5XSA9IHRydWU7XG5cbiAgICAvLyDlsIbnibnmrorlrZfnrKbnmoRrZXnms6jlhozliLAgaG90a2V5cyDkuIpcbiAgICBmb3IgKHZhciBrIGluIF9tb2RpZmllcikge1xuICAgICAgaWYgKF9tb2RpZmllcltrXSA9PT0ga2V5KSBob3RrZXlzW2tdID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWFzdGVyaXNrKSByZXR1cm47XG4gIH1cblxuICAvLyDlsIZtb2RpZmllck1hcOmHjOmdoueahOS/rumlsOmUrue7keWumuWIsGV2ZW505LitXG4gIGZvciAodmFyIGUgaW4gX21vZHMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKF9tb2RzLCBlKSkge1xuICAgICAgX21vZHNbZV0gPSBldmVudFttb2RpZmllck1hcFtlXV07XG4gICAgfVxuICB9XG5cbiAgLy8g6KGo5Y2V5o6n5Lu26L+H5rukIOm7mOiupOihqOWNleaOp+S7tuS4jeinpuWPkeW/q+aNt+mUrlxuICBpZiAoIWhvdGtleXMuZmlsdGVyLmNhbGwodGhpcywgZXZlbnQpKSByZXR1cm47XG5cbiAgLy8g6I635Y+W6IyD5Zu0IOm7mOiupOS4umFsbFxuICB2YXIgc2NvcGUgPSBnZXRTY29wZSgpO1xuXG4gIC8vIOWvueS7u+S9leW/q+aNt+mUrumDvemcgOimgeWBmueahOWkhOeQhlxuICBpZiAoYXN0ZXJpc2spIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFzdGVyaXNrLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXN0ZXJpc2tbaV0uc2NvcGUgPT09IHNjb3BlKSBldmVudEhhbmRsZXIoZXZlbnQsIGFzdGVyaXNrW2ldLCBzY29wZSk7XG4gICAgfVxuICB9XG4gIC8vIGtleSDkuI3lnKhfaGFuZGxlcnPkuK3ov5Tlm55cbiAgaWYgKCEoa2V5IGluIF9oYW5kbGVycykpIHJldHVybjtcblxuICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgX2hhbmRsZXJzW2tleV0ubGVuZ3RoOyBfaSsrKSB7XG4gICAgLy8g5om+5Yiw5aSE55CG5YaF5a65XG4gICAgZXZlbnRIYW5kbGVyKGV2ZW50LCBfaGFuZGxlcnNba2V5XVtfaV0sIHNjb3BlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBob3RrZXlzKGtleSwgb3B0aW9uLCBtZXRob2QpIHtcbiAgdmFyIGtleXMgPSBnZXRLZXlzKGtleSk7IC8vIOmcgOimgeWkhOeQhueahOW/q+aNt+mUruWIl+ihqFxuICB2YXIgbW9kcyA9IFtdO1xuICB2YXIgc2NvcGUgPSAnYWxsJzsgLy8gc2NvcGXpu5jorqTkuLphbGzvvIzmiYDmnInojIPlm7Tpg73mnInmlYhcbiAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudDsgLy8g5b+r5o236ZSu5LqL5Lu257uR5a6a6IqC54K5XG4gIHZhciBpID0gMDtcblxuICAvLyDlr7nkuLrorr7lrprojIPlm7TnmoTliKTmlq1cbiAgaWYgKG1ldGhvZCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBtZXRob2QgPSBvcHRpb247XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9wdGlvbikgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgaWYgKG9wdGlvbi5zY29wZSkgc2NvcGUgPSBvcHRpb24uc2NvcGU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICBpZiAob3B0aW9uLmVsZW1lbnQpIGVsZW1lbnQgPSBvcHRpb24uZWxlbWVudDsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICB9XG5cbiAgaWYgKHR5cGVvZiBvcHRpb24gPT09ICdzdHJpbmcnKSBzY29wZSA9IG9wdGlvbjtcblxuICAvLyDlr7nkuo7mr4/kuKrlv6vmjbfplK7ov5vooYzlpITnkIZcbiAgZm9yICg7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXS5zcGxpdCgnKycpOyAvLyDmjInplK7liJfooahcbiAgICBtb2RzID0gW107XG5cbiAgICAvLyDlpoLmnpzmmK/nu4TlkIjlv6vmjbfplK7lj5blvpfnu4TlkIjlv6vmjbfplK5cbiAgICBpZiAoa2V5Lmxlbmd0aCA+IDEpIG1vZHMgPSBnZXRNb2RzKF9tb2RpZmllciwga2V5KTtcblxuICAgIC8vIOWwhumdnuS/rumlsOmUrui9rOWMluS4uumUrueggVxuICAgIGtleSA9IGtleVtrZXkubGVuZ3RoIC0gMV07XG4gICAga2V5ID0ga2V5ID09PSAnKicgPyAnKicgOiBjb2RlKGtleSk7IC8vICrooajnpLrljLnphY3miYDmnInlv6vmjbfplK5cblxuICAgIC8vIOWIpOaWrWtleeaYr+WQpuWcqF9oYW5kbGVyc+S4re+8jOS4jeWcqOWwsei1i+S4gOS4quepuuaVsOe7hFxuICAgIGlmICghKGtleSBpbiBfaGFuZGxlcnMpKSBfaGFuZGxlcnNba2V5XSA9IFtdO1xuXG4gICAgX2hhbmRsZXJzW2tleV0ucHVzaCh7XG4gICAgICBzY29wZTogc2NvcGUsXG4gICAgICBtb2RzOiBtb2RzLFxuICAgICAgc2hvcnRjdXQ6IGtleXNbaV0sXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGtleToga2V5c1tpXVxuICAgIH0pO1xuICB9XG4gIC8vIOWcqOWFqOWxgGRvY3VtZW505LiK6K6+572u5b+r5o236ZSuXG4gIGlmICh0eXBlb2YgZWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgIWlzQmluZEVsZW1lbnQpIHtcbiAgICBpc0JpbmRFbGVtZW50ID0gdHJ1ZTtcbiAgICBhZGRFdmVudChlbGVtZW50LCAna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBkaXNwYXRjaChlKTtcbiAgICB9KTtcbiAgICBhZGRFdmVudChlbGVtZW50LCAna2V5dXAnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgY2xlYXJNb2RpZmllcihlKTtcbiAgICB9KTtcbiAgfVxufVxuXG52YXIgX2FwaSA9IHtcbiAgc2V0U2NvcGU6IHNldFNjb3BlLFxuICBnZXRTY29wZTogZ2V0U2NvcGUsXG4gIGRlbGV0ZVNjb3BlOiBkZWxldGVTY29wZSxcbiAgZ2V0UHJlc3NlZEtleUNvZGVzOiBnZXRQcmVzc2VkS2V5Q29kZXMsXG4gIGlzUHJlc3NlZDogaXNQcmVzc2VkLFxuICBmaWx0ZXI6IGZpbHRlcixcbiAgdW5iaW5kOiB1bmJpbmRcbn07XG5mb3IgKHZhciBhIGluIF9hcGkpIHtcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChfYXBpLCBhKSkge1xuICAgIGhvdGtleXNbYV0gPSBfYXBpW2FdO1xuICB9XG59XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICB2YXIgX2hvdGtleXMgPSB3aW5kb3cuaG90a2V5cztcbiAgaG90a2V5cy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKGRlZXApIHtcbiAgICBpZiAoZGVlcCAmJiB3aW5kb3cuaG90a2V5cyA9PT0gaG90a2V5cykge1xuICAgICAgd2luZG93LmhvdGtleXMgPSBfaG90a2V5cztcbiAgICB9XG4gICAgcmV0dXJuIGhvdGtleXM7XG4gIH07XG4gIHdpbmRvdy5ob3RrZXlzID0gaG90a2V5cztcbn1cblxuZXhwb3J0IGRlZmF1bHQgaG90a2V5cztcbiIsImNvbnN0IGN1cnNvciA9IGBcbiAgPHN2ZyBjbGFzcz1cImljb24tY3Vyc29yXCIgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDMyIDMyXCI+XG4gICAgPHBhdGggZD1cIk0xNi42ODkgMTcuNjU1bDUuMzExIDEyLjM0NS00IDItNC42NDYtMTIuNjc4LTcuMzU0IDYuNjc4di0yNmwyMCAxNi05LjMxMSAxLjY1NXpcIj48L3BhdGg+XG4gIDwvc3ZnPlxuYFxuXG5jb25zdCBtb3ZlID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xNSA3LjVWMkg5djUuNWwzIDMgMy0zek03LjUgOUgydjZoNS41bDMtMy0zLTN6TTkgMTYuNVYyMmg2di01LjVsLTMtMy0zIDN6TTE2LjUgOWwtMyAzIDMgM0gyMlY5aC01LjV6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3Qgc2VhcmNoID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xNS41IDE0aC0uNzlsLS4yOC0uMjdDMTUuNDEgMTIuNTkgMTYgMTEuMTEgMTYgOS41IDE2IDUuOTEgMTMuMDkgMyA5LjUgM1MzIDUuOTEgMyA5LjUgNS45MSAxNiA5LjUgMTZjMS42MSAwIDMuMDktLjU5IDQuMjMtMS41N2wuMjcuMjh2Ljc5bDUgNC45OUwyMC40OSAxOWwtNC45OS01em0tNiAwQzcuMDEgMTQgNSAxMS45OSA1IDkuNVM3LjAxIDUgOS41IDUgMTQgNy4wMSAxNCA5LjUgMTEuOTkgMTQgOS41IDE0elwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IG1hcmdpbiA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNOSA3SDd2MmgyVjd6bTAgNEg3djJoMnYtMnptMC04Yy0xLjExIDAtMiAuOS0yIDJoMlYzem00IDEyaC0ydjJoMnYtMnptNi0xMnYyaDJjMC0xLjEtLjktMi0yLTJ6bS02IDBoLTJ2MmgyVjN6TTkgMTd2LTJIN2MwIDEuMS44OSAyIDIgMnptMTAtNGgydi0yaC0ydjJ6bTAtNGgyVjdoLTJ2MnptMCA4YzEuMSAwIDItLjkgMi0yaC0ydjJ6TTUgN0gzdjEyYzAgMS4xLjg5IDIgMiAyaDEydi0ySDVWN3ptMTAtMmgyVjNoLTJ2MnptMCAxMmgydi0yaC0ydjJ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgcGFkZGluZyA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMyAxM2gydi0ySDN2MnptMCA0aDJ2LTJIM3Yyem0yIDR2LTJIM2MwIDEuMS44OSAyIDIgMnpNMyA5aDJWN0gzdjJ6bTEyIDEyaDJ2LTJoLTJ2MnptNC0xOEg5Yy0xLjExIDAtMiAuOS0yIDJ2MTBjMCAxLjEuODkgMiAyIDJoMTBjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnptMCAxMkg5VjVoMTB2MTB6bS04IDZoMnYtMmgtMnYyem0tNCAwaDJ2LTJIN3YyelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IGZvbnQgPSBgXG4gIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8cGF0aCBkPVwiTTkgNHYzaDV2MTJoM1Y3aDVWNEg5em0tNiA4aDN2N2gzdi03aDNWOUgzdjN6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgdHlwZSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMyAxNy4yNVYyMWgzLjc1TDE3LjgxIDkuOTRsLTMuNzUtMy43NUwzIDE3LjI1ek0yMC43MSA3LjA0Yy4zOS0uMzkuMzktMS4wMiAwLTEuNDFsLTIuMzQtMi4zNGMtLjM5LS4zOS0xLjAyLS4zOS0xLjQxIDBsLTEuODMgMS44MyAzLjc1IDMuNzUgMS44My0xLjgzelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IGFsaWduID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMCAyMGg0VjRoLTR2MTZ6bS02IDBoNHYtOEg0djh6TTE2IDl2MTFoNFY5aC00elwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IHJlc2l6ZSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTkgMTJoLTJ2M2gtM3YyaDV2LTV6TTcgOWgzVjdINXY1aDJWOXptMTQtNkgzYy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE4YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTYuMDFIM1Y0Ljk5aDE4djE0LjAyelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IHRyYW5zZm9ybSA9IGBcbiAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxwYXRoIGQ9XCJNMTIsN0M2LjQ4LDcsMiw5LjI0LDIsMTJjMCwyLjI0LDIuOTQsNC4xMyw3LDQuNzdWMjBsNC00bC00LTR2Mi43M2MtMy4xNS0wLjU2LTUtMS45LTUtMi43M2MwLTEuMDYsMy4wNC0zLDgtM3M4LDEuOTQsOCwzXG4gICAgYzAsMC43My0xLjQ2LDEuODktNCwyLjUzdjIuMDVjMy41My0wLjc3LDYtMi41Myw2LTQuNThDMjIsOS4yNCwxNy41Miw3LDEyLDd6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgYm9yZGVyID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMyA3aC0ydjJoMlY3em0wIDRoLTJ2Mmgydi0yem00IDBoLTJ2Mmgydi0yek0zIDN2MThoMThWM0gzem0xNiAxNkg1VjVoMTR2MTR6bS02LTRoLTJ2Mmgydi0yem0tNC00SDd2Mmgydi0yelwiLz5cbiAgPC9zdmc+XG5gXG5cbmNvbnN0IGh1ZXNoaWZ0ID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0xMiAzYy00Ljk3IDAtOSA0LjAzLTkgOXM0LjAzIDkgOSA5Yy44MyAwIDEuNS0uNjcgMS41LTEuNSAwLS4zOS0uMTUtLjc0LS4zOS0xLjAxLS4yMy0uMjYtLjM4LS42MS0uMzgtLjk5IDAtLjgzLjY3LTEuNSAxLjUtMS41SDE2YzIuNzYgMCA1LTIuMjQgNS01IDAtNC40Mi00LjAzLTgtOS04em0tNS41IDljLS44MyAwLTEuNS0uNjctMS41LTEuNVM1LjY3IDkgNi41IDkgOCA5LjY3IDggMTAuNSA3LjMzIDEyIDYuNSAxMnptMy00QzguNjcgOCA4IDcuMzMgOCA2LjVTOC42NyA1IDkuNSA1czEuNS42NyAxLjUgMS41UzEwLjMzIDggOS41IDh6bTUgMGMtLjgzIDAtMS41LS42Ny0xLjUtMS41UzEzLjY3IDUgMTQuNSA1czEuNS42NyAxLjUgMS41UzE1LjMzIDggMTQuNSA4em0zIDRjLS44MyAwLTEuNS0uNjctMS41LTEuNVMxNi42NyA5IDE3LjUgOXMxLjUuNjcgMS41IDEuNS0uNjcgMS41LTEuNSAxLjV6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgYm94c2hhZG93ID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPHBhdGggZD1cIk0yMCA4LjY5VjRoLTQuNjlMMTIgLjY5IDguNjkgNEg0djQuNjlMLjY5IDEyIDQgMTUuMzFWMjBoNC42OUwxMiAyMy4zMSAxNS4zMSAyMEgyMHYtNC42OUwyMy4zMSAxMiAyMCA4LjY5ek0xMiAxOGMtLjg5IDAtMS43NC0uMi0yLjUtLjU1QzExLjU2IDE2LjUgMTMgMTQuNDIgMTMgMTJzLTEuNDQtNC41LTMuNS01LjQ1QzEwLjI2IDYuMiAxMS4xMSA2IDEyIDZjMy4zMSAwIDYgMi42OSA2IDZzLTIuNjkgNi02IDZ6XCIvPlxuICA8L3N2Zz5cbmBcblxuY29uc3QgaW5zcGVjdG9yID0gYFxuICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgPGc+XG4gICAgICA8cmVjdCB4PVwiMTFcIiB5PVwiN1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjJcIi8+XG4gICAgICA8cmVjdCB4PVwiMTFcIiB5PVwiMTFcIiB3aWR0aD1cIjJcIiBoZWlnaHQ9XCI2XCIvPlxuICAgICAgPHBhdGggZD1cIk0xMiwyQzYuNDgsMiwyLDYuNDgsMiwxMmMwLDUuNTIsNC40OCwxMCwxMCwxMHMxMC00LjQ4LDEwLTEwQzIyLDYuNDgsMTcuNTIsMiwxMiwyeiBNMTIsMjBjLTQuNDEsMC04LTMuNTktOC04XG4gICAgICAgIGMwLTQuNDEsMy41OS04LDgtOHM4LDMuNTksOCw4QzIwLDE2LjQxLDE2LjQxLDIwLDEyLDIwelwiLz5cbiAgICA8L2c+XG4gIDwvc3ZnPlxuYFxuXG5leHBvcnQge1xuICBjdXJzb3IsXG4gIG1vdmUsXG4gIHNlYXJjaCxcbiAgbWFyZ2luLFxuICBwYWRkaW5nLFxuICBmb250LFxuICB0eXBlLFxuICBhbGlnbixcbiAgdHJhbnNmb3JtLFxuICByZXNpemUsXG4gIGJvcmRlcixcbiAgaHVlc2hpZnQsXG4gIGJveHNoYWRvdyxcbiAgaW5zcGVjdG9yLFxufSIsImV4cG9ydCBmdW5jdGlvbiBnZXRTaWRlKGRpcmVjdGlvbikge1xuICBsZXQgc3RhcnQgPSBkaXJlY3Rpb24uc3BsaXQoJysnKS5wb3AoKS5yZXBsYWNlKC9eXFx3LywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpXG4gIGlmIChzdGFydCA9PSAnVXAnKSBzdGFydCA9ICdUb3AnXG4gIGlmIChzdGFydCA9PSAnRG93bicpIHN0YXJ0ID0gJ0JvdHRvbSdcbiAgcmV0dXJuIHN0YXJ0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsZShlbCwgbmFtZSkge1xuICBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkge1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpXG4gICAgbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKVxuICAgIGxldCBzID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgJycpXG4gICAgcmV0dXJuIHMgJiYgcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpXG4gIH0gXG4gIGVsc2Uge1xuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxlcyhlbCwgZGVzaXJlZFByb3BNYXApIHtcbiAgY29uc3QgZWxTdHlsZU9iamVjdCA9IGVsLnN0eWxlXG4gIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbClcblxuICBsZXQgZGVzaXJlZFZhbHVlcyA9IFtdXG5cbiAgZm9yIChwcm9wIGluIGVsLnN0eWxlKVxuICAgIGlmIChwcm9wIGluIGRlc2lyZWRQcm9wTWFwICYmIGRlc2lyZWRQcm9wTWFwW3Byb3BdICE9IGNvbXB1dGVkU3R5bGVbcHJvcF0pXG4gICAgICBkZXNpcmVkVmFsdWVzLnB1c2goe1xuICAgICAgICBwcm9wLFxuICAgICAgICB2YWx1ZTogY29tcHV0ZWRTdHlsZVtwcm9wXVxuICAgICAgfSlcblxuICByZXR1cm4gZGVzaXJlZFZhbHVlc1xufVxuXG5sZXQgdGltZW91dE1hcCA9IHt9XG5leHBvcnQgZnVuY3Rpb24gc2hvd0hpZGVTZWxlY3RlZChlbCwgZHVyYXRpb24gPSA3NTApIHtcbiAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkLWhpZGUnLCB0cnVlKVxuXG4gIGlmICh0aW1lb3V0TWFwW2VsXSkgY2xlYXJUaW1lb3V0KHRpbWVvdXRNYXBbZWxdKVxuXG4gIHRpbWVvdXRNYXBbZWxdID0gc2V0VGltZW91dChfID0+XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkLWhpZGUnKVxuICAsIGR1cmF0aW9uKVxuICBcbiAgcmV0dXJuIGVsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbFRvRGFzaChjYW1lbFN0cmluZyA9IFwiXCIpIHtcbiAgcmV0dXJuIGNhbWVsU3RyaW5nLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oJDEpe3JldHVybiBcIi1cIiskMS50b0xvd2VyQ2FzZSgpO30pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sU3RyaW5nVG9Eb20oaHRtbFN0cmluZyA9IFwiXCIpIHtcbiAgcmV0dXJuIChuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGh0bWxTdHJpbmcsICd0ZXh0L2h0bWwnKSkuYm9keS5maXJzdENoaWxkXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUsIGdldFNpZGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG4vLyB0b2RvOiBzaG93IG1hcmdpbiBjb2xvclxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sYWx0KyR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9LHNoaWZ0K2FsdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK3NoaWZ0K3VwLGNtZCtkb3duLGNtZCtzaGlmdCtkb3duJ1xuXG5leHBvcnQgZnVuY3Rpb24gTWFyZ2luKHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwdXNoRWxlbWVudCgkKHNlbGVjdG9yKSwgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgaG90a2V5cyhjb21tYW5kX2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwdXNoQWxsRWxlbWVudFNpZGVzKCQoc2VsZWN0b3IpLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoY29tbWFuZF9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpIC8vIGJ1ZyBpbiBsaWI/XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1c2hFbGVtZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnbWFyZ2luJyArIGdldFNpZGUoZGlyZWN0aW9uKSxcbiAgICAgIGN1cnJlbnQ6ICBwYXJzZUludChnZXRTdHlsZShlbCwgJ21hcmdpbicgKyBnZXRTaWRlKGRpcmVjdGlvbikpLCAxMCksXG4gICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykgPyAxMCA6IDEsXG4gICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ2FsdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIG1hcmdpbjogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIG1hcmdpbn0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBgJHttYXJnaW4gPCAwID8gMCA6IG1hcmdpbn1weGApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdXNoQWxsRWxlbWVudFNpZGVzKGVscywga2V5Y29tbWFuZCkge1xuICBjb25zdCBjb21ibyA9IGtleWNvbW1hbmQuc3BsaXQoJysnKVxuICBsZXQgc3Bvb2YgPSAnJ1xuXG4gIGlmIChjb21iby5pbmNsdWRlcygnc2hpZnQnKSkgIHNwb29mID0gJ3NoaWZ0KycgKyBzcG9vZlxuICBpZiAoY29tYm8uaW5jbHVkZXMoJ2Rvd24nKSkgICBzcG9vZiA9ICdhbHQrJyArIHNwb29mXG5cbiAgJ3VwLGRvd24sbGVmdCxyaWdodCcuc3BsaXQoJywnKVxuICAgIC5mb3JFYWNoKHNpZGUgPT4gcHVzaEVsZW1lbnQoZWxzLCBzcG9vZiArIHNpZGUpKVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5cbmNvbnN0IHJlbW92ZUVkaXRhYmlsaXR5ID0gZSA9PiB7XG4gIGUudGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJylcbiAgZS50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHJlbW92ZUVkaXRhYmlsaXR5KVxuICBlLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgc3RvcEJ1YmJsaW5nKVxuICBob3RrZXlzLnVuYmluZCgnZXNjYXBlLGVzYycpXG59XG5cbmNvbnN0IHN0b3BCdWJibGluZyA9IGUgPT4gZS5rZXkgIT0gJ0VzY2FwZScgJiYgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG5leHBvcnQgZnVuY3Rpb24gRWRpdFRleHQoZWxlbWVudHMsIGZvY3VzPWZhbHNlKSB7XG4gIGlmICghZWxlbWVudHMubGVuZ3RoKSByZXR1cm5cblxuICBlbGVtZW50cy5tYXAoZWwgPT4ge1xuICAgIGVsLnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgJ3RydWUnKVxuICAgIGZvY3VzICYmIGVsLmZvY3VzKClcbiAgICAkKGVsKS5vbigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgICAkKGVsKS5vbignYmx1cicsIHJlbW92ZUVkaXRhYmlsaXR5KVxuICB9KVxuXG4gIGhvdGtleXMoJ2VzY2FwZSxlc2MnLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGVsZW1lbnRzLmZvckVhY2godGFyZ2V0ID0+IHJlbW92ZUVkaXRhYmlsaXR5KHt0YXJnZXR9KSlcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZW1wdHkoKVxuICB9KVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0LGJhY2tzcGFjZSdcbi8vIHRvZG86IGluZGljYXRvciBmb3Igd2hlbiBub2RlIGNhbiBkZXNjZW5kXG4vLyB0b2RvOiBpbmRpY2F0b3Igd2hlcmUgbGVmdCBhbmQgcmlnaHQgd2lsbCBnb1xuLy8gdG9kbzogaW5kaWNhdG9yIHdoZW4gbGVmdCBvciByaWdodCBoaXQgZGVhZCBlbmRzXG5leHBvcnQgZnVuY3Rpb24gTW92ZWFibGUoc2VsZWN0b3IpIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwge2tleX0pID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgXG4gICAgJChzZWxlY3RvcikuZm9yRWFjaChlbCA9PiB7XG4gICAgICBtb3ZlRWxlbWVudChlbCwga2V5KVxuICAgICAgdXBkYXRlRmVlZGJhY2soZWwpXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGhvdGtleXMudW5iaW5kKGtleV9ldmVudHMpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdmVFbGVtZW50KGVsLCBkaXJlY3Rpb24pIHtcbiAgaWYgKCFlbCkgcmV0dXJuXG5cbiAgc3dpdGNoKGRpcmVjdGlvbikge1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgaWYgKGNhbk1vdmVMZWZ0KGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwsIGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpXG4gICAgICBlbHNlXG4gICAgICAgIHNob3dFZGdlKGVsLnBhcmVudE5vZGUpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAncmlnaHQnOlxuICAgICAgaWYgKGNhbk1vdmVSaWdodChlbCkgJiYgZWwubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRTaWJsaW5nKVxuICAgICAgICBlbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgZWwubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRTaWJsaW5nKVxuICAgICAgZWxzZSBpZiAoY2FuTW92ZVJpZ2h0KGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbClcbiAgICAgIGVsc2VcbiAgICAgICAgc2hvd0VkZ2UoZWwucGFyZW50Tm9kZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICd1cCc6XG4gICAgICBpZiAoY2FuTW92ZVVwKGVsKSlcbiAgICAgICAgZWwucGFyZW50Tm9kZS5wYXJlbnROb2RlLnByZXBlbmQoZWwpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZG93bic6XG4gICAgICAvLyBlZGdlIGNhc2UgYmVoYXZpb3IsIHVzZXIgdGVzdFxuICAgICAgaWYgKCFlbC5uZXh0RWxlbWVudFNpYmxpbmcgJiYgZWwucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLnBhcmVudE5vZGUpXG4gICAgICAgIGVsLnBhcmVudE5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwsIGVsLnBhcmVudE5vZGUucGFyZW50Tm9kZS5jaGlsZHJlbltbLi4uZWwucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNoaWxkcmVuXS5pbmRleE9mKGVsLnBhcmVudEVsZW1lbnQpICsgMV0pXG4gICAgICBpZiAoY2FuTW92ZURvd24oZWwpKVxuICAgICAgICBlbC5uZXh0RWxlbWVudFNpYmxpbmcucHJlcGVuZChlbClcbiAgICAgIGJyZWFrXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNhbk1vdmVMZWZ0ID0gZWwgPT4gZWwucHJldmlvdXNFbGVtZW50U2libGluZ1xuZXhwb3J0IGNvbnN0IGNhbk1vdmVSaWdodCA9IGVsID0+IGVsLm5leHRFbGVtZW50U2libGluZ1xuZXhwb3J0IGNvbnN0IGNhbk1vdmVEb3duID0gZWwgPT4gXG4gIGVsLm5leHRFbGVtZW50U2libGluZyAmJiBlbC5uZXh0RWxlbWVudFNpYmxpbmcuY2hpbGRyZW4ubGVuZ3RoXG5leHBvcnQgY29uc3QgY2FuTW92ZVVwID0gZWwgPT4gXG4gIGVsLnBhcmVudE5vZGUgJiYgZWwucGFyZW50Tm9kZS5wYXJlbnROb2RlXG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RWRnZShlbCkge1xuICByZXR1cm4gZWwuYW5pbWF0ZShbXG4gICAgeyBvdXRsaW5lOiAnMXB4IHNvbGlkIHRyYW5zcGFyZW50JyB9LFxuICAgIHsgb3V0bGluZTogJzFweCBzb2xpZCBoc2xhKDMzMCwgMTAwJSwgNzElLCA4MCUpJyB9LFxuICAgIHsgb3V0bGluZTogJzFweCBzb2xpZCB0cmFuc3BhcmVudCcgfSxcbiAgXSwgNjAwKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlRmVlZGJhY2soZWwpIHtcbiAgbGV0IG9wdGlvbnMgPSAnJ1xuICAvLyBnZXQgY3VycmVudCBlbGVtZW50cyBvZmZzZXQvc2l6ZVxuICBpZiAoY2FuTW92ZUxlZnQoZWwpKSAgb3B0aW9ucyArPSAn4oegJ1xuICBpZiAoY2FuTW92ZVJpZ2h0KGVsKSkgb3B0aW9ucyArPSAn4oeiJ1xuICBpZiAoY2FuTW92ZURvd24oZWwpKSAgb3B0aW9ucyArPSAn4oejJ1xuICBpZiAoY2FuTW92ZVVwKGVsKSkgICAgb3B0aW9ucyArPSAn4oehJ1xuICAvLyBjcmVhdGUvbW92ZSBhcnJvd3MgaW4gYWJzb2x1dGUvZml4ZWQgdG8gb3ZlcmxheSBlbGVtZW50XG4gIG9wdGlvbnMgJiYgY29uc29sZS5pbmZvKCclYycrb3B0aW9ucywgXCJmb250LXNpemU6IDJyZW07XCIpXG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuXG5sZXQgaW1ncyA9IFtdXG5cbmV4cG9ydCBmdW5jdGlvbiB3YXRjaEltYWdlc0ZvclVwbG9hZCgpIHtcbiAgaW1ncyA9ICQoJ2ltZycpXG5cbiAgY2xlYXJXYXRjaGVycyhpbWdzKVxuICBpbml0V2F0Y2hlcnMoaW1ncylcbn1cblxuY29uc3QgaW5pdFdhdGNoZXJzID0gaW1ncyA9PiB7XG4gIGltZ3Mub24oJ2RyYWdvdmVyJywgb25EcmFnRW50ZXIpXG4gIGltZ3Mub24oJ2RyYWdsZWF2ZScsIG9uRHJhZ0xlYXZlKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgb25Ecm9wKVxufVxuXG5jb25zdCBwcmV2aWV3RmlsZSA9IGZpbGUgPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSlcbiAgICByZWFkZXIub25sb2FkZW5kID0gKCkgPT4gcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICB9KVxufVxuXG5jb25zdCBvbkRyYWdFbnRlciA9IGUgPT4ge1xuICAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLWRyb3B0YXJnZXQnLCB0cnVlKVxuICBlLnByZXZlbnREZWZhdWx0KClcbn1cblxuY29uc3Qgb25EcmFnTGVhdmUgPSBlID0+IHtcbiAgJChlLnRhcmdldCkuYXR0cignZGF0YS1kcm9wdGFyZ2V0JywgbnVsbClcbn1cblxuY29uc3Qgb25Ecm9wID0gYXN5bmMgKGUpID0+IHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtZHJvcHRhcmdldCcsIG51bGwpXG5cbiAgY29uc3Qgc2VsZWN0ZWRJbWFnZXMgPSAkKCdpbWdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG5cbiAgY29uc3Qgc3JjcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgIFsuLi5lLmRhdGFUcmFuc2Zlci5maWxlc10ubWFwKHByZXZpZXdGaWxlKSlcbiAgXG4gIGlmICghc2VsZWN0ZWRJbWFnZXMubGVuZ3RoICYmIGUudGFyZ2V0Lm5vZGVOYW1lID09PSAnSU1HJylcbiAgICBlLnRhcmdldC5zcmMgPSBzcmNzWzBdXG4gIGVsc2Uge1xuICAgIGxldCBpID0gMFxuICAgIHNlbGVjdGVkSW1hZ2VzLmZvckVhY2goaW1nID0+IHtcbiAgICAgIGltZy5zcmMgPSBzcmNzW2krK11cbiAgICAgIGlmIChpID49IHNyY3MubGVuZ3RoKSBpID0gMFxuICAgIH0pXG4gIH1cbn1cblxuY29uc3QgY2xlYXJXYXRjaGVycyA9IGltZ3MgPT4ge1xuICBpbWdzLm9mZignZHJhZ2VudGVyJywgb25EcmFnRW50ZXIpXG4gIGltZ3Mub2ZmKCdkcmFnbGVhdmUnLCBvbkRyYWdMZWF2ZSlcbiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJvcCcsIG9uRHJvcClcbiAgaW1ncyA9IFtdXG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuaW1wb3J0IHsgRWRpdFRleHQgfSBmcm9tICcuL3RleHQnXG5pbXBvcnQgeyBjYW5Nb3ZlTGVmdCwgY2FuTW92ZVJpZ2h0LCBjYW5Nb3ZlVXAgfSBmcm9tICcuL21vdmUnXG5pbXBvcnQgeyB3YXRjaEltYWdlc0ZvclVwbG9hZCB9IGZyb20gJy4vaW1hZ2Vzd2FwJ1xuaW1wb3J0IHsgaHRtbFN0cmluZ1RvRG9tIH0gZnJvbSAnLi91dGlscydcblxuLy8gdG9kbzogYWxpZ25tZW50IGd1aWRlc1xuZXhwb3J0IGZ1bmN0aW9uIFNlbGVjdGFibGUoKSB7XG4gIGNvbnN0IGVsZW1lbnRzICAgICAgICAgID0gJCgnYm9keScpXG4gIGxldCBzZWxlY3RlZCAgICAgICAgICAgID0gW11cbiAgbGV0IHNlbGVjdGVkQ2FsbGJhY2tzICAgPSBbXVxuXG4gIHdhdGNoSW1hZ2VzRm9yVXBsb2FkKClcblxuICBlbGVtZW50cy5vbignY2xpY2snLCBlID0+IHtcbiAgICBpZiAoaXNPZmZCb3VuZHMoZS50YXJnZXQpICYmICFzZWxlY3RlZC5maWx0ZXIoZWwgPT4gZWwgPT0gZS50YXJnZXQpLmxlbmd0aCkgXG4gICAgICByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBpZiAoIWUuc2hpZnRLZXkpIHVuc2VsZWN0X2FsbCgpXG4gICAgc2VsZWN0KGUudGFyZ2V0KVxuICB9KVxuXG4gIGVsZW1lbnRzLm9uKCdkYmxjbGljaycsIGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBpZiAoaXNPZmZCb3VuZHMoZS50YXJnZXQpKSByZXR1cm5cbiAgICBFZGl0VGV4dChbZS50YXJnZXRdLCB7Zm9jdXM6dHJ1ZX0pXG4gICAgJCgndG9vbC1wYWxsZXRlJylbMF0udG9vbFNlbGVjdGVkKCd0ZXh0JylcbiAgfSlcblxuICBob3RrZXlzKCdlc2MnLCBfID0+IFxuICAgIHNlbGVjdGVkLmxlbmd0aCAmJiB1bnNlbGVjdF9hbGwoKSlcblxuICBob3RrZXlzKCdjbWQrZCcsIGUgPT4ge1xuICAgIGNvbnN0IHJvb3Rfbm9kZSA9IHNlbGVjdGVkWzBdXG4gICAgaWYgKCFyb290X25vZGUpIHJldHVyblxuXG4gICAgY29uc3QgZGVlcF9jbG9uZSA9IHJvb3Rfbm9kZS5jbG9uZU5vZGUodHJ1ZSlcbiAgICBkZWVwX2Nsb25lLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcpXG4gICAgcm9vdF9ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRlZXBfY2xvbmUsIHJvb3Rfbm9kZS5uZXh0U2libGluZylcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfSlcblxuICBob3RrZXlzKCdiYWNrc3BhY2UsZGVsLGRlbGV0ZScsIGUgPT4gXG4gICAgc2VsZWN0ZWQubGVuZ3RoICYmIGRlbGV0ZV9hbGwoKSlcblxuICBob3RrZXlzKCdhbHQrZGVsLGFsdCtiYWNrc3BhY2UnLCBlID0+XG4gICAgc2VsZWN0ZWQuZm9yRWFjaChlbCA9PlxuICAgICAgZWwuYXR0cignc3R5bGUnLCBudWxsKSkpXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY29weScsIGUgPT4ge1xuICAgIGlmIChzZWxlY3RlZFswXSAmJiB0aGlzLm5vZGVfY2xpcGJvYXJkICE9PSBzZWxlY3RlZFswXSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBsZXQgJG5vZGUgPSBzZWxlY3RlZFswXS5jbG9uZU5vZGUodHJ1ZSlcbiAgICAgICRub2RlLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcpXG4gICAgICB0aGlzLmNvcHlfYmFja3VwID0gJG5vZGUub3V0ZXJIVE1MXG4gICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dC9odG1sJywgdGhpcy5jb3B5X2JhY2t1cClcbiAgICB9XG4gIH0pXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY3V0JywgZSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkWzBdICYmIHRoaXMubm9kZV9jbGlwYm9hcmQgIT09IHNlbGVjdGVkWzBdKSB7XG4gICAgICBsZXQgJG5vZGUgPSBzZWxlY3RlZFswXS5jbG9uZU5vZGUodHJ1ZSlcbiAgICAgICRub2RlLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zZWxlY3RlZCcpXG4gICAgICB0aGlzLmNvcHlfYmFja3VwID0gJG5vZGUub3V0ZXJIVE1MXG4gICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dC9odG1sJywgdGhpcy5jb3B5X2JhY2t1cClcbiAgICAgIHNlbGVjdGVkWzBdLnJlbW92ZSgpXG4gICAgfVxuICB9KVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgZSA9PiB7XG4gICAgY29uc3QgY2xpcERhdGEgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dC9odG1sJylcbiAgICBjb25zdCBwb3RlbnRpYWxIVE1MID0gY2xpcERhdGEgfHwgdGhpcy5jb3B5X2JhY2t1cFxuICAgIGlmIChzZWxlY3RlZFswXSAmJiBwb3RlbnRpYWxIVE1MKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHNlbGVjdGVkWzBdLmFwcGVuZENoaWxkKFxuICAgICAgICBodG1sU3RyaW5nVG9Eb20ocG90ZW50aWFsSFRNTCkpXG4gICAgfVxuICB9KVxuXG4gIGhvdGtleXMoJ2NtZCtlLGNtZCtzaGlmdCtlJywgKGUsIHtrZXl9KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAvLyBUT0RPOiBuZWVkIGEgbXVjaCBzbWFydGVyIHN5c3RlbSBoZXJlXG4gICAgLy8gb25seSBleHBhbmRzIGJhc2UgdGFnIG5hbWVzIGF0bVxuICAgIGlmIChzZWxlY3RlZFswXS5ub2RlTmFtZSAhPT0gJ0RJVicpXG4gICAgICBleHBhbmRTZWxlY3Rpb24oe1xuICAgICAgICByb290X25vZGU6IHNlbGVjdGVkWzBdLCBcbiAgICAgICAgYWxsOiBrZXkuaW5jbHVkZXMoJ3NoaWZ0JyksXG4gICAgICB9KVxuICB9KVxuXG4gIGhvdGtleXMoJ2NtZCtnLGNtZCtzaGlmdCtnJywgKGUsIHtrZXl9KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoa2V5LnNwbGl0KCcrJykuaW5jbHVkZXMoJ3NoaWZ0JykpIHtcbiAgICAgIGxldCAkc2VsZWN0ZWQgPSBbLi4uc2VsZWN0ZWRdXG4gICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgJHNlbGVjdGVkLnJldmVyc2UoKS5mb3JFYWNoKGVsID0+IHtcbiAgICAgICAgbGV0IGwgPSBlbC5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgd2hpbGUgKGVsLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgbm9kZSA9IGVsLmNoaWxkTm9kZXNbZWwuY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSAhPT0gJyN0ZXh0JylcbiAgICAgICAgICAgIHNlbGVjdChub2RlKVxuICAgICAgICAgIGVsLnBhcmVudE5vZGUucHJlcGVuZChub2RlKVxuICAgICAgICB9XG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgc2VsZWN0ZWRbMF0ucGFyZW50Tm9kZS5wcmVwZW5kKFxuICAgICAgICBzZWxlY3RlZC5yZXZlcnNlKCkucmVkdWNlKChkaXYsIGVsKSA9PiB7XG4gICAgICAgICAgZGl2LmFwcGVuZENoaWxkKGVsKVxuICAgICAgICAgIHJldHVybiBkaXZcbiAgICAgICAgfSwgZGl2KVxuICAgICAgKVxuICAgICAgdW5zZWxlY3RfYWxsKClcbiAgICAgIHNlbGVjdChkaXYpXG4gICAgfVxuICB9KVxuXG4gIGVsZW1lbnRzLm9uKCdzZWxlY3RzdGFydCcsIGUgPT5cbiAgICAhaXNPZmZCb3VuZHMoZS50YXJnZXQpIFxuICAgICYmIHNlbGVjdGVkLmxlbmd0aCBcbiAgICAmJiBzZWxlY3RlZFswXS50ZXh0Q29udGVudCAhPSBlLnRhcmdldC50ZXh0Q29udGVudCBcbiAgICAmJiBlLnByZXZlbnREZWZhdWx0KCkpXG5cbiAgaG90a2V5cygndGFiLHNoaWZ0K3RhYixlbnRlcixzaGlmdCtlbnRlcicsIChlLCB7a2V5fSkgPT4ge1xuICAgIGlmIChzZWxlY3RlZC5sZW5ndGggIT09IDEpIHJldHVyblxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdGVkWzBdXG5cbiAgICBpZiAoa2V5LmluY2x1ZGVzKCdzaGlmdCcpKSB7XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKCd0YWInKSAmJiBjYW5Nb3ZlTGVmdChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY2FuTW92ZUxlZnQoY3VycmVudCkpXG4gICAgICB9XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKCdlbnRlcicpICYmIGNhbk1vdmVVcChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY3VycmVudC5wYXJlbnROb2RlKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChrZXkuaW5jbHVkZXMoJ3RhYicpICYmIGNhbk1vdmVSaWdodChjdXJyZW50KSkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY2FuTW92ZVJpZ2h0KGN1cnJlbnQpKVxuICAgICAgfVxuICAgICAgaWYgKGtleS5pbmNsdWRlcygnZW50ZXInKSAmJiBjdXJyZW50LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICB1bnNlbGVjdF9hbGwoKVxuICAgICAgICBzZWxlY3QoY3VycmVudC5jaGlsZHJlblswXSlcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZWxlbWVudHMub24oJ21vdXNlb3ZlcicsICh7dGFyZ2V0fSkgPT5cbiAgICAhaXNPZmZCb3VuZHModGFyZ2V0KSAmJiB0YXJnZXQuc2V0QXR0cmlidXRlKCdkYXRhLWhvdmVyJywgdHJ1ZSkpXG5cbiAgZWxlbWVudHMub24oJ21vdXNlb3V0JywgKHt0YXJnZXR9KSA9PlxuICAgIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtaG92ZXInKSlcblxuICBjb25zdCBzZWxlY3QgPSBlbCA9PiB7XG4gICAgaWYgKGVsLm5vZGVOYW1lID09PSAnc3ZnJyB8fCBlbC5vd25lclNWR0VsZW1lbnQpIHJldHVyblxuXG4gICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLXNlbGVjdGVkJywgdHJ1ZSlcbiAgICBzZWxlY3RlZC51bnNoaWZ0KGVsKVxuICAgIHRlbGxXYXRjaGVycygpXG4gIH1cblxuICBjb25zdCB1bnNlbGVjdF9hbGwgPSAoKSA9PiB7XG4gICAgc2VsZWN0ZWRcbiAgICAgIC5mb3JFYWNoKGVsID0+IFxuICAgICAgICAkKGVsKS5hdHRyKHtcbiAgICAgICAgICAnZGF0YS1zZWxlY3RlZCc6IG51bGwsXG4gICAgICAgICAgJ2RhdGEtc2VsZWN0ZWQtaGlkZSc6IG51bGwsXG4gICAgICAgIH0pKVxuXG4gICAgc2VsZWN0ZWQgPSBbXVxuICB9XG5cbiAgY29uc3QgZGVsZXRlX2FsbCA9ICgpID0+IHtcbiAgICBzZWxlY3RlZC5mb3JFYWNoKGVsID0+XG4gICAgICBlbC5yZW1vdmUoKSlcbiAgICBzZWxlY3RlZCA9IFtdXG4gIH1cblxuICBjb25zdCBleHBhbmRTZWxlY3Rpb24gPSAoe3Jvb3Rfbm9kZSwgYWxsfSkgPT4ge1xuICAgIGlmIChhbGwpIHtcbiAgICAgIGNvbnN0IHVuc2VsZWN0ZWRzID0gJChyb290X25vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSArICc6bm90KFtkYXRhLXNlbGVjdGVkXSknKVxuICAgICAgdW5zZWxlY3RlZHMuZm9yRWFjaChzZWxlY3QpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgcG90ZW50aWFscyA9ICQocm9vdF9ub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpXG4gICAgICBpZiAoIXBvdGVudGlhbHMpIHJldHVyblxuXG4gICAgICBjb25zdCByb290X25vZGVfaW5kZXggPSBwb3RlbnRpYWxzLnJlZHVjZSgoaW5kZXgsIG5vZGUsIGkpID0+XG4gICAgICAgIG5vZGUgPT0gcm9vdF9ub2RlIFxuICAgICAgICAgID8gaW5kZXggPSBpXG4gICAgICAgICAgOiBpbmRleFxuICAgICAgLCBudWxsKVxuXG4gICAgICBpZiAocm9vdF9ub2RlX2luZGV4ICE9PSBudWxsKSB7XG4gICAgICAgIGlmICghcG90ZW50aWFsc1tyb290X25vZGVfaW5kZXggKyAxXSkge1xuICAgICAgICAgIGNvbnN0IHBvdGVudGlhbCA9IHBvdGVudGlhbHMuZmlsdGVyKGVsID0+ICFlbC5hdHRyKCdkYXRhLXNlbGVjdGVkJykpWzBdXG4gICAgICAgICAgaWYgKHBvdGVudGlhbCkgc2VsZWN0KHBvdGVudGlhbClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzZWxlY3QocG90ZW50aWFsc1tyb290X25vZGVfaW5kZXggKyAxXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzT2ZmQm91bmRzID0gbm9kZSA9PlxuICAgIG5vZGUuY2xvc2VzdCAmJiAobm9kZS5jbG9zZXN0KCd0b29sLXBhbGxldGUnKSB8fCBub2RlLmNsb3Nlc3QoJy5tZXRhdGlwJykgfHwgbm9kZS5jbG9zZXN0KCdob3RrZXktbWFwJykpXG5cbiAgY29uc3Qgb25TZWxlY3RlZFVwZGF0ZSA9IGNiID0+XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MucHVzaChjYikgJiYgY2Ioc2VsZWN0ZWQpXG5cbiAgY29uc3QgcmVtb3ZlU2VsZWN0ZWRDYWxsYmFjayA9IGNiID0+XG4gICAgc2VsZWN0ZWRDYWxsYmFja3MgPSBzZWxlY3RlZENhbGxiYWNrcy5maWx0ZXIoY2FsbGJhY2sgPT4gY2FsbGJhY2sgIT0gY2IpXG5cbiAgY29uc3QgdGVsbFdhdGNoZXJzID0gKCkgPT5cbiAgICBzZWxlY3RlZENhbGxiYWNrcy5mb3JFYWNoKGNiID0+IGNiKHNlbGVjdGVkKSlcblxuICByZXR1cm4ge1xuICAgIHNlbGVjdCxcbiAgICB1bnNlbGVjdF9hbGwsXG4gICAgb25TZWxlY3RlZFVwZGF0ZSxcbiAgICByZW1vdmVTZWxlY3RlZENhbGxiYWNrLFxuICB9XG59IiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcbmltcG9ydCB7IGdldFN0eWxlLCBnZXRTaWRlLCBzaG93SGlkZVNlbGVjdGVkIH0gZnJvbSAnLi91dGlscy5qcydcblxuLy8gdG9kbzogc2hvdyBwYWRkaW5nIGNvbG9yXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxhbHQrJHtldmVudH0sc2hpZnQrJHtldmVudH0sc2hpZnQrYWx0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gJ2NtZCt1cCxjbWQrc2hpZnQrdXAsY21kK2Rvd24sY21kK3NoaWZ0K2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBQYWRkaW5nKHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwYWRFbGVtZW50KCQoc2VsZWN0b3IpLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHBhZEFsbEVsZW1lbnRTaWRlcygkKHNlbGVjdG9yKSwgaGFuZGxlci5rZXkpXG4gIH0pXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCd1cCxkb3duLGxlZnQscmlnaHQnKSAvLyBidWcgaW4gbGliP1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWRFbGVtZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAncGFkZGluZycgKyBnZXRTaWRlKGRpcmVjdGlvbiksXG4gICAgICBjdXJyZW50OiAgcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdwYWRkaW5nJyArIGdldFNpZGUoZGlyZWN0aW9uKSksIDEwKSxcbiAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnYWx0JyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgcGFkZGluZzogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHBhZGRpbmd9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7cGFkZGluZyA8IDAgPyAwIDogcGFkZGluZ31weGApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWRBbGxFbGVtZW50U2lkZXMoZWxzLCBrZXljb21tYW5kKSB7XG4gIGNvbnN0IGNvbWJvID0ga2V5Y29tbWFuZC5zcGxpdCgnKycpXG4gIGxldCBzcG9vZiA9ICcnXG5cbiAgaWYgKGNvbWJvLmluY2x1ZGVzKCdzaGlmdCcpKSAgc3Bvb2YgPSAnc2hpZnQrJyArIHNwb29mXG4gIGlmIChjb21iby5pbmNsdWRlcygnZG93bicpKSAgIHNwb29mID0gJ2FsdCsnICsgc3Bvb2ZcblxuICAndXAsZG93bixsZWZ0LHJpZ2h0Jy5zcGxpdCgnLCcpXG4gICAgLmZvckVhY2goc2lkZSA9PiBwYWRFbGVtZW50KGVscywgc3Bvb2YgKyBzaWRlKSlcbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBnZXRTdHlsZSwgc2hvd0hpZGVTZWxlY3RlZCB9IGZyb20gJy4vdXRpbHMuanMnXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuICAuc3BsaXQoJywnKVxuICAucmVkdWNlKChldmVudHMsIGV2ZW50KSA9PiBcbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gJ2NtZCt1cCxjbWQrZG93bidcblxuZXhwb3J0IGZ1bmN0aW9uIEZvbnQoc2VsZWN0b3IpIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGV0IHNlbGVjdGVkTm9kZXMgPSAkKHNlbGVjdG9yKVxuICAgICAgLCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuXG4gICAgaWYgKGtleXMuaW5jbHVkZXMoJ2xlZnQnKSB8fCBrZXlzLmluY2x1ZGVzKCdyaWdodCcpKVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUtlcm5pbmcoc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gICAgICAgIDogY2hhbmdlQWxpZ25tZW50KHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgIGVsc2VcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VMZWFkaW5nKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZUZvbnRTaXplKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICB9KVxuXG4gIGhvdGtleXMoY29tbWFuZF9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgbGV0IGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG4gICAgY2hhbmdlRm9udFdlaWdodCgkKHNlbGVjdG9yKSwga2V5cy5pbmNsdWRlcygndXAnKSA/ICd1cCcgOiAnZG93bicpXG4gIH0pXG5cbiAgaG90a2V5cygnY21kK2InLCBlID0+IHtcbiAgICAkKHNlbGVjdG9yKS5mb3JFYWNoKGVsID0+XG4gICAgICBlbC5zdHlsZS5mb250V2VpZ2h0ID0gJ2JvbGQnKVxuICB9KVxuXG4gIGhvdGtleXMoJ2NtZCtpJywgZSA9PiB7XG4gICAgJChzZWxlY3RvcikuZm9yRWFjaChlbCA9PlxuICAgICAgZWwuc3R5bGUuZm9udFN0eWxlID0gJ2l0YWxpYycpXG4gIH0pXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBob3RrZXlzLnVuYmluZChrZXlfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKGNvbW1hbmRfZXZlbnRzKVxuICAgIGhvdGtleXMudW5iaW5kKCdjbWQrYixjbWQraScpXG4gICAgaG90a2V5cy51bmJpbmQoJ3VwLGRvd24sbGVmdCxyaWdodCcpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUxlYWRpbmcoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdsaW5lSGVpZ2h0JyxcbiAgICAgIGN1cnJlbnQ6ICBwYXJzZUludChnZXRTdHlsZShlbCwgJ2xpbmVIZWlnaHQnKSksXG4gICAgICBhbW91bnQ6ICAgMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnZG93bicpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGN1cnJlbnQ6IHBheWxvYWQuY3VycmVudCA9PSAnbm9ybWFsJyB8fCBpc05hTihwYXlsb2FkLmN1cnJlbnQpXG4gICAgICAgICAgPyAxLjE0ICogcGFyc2VJbnQoZ2V0U3R5bGUocGF5bG9hZC5lbCwgJ2ZvbnRTaXplJykpIC8vIGRvY3VtZW50IHRoaXMgY2hvaWNlXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnRcbiAgICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLm5lZ2F0aXZlXG4gICAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnQgLSBwYXlsb2FkLmFtb3VudCBcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudCArIHBheWxvYWQuYW1vdW50XG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gYCR7dmFsdWV9cHhgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlS2VybmluZyhlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ2xldHRlclNwYWNpbmcnLFxuICAgICAgY3VycmVudDogIHBhcnNlRmxvYXQoZ2V0U3R5bGUoZWwsICdsZXR0ZXJTcGFjaW5nJykpLFxuICAgICAgYW1vdW50OiAgIC4xLFxuICAgICAgbmVnYXRpdmU6IGRpcmVjdGlvbi5zcGxpdCgnKycpLmluY2x1ZGVzKCdsZWZ0JyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgY3VycmVudDogcGF5bG9hZC5jdXJyZW50ID09ICdub3JtYWwnIHx8IGlzTmFOKHBheWxvYWQuY3VycmVudClcbiAgICAgICAgICA/IDBcbiAgICAgICAgICA6IHBheWxvYWQuY3VycmVudFxuICAgICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgdmFsdWU6IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgICA/IHBheWxvYWQuY3VycmVudCAtIHBheWxvYWQuYW1vdW50IFxuICAgICAgICAgIDogcGF5bG9hZC5jdXJyZW50ICsgcGF5bG9hZC5hbW91bnRcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBgJHt2YWx1ZSA8PSAtMiA/IC0yIDogdmFsdWV9cHhgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlRm9udFNpemUoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbCA9PiBzaG93SGlkZVNlbGVjdGVkKGVsKSlcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdmb250U2l6ZScsXG4gICAgICBjdXJyZW50OiAgcGFyc2VJbnQoZ2V0U3R5bGUoZWwsICdmb250U2l6ZScpKSxcbiAgICAgIGFtb3VudDogICBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnc2hpZnQnKSA/IDEwIDogMSxcbiAgICAgIG5lZ2F0aXZlOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnZG93bicpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIGZvbnRfc2l6ZTogcGF5bG9hZC5uZWdhdGl2ZVxuICAgICAgICAgID8gcGF5bG9hZC5jdXJyZW50IC0gcGF5bG9hZC5hbW91bnQgXG4gICAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnQgKyBwYXlsb2FkLmFtb3VudFxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIGZvbnRfc2l6ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBgJHtmb250X3NpemUgPD0gNiA/IDYgOiBmb250X3NpemV9cHhgKVxufVxuXG5jb25zdCB3ZWlnaHRNYXAgPSB7XG4gIG5vcm1hbDogMixcbiAgYm9sZDogICA1LFxuICBsaWdodDogIDAsXG4gIFwiXCI6IDIsXG4gIFwiMTAwXCI6MCxcIjIwMFwiOjEsXCIzMDBcIjoyLFwiNDAwXCI6MyxcIjUwMFwiOjQsXCI2MDBcIjo1LFwiNzAwXCI6NixcIjgwMFwiOjcsXCI5MDBcIjo4XG59XG5jb25zdCB3ZWlnaHRPcHRpb25zID0gWzEwMCwyMDAsMzAwLDQwMCw1MDAsNjAwLDcwMCw4MDAsOTAwXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlRm9udFdlaWdodChlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVsID0+IHNob3dIaWRlU2VsZWN0ZWQoZWwpKVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ2ZvbnRXZWlnaHQnLFxuICAgICAgY3VycmVudDogIGdldFN0eWxlKGVsLCAnZm9udFdlaWdodCcpLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnZG93bicpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gd2VpZ2h0TWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogd2VpZ2h0TWFwW3BheWxvYWQuY3VycmVudF0gKyAxXG4gICAgICB9KSlcbiAgICAuZm9yRWFjaCgoe2VsLCBzdHlsZSwgdmFsdWV9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gd2VpZ2h0T3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gd2VpZ2h0T3B0aW9ucy5sZW5ndGggXG4gICAgICAgID8gd2VpZ2h0T3B0aW9ucy5sZW5ndGhcbiAgICAgICAgOiB2YWx1ZVxuICAgICAgXSlcbn1cblxuY29uc3QgYWxpZ25NYXAgPSB7XG4gIHN0YXJ0OiAwLFxuICBsZWZ0OiAwLFxuICBjZW50ZXI6IDEsXG4gIHJpZ2h0OiAyLFxufVxuY29uc3QgYWxpZ25PcHRpb25zID0gWydsZWZ0JywnY2VudGVyJywncmlnaHQnXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlQWxpZ25tZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAndGV4dEFsaWduJyxcbiAgICAgIGN1cnJlbnQ6ICBnZXRTdHlsZShlbCwgJ3RleHRBbGlnbicpLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnbGVmdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSAtIDEgXG4gICAgICAgICAgOiBhbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGFsaWduT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBnZXRTdHlsZSB9IGZyb20gJy4vdXRpbHMuanMnXG5cbmNvbnN0IGtleV9ldmVudHMgPSAndXAsZG93bixsZWZ0LHJpZ2h0J1xuICAuc3BsaXQoJywnKVxuICAucmVkdWNlKChldmVudHMsIGV2ZW50KSA9PiBcbiAgICBgJHtldmVudHN9LCR7ZXZlbnR9LHNoaWZ0KyR7ZXZlbnR9YFxuICAsICcnKVxuICAuc3Vic3RyaW5nKDEpXG5cbmNvbnN0IGNvbW1hbmRfZXZlbnRzID0gJ2NtZCt1cCxjbWQrZG93bixjbWQrbGVmdCxjbWQrcmlnaHQnXG5cbmV4cG9ydCBmdW5jdGlvbiBGbGV4KHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGtleXMuaW5jbHVkZXMoJ3NoaWZ0JylcbiAgICAgICAgPyBjaGFuZ2VIRGlzdHJpYnV0aW9uKHNlbGVjdGVkTm9kZXMsIGhhbmRsZXIua2V5KVxuICAgICAgICA6IGNoYW5nZUhBbGlnbm1lbnQoc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gICAgZWxzZVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZVZEaXN0cmlidXRpb24oc2VsZWN0ZWROb2RlcywgaGFuZGxlci5rZXkpXG4gICAgICAgIDogY2hhbmdlVkFsaWdubWVudChzZWxlY3RlZE5vZGVzLCBoYW5kbGVyLmtleSlcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGV0IHNlbGVjdGVkTm9kZXMgPSAkKHNlbGVjdG9yKVxuICAgICAgLCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIFxuICAgIGNoYW5nZURpcmVjdGlvbihzZWxlY3RlZE5vZGVzLCBrZXlzLmluY2x1ZGVzKCdsZWZ0JykgPyAncm93JyA6ICdjb2x1bW4nKVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JylcbiAgfVxufVxuXG5jb25zdCBlbnN1cmVGbGV4ID0gZWwgPT4ge1xuICBlbC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnXG4gIHJldHVybiBlbFxufVxuXG5jb25zdCBhY2NvdW50Rm9yT3RoZXJKdXN0aWZ5Q29udGVudCA9IChjdXIsIHdhbnQpID0+IHtcbiAgaWYgKHdhbnQgPT0gJ2FsaWduJyAmJiAoY3VyICE9ICdmbGV4LXN0YXJ0JyAmJiBjdXIgIT0gJ2NlbnRlcicgJiYgY3VyICE9ICdmbGV4LWVuZCcpKVxuICAgIGN1ciA9ICdub3JtYWwnXG4gIGVsc2UgaWYgKHdhbnQgPT0gJ2Rpc3RyaWJ1dGUnICYmIChjdXIgIT0gJ3NwYWNlLWFyb3VuZCcgJiYgY3VyICE9ICdzcGFjZS1iZXR3ZWVuJykpXG4gICAgY3VyID0gJ25vcm1hbCdcblxuICByZXR1cm4gY3VyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VEaXJlY3Rpb24oZWxzLCB2YWx1ZSkge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiB7XG4gICAgICBlbC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gdmFsdWVcbiAgICB9KVxufVxuXG5jb25zdCBoX2FsaWduTWFwICAgICAgPSB7bm9ybWFsOiAwLCdmbGV4LXN0YXJ0JzogMCwnY2VudGVyJzogMSwnZmxleC1lbmQnOiAyLH1cbmNvbnN0IGhfYWxpZ25PcHRpb25zICA9IFsnZmxleC1zdGFydCcsJ2NlbnRlcicsJ2ZsZXgtZW5kJ11cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUhBbGlnbm1lbnQoZWxzLCBkaXJlY3Rpb24pIHtcbiAgZWxzXG4gICAgLm1hcChlbnN1cmVGbGV4KVxuICAgIC5tYXAoZWwgPT4gKHsgXG4gICAgICBlbCwgXG4gICAgICBzdHlsZTogICAgJ2p1c3RpZnlDb250ZW50JyxcbiAgICAgIGN1cnJlbnQ6ICBhY2NvdW50Rm9yT3RoZXJKdXN0aWZ5Q29udGVudChnZXRTdHlsZShlbCwgJ2p1c3RpZnlDb250ZW50JyksICdhbGlnbicpLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnbGVmdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gaF9hbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdIC0gMSBcbiAgICAgICAgICA6IGhfYWxpZ25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSBoX2FsaWduT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cblxuY29uc3Qgdl9hbGlnbk1hcCAgICAgID0ge25vcm1hbDogMCwnZmxleC1zdGFydCc6IDAsJ2NlbnRlcic6IDEsJ2ZsZXgtZW5kJzogMix9XG5jb25zdCB2X2FsaWduT3B0aW9ucyAgPSBbJ2ZsZXgtc3RhcnQnLCdjZW50ZXInLCdmbGV4LWVuZCddXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VWQWxpZ25tZW50KGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlRmxleClcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdhbGlnbkl0ZW1zJyxcbiAgICAgIGN1cnJlbnQ6ICBnZXRTdHlsZShlbCwgJ2FsaWduSXRlbXMnKSxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uLnNwbGl0KCcrJykuaW5jbHVkZXMoJ3VwJyksXG4gICAgfSkpXG4gICAgLm1hcChwYXlsb2FkID0+XG4gICAgICBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgdmFsdWU6IHBheWxvYWQuZGlyZWN0aW9uXG4gICAgICAgICAgPyBoX2FsaWduTWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogaF9hbGlnbk1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IHZfYWxpZ25PcHRpb25zW3ZhbHVlIDwgMCA/IDAgOiB2YWx1ZSA+PSAyID8gMjogdmFsdWVdKVxufVxuXG5jb25zdCBoX2Rpc3RyaWJ1dGlvbk1hcCAgICAgID0ge25vcm1hbDogMSwnc3BhY2UtYXJvdW5kJzogMCwnJzogMSwnc3BhY2UtYmV0d2Vlbic6IDIsfVxuY29uc3QgaF9kaXN0cmlidXRpb25PcHRpb25zICA9IFsnc3BhY2UtYXJvdW5kJywnJywnc3BhY2UtYmV0d2VlbiddXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VIRGlzdHJpYnV0aW9uKGVscywgZGlyZWN0aW9uKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlRmxleClcbiAgICAubWFwKGVsID0+ICh7IFxuICAgICAgZWwsIFxuICAgICAgc3R5bGU6ICAgICdqdXN0aWZ5Q29udGVudCcsXG4gICAgICBjdXJyZW50OiAgYWNjb3VudEZvck90aGVySnVzdGlmeUNvbnRlbnQoZ2V0U3R5bGUoZWwsICdqdXN0aWZ5Q29udGVudCcpLCAnZGlzdHJpYnV0ZScpLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygnbGVmdCcpLFxuICAgIH0pKVxuICAgIC5tYXAocGF5bG9hZCA9PlxuICAgICAgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgIHZhbHVlOiBwYXlsb2FkLmRpcmVjdGlvblxuICAgICAgICAgID8gaF9kaXN0cmlidXRpb25NYXBbcGF5bG9hZC5jdXJyZW50XSAtIDEgXG4gICAgICAgICAgOiBoX2Rpc3RyaWJ1dGlvbk1hcFtwYXlsb2FkLmN1cnJlbnRdICsgMVxuICAgICAgfSkpXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IGhfZGlzdHJpYnV0aW9uT3B0aW9uc1t2YWx1ZSA8IDAgPyAwIDogdmFsdWUgPj0gMiA/IDI6IHZhbHVlXSlcbn1cblxuY29uc3Qgdl9kaXN0cmlidXRpb25NYXAgICAgICA9IHtub3JtYWw6IDEsJ3NwYWNlLWFyb3VuZCc6IDAsJyc6IDEsJ3NwYWNlLWJldHdlZW4nOiAyLH1cbmNvbnN0IHZfZGlzdHJpYnV0aW9uT3B0aW9ucyAgPSBbJ3NwYWNlLWFyb3VuZCcsJycsJ3NwYWNlLWJldHdlZW4nXVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlVkRpc3RyaWJ1dGlvbihlbHMsIGRpcmVjdGlvbikge1xuICBlbHNcbiAgICAubWFwKGVuc3VyZUZsZXgpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAnYWxpZ25Db250ZW50JyxcbiAgICAgIGN1cnJlbnQ6ICBnZXRTdHlsZShlbCwgJ2FsaWduQ29udGVudCcpLFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24uc3BsaXQoJysnKS5pbmNsdWRlcygndXAnKSxcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICB2YWx1ZTogcGF5bG9hZC5kaXJlY3Rpb25cbiAgICAgICAgICA/IHZfZGlzdHJpYnV0aW9uTWFwW3BheWxvYWQuY3VycmVudF0gLSAxIFxuICAgICAgICAgIDogdl9kaXN0cmlidXRpb25NYXBbcGF5bG9hZC5jdXJyZW50XSArIDFcbiAgICAgIH0pKVxuICAgIC5mb3JFYWNoKCh7ZWwsIHN0eWxlLCB2YWx1ZX0pID0+XG4gICAgICBlbC5zdHlsZVtzdHlsZV0gPSB2X2Rpc3RyaWJ1dGlvbk9wdGlvbnNbdmFsdWUgPCAwID8gMCA6IHZhbHVlID49IDIgPyAyOiB2YWx1ZV0pXG59XG4iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuXG4vLyBjcmVhdGUgaW5wdXRcbmNvbnN0IHNlYXJjaF9iYXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbnNlYXJjaF9iYXNlLmNsYXNzTGlzdC5hZGQoJ3NlYXJjaCcpXG5zZWFyY2hfYmFzZS5pbm5lckhUTUwgPSBgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJleDogaW1hZ2VzLCAuYnRuLCBkaXYsIGFuZCBtb3JlXCIvPmBcblxuY29uc3Qgc2VhcmNoICAgICAgICA9ICQoc2VhcmNoX2Jhc2UpXG5jb25zdCBzZWFyY2hJbnB1dCAgID0gJCgnaW5wdXQnLCBzZWFyY2hfYmFzZSlcblxuY29uc3Qgc2hvd1NlYXJjaEJhciA9ICgpID0+IHNlYXJjaC5hdHRyKCdzdHlsZScsICdkaXNwbGF5OmJsb2NrJylcbmNvbnN0IGhpZGVTZWFyY2hCYXIgPSAoKSA9PiBzZWFyY2guYXR0cignc3R5bGUnLCAnZGlzcGxheTpub25lJylcbmNvbnN0IHN0b3BCdWJibGluZyAgPSBlID0+IGUua2V5ICE9ICdFc2NhcGUnICYmIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuZXhwb3J0IGZ1bmN0aW9uIFNlYXJjaChTZWxlY3RvckVuZ2luZSwgbm9kZSkge1xuICBpZiAobm9kZSkgbm9kZVswXS5hcHBlbmRDaGlsZChzZWFyY2hbMF0pXG5cbiAgY29uc3Qgb25RdWVyeSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGxldCBxdWVyeSA9IGUudGFyZ2V0LnZhbHVlXG5cbiAgICBpZiAocXVlcnkgPT0gJ2xpbmtzJykgcXVlcnkgPSAnYSdcbiAgICBpZiAocXVlcnkgPT0gJ2J1dHRvbnMnKSBxdWVyeSA9ICdidXR0b24nXG4gICAgaWYgKHF1ZXJ5ID09ICdpbWFnZXMnKSBxdWVyeSA9ICdpbWcnXG4gICAgaWYgKHF1ZXJ5ID09ICd0ZXh0JykgcXVlcnkgPSAncCxjYXB0aW9uLGEsaDEsaDIsaDMsaDQsaDUsaDYsc21hbGwsZGF0ZSx0aW1lLGxpLGR0LGRkJ1xuXG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIFNlbGVjdG9yRW5naW5lLnVuc2VsZWN0X2FsbCgpXG4gICAgaWYgKHF1ZXJ5ID09ICcuJyB8fCBxdWVyeSA9PSAnIycpIHJldHVyblxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSAkKHF1ZXJ5KVxuICAgICAgU2VsZWN0b3JFbmdpbmUudW5zZWxlY3RfYWxsKClcbiAgICAgIGlmIChtYXRjaGVzLmxlbmd0aClcbiAgICAgICAgbWF0Y2hlcy5mb3JFYWNoKGVsID0+XG4gICAgICAgICAgU2VsZWN0b3JFbmdpbmUuc2VsZWN0KGVsKSlcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge31cbiAgfVxuXG4gIHNlYXJjaElucHV0Lm9uKCdpbnB1dCcsIG9uUXVlcnkpXG4gIHNlYXJjaElucHV0Lm9uKCdrZXlkb3duJywgc3RvcEJ1YmJsaW5nKVxuICAvLyBzZWFyY2hJbnB1dC5vbignYmx1cicsIGhpZGVTZWFyY2hCYXIpXG5cbiAgc2hvd1NlYXJjaEJhcigpXG4gIHNlYXJjaElucHV0WzBdLmZvY3VzKClcblxuICAvLyBob3RrZXlzKCdlc2NhcGUsZXNjJywgKGUsIGhhbmRsZXIpID0+IHtcbiAgLy8gICBoaWRlU2VhcmNoQmFyKClcbiAgLy8gICBob3RrZXlzLnVuYmluZCgnZXNjYXBlLGVzYycpXG4gIC8vIH0pXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBoaWRlU2VhcmNoQmFyKClcbiAgICBzZWFyY2hJbnB1dC5vZmYoJ29uaW5wdXQnLCBvblF1ZXJ5KVxuICAgIHNlYXJjaElucHV0Lm9mZigna2V5ZG93bicsIHN0b3BCdWJibGluZylcbiAgICBzZWFyY2hJbnB1dC5vZmYoJ2JsdXInLCBoaWRlU2VhcmNoQmFyKVxuICB9XG59IiwiLyoqXG4gKiBUYWtlIGlucHV0IGZyb20gWzAsIG5dIGFuZCByZXR1cm4gaXQgYXMgWzAsIDFdXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGJvdW5kMDEobiwgbWF4KSB7XG4gICAgaWYgKGlzT25lUG9pbnRaZXJvKG4pKSB7XG4gICAgICAgIG4gPSAnMTAwJSc7XG4gICAgfVxuICAgIGNvbnN0IHByb2Nlc3NQZXJjZW50ID0gaXNQZXJjZW50YWdlKG4pO1xuICAgIG4gPSBtYXggPT09IDM2MCA/IG4gOiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KDAsIHBhcnNlRmxvYXQobikpKTtcbiAgICAvLyBBdXRvbWF0aWNhbGx5IGNvbnZlcnQgcGVyY2VudGFnZSBpbnRvIG51bWJlclxuICAgIGlmIChwcm9jZXNzUGVyY2VudCkge1xuICAgICAgICBuID0gcGFyc2VJbnQoU3RyaW5nKG4gKiBtYXgpLCAxMCkgLyAxMDA7XG4gICAgfVxuICAgIC8vIEhhbmRsZSBmbG9hdGluZyBwb2ludCByb3VuZGluZyBlcnJvcnNcbiAgICBpZiAoTWF0aC5hYnMobiAtIG1heCkgPCAwLjAwMDAwMSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgLy8gQ29udmVydCBpbnRvIFswLCAxXSByYW5nZSBpZiBpdCBpc24ndCBhbHJlYWR5XG4gICAgaWYgKG1heCA9PT0gMzYwKSB7XG4gICAgICAgIC8vIElmIG4gaXMgYSBodWUgZ2l2ZW4gaW4gZGVncmVlcyxcbiAgICAgICAgLy8gd3JhcCBhcm91bmQgb3V0LW9mLXJhbmdlIHZhbHVlcyBpbnRvIFswLCAzNjBdIHJhbmdlXG4gICAgICAgIC8vIHRoZW4gY29udmVydCBpbnRvIFswLCAxXS5cbiAgICAgICAgbiA9IChuIDwgMCA/IG4gJSBtYXggKyBtYXggOiBuICUgbWF4KSAvIHBhcnNlRmxvYXQoU3RyaW5nKG1heCkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gSWYgbiBub3QgYSBodWUgZ2l2ZW4gaW4gZGVncmVlc1xuICAgICAgICAvLyBDb252ZXJ0IGludG8gWzAsIDFdIHJhbmdlIGlmIGl0IGlzbid0IGFscmVhZHkuXG4gICAgICAgIG4gPSAobiAlIG1heCkgLyBwYXJzZUZsb2F0KFN0cmluZyhtYXgpKTtcbiAgICB9XG4gICAgcmV0dXJuIG47XG59XG4vKipcbiAqIEZvcmNlIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMVxuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBjbGFtcDAxKHZhbCkge1xuICAgIHJldHVybiBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCB2YWwpKTtcbn1cbi8qKlxuICogTmVlZCB0byBoYW5kbGUgMS4wIGFzIDEwMCUsIHNpbmNlIG9uY2UgaXQgaXMgYSBudW1iZXIsIHRoZXJlIGlzIG5vIGRpZmZlcmVuY2UgYmV0d2VlbiBpdCBhbmQgMVxuICogPGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzQyMjA3Mi9qYXZhc2NyaXB0LWhvdy10by1kZXRlY3QtbnVtYmVyLWFzLWEtZGVjaW1hbC1pbmNsdWRpbmctMS0wPlxuICogQGhpZGRlblxuICovXG5mdW5jdGlvbiBpc09uZVBvaW50WmVybyhuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBuID09PSAnc3RyaW5nJyAmJiBuLmluZGV4T2YoJy4nKSAhPT0gLTEgJiYgcGFyc2VGbG9hdChuKSA9PT0gMTtcbn1cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHN0cmluZyBwYXNzZWQgaW4gaXMgYSBwZXJjZW50YWdlXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGlzUGVyY2VudGFnZShuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBuID09PSAnc3RyaW5nJyAmJiBuLmluZGV4T2YoJyUnKSAhPT0gLTE7XG59XG4vKipcbiAqIFJldHVybiBhIHZhbGlkIGFscGhhIHZhbHVlIFswLDFdIHdpdGggYWxsIGludmFsaWQgdmFsdWVzIGJlaW5nIHNldCB0byAxXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGJvdW5kQWxwaGEoYSkge1xuICAgIGEgPSBwYXJzZUZsb2F0KGEpO1xuICAgIGlmIChpc05hTihhKSB8fCBhIDwgMCB8fCBhID4gMSkge1xuICAgICAgICBhID0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG59XG4vKipcbiAqIFJlcGxhY2UgYSBkZWNpbWFsIHdpdGggaXQncyBwZXJjZW50YWdlIHZhbHVlXG4gKiBAaGlkZGVuXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUb1BlcmNlbnRhZ2Uobikge1xuICAgIGlmIChuIDw9IDEpIHtcbiAgICAgICAgcmV0dXJuICtuICogMTAwICsgJyUnO1xuICAgIH1cbiAgICByZXR1cm4gbjtcbn1cbi8qKlxuICogRm9yY2UgYSBoZXggdmFsdWUgdG8gaGF2ZSAyIGNoYXJhY3RlcnNcbiAqIEBoaWRkZW5cbiAqL1xuZnVuY3Rpb24gcGFkMihjKSB7XG4gICAgcmV0dXJuIGMubGVuZ3RoID09PSAxID8gJzAnICsgYyA6ICcnICsgYztcbn1cblxuLy8gYHJnYlRvSHNsYCwgYHJnYlRvSHN2YCwgYGhzbFRvUmdiYCwgYGhzdlRvUmdiYCBtb2RpZmllZCBmcm9tOlxuLy8gPGh0dHA6Ly9tamlqYWNrc29uLmNvbS8yMDA4LzAyL3JnYi10by1oc2wtYW5kLXJnYi10by1oc3YtY29sb3ItbW9kZWwtY29udmVyc2lvbi1hbGdvcml0aG1zLWluLWphdmFzY3JpcHQ+XG4vKipcbiAqIEhhbmRsZSBib3VuZHMgLyBwZXJjZW50YWdlIGNoZWNraW5nIHRvIGNvbmZvcm0gdG8gQ1NTIGNvbG9yIHNwZWNcbiAqIDxodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLWNvbG9yLz5cbiAqICpBc3N1bWVzOiogciwgZywgYiBpbiBbMCwgMjU1XSBvciBbMCwgMV1cbiAqICpSZXR1cm5zOiogeyByLCBnLCBiIH0gaW4gWzAsIDI1NV1cbiAqL1xuZnVuY3Rpb24gcmdiVG9SZ2IociwgZywgYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHI6IGJvdW5kMDEociwgMjU1KSAqIDI1NSxcbiAgICAgICAgZzogYm91bmQwMShnLCAyNTUpICogMjU1LFxuICAgICAgICBiOiBib3VuZDAxKGIsIDI1NSkgKiAyNTUsXG4gICAgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gUkdCIGNvbG9yIHZhbHVlIHRvIEhTTC5cbiAqICpBc3N1bWVzOiogciwgZywgYW5kIGIgYXJlIGNvbnRhaW5lZCBpbiBbMCwgMjU1XSBvciBbMCwgMV1cbiAqICpSZXR1cm5zOiogeyBoLCBzLCBsIH0gaW4gWzAsMV1cbiAqL1xuZnVuY3Rpb24gcmdiVG9Ic2wociwgZywgYikge1xuICAgIHIgPSBib3VuZDAxKHIsIDI1NSk7XG4gICAgZyA9IGJvdW5kMDEoZywgMjU1KTtcbiAgICBiID0gYm91bmQwMShiLCAyNTUpO1xuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIGNvbnN0IG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIGxldCBoID0gMDtcbiAgICBsZXQgcyA9IDA7XG4gICAgY29uc3QgbCA9IChtYXggKyBtaW4pIC8gMjtcbiAgICBpZiAobWF4ID09PSBtaW4pIHtcbiAgICAgICAgaCA9IHMgPSAwOyAvLyBhY2hyb21hdGljXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBkID0gbWF4IC0gbWluO1xuICAgICAgICBzID0gbCA+IDAuNSA/IGQgLyAoMiAtIG1heCAtIG1pbikgOiBkIC8gKG1heCArIG1pbik7XG4gICAgICAgIHN3aXRjaCAobWF4KSB7XG4gICAgICAgICAgICBjYXNlIHI6XG4gICAgICAgICAgICAgICAgaCA9IChnIC0gYikgLyBkICsgKGcgPCBiID8gNiA6IDApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBnOlxuICAgICAgICAgICAgICAgIGggPSAoYiAtIHIpIC8gZCArIDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGI6XG4gICAgICAgICAgICAgICAgaCA9IChyIC0gZykgLyBkICsgNDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBoIC89IDY7XG4gICAgfVxuICAgIHJldHVybiB7IGgsIHMsIGwgfTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gSFNMIGNvbG9yIHZhbHVlIHRvIFJHQi5cbiAqXG4gKiAqQXNzdW1lczoqIGggaXMgY29udGFpbmVkIGluIFswLCAxXSBvciBbMCwgMzYwXSBhbmQgcyBhbmQgbCBhcmUgY29udGFpbmVkIFswLCAxXSBvciBbMCwgMTAwXVxuICogKlJldHVybnM6KiB7IHIsIGcsIGIgfSBpbiB0aGUgc2V0IFswLCAyNTVdXG4gKi9cbmZ1bmN0aW9uIGhzbFRvUmdiKGgsIHMsIGwpIHtcbiAgICBsZXQgcjtcbiAgICBsZXQgZztcbiAgICBsZXQgYjtcbiAgICBoID0gYm91bmQwMShoLCAzNjApO1xuICAgIHMgPSBib3VuZDAxKHMsIDEwMCk7XG4gICAgbCA9IGJvdW5kMDEobCwgMTAwKTtcbiAgICBmdW5jdGlvbiBodWUycmdiKHAsIHEsIHQpIHtcbiAgICAgICAgaWYgKHQgPCAwKVxuICAgICAgICAgICAgdCArPSAxO1xuICAgICAgICBpZiAodCA+IDEpXG4gICAgICAgICAgICB0IC09IDE7XG4gICAgICAgIGlmICh0IDwgMSAvIDYpIHtcbiAgICAgICAgICAgIHJldHVybiBwICsgKHEgLSBwKSAqIDYgKiB0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0IDwgMSAvIDIpIHtcbiAgICAgICAgICAgIHJldHVybiBxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0IDwgMiAvIDMpIHtcbiAgICAgICAgICAgIHJldHVybiBwICsgKHEgLSBwKSAqICgyIC8gMyAtIHQpICogNjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG4gICAgaWYgKHMgPT09IDApIHtcbiAgICAgICAgciA9IGcgPSBiID0gbDsgLy8gYWNocm9tYXRpY1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcSA9IGwgPCAwLjUgPyBsICogKDEgKyBzKSA6IGwgKyBzIC0gbCAqIHM7XG4gICAgICAgIGNvbnN0IHAgPSAyICogbCAtIHE7XG4gICAgICAgIHIgPSBodWUycmdiKHAsIHEsIGggKyAxIC8gMyk7XG4gICAgICAgIGcgPSBodWUycmdiKHAsIHEsIGgpO1xuICAgICAgICBiID0gaHVlMnJnYihwLCBxLCBoIC0gMSAvIDMpO1xuICAgIH1cbiAgICByZXR1cm4geyByOiByICogMjU1LCBnOiBnICogMjU1LCBiOiBiICogMjU1IH07XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQiBjb2xvciB2YWx1ZSB0byBIU1ZcbiAqXG4gKiAqQXNzdW1lczoqIHIsIGcsIGFuZCBiIGFyZSBjb250YWluZWQgaW4gdGhlIHNldCBbMCwgMjU1XSBvciBbMCwgMV1cbiAqICpSZXR1cm5zOiogeyBoLCBzLCB2IH0gaW4gWzAsMV1cbiAqL1xuZnVuY3Rpb24gcmdiVG9Ic3YociwgZywgYikge1xuICAgIHIgPSBib3VuZDAxKHIsIDI1NSk7XG4gICAgZyA9IGJvdW5kMDEoZywgMjU1KTtcbiAgICBiID0gYm91bmQwMShiLCAyNTUpO1xuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIGNvbnN0IG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIGxldCBoID0gMDtcbiAgICBjb25zdCB2ID0gbWF4O1xuICAgIGNvbnN0IGQgPSBtYXggLSBtaW47XG4gICAgY29uc3QgcyA9IG1heCA9PT0gMCA/IDAgOiBkIC8gbWF4O1xuICAgIGlmIChtYXggPT09IG1pbikge1xuICAgICAgICBoID0gMDsgLy8gYWNocm9tYXRpY1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChtYXgpIHtcbiAgICAgICAgICAgIGNhc2UgcjpcbiAgICAgICAgICAgICAgICBoID0gKGcgLSBiKSAvIGQgKyAoZyA8IGIgPyA2IDogMCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGc6XG4gICAgICAgICAgICAgICAgaCA9IChiIC0gcikgLyBkICsgMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgYjpcbiAgICAgICAgICAgICAgICBoID0gKHIgLSBnKSAvIGQgKyA0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGggLz0gNjtcbiAgICB9XG4gICAgcmV0dXJuIHsgaDogaCwgczogcywgdjogdiB9O1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBIU1YgY29sb3IgdmFsdWUgdG8gUkdCLlxuICpcbiAqICpBc3N1bWVzOiogaCBpcyBjb250YWluZWQgaW4gWzAsIDFdIG9yIFswLCAzNjBdIGFuZCBzIGFuZCB2IGFyZSBjb250YWluZWQgaW4gWzAsIDFdIG9yIFswLCAxMDBdXG4gKiAqUmV0dXJuczoqIHsgciwgZywgYiB9IGluIHRoZSBzZXQgWzAsIDI1NV1cbiAqL1xuZnVuY3Rpb24gaHN2VG9SZ2IoaCwgcywgdikge1xuICAgIGggPSBib3VuZDAxKGgsIDM2MCkgKiA2O1xuICAgIHMgPSBib3VuZDAxKHMsIDEwMCk7XG4gICAgdiA9IGJvdW5kMDEodiwgMTAwKTtcbiAgICBjb25zdCBpID0gTWF0aC5mbG9vcihoKTtcbiAgICBjb25zdCBmID0gaCAtIGk7XG4gICAgY29uc3QgcCA9IHYgKiAoMSAtIHMpO1xuICAgIGNvbnN0IHEgPSB2ICogKDEgLSBmICogcyk7XG4gICAgY29uc3QgdCA9IHYgKiAoMSAtICgxIC0gZikgKiBzKTtcbiAgICBjb25zdCBtb2QgPSBpICUgNjtcbiAgICBjb25zdCByID0gW3YsIHEsIHAsIHAsIHQsIHZdW21vZF07XG4gICAgY29uc3QgZyA9IFt0LCB2LCB2LCBxLCBwLCBwXVttb2RdO1xuICAgIGNvbnN0IGIgPSBbcCwgcCwgdCwgdiwgdiwgcV1bbW9kXTtcbiAgICByZXR1cm4geyByOiByICogMjU1LCBnOiBnICogMjU1LCBiOiBiICogMjU1IH07XG59XG4vKipcbiAqIENvbnZlcnRzIGFuIFJHQiBjb2xvciB0byBoZXhcbiAqXG4gKiBBc3N1bWVzIHIsIGcsIGFuZCBiIGFyZSBjb250YWluZWQgaW4gdGhlIHNldCBbMCwgMjU1XVxuICogUmV0dXJucyBhIDMgb3IgNiBjaGFyYWN0ZXIgaGV4XG4gKi9cbmZ1bmN0aW9uIHJnYlRvSGV4KHIsIGcsIGIsIGFsbG93M0NoYXIpIHtcbiAgICBjb25zdCBoZXggPSBbXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChyKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoZykudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGIpLnRvU3RyaW5nKDE2KSksXG4gICAgXTtcbiAgICAvLyBSZXR1cm4gYSAzIGNoYXJhY3RlciBoZXggaWYgcG9zc2libGVcbiAgICBpZiAoYWxsb3czQ2hhciAmJlxuICAgICAgICBoZXhbMF0uY2hhckF0KDApID09PSBoZXhbMF0uY2hhckF0KDEpICYmXG4gICAgICAgIGhleFsxXS5jaGFyQXQoMCkgPT09IGhleFsxXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzJdLmNoYXJBdCgwKSA9PT0gaGV4WzJdLmNoYXJBdCgxKSkge1xuICAgICAgICByZXR1cm4gaGV4WzBdLmNoYXJBdCgwKSArIGhleFsxXS5jaGFyQXQoMCkgKyBoZXhbMl0uY2hhckF0KDApO1xuICAgIH1cbiAgICByZXR1cm4gaGV4LmpvaW4oJycpO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSR0JBIGNvbG9yIHBsdXMgYWxwaGEgdHJhbnNwYXJlbmN5IHRvIGhleFxuICpcbiAqIEFzc3VtZXMgciwgZywgYiBhcmUgY29udGFpbmVkIGluIHRoZSBzZXQgWzAsIDI1NV0gYW5kXG4gKiBhIGluIFswLCAxXS4gUmV0dXJucyBhIDQgb3IgOCBjaGFyYWN0ZXIgcmdiYSBoZXhcbiAqL1xuZnVuY3Rpb24gcmdiYVRvSGV4KHIsIGcsIGIsIGEsIGFsbG93NENoYXIpIHtcbiAgICBjb25zdCBoZXggPSBbXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChyKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoZykudG9TdHJpbmcoMTYpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKGIpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoY29udmVydERlY2ltYWxUb0hleChhKSksXG4gICAgXTtcbiAgICAvLyBSZXR1cm4gYSA0IGNoYXJhY3RlciBoZXggaWYgcG9zc2libGVcbiAgICBpZiAoYWxsb3c0Q2hhciAmJlxuICAgICAgICBoZXhbMF0uY2hhckF0KDApID09PSBoZXhbMF0uY2hhckF0KDEpICYmXG4gICAgICAgIGhleFsxXS5jaGFyQXQoMCkgPT09IGhleFsxXS5jaGFyQXQoMSkgJiZcbiAgICAgICAgaGV4WzJdLmNoYXJBdCgwKSA9PT0gaGV4WzJdLmNoYXJBdCgxKSAmJlxuICAgICAgICBoZXhbM10uY2hhckF0KDApID09PSBoZXhbM10uY2hhckF0KDEpKSB7XG4gICAgICAgIHJldHVybiBoZXhbMF0uY2hhckF0KDApICsgaGV4WzFdLmNoYXJBdCgwKSArIGhleFsyXS5jaGFyQXQoMCkgKyBoZXhbM10uY2hhckF0KDApO1xuICAgIH1cbiAgICByZXR1cm4gaGV4LmpvaW4oJycpO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSR0JBIGNvbG9yIHRvIGFuIEFSR0IgSGV4OCBzdHJpbmdcbiAqIFJhcmVseSB1c2VkLCBidXQgcmVxdWlyZWQgZm9yIFwidG9GaWx0ZXIoKVwiXG4gKi9cbmZ1bmN0aW9uIHJnYmFUb0FyZ2JIZXgociwgZywgYiwgYSkge1xuICAgIGNvbnN0IGhleCA9IFtcbiAgICAgICAgcGFkMihjb252ZXJ0RGVjaW1hbFRvSGV4KGEpKSxcbiAgICAgICAgcGFkMihNYXRoLnJvdW5kKHIpLnRvU3RyaW5nKDE2KSksXG4gICAgICAgIHBhZDIoTWF0aC5yb3VuZChnKS50b1N0cmluZygxNikpLFxuICAgICAgICBwYWQyKE1hdGgucm91bmQoYikudG9TdHJpbmcoMTYpKSxcbiAgICBdO1xuICAgIHJldHVybiBoZXguam9pbignJyk7XG59XG4vKiogQ29udmVydHMgYSBkZWNpbWFsIHRvIGEgaGV4IHZhbHVlICovXG5mdW5jdGlvbiBjb252ZXJ0RGVjaW1hbFRvSGV4KGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChwYXJzZUZsb2F0KGQpICogMjU1KS50b1N0cmluZygxNik7XG59XG4vKiogQ29udmVydHMgYSBoZXggdmFsdWUgdG8gYSBkZWNpbWFsICovXG5mdW5jdGlvbiBjb252ZXJ0SGV4VG9EZWNpbWFsKGgpIHtcbiAgICByZXR1cm4gcGFyc2VJbnRGcm9tSGV4KGgpIC8gMjU1O1xufVxuLyoqIFBhcnNlIGEgYmFzZS0xNiBoZXggdmFsdWUgaW50byBhIGJhc2UtMTAgaW50ZWdlciAqL1xuZnVuY3Rpb24gcGFyc2VJbnRGcm9tSGV4KHZhbCkge1xuICAgIHJldHVybiBwYXJzZUludCh2YWwsIDE2KTtcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2JhaGFtYXMxMC9jc3MtY29sb3ItbmFtZXMvYmxvYi9tYXN0ZXIvY3NzLWNvbG9yLW5hbWVzLmpzb25cbi8qKlxuICogQGhpZGRlblxuICovXG5jb25zdCBuYW1lcyA9IHtcbiAgICBhbGljZWJsdWU6ICcjZjBmOGZmJyxcbiAgICBhbnRpcXVld2hpdGU6ICcjZmFlYmQ3JyxcbiAgICBhcXVhOiAnIzAwZmZmZicsXG4gICAgYXF1YW1hcmluZTogJyM3ZmZmZDQnLFxuICAgIGF6dXJlOiAnI2YwZmZmZicsXG4gICAgYmVpZ2U6ICcjZjVmNWRjJyxcbiAgICBiaXNxdWU6ICcjZmZlNGM0JyxcbiAgICBibGFjazogJyMwMDAwMDAnLFxuICAgIGJsYW5jaGVkYWxtb25kOiAnI2ZmZWJjZCcsXG4gICAgYmx1ZTogJyMwMDAwZmYnLFxuICAgIGJsdWV2aW9sZXQ6ICcjOGEyYmUyJyxcbiAgICBicm93bjogJyNhNTJhMmEnLFxuICAgIGJ1cmx5d29vZDogJyNkZWI4ODcnLFxuICAgIGNhZGV0Ymx1ZTogJyM1ZjllYTAnLFxuICAgIGNoYXJ0cmV1c2U6ICcjN2ZmZjAwJyxcbiAgICBjaG9jb2xhdGU6ICcjZDI2OTFlJyxcbiAgICBjb3JhbDogJyNmZjdmNTAnLFxuICAgIGNvcm5mbG93ZXJibHVlOiAnIzY0OTVlZCcsXG4gICAgY29ybnNpbGs6ICcjZmZmOGRjJyxcbiAgICBjcmltc29uOiAnI2RjMTQzYycsXG4gICAgY3lhbjogJyMwMGZmZmYnLFxuICAgIGRhcmtibHVlOiAnIzAwMDA4YicsXG4gICAgZGFya2N5YW46ICcjMDA4YjhiJyxcbiAgICBkYXJrZ29sZGVucm9kOiAnI2I4ODYwYicsXG4gICAgZGFya2dyYXk6ICcjYTlhOWE5JyxcbiAgICBkYXJrZ3JlZW46ICcjMDA2NDAwJyxcbiAgICBkYXJrZ3JleTogJyNhOWE5YTknLFxuICAgIGRhcmtraGFraTogJyNiZGI3NmInLFxuICAgIGRhcmttYWdlbnRhOiAnIzhiMDA4YicsXG4gICAgZGFya29saXZlZ3JlZW46ICcjNTU2YjJmJyxcbiAgICBkYXJrb3JhbmdlOiAnI2ZmOGMwMCcsXG4gICAgZGFya29yY2hpZDogJyM5OTMyY2MnLFxuICAgIGRhcmtyZWQ6ICcjOGIwMDAwJyxcbiAgICBkYXJrc2FsbW9uOiAnI2U5OTY3YScsXG4gICAgZGFya3NlYWdyZWVuOiAnIzhmYmM4ZicsXG4gICAgZGFya3NsYXRlYmx1ZTogJyM0ODNkOGInLFxuICAgIGRhcmtzbGF0ZWdyYXk6ICcjMmY0ZjRmJyxcbiAgICBkYXJrc2xhdGVncmV5OiAnIzJmNGY0ZicsXG4gICAgZGFya3R1cnF1b2lzZTogJyMwMGNlZDEnLFxuICAgIGRhcmt2aW9sZXQ6ICcjOTQwMGQzJyxcbiAgICBkZWVwcGluazogJyNmZjE0OTMnLFxuICAgIGRlZXBza3libHVlOiAnIzAwYmZmZicsXG4gICAgZGltZ3JheTogJyM2OTY5NjknLFxuICAgIGRpbWdyZXk6ICcjNjk2OTY5JyxcbiAgICBkb2RnZXJibHVlOiAnIzFlOTBmZicsXG4gICAgZmlyZWJyaWNrOiAnI2IyMjIyMicsXG4gICAgZmxvcmFsd2hpdGU6ICcjZmZmYWYwJyxcbiAgICBmb3Jlc3RncmVlbjogJyMyMjhiMjInLFxuICAgIGZ1Y2hzaWE6ICcjZmYwMGZmJyxcbiAgICBnYWluc2Jvcm86ICcjZGNkY2RjJyxcbiAgICBnaG9zdHdoaXRlOiAnI2Y4ZjhmZicsXG4gICAgZ29sZDogJyNmZmQ3MDAnLFxuICAgIGdvbGRlbnJvZDogJyNkYWE1MjAnLFxuICAgIGdyYXk6ICcjODA4MDgwJyxcbiAgICBncmVlbjogJyMwMDgwMDAnLFxuICAgIGdyZWVueWVsbG93OiAnI2FkZmYyZicsXG4gICAgZ3JleTogJyM4MDgwODAnLFxuICAgIGhvbmV5ZGV3OiAnI2YwZmZmMCcsXG4gICAgaG90cGluazogJyNmZjY5YjQnLFxuICAgIGluZGlhbnJlZDogJyNjZDVjNWMnLFxuICAgIGluZGlnbzogJyM0YjAwODInLFxuICAgIGl2b3J5OiAnI2ZmZmZmMCcsXG4gICAga2hha2k6ICcjZjBlNjhjJyxcbiAgICBsYXZlbmRlcjogJyNlNmU2ZmEnLFxuICAgIGxhdmVuZGVyYmx1c2g6ICcjZmZmMGY1JyxcbiAgICBsYXduZ3JlZW46ICcjN2NmYzAwJyxcbiAgICBsZW1vbmNoaWZmb246ICcjZmZmYWNkJyxcbiAgICBsaWdodGJsdWU6ICcjYWRkOGU2JyxcbiAgICBsaWdodGNvcmFsOiAnI2YwODA4MCcsXG4gICAgbGlnaHRjeWFuOiAnI2UwZmZmZicsXG4gICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6ICcjZmFmYWQyJyxcbiAgICBsaWdodGdyYXk6ICcjZDNkM2QzJyxcbiAgICBsaWdodGdyZWVuOiAnIzkwZWU5MCcsXG4gICAgbGlnaHRncmV5OiAnI2QzZDNkMycsXG4gICAgbGlnaHRwaW5rOiAnI2ZmYjZjMScsXG4gICAgbGlnaHRzYWxtb246ICcjZmZhMDdhJyxcbiAgICBsaWdodHNlYWdyZWVuOiAnIzIwYjJhYScsXG4gICAgbGlnaHRza3libHVlOiAnIzg3Y2VmYScsXG4gICAgbGlnaHRzbGF0ZWdyYXk6ICcjNzc4ODk5JyxcbiAgICBsaWdodHNsYXRlZ3JleTogJyM3Nzg4OTknLFxuICAgIGxpZ2h0c3RlZWxibHVlOiAnI2IwYzRkZScsXG4gICAgbGlnaHR5ZWxsb3c6ICcjZmZmZmUwJyxcbiAgICBsaW1lOiAnIzAwZmYwMCcsXG4gICAgbGltZWdyZWVuOiAnIzMyY2QzMicsXG4gICAgbGluZW46ICcjZmFmMGU2JyxcbiAgICBtYWdlbnRhOiAnI2ZmMDBmZicsXG4gICAgbWFyb29uOiAnIzgwMDAwMCcsXG4gICAgbWVkaXVtYXF1YW1hcmluZTogJyM2NmNkYWEnLFxuICAgIG1lZGl1bWJsdWU6ICcjMDAwMGNkJyxcbiAgICBtZWRpdW1vcmNoaWQ6ICcjYmE1NWQzJyxcbiAgICBtZWRpdW1wdXJwbGU6ICcjOTM3MGRiJyxcbiAgICBtZWRpdW1zZWFncmVlbjogJyMzY2IzNzEnLFxuICAgIG1lZGl1bXNsYXRlYmx1ZTogJyM3YjY4ZWUnLFxuICAgIG1lZGl1bXNwcmluZ2dyZWVuOiAnIzAwZmE5YScsXG4gICAgbWVkaXVtdHVycXVvaXNlOiAnIzQ4ZDFjYycsXG4gICAgbWVkaXVtdmlvbGV0cmVkOiAnI2M3MTU4NScsXG4gICAgbWlkbmlnaHRibHVlOiAnIzE5MTk3MCcsXG4gICAgbWludGNyZWFtOiAnI2Y1ZmZmYScsXG4gICAgbWlzdHlyb3NlOiAnI2ZmZTRlMScsXG4gICAgbW9jY2FzaW46ICcjZmZlNGI1JyxcbiAgICBuYXZham93aGl0ZTogJyNmZmRlYWQnLFxuICAgIG5hdnk6ICcjMDAwMDgwJyxcbiAgICBvbGRsYWNlOiAnI2ZkZjVlNicsXG4gICAgb2xpdmU6ICcjODA4MDAwJyxcbiAgICBvbGl2ZWRyYWI6ICcjNmI4ZTIzJyxcbiAgICBvcmFuZ2U6ICcjZmZhNTAwJyxcbiAgICBvcmFuZ2VyZWQ6ICcjZmY0NTAwJyxcbiAgICBvcmNoaWQ6ICcjZGE3MGQ2JyxcbiAgICBwYWxlZ29sZGVucm9kOiAnI2VlZThhYScsXG4gICAgcGFsZWdyZWVuOiAnIzk4ZmI5OCcsXG4gICAgcGFsZXR1cnF1b2lzZTogJyNhZmVlZWUnLFxuICAgIHBhbGV2aW9sZXRyZWQ6ICcjZGI3MDkzJyxcbiAgICBwYXBheWF3aGlwOiAnI2ZmZWZkNScsXG4gICAgcGVhY2hwdWZmOiAnI2ZmZGFiOScsXG4gICAgcGVydTogJyNjZDg1M2YnLFxuICAgIHBpbms6ICcjZmZjMGNiJyxcbiAgICBwbHVtOiAnI2RkYTBkZCcsXG4gICAgcG93ZGVyYmx1ZTogJyNiMGUwZTYnLFxuICAgIHB1cnBsZTogJyM4MDAwODAnLFxuICAgIHJlYmVjY2FwdXJwbGU6ICcjNjYzMzk5JyxcbiAgICByZWQ6ICcjZmYwMDAwJyxcbiAgICByb3N5YnJvd246ICcjYmM4ZjhmJyxcbiAgICByb3lhbGJsdWU6ICcjNDE2OWUxJyxcbiAgICBzYWRkbGVicm93bjogJyM4YjQ1MTMnLFxuICAgIHNhbG1vbjogJyNmYTgwNzInLFxuICAgIHNhbmR5YnJvd246ICcjZjRhNDYwJyxcbiAgICBzZWFncmVlbjogJyMyZThiNTcnLFxuICAgIHNlYXNoZWxsOiAnI2ZmZjVlZScsXG4gICAgc2llbm5hOiAnI2EwNTIyZCcsXG4gICAgc2lsdmVyOiAnI2MwYzBjMCcsXG4gICAgc2t5Ymx1ZTogJyM4N2NlZWInLFxuICAgIHNsYXRlYmx1ZTogJyM2YTVhY2QnLFxuICAgIHNsYXRlZ3JheTogJyM3MDgwOTAnLFxuICAgIHNsYXRlZ3JleTogJyM3MDgwOTAnLFxuICAgIHNub3c6ICcjZmZmYWZhJyxcbiAgICBzcHJpbmdncmVlbjogJyMwMGZmN2YnLFxuICAgIHN0ZWVsYmx1ZTogJyM0NjgyYjQnLFxuICAgIHRhbjogJyNkMmI0OGMnLFxuICAgIHRlYWw6ICcjMDA4MDgwJyxcbiAgICB0aGlzdGxlOiAnI2Q4YmZkOCcsXG4gICAgdG9tYXRvOiAnI2ZmNjM0NycsXG4gICAgdHVycXVvaXNlOiAnIzQwZTBkMCcsXG4gICAgdmlvbGV0OiAnI2VlODJlZScsXG4gICAgd2hlYXQ6ICcjZjVkZWIzJyxcbiAgICB3aGl0ZTogJyNmZmZmZmYnLFxuICAgIHdoaXRlc21va2U6ICcjZjVmNWY1JyxcbiAgICB5ZWxsb3c6ICcjZmZmZjAwJyxcbiAgICB5ZWxsb3dncmVlbjogJyM5YWNkMzInLFxufTtcblxuLyoqXG4gKiBHaXZlbiBhIHN0cmluZyBvciBvYmplY3QsIGNvbnZlcnQgdGhhdCBpbnB1dCB0byBSR0JcbiAqXG4gKiBQb3NzaWJsZSBzdHJpbmcgaW5wdXRzOlxuICogYGBgXG4gKiBcInJlZFwiXG4gKiBcIiNmMDBcIiBvciBcImYwMFwiXG4gKiBcIiNmZjAwMDBcIiBvciBcImZmMDAwMFwiXG4gKiBcIiNmZjAwMDAwMFwiIG9yIFwiZmYwMDAwMDBcIlxuICogXCJyZ2IgMjU1IDAgMFwiIG9yIFwicmdiICgyNTUsIDAsIDApXCJcbiAqIFwicmdiIDEuMCAwIDBcIiBvciBcInJnYiAoMSwgMCwgMClcIlxuICogXCJyZ2JhICgyNTUsIDAsIDAsIDEpXCIgb3IgXCJyZ2JhIDI1NSwgMCwgMCwgMVwiXG4gKiBcInJnYmEgKDEuMCwgMCwgMCwgMSlcIiBvciBcInJnYmEgMS4wLCAwLCAwLCAxXCJcbiAqIFwiaHNsKDAsIDEwMCUsIDUwJSlcIiBvciBcImhzbCAwIDEwMCUgNTAlXCJcbiAqIFwiaHNsYSgwLCAxMDAlLCA1MCUsIDEpXCIgb3IgXCJoc2xhIDAgMTAwJSA1MCUsIDFcIlxuICogXCJoc3YoMCwgMTAwJSwgMTAwJSlcIiBvciBcImhzdiAwIDEwMCUgMTAwJVwiXG4gKiBgYGBcbiAqL1xuZnVuY3Rpb24gaW5wdXRUb1JHQihjb2xvcikge1xuICAgIGxldCByZ2IgPSB7IHI6IDAsIGc6IDAsIGI6IDAgfTtcbiAgICBsZXQgYSA9IDE7XG4gICAgbGV0IHMgPSBudWxsO1xuICAgIGxldCB2ID0gbnVsbDtcbiAgICBsZXQgbCA9IG51bGw7XG4gICAgbGV0IG9rID0gZmFsc2U7XG4gICAgbGV0IGZvcm1hdCA9IGZhbHNlO1xuICAgIGlmICh0eXBlb2YgY29sb3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbG9yID0gc3RyaW5nSW5wdXRUb09iamVjdChjb2xvcik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29sb3IgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChpc1ZhbGlkQ1NTVW5pdChjb2xvci5yKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci5nKSAmJiBpc1ZhbGlkQ1NTVW5pdChjb2xvci5iKSkge1xuICAgICAgICAgICAgcmdiID0gcmdiVG9SZ2IoY29sb3IuciwgY29sb3IuZywgY29sb3IuYik7XG4gICAgICAgICAgICBvayA9IHRydWU7XG4gICAgICAgICAgICBmb3JtYXQgPSBTdHJpbmcoY29sb3Iucikuc3Vic3RyKC0xKSA9PT0gJyUnID8gJ3ByZ2InIDogJ3JnYic7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNWYWxpZENTU1VuaXQoY29sb3IuaCkgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IucykgJiYgaXNWYWxpZENTU1VuaXQoY29sb3IudikpIHtcbiAgICAgICAgICAgIHMgPSBjb252ZXJ0VG9QZXJjZW50YWdlKGNvbG9yLnMpO1xuICAgICAgICAgICAgdiA9IGNvbnZlcnRUb1BlcmNlbnRhZ2UoY29sb3Iudik7XG4gICAgICAgICAgICByZ2IgPSBoc3ZUb1JnYihjb2xvci5oLCBzLCB2KTtcbiAgICAgICAgICAgIG9rID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcm1hdCA9ICdoc3YnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzVmFsaWRDU1NVbml0KGNvbG9yLmgpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLnMpICYmIGlzVmFsaWRDU1NVbml0KGNvbG9yLmwpKSB7XG4gICAgICAgICAgICBzID0gY29udmVydFRvUGVyY2VudGFnZShjb2xvci5zKTtcbiAgICAgICAgICAgIGwgPSBjb252ZXJ0VG9QZXJjZW50YWdlKGNvbG9yLmwpO1xuICAgICAgICAgICAgcmdiID0gaHNsVG9SZ2IoY29sb3IuaCwgcywgbCk7XG4gICAgICAgICAgICBvayA9IHRydWU7XG4gICAgICAgICAgICBmb3JtYXQgPSAnaHNsJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sb3IuaGFzT3duUHJvcGVydHkoJ2EnKSkge1xuICAgICAgICAgICAgYSA9IGNvbG9yLmE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYSA9IGJvdW5kQWxwaGEoYSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2ssXG4gICAgICAgIGZvcm1hdDogY29sb3IuZm9ybWF0IHx8IGZvcm1hdCxcbiAgICAgICAgcjogTWF0aC5taW4oMjU1LCBNYXRoLm1heChyZ2IuciwgMCkpLFxuICAgICAgICBnOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KHJnYi5nLCAwKSksXG4gICAgICAgIGI6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgocmdiLmIsIDApKSxcbiAgICAgICAgYSxcbiAgICB9O1xufVxuLy8gPGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtdmFsdWVzLyNpbnRlZ2Vycz5cbmNvbnN0IENTU19JTlRFR0VSID0gJ1stXFxcXCtdP1xcXFxkKyU/Jztcbi8vIDxodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXZhbHVlcy8jbnVtYmVyLXZhbHVlPlxuY29uc3QgQ1NTX05VTUJFUiA9ICdbLVxcXFwrXT9cXFxcZCpcXFxcLlxcXFxkKyU/Jztcbi8vIEFsbG93IHBvc2l0aXZlL25lZ2F0aXZlIGludGVnZXIvbnVtYmVyLiAgRG9uJ3QgY2FwdHVyZSB0aGUgZWl0aGVyL29yLCBqdXN0IHRoZSBlbnRpcmUgb3V0Y29tZS5cbmNvbnN0IENTU19VTklUID0gYCg/OiR7Q1NTX05VTUJFUn0pfCg/OiR7Q1NTX0lOVEVHRVJ9KWA7XG4vLyBBY3R1YWwgbWF0Y2hpbmcuXG4vLyBQYXJlbnRoZXNlcyBhbmQgY29tbWFzIGFyZSBvcHRpb25hbCwgYnV0IG5vdCByZXF1aXJlZC5cbi8vIFdoaXRlc3BhY2UgY2FuIHRha2UgdGhlIHBsYWNlIG9mIGNvbW1hcyBvciBvcGVuaW5nIHBhcmVuXG5jb25zdCBQRVJNSVNTSVZFX01BVENIMyA9IGBbXFxcXHN8XFxcXChdKygke0NTU19VTklUfSlbLHxcXFxcc10rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pXFxcXHMqXFxcXCk/YDtcbmNvbnN0IFBFUk1JU1NJVkVfTUFUQ0g0ID0gYFtcXFxcc3xcXFxcKF0rKCR7Q1NTX1VOSVR9KVssfFxcXFxzXSsoJHtDU1NfVU5JVH0pWyx8XFxcXHNdKygke0NTU19VTklUfSlbLHxcXFxcc10rKCR7Q1NTX1VOSVR9KVxcXFxzKlxcXFwpP2A7XG5jb25zdCBtYXRjaGVycyA9IHtcbiAgICBDU1NfVU5JVDogbmV3IFJlZ0V4cChDU1NfVU5JVCksXG4gICAgcmdiOiBuZXcgUmVnRXhwKCdyZ2InICsgUEVSTUlTU0lWRV9NQVRDSDMpLFxuICAgIHJnYmE6IG5ldyBSZWdFeHAoJ3JnYmEnICsgUEVSTUlTU0lWRV9NQVRDSDQpLFxuICAgIGhzbDogbmV3IFJlZ0V4cCgnaHNsJyArIFBFUk1JU1NJVkVfTUFUQ0gzKSxcbiAgICBoc2xhOiBuZXcgUmVnRXhwKCdoc2xhJyArIFBFUk1JU1NJVkVfTUFUQ0g0KSxcbiAgICBoc3Y6IG5ldyBSZWdFeHAoJ2hzdicgKyBQRVJNSVNTSVZFX01BVENIMyksXG4gICAgaHN2YTogbmV3IFJlZ0V4cCgnaHN2YScgKyBQRVJNSVNTSVZFX01BVENINCksXG4gICAgaGV4MzogL14jPyhbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pKFswLTlhLWZBLUZdezF9KSQvLFxuICAgIGhleDY6IC9eIz8oWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KShbMC05YS1mQS1GXXsyfSkkLyxcbiAgICBoZXg0OiAvXiM/KFswLTlhLWZBLUZdezF9KShbMC05YS1mQS1GXXsxfSkoWzAtOWEtZkEtRl17MX0pKFswLTlhLWZBLUZdezF9KSQvLFxuICAgIGhleDg6IC9eIz8oWzAtOWEtZkEtRl17Mn0pKFswLTlhLWZBLUZdezJ9KShbMC05YS1mQS1GXXsyfSkoWzAtOWEtZkEtRl17Mn0pJC8sXG59O1xuLyoqXG4gKiBQZXJtaXNzaXZlIHN0cmluZyBwYXJzaW5nLiAgVGFrZSBpbiBhIG51bWJlciBvZiBmb3JtYXRzLCBhbmQgb3V0cHV0IGFuIG9iamVjdFxuICogYmFzZWQgb24gZGV0ZWN0ZWQgZm9ybWF0LiAgUmV0dXJucyBgeyByLCBnLCBiIH1gIG9yIGB7IGgsIHMsIGwgfWAgb3IgYHsgaCwgcywgdn1gXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ0lucHV0VG9PYmplY3QoY29sb3IpIHtcbiAgICBjb2xvciA9IGNvbG9yLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjb2xvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBsZXQgbmFtZWQgPSBmYWxzZTtcbiAgICBpZiAobmFtZXNbY29sb3JdKSB7XG4gICAgICAgIGNvbG9yID0gbmFtZXNbY29sb3JdO1xuICAgICAgICBuYW1lZCA9IHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNvbG9yID09PSAndHJhbnNwYXJlbnQnKSB7XG4gICAgICAgIHJldHVybiB7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDAsIGZvcm1hdDogJ25hbWUnIH07XG4gICAgfVxuICAgIC8vIFRyeSB0byBtYXRjaCBzdHJpbmcgaW5wdXQgdXNpbmcgcmVndWxhciBleHByZXNzaW9ucy5cbiAgICAvLyBLZWVwIG1vc3Qgb2YgdGhlIG51bWJlciBib3VuZGluZyBvdXQgb2YgdGhpcyBmdW5jdGlvbiAtIGRvbid0IHdvcnJ5IGFib3V0IFswLDFdIG9yIFswLDEwMF0gb3IgWzAsMzYwXVxuICAgIC8vIEp1c3QgcmV0dXJuIGFuIG9iamVjdCBhbmQgbGV0IHRoZSBjb252ZXJzaW9uIGZ1bmN0aW9ucyBoYW5kbGUgdGhhdC5cbiAgICAvLyBUaGlzIHdheSB0aGUgcmVzdWx0IHdpbGwgYmUgdGhlIHNhbWUgd2hldGhlciB0aGUgdGlueWNvbG9yIGlzIGluaXRpYWxpemVkIHdpdGggc3RyaW5nIG9yIG9iamVjdC5cbiAgICBsZXQgbWF0Y2ggPSBtYXRjaGVycy5yZ2IuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IHI6IG1hdGNoWzFdLCBnOiBtYXRjaFsyXSwgYjogbWF0Y2hbM10gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5yZ2JhLmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyByOiBtYXRjaFsxXSwgZzogbWF0Y2hbMl0sIGI6IG1hdGNoWzNdLCBhOiBtYXRjaFs0XSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhzbC5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgaDogbWF0Y2hbMV0sIHM6IG1hdGNoWzJdLCBsOiBtYXRjaFszXSB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhzbGEuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7IGg6IG1hdGNoWzFdLCBzOiBtYXRjaFsyXSwgbDogbWF0Y2hbM10sIGE6IG1hdGNoWzRdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaHN2LmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4geyBoOiBtYXRjaFsxXSwgczogbWF0Y2hbMl0sIHY6IG1hdGNoWzNdIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaHN2YS5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHsgaDogbWF0Y2hbMV0sIHM6IG1hdGNoWzJdLCB2OiBtYXRjaFszXSwgYTogbWF0Y2hbNF0gfTtcbiAgICB9XG4gICAgbWF0Y2ggPSBtYXRjaGVycy5oZXg4LmV4ZWMoY29sb3IpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcjogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGc6IHBhcnNlSW50RnJvbUhleChtYXRjaFsyXSksXG4gICAgICAgICAgICBiOiBwYXJzZUludEZyb21IZXgobWF0Y2hbM10pLFxuICAgICAgICAgICAgYTogY29udmVydEhleFRvRGVjaW1hbChtYXRjaFs0XSksXG4gICAgICAgICAgICBmb3JtYXQ6IG5hbWVkID8gJ25hbWUnIDogJ2hleDgnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhleDYuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMV0pLFxuICAgICAgICAgICAgZzogcGFyc2VJbnRGcm9tSGV4KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50RnJvbUhleChtYXRjaFszXSksXG4gICAgICAgICAgICBmb3JtYXQ6IG5hbWVkID8gJ25hbWUnIDogJ2hleCcsXG4gICAgICAgIH07XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hlcnMuaGV4NC5leGVjKGNvbG9yKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IHBhcnNlSW50RnJvbUhleChtYXRjaFsxXSArIG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGc6IHBhcnNlSW50RnJvbUhleChtYXRjaFsyXSArIG1hdGNoWzJdKSxcbiAgICAgICAgICAgIGI6IHBhcnNlSW50RnJvbUhleChtYXRjaFszXSArIG1hdGNoWzNdKSxcbiAgICAgICAgICAgIGE6IGNvbnZlcnRIZXhUb0RlY2ltYWwobWF0Y2hbNF0gKyBtYXRjaFs0XSksXG4gICAgICAgICAgICBmb3JtYXQ6IG5hbWVkID8gJ25hbWUnIDogJ2hleDgnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBtYXRjaCA9IG1hdGNoZXJzLmhleDMuZXhlYyhjb2xvcik7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMV0gKyBtYXRjaFsxXSksXG4gICAgICAgICAgICBnOiBwYXJzZUludEZyb21IZXgobWF0Y2hbMl0gKyBtYXRjaFsyXSksXG4gICAgICAgICAgICBiOiBwYXJzZUludEZyb21IZXgobWF0Y2hbM10gKyBtYXRjaFszXSksXG4gICAgICAgICAgICBmb3JtYXQ6IG5hbWVkID8gJ25hbWUnIDogJ2hleCcsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIGl0IGxvb2tzIGxpa2UgYSBDU1MgdW5pdFxuICogKHNlZSBgbWF0Y2hlcnNgIGFib3ZlIGZvciBkZWZpbml0aW9uKS5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZENTU1VuaXQoY29sb3IpIHtcbiAgICByZXR1cm4gISFtYXRjaGVycy5DU1NfVU5JVC5leGVjKFN0cmluZyhjb2xvcikpO1xufVxuXG5jbGFzcyBUaW55Q29sb3Ige1xuICAgIGNvbnN0cnVjdG9yKGNvbG9yID0gJycsIG9wdHMgPSB7fSkge1xuICAgICAgICAvLyBJZiBpbnB1dCBpcyBhbHJlYWR5IGEgdGlueWNvbG9yLCByZXR1cm4gaXRzZWxmXG4gICAgICAgIGlmIChjb2xvciBpbnN0YW5jZW9mIFRpbnlDb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3JpZ2luYWxJbnB1dCA9IGNvbG9yO1xuICAgICAgICBjb25zdCByZ2IgPSBpbnB1dFRvUkdCKGNvbG9yKTtcbiAgICAgICAgdGhpcy5vcmlnaW5hbElucHV0ID0gY29sb3I7XG4gICAgICAgIHRoaXMuciA9IHJnYi5yO1xuICAgICAgICB0aGlzLmcgPSByZ2IuZztcbiAgICAgICAgdGhpcy5iID0gcmdiLmI7XG4gICAgICAgIHRoaXMuYSA9IHJnYi5hO1xuICAgICAgICB0aGlzLnJvdW5kQSA9IE1hdGgucm91bmQoMTAwICogdGhpcy5hKSAvIDEwMDtcbiAgICAgICAgdGhpcy5mb3JtYXQgPSBvcHRzLmZvcm1hdCB8fCByZ2IuZm9ybWF0O1xuICAgICAgICB0aGlzLmdyYWRpZW50VHlwZSA9IG9wdHMuZ3JhZGllbnRUeXBlO1xuICAgICAgICAvLyBEb24ndCBsZXQgdGhlIHJhbmdlIG9mIFswLDI1NV0gY29tZSBiYWNrIGluIFswLDFdLlxuICAgICAgICAvLyBQb3RlbnRpYWxseSBsb3NlIGEgbGl0dGxlIGJpdCBvZiBwcmVjaXNpb24gaGVyZSwgYnV0IHdpbGwgZml4IGlzc3VlcyB3aGVyZVxuICAgICAgICAvLyAuNSBnZXRzIGludGVycHJldGVkIGFzIGhhbGYgb2YgdGhlIHRvdGFsLCBpbnN0ZWFkIG9mIGhhbGYgb2YgMVxuICAgICAgICAvLyBJZiBpdCB3YXMgc3VwcG9zZWQgdG8gYmUgMTI4LCB0aGlzIHdhcyBhbHJlYWR5IHRha2VuIGNhcmUgb2YgYnkgYGlucHV0VG9SZ2JgXG4gICAgICAgIGlmICh0aGlzLnIgPCAxKSB7XG4gICAgICAgICAgICB0aGlzLnIgPSBNYXRoLnJvdW5kKHRoaXMucik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZyA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZyA9IE1hdGgucm91bmQodGhpcy5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5iIDwgMSkge1xuICAgICAgICAgICAgdGhpcy5iID0gTWF0aC5yb3VuZCh0aGlzLmIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNWYWxpZCA9IHJnYi5vaztcbiAgICB9XG4gICAgaXNEYXJrKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRCcmlnaHRuZXNzKCkgPCAxMjg7XG4gICAgfVxuICAgIGlzTGlnaHQoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5pc0RhcmsoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGVyY2VpdmVkIGJyaWdodG5lc3Mgb2YgdGhlIGNvbG9yLCBmcm9tIDAtMjU1LlxuICAgICAqL1xuICAgIGdldEJyaWdodG5lc3MoKSB7XG4gICAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0FFUlQjY29sb3ItY29udHJhc3RcbiAgICAgICAgY29uc3QgcmdiID0gdGhpcy50b1JnYigpO1xuICAgICAgICByZXR1cm4gKHJnYi5yICogMjk5ICsgcmdiLmcgKiA1ODcgKyByZ2IuYiAqIDExNCkgLyAxMDAwO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwZXJjZWl2ZWQgbHVtaW5hbmNlIG9mIGEgY29sb3IsIGZyb20gMC0xLlxuICAgICAqL1xuICAgIGdldEx1bWluYW5jZSgpIHtcbiAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMtV0NBRzIwLTIwMDgxMjExLyNyZWxhdGl2ZWx1bWluYW5jZWRlZlxuICAgICAgICBjb25zdCByZ2IgPSB0aGlzLnRvUmdiKCk7XG4gICAgICAgIGxldCBSO1xuICAgICAgICBsZXQgRztcbiAgICAgICAgbGV0IEI7XG4gICAgICAgIGNvbnN0IFJzUkdCID0gcmdiLnIgLyAyNTU7XG4gICAgICAgIGNvbnN0IEdzUkdCID0gcmdiLmcgLyAyNTU7XG4gICAgICAgIGNvbnN0IEJzUkdCID0gcmdiLmIgLyAyNTU7XG4gICAgICAgIGlmIChSc1JHQiA8PSAwLjAzOTI4KSB7XG4gICAgICAgICAgICBSID0gUnNSR0IgLyAxMi45MjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIFIgPSBNYXRoLnBvdygoUnNSR0IgKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoR3NSR0IgPD0gMC4wMzkyOCkge1xuICAgICAgICAgICAgRyA9IEdzUkdCIC8gMTIuOTI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBHID0gTWF0aC5wb3coKEdzUkdCICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEJzUkdCIDw9IDAuMDM5MjgpIHtcbiAgICAgICAgICAgIEIgPSBCc1JHQiAvIDEyLjkyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgQiA9IE1hdGgucG93KChCc1JHQiArIDAuMDU1KSAvIDEuMDU1LCAyLjQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAwLjIxMjYgKiBSICsgMC43MTUyICogRyArIDAuMDcyMiAqIEI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGFscGhhIHZhbHVlIG9uIHRoZSBjdXJyZW50IGNvbG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFscGhhIC0gVGhlIG5ldyBhbHBoYSB2YWx1ZS4gVGhlIGFjY2VwdGVkIHJhbmdlIGlzIDAtMS5cbiAgICAgKi9cbiAgICBzZXRBbHBoYShhbHBoYSkge1xuICAgICAgICB0aGlzLmEgPSBib3VuZEFscGhhKGFscGhhKTtcbiAgICAgICAgdGhpcy5yb3VuZEEgPSBNYXRoLnJvdW5kKDEwMCAqIHRoaXMuYSkgLyAxMDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBvYmplY3QgYXMgYSBIU1ZBIG9iamVjdC5cbiAgICAgKi9cbiAgICB0b0hzdigpIHtcbiAgICAgICAgY29uc3QgaHN2ID0gcmdiVG9Ic3YodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gICAgICAgIHJldHVybiB7IGg6IGhzdi5oICogMzYwLCBzOiBoc3YucywgdjogaHN2LnYsIGE6IHRoaXMuYSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoc3ZhIHZhbHVlcyBpbnRlcnBvbGF0ZWQgaW50byBhIHN0cmluZyB3aXRoIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICAgICAqIFwiaHN2YSh4eHgsIHh4eCwgeHh4LCB4eClcIi5cbiAgICAgKi9cbiAgICB0b0hzdlN0cmluZygpIHtcbiAgICAgICAgY29uc3QgaHN2ID0gcmdiVG9Ic3YodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gICAgICAgIGNvbnN0IGggPSBNYXRoLnJvdW5kKGhzdi5oICogMzYwKTtcbiAgICAgICAgY29uc3QgcyA9IE1hdGgucm91bmQoaHN2LnMgKiAxMDApO1xuICAgICAgICBjb25zdCB2ID0gTWF0aC5yb3VuZChoc3YudiAqIDEwMCk7XG4gICAgICAgIHJldHVybiB0aGlzLmEgPT09IDEgPyBgaHN2KCR7aH0sICR7c30lLCAke3Z9JSlgIDogYGhzdmEoJHtofSwgJHtzfSUsICR7dn0lLCAke3RoaXMucm91bmRBfSlgO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBvYmplY3QgYXMgYSBIU0xBIG9iamVjdC5cbiAgICAgKi9cbiAgICB0b0hzbCgpIHtcbiAgICAgICAgY29uc3QgaHNsID0gcmdiVG9Ic2wodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gICAgICAgIHJldHVybiB7IGg6IGhzbC5oICogMzYwLCBzOiBoc2wucywgbDogaHNsLmwsIGE6IHRoaXMuYSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoc2xhIHZhbHVlcyBpbnRlcnBvbGF0ZWQgaW50byBhIHN0cmluZyB3aXRoIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICAgICAqIFwiaHNsYSh4eHgsIHh4eCwgeHh4LCB4eClcIi5cbiAgICAgKi9cbiAgICB0b0hzbFN0cmluZygpIHtcbiAgICAgICAgY29uc3QgaHNsID0gcmdiVG9Ic2wodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gICAgICAgIGNvbnN0IGggPSBNYXRoLnJvdW5kKGhzbC5oICogMzYwKTtcbiAgICAgICAgY29uc3QgcyA9IE1hdGgucm91bmQoaHNsLnMgKiAxMDApO1xuICAgICAgICBjb25zdCBsID0gTWF0aC5yb3VuZChoc2wubCAqIDEwMCk7XG4gICAgICAgIHJldHVybiB0aGlzLmEgPT09IDEgPyBgaHNsKCR7aH0sICR7c30lLCAke2x9JSlgIDogYGhzbGEoJHtofSwgJHtzfSUsICR7bH0lLCAke3RoaXMucm91bmRBfSlgO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBoZXggdmFsdWUgb2YgdGhlIGNvbG9yLlxuICAgICAqIEBwYXJhbSBhbGxvdzNDaGFyIHdpbGwgc2hvcnRlbiBoZXggdmFsdWUgdG8gMyBjaGFyIGlmIHBvc3NpYmxlXG4gICAgICovXG4gICAgdG9IZXgoYWxsb3czQ2hhciA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiByZ2JUb0hleCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCBhbGxvdzNDaGFyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaGV4IHZhbHVlIG9mIHRoZSBjb2xvciAtd2l0aCBhICMgYXBwZW5lZC5cbiAgICAgKiBAcGFyYW0gYWxsb3czQ2hhciB3aWxsIHNob3J0ZW4gaGV4IHZhbHVlIHRvIDMgY2hhciBpZiBwb3NzaWJsZVxuICAgICAqL1xuICAgIHRvSGV4U3RyaW5nKGFsbG93M0NoYXIgPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gJyMnICsgdGhpcy50b0hleChhbGxvdzNDaGFyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaGV4IDggdmFsdWUgb2YgdGhlIGNvbG9yLlxuICAgICAqIEBwYXJhbSBhbGxvdzRDaGFyIHdpbGwgc2hvcnRlbiBoZXggdmFsdWUgdG8gNCBjaGFyIGlmIHBvc3NpYmxlXG4gICAgICovXG4gICAgdG9IZXg4KGFsbG93NENoYXIgPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gcmdiYVRvSGV4KHRoaXMuciwgdGhpcy5nLCB0aGlzLmIsIHRoaXMuYSwgYWxsb3c0Q2hhcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGhleCA4IHZhbHVlIG9mIHRoZSBjb2xvciAtd2l0aCBhICMgYXBwZW5lZC5cbiAgICAgKiBAcGFyYW0gYWxsb3c0Q2hhciB3aWxsIHNob3J0ZW4gaGV4IHZhbHVlIHRvIDQgY2hhciBpZiBwb3NzaWJsZVxuICAgICAqL1xuICAgIHRvSGV4OFN0cmluZyhhbGxvdzRDaGFyID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuICcjJyArIHRoaXMudG9IZXg4KGFsbG93NENoYXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBvYmplY3QgYXMgYSBSR0JBIG9iamVjdC5cbiAgICAgKi9cbiAgICB0b1JnYigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IE1hdGgucm91bmQodGhpcy5yKSxcbiAgICAgICAgICAgIGc6IE1hdGgucm91bmQodGhpcy5nKSxcbiAgICAgICAgICAgIGI6IE1hdGgucm91bmQodGhpcy5iKSxcbiAgICAgICAgICAgIGE6IHRoaXMuYSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgUkdCQSB2YWx1ZXMgaW50ZXJwb2xhdGVkIGludG8gYSBzdHJpbmcgd2l0aCB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAgICAgKiBcIlJHQkEoeHh4LCB4eHgsIHh4eCwgeHgpXCIuXG4gICAgICovXG4gICAgdG9SZ2JTdHJpbmcoKSB7XG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJvdW5kKHRoaXMucik7XG4gICAgICAgIGNvbnN0IGcgPSBNYXRoLnJvdW5kKHRoaXMuZyk7XG4gICAgICAgIGNvbnN0IGIgPSBNYXRoLnJvdW5kKHRoaXMuYik7XG4gICAgICAgIHJldHVybiB0aGlzLmEgPT09IDEgPyBgcmdiKCR7cn0sICR7Z30sICR7Yn0pYCA6IGByZ2JhKCR7cn0sICR7Z30sICR7Yn0sICR7dGhpcy5yb3VuZEF9KWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9iamVjdCBhcyBhIFJHQkEgb2JqZWN0LlxuICAgICAqL1xuICAgIHRvUGVyY2VudGFnZVJnYigpIHtcbiAgICAgICAgY29uc3QgZm10ID0gKHgpID0+IE1hdGgucm91bmQoYm91bmQwMSh4LCAyNTUpICogMTAwKSArICclJztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHI6IGZtdCh0aGlzLnIpLFxuICAgICAgICAgICAgZzogZm10KHRoaXMuZyksXG4gICAgICAgICAgICBiOiBmbXQodGhpcy5iKSxcbiAgICAgICAgICAgIGE6IHRoaXMuYSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgUkdCQSByZWxhdGl2ZSB2YWx1ZXMgaW50ZXJwb2xhdGVkIGludG8gYSBzdHJpbmdcbiAgICAgKi9cbiAgICB0b1BlcmNlbnRhZ2VSZ2JTdHJpbmcoKSB7XG4gICAgICAgIGNvbnN0IHJuZCA9ICh4KSA9PiBNYXRoLnJvdW5kKGJvdW5kMDEoeCwgMjU1KSAqIDEwMCk7XG4gICAgICAgIHJldHVybiB0aGlzLmEgPT09IDFcbiAgICAgICAgICAgID8gYHJnYigke3JuZCh0aGlzLnIpfSUsICR7cm5kKHRoaXMuZyl9JSwgJHtybmQodGhpcy5iKX0lKWBcbiAgICAgICAgICAgIDogYHJnYmEoJHtybmQodGhpcy5yKX0lLCAke3JuZCh0aGlzLmcpfSUsICR7cm5kKHRoaXMuYil9JSwgJHt0aGlzLnJvdW5kQX0pYDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhlICdyZWFsJyBuYW1lIG9mIHRoZSBjb2xvciAtaWYgdGhlcmUgaXMgb25lLlxuICAgICAqL1xuICAgIHRvTmFtZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc3BhcmVudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoZXggPSAnIycgKyByZ2JUb0hleCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCBmYWxzZSk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG5hbWVzKSkge1xuICAgICAgICAgICAgaWYgKG5hbWVzW2tleV0gPT09IGhleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1hdCAtIFRoZSBmb3JtYXQgdG8gYmUgdXNlZCB3aGVuIGRpc3BsYXlpbmcgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICAgKi9cbiAgICB0b1N0cmluZyhmb3JtYXQpIHtcbiAgICAgICAgY29uc3QgZm9ybWF0U2V0ID0gISFmb3JtYXQ7XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCB0aGlzLmZvcm1hdDtcbiAgICAgICAgbGV0IGZvcm1hdHRlZFN0cmluZyA9IGZhbHNlO1xuICAgICAgICBjb25zdCBoYXNBbHBoYSA9IHRoaXMuYSA8IDEgJiYgdGhpcy5hID49IDA7XG4gICAgICAgIGNvbnN0IG5lZWRzQWxwaGFGb3JtYXQgPSAhZm9ybWF0U2V0ICYmIGhhc0FscGhhICYmIChmb3JtYXQuc3RhcnRzV2l0aCgnaGV4JykgfHwgZm9ybWF0ID09PSAnbmFtZScpO1xuICAgICAgICBpZiAobmVlZHNBbHBoYUZvcm1hdCkge1xuICAgICAgICAgICAgLy8gU3BlY2lhbCBjYXNlIGZvciBcInRyYW5zcGFyZW50XCIsIGFsbCBvdGhlciBub24tYWxwaGEgZm9ybWF0c1xuICAgICAgICAgICAgLy8gd2lsbCByZXR1cm4gcmdiYSB3aGVuIHRoZXJlIGlzIHRyYW5zcGFyZW5jeS5cbiAgICAgICAgICAgIGlmIChmb3JtYXQgPT09ICduYW1lJyAmJiB0aGlzLmEgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b05hbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvUmdiU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ3JnYicpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9SZ2JTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAncHJnYicpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9QZXJjZW50YWdlUmdiU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hleCcgfHwgZm9ybWF0ID09PSAnaGV4NicpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9IZXhTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaGV4MycpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9IZXhTdHJpbmcodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hleDQnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvSGV4OFN0cmluZyh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybWF0ID09PSAnaGV4OCcpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9IZXg4U3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ25hbWUnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvTmFtZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdoc2wnKSB7XG4gICAgICAgICAgICBmb3JtYXR0ZWRTdHJpbmcgPSB0aGlzLnRvSHNsU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2hzdicpIHtcbiAgICAgICAgICAgIGZvcm1hdHRlZFN0cmluZyA9IHRoaXMudG9Ic3ZTdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9ybWF0dGVkU3RyaW5nIHx8IHRoaXMudG9IZXhTdHJpbmcoKTtcbiAgICB9XG4gICAgY2xvbmUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKHRoaXMudG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExpZ2h0ZW4gdGhlIGNvbG9yIGEgZ2l2ZW4gYW1vdW50LiBQcm92aWRpbmcgMTAwIHdpbGwgYWx3YXlzIHJldHVybiB3aGl0ZS5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIGxpZ2h0ZW4oYW1vdW50ID0gMTApIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBoc2wubCArPSBhbW91bnQgLyAxMDA7XG4gICAgICAgIGhzbC5sID0gY2xhbXAwMShoc2wubCk7XG4gICAgICAgIHJldHVybiBuZXcgVGlueUNvbG9yKGhzbCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEJyaWdodGVuIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudCwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIGJyaWdodGVuKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IHJnYiA9IHRoaXMudG9SZ2IoKTtcbiAgICAgICAgcmdiLnIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHJnYi5yIC0gTWF0aC5yb3VuZCgyNTUgKiAtKGFtb3VudCAvIDEwMCkpKSk7XG4gICAgICAgIHJnYi5nID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByZ2IuZyAtIE1hdGgucm91bmQoMjU1ICogLShhbW91bnQgLyAxMDApKSkpO1xuICAgICAgICByZ2IuYiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcmdiLmIgLSBNYXRoLnJvdW5kKDI1NSAqIC0oYW1vdW50IC8gMTAwKSkpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IocmdiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGFya2VuIHRoZSBjb2xvciBhIGdpdmVuIGFtb3VudCwgZnJvbSAwIHRvIDEwMC5cbiAgICAgKiBQcm92aWRpbmcgMTAwIHdpbGwgYWx3YXlzIHJldHVybiBibGFjay5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIGRhcmtlbihhbW91bnQgPSAxMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGhzbC5sIC09IGFtb3VudCAvIDEwMDtcbiAgICAgICAgaHNsLmwgPSBjbGFtcDAxKGhzbC5sKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWl4IHRoZSBjb2xvciB3aXRoIHB1cmUgd2hpdGUsIGZyb20gMCB0byAxMDAuXG4gICAgICogUHJvdmlkaW5nIDAgd2lsbCBkbyBub3RoaW5nLCBwcm92aWRpbmcgMTAwIHdpbGwgYWx3YXlzIHJldHVybiB3aGl0ZS5cbiAgICAgKiBAcGFyYW0gYW1vdW50IC0gdmFsaWQgYmV0d2VlbiAxLTEwMFxuICAgICAqL1xuICAgIHRpbnQoYW1vdW50ID0gMTApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWl4KCd3aGl0ZScsIGFtb3VudCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1peCB0aGUgY29sb3Igd2l0aCBwdXJlIGJsYWNrLCBmcm9tIDAgdG8gMTAwLlxuICAgICAqIFByb3ZpZGluZyAwIHdpbGwgZG8gbm90aGluZywgcHJvdmlkaW5nIDEwMCB3aWxsIGFsd2F5cyByZXR1cm4gYmxhY2suXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICBzaGFkZShhbW91bnQgPSAxMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5taXgoJ2JsYWNrJywgYW1vdW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVzYXR1cmF0ZSB0aGUgY29sb3IgYSBnaXZlbiBhbW91bnQsIGZyb20gMCB0byAxMDAuXG4gICAgICogUHJvdmlkaW5nIDEwMCB3aWxsIGlzIHRoZSBzYW1lIGFzIGNhbGxpbmcgZ3JleXNjYWxlXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICBkZXNhdHVyYXRlKGFtb3VudCA9IDEwKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLnMgLT0gYW1vdW50IC8gMTAwO1xuICAgICAgICBoc2wucyA9IGNsYW1wMDEoaHNsLnMpO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTYXR1cmF0ZSB0aGUgY29sb3IgYSBnaXZlbiBhbW91bnQsIGZyb20gMCB0byAxMDAuXG4gICAgICogQHBhcmFtIGFtb3VudCAtIHZhbGlkIGJldHdlZW4gMS0xMDBcbiAgICAgKi9cbiAgICBzYXR1cmF0ZShhbW91bnQgPSAxMCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGhzbC5zICs9IGFtb3VudCAvIDEwMDtcbiAgICAgICAgaHNsLnMgPSBjbGFtcDAxKGhzbC5zKTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGxldGVseSBkZXNhdHVyYXRlcyBhIGNvbG9yIGludG8gZ3JleXNjYWxlLlxuICAgICAqIFNhbWUgYXMgY2FsbGluZyBgZGVzYXR1cmF0ZSgxMDApYFxuICAgICAqL1xuICAgIGdyZXlzY2FsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzYXR1cmF0ZSgxMDApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTcGluIHRha2VzIGEgcG9zaXRpdmUgb3IgbmVnYXRpdmUgYW1vdW50IHdpdGhpbiBbLTM2MCwgMzYwXSBpbmRpY2F0aW5nIHRoZSBjaGFuZ2Ugb2YgaHVlLlxuICAgICAqIFZhbHVlcyBvdXRzaWRlIG9mIHRoaXMgcmFuZ2Ugd2lsbCBiZSB3cmFwcGVkIGludG8gdGhpcyByYW5nZS5cbiAgICAgKi9cbiAgICBzcGluKGFtb3VudCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGNvbnN0IGh1ZSA9IChoc2wuaCArIGFtb3VudCkgJSAzNjA7XG4gICAgICAgIGhzbC5oID0gaHVlIDwgMCA/IDM2MCArIGh1ZSA6IGh1ZTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IoaHNsKTtcbiAgICB9XG4gICAgbWl4KGNvbG9yLCBhbW91bnQgPSA1MCkge1xuICAgICAgICBjb25zdCByZ2IxID0gdGhpcy50b1JnYigpO1xuICAgICAgICBjb25zdCByZ2IyID0gbmV3IFRpbnlDb2xvcihjb2xvcikudG9SZ2IoKTtcbiAgICAgICAgY29uc3QgcCA9IGFtb3VudCAvIDEwMDtcbiAgICAgICAgY29uc3QgcmdiYSA9IHtcbiAgICAgICAgICAgIHI6IChyZ2IyLnIgLSByZ2IxLnIpICogcCArIHJnYjEucixcbiAgICAgICAgICAgIGc6IChyZ2IyLmcgLSByZ2IxLmcpICogcCArIHJnYjEuZyxcbiAgICAgICAgICAgIGI6IChyZ2IyLmIgLSByZ2IxLmIpICogcCArIHJnYjEuYixcbiAgICAgICAgICAgIGE6IChyZ2IyLmEgLSByZ2IxLmEpICogcCArIHJnYjEuYSxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW55Q29sb3IocmdiYSk7XG4gICAgfVxuICAgIGFuYWxvZ291cyhyZXN1bHRzID0gNiwgc2xpY2VzID0gMzApIHtcbiAgICAgICAgY29uc3QgaHNsID0gdGhpcy50b0hzbCgpO1xuICAgICAgICBjb25zdCBwYXJ0ID0gMzYwIC8gc2xpY2VzO1xuICAgICAgICBjb25zdCByZXQgPSBbdGhpc107XG4gICAgICAgIGZvciAoaHNsLmggPSAoaHNsLmggLSAoKHBhcnQgKiByZXN1bHRzKSA+PiAxKSArIDcyMCkgJSAzNjA7IC0tcmVzdWx0czspIHtcbiAgICAgICAgICAgIGhzbC5oID0gKGhzbC5oICsgcGFydCkgJSAzNjA7XG4gICAgICAgICAgICByZXQucHVzaChuZXcgVGlueUNvbG9yKGhzbCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2luZnVzaW9uL2pRdWVyeS14Y29sb3IvYmxvYi9tYXN0ZXIvanF1ZXJ5Lnhjb2xvci5qc1xuICAgICAqL1xuICAgIGNvbXBsZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IGhzbCA9IHRoaXMudG9Ic2woKTtcbiAgICAgICAgaHNsLmggPSAoaHNsLmggKyAxODApICUgMzYwO1xuICAgICAgICByZXR1cm4gbmV3IFRpbnlDb2xvcihoc2wpO1xuICAgIH1cbiAgICBtb25vY2hyb21hdGljKHJlc3VsdHMgPSA2KSB7XG4gICAgICAgIGNvbnN0IGhzdiA9IHRoaXMudG9Ic3YoKTtcbiAgICAgICAgY29uc3QgaCA9IGhzdi5oO1xuICAgICAgICBjb25zdCBzID0gaHN2LnM7XG4gICAgICAgIGxldCB2ID0gaHN2LnY7XG4gICAgICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgICAgICBjb25zdCBtb2RpZmljYXRpb24gPSAxIC8gcmVzdWx0cztcbiAgICAgICAgd2hpbGUgKHJlc3VsdHMtLSkge1xuICAgICAgICAgICAgcmVzLnB1c2gobmV3IFRpbnlDb2xvcih7IGgsIHMsIHYgfSkpO1xuICAgICAgICAgICAgdiA9ICh2ICsgbW9kaWZpY2F0aW9uKSAlIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgc3BsaXRjb21wbGVtZW50KCkge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGNvbnN0IGggPSBoc2wuaDtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBuZXcgVGlueUNvbG9yKHsgaDogKGggKyA3MikgJSAzNjAsIHM6IGhzbC5zLCBsOiBoc2wubCB9KSxcbiAgICAgICAgICAgIG5ldyBUaW55Q29sb3IoeyBoOiAoaCArIDIxNikgJSAzNjAsIHM6IGhzbC5zLCBsOiBoc2wubCB9KSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdHJpYWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvbHlhZCgzKTtcbiAgICB9XG4gICAgdGV0cmFkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb2x5YWQoNCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBwb2x5YWQgY29sb3JzLCBsaWtlIChmb3IgMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgZXRjLi4uKVxuICAgICAqIG1vbmFkLCBkeWFkLCB0cmlhZCwgdGV0cmFkLCBwZW50YWQsIGhleGFkLCBoZXB0YWQsIG9jdGFkLCBldGMuLi5cbiAgICAgKi9cbiAgICBwb2x5YWQobikge1xuICAgICAgICBjb25zdCBoc2wgPSB0aGlzLnRvSHNsKCk7XG4gICAgICAgIGNvbnN0IGggPSBoc2wuaDtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW3RoaXNdO1xuICAgICAgICBjb25zdCBpbmNyZW1lbnQgPSAzNjAgLyBuO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRpbnlDb2xvcih7IGg6IChoICsgaSAqIGluY3JlbWVudCkgJSAzNjAsIHM6IGhzbC5zLCBsOiBoc2wubCB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogY29tcGFyZSBjb2xvciB2cyBjdXJyZW50IGNvbG9yXG4gICAgICovXG4gICAgZXF1YWxzKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvUmdiU3RyaW5nKCkgPT09IG5ldyBUaW55Q29sb3IoY29sb3IpLnRvUmdiU3RyaW5nKCk7XG4gICAgfVxufVxuXG4vLyBSZWFkYWJpbGl0eSBGdW5jdGlvbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gPGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLVdDQUcyMC0yMDA4MTIxMS8jY29udHJhc3QtcmF0aW9kZWYgKFdDQUcgVmVyc2lvbiAyKVxuLyoqXG4gKiBBS0EgYGNvbnRyYXN0YFxuICpcbiAqIEFuYWx5emUgdGhlIDIgY29sb3JzIGFuZCByZXR1cm5zIHRoZSBjb2xvciBjb250cmFzdCBkZWZpbmVkIGJ5IChXQ0FHIFZlcnNpb24gMilcbiAqL1xuZnVuY3Rpb24gcmVhZGFiaWxpdHkoY29sb3IxLCBjb2xvcjIpIHtcbiAgICBjb25zdCBjMSA9IG5ldyBUaW55Q29sb3IoY29sb3IxKTtcbiAgICBjb25zdCBjMiA9IG5ldyBUaW55Q29sb3IoY29sb3IyKTtcbiAgICByZXR1cm4gKChNYXRoLm1heChjMS5nZXRMdW1pbmFuY2UoKSwgYzIuZ2V0THVtaW5hbmNlKCkpICsgMC4wNSkgL1xuICAgICAgICAoTWF0aC5taW4oYzEuZ2V0THVtaW5hbmNlKCksIGMyLmdldEx1bWluYW5jZSgpKSArIDAuMDUpKTtcbn1cbi8qKlxuICogRW5zdXJlIHRoYXQgZm9yZWdyb3VuZCBhbmQgYmFja2dyb3VuZCBjb2xvciBjb21iaW5hdGlvbnMgbWVldCBXQ0FHMiBndWlkZWxpbmVzLlxuICogVGhlIHRoaXJkIGFyZ3VtZW50IGlzIGFuIG9iamVjdC5cbiAqICAgICAgdGhlICdsZXZlbCcgcHJvcGVydHkgc3RhdGVzICdBQScgb3IgJ0FBQScgLSBpZiBtaXNzaW5nIG9yIGludmFsaWQsIGl0IGRlZmF1bHRzIHRvICdBQSc7XG4gKiAgICAgIHRoZSAnc2l6ZScgcHJvcGVydHkgc3RhdGVzICdsYXJnZScgb3IgJ3NtYWxsJyAtIGlmIG1pc3Npbmcgb3IgaW52YWxpZCwgaXQgZGVmYXVsdHMgdG8gJ3NtYWxsJy5cbiAqIElmIHRoZSBlbnRpcmUgb2JqZWN0IGlzIGFic2VudCwgaXNSZWFkYWJsZSBkZWZhdWx0cyB0byB7bGV2ZWw6XCJBQVwiLHNpemU6XCJzbWFsbFwifS5cbiAqXG4gKiBFeGFtcGxlXG4gKiBgYGB0c1xuICogbmV3IFRpbnlDb2xvcigpLmlzUmVhZGFibGUoJyMwMDAnLCAnIzExMScpID0+IGZhbHNlXG4gKiBuZXcgVGlueUNvbG9yKCkuaXNSZWFkYWJsZSgnIzAwMCcsICcjMTExJywgeyBsZXZlbDogJ0FBJywgc2l6ZTogJ2xhcmdlJyB9KSA9PiBmYWxzZVxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIGlzUmVhZGFibGUoY29sb3IxLCBjb2xvcjIsIHdjYWcyID0geyBsZXZlbDogJ0FBJywgc2l6ZTogJ3NtYWxsJyB9KSB7XG4gICAgY29uc3QgcmVhZGFiaWxpdHlMZXZlbCA9IHJlYWRhYmlsaXR5KGNvbG9yMSwgY29sb3IyKTtcbiAgICBzd2l0Y2ggKCh3Y2FnMi5sZXZlbCB8fCAnQUEnKSArICh3Y2FnMi5zaXplIHx8ICdzbWFsbCcpKSB7XG4gICAgICAgIGNhc2UgJ0FBc21hbGwnOlxuICAgICAgICBjYXNlICdBQUFsYXJnZSc6XG4gICAgICAgICAgICByZXR1cm4gcmVhZGFiaWxpdHlMZXZlbCA+PSA0LjU7XG4gICAgICAgIGNhc2UgJ0FBbGFyZ2UnOlxuICAgICAgICAgICAgcmV0dXJuIHJlYWRhYmlsaXR5TGV2ZWwgPj0gMztcbiAgICAgICAgY2FzZSAnQUFBc21hbGwnOlxuICAgICAgICAgICAgcmV0dXJuIHJlYWRhYmlsaXR5TGV2ZWwgPj0gNztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBHaXZlbiBhIGJhc2UgY29sb3IgYW5kIGEgbGlzdCBvZiBwb3NzaWJsZSBmb3JlZ3JvdW5kIG9yIGJhY2tncm91bmRcbiAqIGNvbG9ycyBmb3IgdGhhdCBiYXNlLCByZXR1cm5zIHRoZSBtb3N0IHJlYWRhYmxlIGNvbG9yLlxuICogT3B0aW9uYWxseSByZXR1cm5zIEJsYWNrIG9yIFdoaXRlIGlmIHRoZSBtb3N0IHJlYWRhYmxlIGNvbG9yIGlzIHVucmVhZGFibGUuXG4gKlxuICogQHBhcmFtIGJhc2VDb2xvciAtIHRoZSBiYXNlIGNvbG9yLlxuICogQHBhcmFtIGNvbG9yTGlzdCAtIGFycmF5IG9mIGNvbG9ycyB0byBwaWNrIHRoZSBtb3N0IHJlYWRhYmxlIG9uZSBmcm9tLlxuICogQHBhcmFtIGFyZ3MgLSBhbmQgb2JqZWN0IHdpdGggZXh0cmEgYXJndW1lbnRzXG4gKlxuICogRXhhbXBsZVxuICogYGBgdHNcbiAqIG5ldyBUaW55Q29sb3IoKS5tb3N0UmVhZGFibGUoJyMxMjMnLCBbJyMxMjRcIiwgXCIjMTI1J10sIHsgaW5jbHVkZUZhbGxiYWNrQ29sb3JzOiBmYWxzZSB9KS50b0hleFN0cmluZygpOyAvLyBcIiMxMTIyNTVcIlxuICogbmV3IFRpbnlDb2xvcigpLm1vc3RSZWFkYWJsZSgnIzEyMycsIFsnIzEyNFwiLCBcIiMxMjUnXSx7IGluY2x1ZGVGYWxsYmFja0NvbG9yczogdHJ1ZSB9KS50b0hleFN0cmluZygpOyAgLy8gXCIjZmZmZmZmXCJcbiAqIG5ldyBUaW55Q29sb3IoKS5tb3N0UmVhZGFibGUoJyNhODAxNWEnLCBbXCIjZmFmM2YzXCJdLCB7IGluY2x1ZGVGYWxsYmFja0NvbG9yczp0cnVlLCBsZXZlbDogJ0FBQScsIHNpemU6ICdsYXJnZScgfSkudG9IZXhTdHJpbmcoKTsgLy8gXCIjZmFmM2YzXCJcbiAqIG5ldyBUaW55Q29sb3IoKS5tb3N0UmVhZGFibGUoJyNhODAxNWEnLCBbXCIjZmFmM2YzXCJdLCB7IGluY2x1ZGVGYWxsYmFja0NvbG9yczp0cnVlLCBsZXZlbDogJ0FBQScsIHNpemU6ICdzbWFsbCcgfSkudG9IZXhTdHJpbmcoKTsgLy8gXCIjZmZmZmZmXCJcbiAqIGBgYFxuICovXG5mdW5jdGlvbiBtb3N0UmVhZGFibGUoYmFzZUNvbG9yLCBjb2xvckxpc3QsIGFyZ3MgPSB7IGluY2x1ZGVGYWxsYmFja0NvbG9yczogZmFsc2UsIGxldmVsOiAnQUEnLCBzaXplOiAnc21hbGwnIH0pIHtcbiAgICBsZXQgYmVzdENvbG9yID0gbnVsbDtcbiAgICBsZXQgYmVzdFNjb3JlID0gMDtcbiAgICBjb25zdCBpbmNsdWRlRmFsbGJhY2tDb2xvcnMgPSBhcmdzLmluY2x1ZGVGYWxsYmFja0NvbG9ycztcbiAgICBjb25zdCBsZXZlbCA9IGFyZ3MubGV2ZWw7XG4gICAgY29uc3Qgc2l6ZSA9IGFyZ3Muc2l6ZTtcbiAgICBmb3IgKGNvbnN0IGNvbG9yIG9mIGNvbG9yTGlzdCkge1xuICAgICAgICBjb25zdCBzY29yZSA9IHJlYWRhYmlsaXR5KGJhc2VDb2xvciwgY29sb3IpO1xuICAgICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICAgICAgYmVzdENvbG9yID0gbmV3IFRpbnlDb2xvcihjb2xvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzUmVhZGFibGUoYmFzZUNvbG9yLCBiZXN0Q29sb3IsIHsgbGV2ZWwsIHNpemUgfSkgfHwgIWluY2x1ZGVGYWxsYmFja0NvbG9ycykge1xuICAgICAgICByZXR1cm4gYmVzdENvbG9yO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYXJncy5pbmNsdWRlRmFsbGJhY2tDb2xvcnMgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIG1vc3RSZWFkYWJsZShiYXNlQ29sb3IsIFsnI2ZmZicsICcjMDAwJ10sIGFyZ3MpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjb2xvciByZXByZXNlbnRlZCBhcyBhIE1pY3Jvc29mdCBmaWx0ZXIgZm9yIHVzZSBpbiBvbGQgdmVyc2lvbnMgb2YgSUUuXG4gKi9cbmZ1bmN0aW9uIHRvTXNGaWx0ZXIoZmlyc3RDb2xvciwgc2Vjb25kQ29sb3IpIHtcbiAgICBjb25zdCBjb2xvciA9IG5ldyBUaW55Q29sb3IoZmlyc3RDb2xvcik7XG4gICAgY29uc3QgaGV4OFN0cmluZyA9ICcjJyArIHJnYmFUb0FyZ2JIZXgoY29sb3IuciwgY29sb3IuZywgY29sb3IuYiwgY29sb3IuYSk7XG4gICAgbGV0IHNlY29uZEhleDhTdHJpbmcgPSBoZXg4U3RyaW5nO1xuICAgIGNvbnN0IGdyYWRpZW50VHlwZSA9IGNvbG9yLmdyYWRpZW50VHlwZSA/ICdHcmFkaWVudFR5cGUgPSAxLCAnIDogJyc7XG4gICAgaWYgKHNlY29uZENvbG9yKSB7XG4gICAgICAgIGNvbnN0IHMgPSBuZXcgVGlueUNvbG9yKHNlY29uZENvbG9yKTtcbiAgICAgICAgc2Vjb25kSGV4OFN0cmluZyA9ICcjJyArIHJnYmFUb0FyZ2JIZXgocy5yLCBzLmcsIHMuYiwgcy5hKTtcbiAgICB9XG4gICAgcmV0dXJuIGBwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoJHtncmFkaWVudFR5cGV9c3RhcnRDb2xvcnN0cj0ke2hleDhTdHJpbmd9LGVuZENvbG9yc3RyPSR7c2Vjb25kSGV4OFN0cmluZ30pYDtcbn1cblxuLyoqXG4gKiBJZiBpbnB1dCBpcyBhbiBvYmplY3QsIGZvcmNlIDEgaW50byBcIjEuMFwiIHRvIGhhbmRsZSByYXRpb3MgcHJvcGVybHlcbiAqIFN0cmluZyBpbnB1dCByZXF1aXJlcyBcIjEuMFwiIGFzIGlucHV0LCBzbyAxIHdpbGwgYmUgdHJlYXRlZCBhcyAxXG4gKi9cbmZ1bmN0aW9uIGZyb21SYXRpbyhyYXRpbywgb3B0cykge1xuICAgIGNvbnN0IG5ld0NvbG9yID0ge1xuICAgICAgICByOiBjb252ZXJ0VG9QZXJjZW50YWdlKHJhdGlvLnIpLFxuICAgICAgICBnOiBjb252ZXJ0VG9QZXJjZW50YWdlKHJhdGlvLmcpLFxuICAgICAgICBiOiBjb252ZXJ0VG9QZXJjZW50YWdlKHJhdGlvLmIpLFxuICAgIH07XG4gICAgaWYgKHJhdGlvLmEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuZXdDb2xvci5hID0gK3JhdGlvLmE7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVGlueUNvbG9yKG5ld0NvbG9yLCBvcHRzKTtcbn1cbi8qKiBvbGQgcmFuZG9tIGZ1bmN0aW9uICovXG5mdW5jdGlvbiBsZWdhY3lSYW5kb20oKSB7XG4gICAgcmV0dXJuIG5ldyBUaW55Q29sb3Ioe1xuICAgICAgICByOiBNYXRoLnJhbmRvbSgpLFxuICAgICAgICBnOiBNYXRoLnJhbmRvbSgpLFxuICAgICAgICBiOiBNYXRoLnJhbmRvbSgpLFxuICAgIH0pO1xufVxuXG4vLyByYW5kb21Db2xvciBieSBEYXZpZCBNZXJmaWVsZCB1bmRlciB0aGUgQ0MwIGxpY2Vuc2VcbmZ1bmN0aW9uIHJhbmRvbShvcHRpb25zID0ge30pIHtcbiAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGdlbmVyYXRlIG11bHRpcGxlIGNvbG9yc1xuICAgIGlmIChvcHRpb25zLmNvdW50ICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5jb3VudCAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCB0b3RhbENvbG9ycyA9IG9wdGlvbnMuY291bnQ7XG4gICAgICAgIGNvbnN0IGNvbG9ycyA9IFtdO1xuICAgICAgICBvcHRpb25zLmNvdW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB3aGlsZSAodG90YWxDb2xvcnMgPiBjb2xvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBTaW5jZSB3ZSdyZSBnZW5lcmF0aW5nIG11bHRpcGxlIGNvbG9ycyxcbiAgICAgICAgICAgIC8vIGluY3JlbWVtZW50IHRoZSBzZWVkLiBPdGhlcndpc2Ugd2UnZCBqdXN0XG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSB0aGUgc2FtZSBjb2xvciBlYWNoIHRpbWUuLi5cbiAgICAgICAgICAgIG9wdGlvbnMuY291bnQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc2VlZCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuc2VlZCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29sb3JzLnB1c2gocmFuZG9tKG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLmNvdW50ID0gdG90YWxDb2xvcnM7XG4gICAgICAgIHJldHVybiBjb2xvcnM7XG4gICAgfVxuICAgIC8vIEZpcnN0IHdlIHBpY2sgYSBodWUgKEgpXG4gICAgY29uc3QgaCA9IHBpY2tIdWUob3B0aW9ucy5odWUsIG9wdGlvbnMuc2VlZCk7XG4gICAgLy8gVGhlbiB1c2UgSCB0byBkZXRlcm1pbmUgc2F0dXJhdGlvbiAoUylcbiAgICBjb25zdCBzID0gcGlja1NhdHVyYXRpb24oaCwgb3B0aW9ucyk7XG4gICAgLy8gVGhlbiB1c2UgUyBhbmQgSCB0byBkZXRlcm1pbmUgYnJpZ2h0bmVzcyAoQikuXG4gICAgY29uc3QgdiA9IHBpY2tCcmlnaHRuZXNzKGgsIHMsIG9wdGlvbnMpO1xuICAgIGNvbnN0IHJlcyA9IHsgaCwgcywgdiB9O1xuICAgIGlmIChvcHRpb25zLmFscGhhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVzLmEgPSBvcHRpb25zLmFscGhhO1xuICAgIH1cbiAgICAvLyBUaGVuIHdlIHJldHVybiB0aGUgSFNCIGNvbG9yIGluIHRoZSBkZXNpcmVkIGZvcm1hdFxuICAgIHJldHVybiBuZXcgVGlueUNvbG9yKHJlcyk7XG59XG5mdW5jdGlvbiBwaWNrSHVlKGh1ZSwgc2VlZCkge1xuICAgIGNvbnN0IGh1ZVJhbmdlID0gZ2V0SHVlUmFuZ2UoaHVlKTtcbiAgICBsZXQgcmVzID0gcmFuZG9tV2l0aGluKGh1ZVJhbmdlLCBzZWVkKTtcbiAgICAvLyBJbnN0ZWFkIG9mIHN0b3JpbmcgcmVkIGFzIHR3byBzZXBlcmF0ZSByYW5nZXMsXG4gICAgLy8gd2UgZ3JvdXAgdGhlbSwgdXNpbmcgbmVnYXRpdmUgbnVtYmVyc1xuICAgIGlmIChyZXMgPCAwKSB7XG4gICAgICAgIHJlcyA9IDM2MCArIHJlcztcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIHBpY2tTYXR1cmF0aW9uKGh1ZSwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmh1ZSA9PT0gJ21vbm9jaHJvbWUnKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5sdW1pbm9zaXR5ID09PSAncmFuZG9tJykge1xuICAgICAgICByZXR1cm4gcmFuZG9tV2l0aGluKFswLCAxMDBdLCBvcHRpb25zLnNlZWQpO1xuICAgIH1cbiAgICBjb25zdCBzYXR1cmF0aW9uUmFuZ2UgPSBnZXRDb2xvckluZm8oaHVlKS5zYXR1cmF0aW9uUmFuZ2U7XG4gICAgbGV0IHNNaW4gPSBzYXR1cmF0aW9uUmFuZ2VbMF07XG4gICAgbGV0IHNNYXggPSBzYXR1cmF0aW9uUmFuZ2VbMV07XG4gICAgc3dpdGNoIChvcHRpb25zLmx1bWlub3NpdHkpIHtcbiAgICAgICAgY2FzZSAnYnJpZ2h0JzpcbiAgICAgICAgICAgIHNNaW4gPSA1NTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkYXJrJzpcbiAgICAgICAgICAgIHNNaW4gPSBzTWF4IC0gMTA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbGlnaHQnOlxuICAgICAgICAgICAgc01heCA9IDU1O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByYW5kb21XaXRoaW4oW3NNaW4sIHNNYXhdLCBvcHRpb25zLnNlZWQpO1xufVxuZnVuY3Rpb24gcGlja0JyaWdodG5lc3MoSCwgUywgb3B0aW9ucykge1xuICAgIGxldCBiTWluID0gZ2V0TWluaW11bUJyaWdodG5lc3MoSCwgUyk7XG4gICAgbGV0IGJNYXggPSAxMDA7XG4gICAgc3dpdGNoIChvcHRpb25zLmx1bWlub3NpdHkpIHtcbiAgICAgICAgY2FzZSAnZGFyayc6XG4gICAgICAgICAgICBiTWF4ID0gYk1pbiArIDIwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2xpZ2h0JzpcbiAgICAgICAgICAgIGJNaW4gPSAoYk1heCArIGJNaW4pIC8gMjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyYW5kb20nOlxuICAgICAgICAgICAgYk1pbiA9IDA7XG4gICAgICAgICAgICBiTWF4ID0gMTAwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByYW5kb21XaXRoaW4oW2JNaW4sIGJNYXhdLCBvcHRpb25zLnNlZWQpO1xufVxuZnVuY3Rpb24gZ2V0TWluaW11bUJyaWdodG5lc3MoSCwgUykge1xuICAgIGNvbnN0IGxvd2VyQm91bmRzID0gZ2V0Q29sb3JJbmZvKEgpLmxvd2VyQm91bmRzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG93ZXJCb3VuZHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHMxID0gbG93ZXJCb3VuZHNbaV1bMF07XG4gICAgICAgIGNvbnN0IHYxID0gbG93ZXJCb3VuZHNbaV1bMV07XG4gICAgICAgIGNvbnN0IHMyID0gbG93ZXJCb3VuZHNbaSArIDFdWzBdO1xuICAgICAgICBjb25zdCB2MiA9IGxvd2VyQm91bmRzW2kgKyAxXVsxXTtcbiAgICAgICAgaWYgKFMgPj0gczEgJiYgUyA8PSBzMikge1xuICAgICAgICAgICAgY29uc3QgbSA9ICh2MiAtIHYxKSAvIChzMiAtIHMxKTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSB2MSAtIG0gKiBzMTtcbiAgICAgICAgICAgIHJldHVybiBtICogUyArIGI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBnZXRIdWVSYW5nZShjb2xvcklucHV0KSB7XG4gICAgY29uc3QgbnVtID0gcGFyc2VJbnQoY29sb3JJbnB1dCwgMTApO1xuICAgIGlmICghTnVtYmVyLmlzTmFOKG51bSkgJiYgbnVtIDwgMzYwICYmIG51bSA+IDApIHtcbiAgICAgICAgcmV0dXJuIFtudW0sIG51bV07XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY29sb3JJbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgbmFtZWRDb2xvciA9IGJvdW5kcy5maW5kKG4gPT4gbi5uYW1lID09PSBjb2xvcklucHV0KTtcbiAgICAgICAgaWYgKG5hbWVkQ29sb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZGVmaW5lQ29sb3IobmFtZWRDb2xvcik7XG4gICAgICAgICAgICBpZiAoY29sb3IuaHVlUmFuZ2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3IuaHVlUmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFRpbnlDb2xvcihjb2xvcklucHV0KTtcbiAgICAgICAgaWYgKHBhcnNlZC5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBjb25zdCBodWUgPSBwYXJzZWQudG9Ic3YoKS5oO1xuICAgICAgICAgICAgcmV0dXJuIFtodWUsIGh1ZV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFswLCAzNjBdO1xufVxuZnVuY3Rpb24gZ2V0Q29sb3JJbmZvKGh1ZSkge1xuICAgIC8vIE1hcHMgcmVkIGNvbG9ycyB0byBtYWtlIHBpY2tpbmcgaHVlIGVhc2llclxuICAgIGlmIChodWUgPj0gMzM0ICYmIGh1ZSA8PSAzNjApIHtcbiAgICAgICAgaHVlIC09IDM2MDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBib3VuZCBvZiBib3VuZHMpIHtcbiAgICAgICAgY29uc3QgY29sb3IgPSBkZWZpbmVDb2xvcihib3VuZCk7XG4gICAgICAgIGlmIChjb2xvci5odWVSYW5nZSAmJiBodWUgPj0gY29sb3IuaHVlUmFuZ2VbMF0gJiYgaHVlIDw9IGNvbG9yLmh1ZVJhbmdlWzFdKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgRXJyb3IoJ0NvbG9yIG5vdCBmb3VuZCcpO1xufVxuZnVuY3Rpb24gcmFuZG9tV2l0aGluKHJhbmdlLCBzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihyYW5nZVswXSArIE1hdGgucmFuZG9tKCkgKiAocmFuZ2VbMV0gKyAxIC0gcmFuZ2VbMF0pKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIFNlZWRlZCByYW5kb20gYWxnb3JpdGhtIGZyb20gaHR0cDovL2luZGllZ2Ftci5jb20vZ2VuZXJhdGUtcmVwZWF0YWJsZS1yYW5kb20tbnVtYmVycy1pbi1qcy9cbiAgICAgICAgY29uc3QgbWF4ID0gcmFuZ2VbMV0gfHwgMTtcbiAgICAgICAgY29uc3QgbWluID0gcmFuZ2VbMF0gfHwgMDtcbiAgICAgICAgc2VlZCA9IChzZWVkICogOTMwMSArIDQ5Mjk3KSAlIDIzMzI4MDtcbiAgICAgICAgY29uc3Qgcm5kID0gc2VlZCAvIDIzMzI4MC4wO1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihtaW4gKyBybmQgKiAobWF4IC0gbWluKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGVmaW5lQ29sb3IoYm91bmQpIHtcbiAgICBjb25zdCBzTWluID0gYm91bmQubG93ZXJCb3VuZHNbMF1bMF07XG4gICAgY29uc3Qgc01heCA9IGJvdW5kLmxvd2VyQm91bmRzW2JvdW5kLmxvd2VyQm91bmRzLmxlbmd0aCAtIDFdWzBdO1xuICAgIGNvbnN0IGJNaW4gPSBib3VuZC5sb3dlckJvdW5kc1tib3VuZC5sb3dlckJvdW5kcy5sZW5ndGggLSAxXVsxXTtcbiAgICBjb25zdCBiTWF4ID0gYm91bmQubG93ZXJCb3VuZHNbMF1bMV07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogYm91bmQubmFtZSxcbiAgICAgICAgaHVlUmFuZ2U6IGJvdW5kLmh1ZVJhbmdlLFxuICAgICAgICBsb3dlckJvdW5kczogYm91bmQubG93ZXJCb3VuZHMsXG4gICAgICAgIHNhdHVyYXRpb25SYW5nZTogW3NNaW4sIHNNYXhdLFxuICAgICAgICBicmlnaHRuZXNzUmFuZ2U6IFtiTWluLCBiTWF4XSxcbiAgICB9O1xufVxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmNvbnN0IGJvdW5kcyA9IFtcbiAgICB7XG4gICAgICAgIG5hbWU6ICdtb25vY2hyb21lJyxcbiAgICAgICAgaHVlUmFuZ2U6IG51bGwsXG4gICAgICAgIGxvd2VyQm91bmRzOiBbWzAsIDBdLCBbMTAwLCAwXV0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdyZWQnLFxuICAgICAgICBodWVSYW5nZTogWy0yNiwgMThdLFxuICAgICAgICBsb3dlckJvdW5kczogW1xuICAgICAgICAgICAgWzIwLCAxMDBdLFxuICAgICAgICAgICAgWzMwLCA5Ml0sXG4gICAgICAgICAgICBbNDAsIDg5XSxcbiAgICAgICAgICAgIFs1MCwgODVdLFxuICAgICAgICAgICAgWzYwLCA3OF0sXG4gICAgICAgICAgICBbNzAsIDcwXSxcbiAgICAgICAgICAgIFs4MCwgNjBdLFxuICAgICAgICAgICAgWzkwLCA1NV0sXG4gICAgICAgICAgICBbMTAwLCA1MF0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICdvcmFuZ2UnLFxuICAgICAgICBodWVSYW5nZTogWzE5LCA0Nl0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbWzIwLCAxMDBdLCBbMzAsIDkzXSwgWzQwLCA4OF0sIFs1MCwgODZdLCBbNjAsIDg1XSwgWzcwLCA3MF0sIFsxMDAsIDcwXV0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG5hbWU6ICd5ZWxsb3cnLFxuICAgICAgICBodWVSYW5nZTogWzQ3LCA2Ml0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbWzI1LCAxMDBdLCBbNDAsIDk0XSwgWzUwLCA4OV0sIFs2MCwgODZdLCBbNzAsIDg0XSwgWzgwLCA4Ml0sIFs5MCwgODBdLCBbMTAwLCA3NV1dLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnZ3JlZW4nLFxuICAgICAgICBodWVSYW5nZTogWzYzLCAxNzhdLFxuICAgICAgICBsb3dlckJvdW5kczogW1szMCwgMTAwXSwgWzQwLCA5MF0sIFs1MCwgODVdLCBbNjAsIDgxXSwgWzcwLCA3NF0sIFs4MCwgNjRdLCBbOTAsIDUwXSwgWzEwMCwgNDBdXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ2JsdWUnLFxuICAgICAgICBodWVSYW5nZTogWzE3OSwgMjU3XSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtcbiAgICAgICAgICAgIFsyMCwgMTAwXSxcbiAgICAgICAgICAgIFszMCwgODZdLFxuICAgICAgICAgICAgWzQwLCA4MF0sXG4gICAgICAgICAgICBbNTAsIDc0XSxcbiAgICAgICAgICAgIFs2MCwgNjBdLFxuICAgICAgICAgICAgWzcwLCA1Ml0sXG4gICAgICAgICAgICBbODAsIDQ0XSxcbiAgICAgICAgICAgIFs5MCwgMzldLFxuICAgICAgICAgICAgWzEwMCwgMzVdLFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAncHVycGxlJyxcbiAgICAgICAgaHVlUmFuZ2U6IFsyNTgsIDI4Ml0sXG4gICAgICAgIGxvd2VyQm91bmRzOiBbXG4gICAgICAgICAgICBbMjAsIDEwMF0sXG4gICAgICAgICAgICBbMzAsIDg3XSxcbiAgICAgICAgICAgIFs0MCwgNzldLFxuICAgICAgICAgICAgWzUwLCA3MF0sXG4gICAgICAgICAgICBbNjAsIDY1XSxcbiAgICAgICAgICAgIFs3MCwgNTldLFxuICAgICAgICAgICAgWzgwLCA1Ml0sXG4gICAgICAgICAgICBbOTAsIDQ1XSxcbiAgICAgICAgICAgIFsxMDAsIDQyXSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbmFtZTogJ3BpbmsnLFxuICAgICAgICBodWVSYW5nZTogWzI4MywgMzM0XSxcbiAgICAgICAgbG93ZXJCb3VuZHM6IFtbMjAsIDEwMF0sIFszMCwgOTBdLCBbNDAsIDg2XSwgWzYwLCA4NF0sIFs4MCwgODBdLCBbOTAsIDc1XSwgWzEwMCwgNzNdXSxcbiAgICB9LFxuXTtcblxuZXhwb3J0IHsgVGlueUNvbG9yLCBuYW1lcywgcmVhZGFiaWxpdHksIGlzUmVhZGFibGUsIG1vc3RSZWFkYWJsZSwgdG9Nc0ZpbHRlciwgZnJvbVJhdGlvLCBsZWdhY3lSYW5kb20sIGlucHV0VG9SR0IsIHN0cmluZ0lucHV0VG9PYmplY3QsIGlzVmFsaWRDU1NVbml0LCByYW5kb20sIGJvdW5kcyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGlueWNvbG9yLmVzMjAxNS5qcy5tYXBcbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCB7IFRpbnlDb2xvciB9IGZyb20gJ0BjdHJsL3Rpbnljb2xvcidcbmltcG9ydCB7IGdldFN0eWxlIH0gZnJvbSAnLi4vZmVhdHVyZXMvdXRpbHMnXG5cbmV4cG9ydCBmdW5jdGlvbiBDb2xvclBpY2tlcihwYWxsZXRlLCBzZWxlY3RvckVuZ2luZSkge1xuICBjb25zdCBmb3JlZ3JvdW5kUGlja2VyID0gJCgnI2ZvcmVncm91bmQnLCBwYWxsZXRlKVswXVxuICBjb25zdCBiYWNrZ3JvdW5kUGlja2VyID0gJCgnI2JhY2tncm91bmQnLCBwYWxsZXRlKVswXVxuXG4gIC8vIHNldCBjb2xvcnNcbiAgZm9yZWdyb3VuZFBpY2tlci5vbignaW5wdXQnLCBlID0+XG4gICAgJCgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKS5tYXAoZWwgPT5cbiAgICAgIGVsLnN0eWxlLmNvbG9yID0gZS50YXJnZXQudmFsdWUpKVxuXG4gIGJhY2tncm91bmRQaWNrZXIub24oJ2lucHV0JywgZSA9PlxuICAgICQoJ1tkYXRhLXNlbGVjdGVkPXRydWVdJykubWFwKGVsID0+XG4gICAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBlLnRhcmdldC52YWx1ZSkpXG5cbiAgLy8gcmVhZCBjb2xvcnNcbiAgc2VsZWN0b3JFbmdpbmUub25TZWxlY3RlZFVwZGF0ZShlbGVtZW50cyA9PiB7XG4gICAgaWYgKCFlbGVtZW50cy5sZW5ndGgpIHJldHVyblxuXG4gICAgbGV0IGlzTWVhbmluZ2Z1bEZvcmVncm91bmQgPSBmYWxzZVxuICAgIGxldCBpc01lYW5pbmdmdWxCYWNrZ3JvdW5kID0gZmFsc2VcblxuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPD0gMikge1xuICAgICAgY29uc3QgZWwgPSBlbGVtZW50c1swXVxuICAgICAgY29uc3QgRkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsLCAnY29sb3InKSlcbiAgICAgIGNvbnN0IEJHID0gbmV3IFRpbnlDb2xvcihnZXRTdHlsZShlbCwgJ2JhY2tncm91bmRDb2xvcicpKVxuXG4gICAgICBsZXQgZmcgPSBGRy50b0hleFN0cmluZygpXG4gICAgICBsZXQgYmcgPSBCRy50b0hleFN0cmluZygpXG5cbiAgICAgIGlzTWVhbmluZ2Z1bEZvcmVncm91bmQgPSBGRy5vcmlnaW5hbElucHV0ICE9PSAncmdiKDAsIDAsIDApJyB8fCAoZWwuY2hpbGRyZW4ubGVuZ3RoID09PSAwICYmIGVsLnRleHRDb250ZW50ICE9PSAnJylcbiAgICAgIGlzTWVhbmluZ2Z1bEJhY2tncm91bmQgPSBCRy5vcmlnaW5hbElucHV0ICE9PSAncmdiYSgwLCAwLCAwLCAwKScgXG5cbiAgICAgIGZvcmVncm91bmRQaWNrZXIuYXR0cigndmFsdWUnLCBpc01lYW5pbmdmdWxGb3JlZ3JvdW5kXG4gICAgICAgID8gZmcgXG4gICAgICAgIDogJycpXG5cbiAgICAgIGJhY2tncm91bmRQaWNrZXIuYXR0cigndmFsdWUnLCBpc01lYW5pbmdmdWxCYWNrZ3JvdW5kXG4gICAgICAgID8gYmcgXG4gICAgICAgIDogJycpXG4gICAgfVxuXG4gICAgZm9yZWdyb3VuZFBpY2tlci5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXkgPSAhaXNNZWFuaW5nZnVsRm9yZWdyb3VuZCA/ICdub25lJyA6ICdibG9jaydcbiAgICBiYWNrZ3JvdW5kUGlja2VyLnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9ICFpc01lYW5pbmdmdWxCYWNrZ3JvdW5kID8gJ25vbmUnIDogJ2Jsb2NrJ1xuICB9KVxufSIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBUaW55Q29sb3IgfSBmcm9tICdAY3RybC90aW55Y29sb3InXG5pbXBvcnQgeyBnZXRTdHlsZXMsIGNhbWVsVG9EYXNoIH0gZnJvbSAnLi91dGlscydcblxuY29uc3QgZGVzaXJlZFByb3BNYXAgPSB7XG4gIGNvbG9yOiAgICAgICAgICAgICAgICAncmdiKDAsIDAsIDApJyxcbiAgYmFja2dyb3VuZENvbG9yOiAgICAgICdyZ2JhKDAsIDAsIDAsIDApJyxcbiAgYmFja2dyb3VuZEltYWdlOiAgICAgICdub25lJyxcbiAgYmFja2dyb3VuZFNpemU6ICAgICAgICdhdXRvJyxcbiAgYmFja2dyb3VuZFBvc2l0aW9uOiAgICcwJSAwJScsXG4gIC8vIGJvcmRlcjogICAgICAgICAgICAgICAnMHB4IG5vbmUgcmdiKDAsIDAsIDApJyxcbiAgYm9yZGVyUmFkaXVzOiAgICAgICAgICcwcHgnLFxuICBwYWRkaW5nOiAgICAgICAgICAgICAgJzBweCcsXG4gIG1hcmdpbjogICAgICAgICAgICAgICAnMHB4JyxcbiAgZm9udEZhbWlseTogICAgICAgICAgICcnLFxuICBmb250U2l6ZTogICAgICAgICAgICAgJzE2cHgnLFxuICBmb250V2VpZ2h0OiAgICAgICAgICAgJzQwMCcsXG4gIHRleHRBbGlnbjogICAgICAgICAgICAnc3RhcnQnLFxuICB0ZXh0U2hhZG93OiAgICAgICAgICAgJ25vbmUnLFxuICB0ZXh0VHJhbnNmb3JtOiAgICAgICAgJ25vbmUnLFxuICBsaW5lSGVpZ2h0OiAgICAgICAgICAgJ25vcm1hbCcsXG4gIGRpc3BsYXk6ICAgICAgICAgICAgICAnYmxvY2snLFxuICBhbGlnbkl0ZW1zOiAgICAgICAgICAgJ25vcm1hbCcsXG4gIGp1c3RpZnlDb250ZW50OiAgICAgICAnbm9ybWFsJyxcbn1cblxubGV0IHRpcF9tYXAgPSB7fVxuXG4vLyB0b2RvOiBcbi8vIC0gbm9kZSByZWN5Y2xpbmcgKGZvciBuZXcgdGFyZ2V0KSBubyBuZWVkIHRvIGNyZWF0ZS9kZWxldGVcbi8vIC0gbWFrZSBzaW5nbGUgZnVuY3Rpb24gY3JlYXRlL3VwZGF0ZVxuZXhwb3J0IGZ1bmN0aW9uIE1ldGFUaXAoKSB7XG4gIGNvbnN0IHRlbXBsYXRlID0gKHt0YXJnZXQ6IGVsfSkgPT4ge1xuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb25zdCBzdHlsZXMgPSBnZXRTdHlsZXMoZWwsIGRlc2lyZWRQcm9wTWFwKVxuICAgICAgLm1hcChzdHlsZSA9PiBPYmplY3QuYXNzaWduKHN0eWxlLCB7XG4gICAgICAgIHByb3A6IGNhbWVsVG9EYXNoKHN0eWxlLnByb3ApXG4gICAgICB9KSlcbiAgICAgIC5maWx0ZXIoc3R5bGUgPT4gXG4gICAgICAgIHN0eWxlLnByb3AuaW5jbHVkZXMoJ2ZvbnQtZmFtaWx5JykgXG4gICAgICAgICAgPyBlbC5tYXRjaGVzKCdoMSxoMixoMyxoNCxoNSxoNixwLGEsZGF0ZSxjYXB0aW9uLGJ1dHRvbixmaWdjYXB0aW9uLG5hdixoZWFkZXIsZm9vdGVyJykgXG4gICAgICAgICAgOiB0cnVlXG4gICAgICApXG4gICAgICAubWFwKHN0eWxlID0+IHtcbiAgICAgICAgaWYgKHN0eWxlLnByb3AuaW5jbHVkZXMoJ2NvbG9yJykgfHwgc3R5bGUucHJvcC5pbmNsdWRlcygnQ29sb3InKSlcbiAgICAgICAgICBzdHlsZS52YWx1ZSA9IGA8c3BhbiBjb2xvciBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICR7c3R5bGUudmFsdWV9O1wiPjwvc3Bhbj4ke25ldyBUaW55Q29sb3Ioc3R5bGUudmFsdWUpLnRvSHNsU3RyaW5nKCl9YFxuXG4gICAgICAgIGlmIChzdHlsZS5wcm9wLmluY2x1ZGVzKCdmb250LWZhbWlseScpICYmIHN0eWxlLnZhbHVlLmxlbmd0aCA+IDI1KVxuICAgICAgICAgIHN0eWxlLnZhbHVlID0gc3R5bGUudmFsdWUuc2xpY2UoMCwyNSkgKyAnLi4uJ1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHN0eWxlIGlzIGlubGluZSBzdHlsZSwgc2hvdyBpbmRpY2F0b3JcbiAgICAgICAgaWYgKGVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSAmJiBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykuaW5jbHVkZXMoc3R5bGUucHJvcCkpXG4gICAgICAgICAgc3R5bGUudmFsdWUgPSBgPHNwYW4gbG9jYWwtY2hhbmdlPiR7c3R5bGUudmFsdWV9PC9zcGFuPmBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzdHlsZVxuICAgICAgfSlcblxuICAgIGNvbnN0IGxvY2FsTW9kaWZpY2F0aW9ucyA9IHN0eWxlcy5maWx0ZXIoc3R5bGUgPT5cbiAgICAgIGVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSAmJiBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykuaW5jbHVkZXMoc3R5bGUucHJvcClcbiAgICAgICAgPyAxXG4gICAgICAgIDogMClcblxuICAgIGNvbnN0IG5vdExvY2FsTW9kaWZpY2F0aW9ucyA9IHN0eWxlcy5maWx0ZXIoc3R5bGUgPT5cbiAgICAgIGVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSAmJiBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykuaW5jbHVkZXMoc3R5bGUucHJvcClcbiAgICAgICAgPyAwXG4gICAgICAgIDogMSlcbiAgICBcbiAgICBsZXQgdGlwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aXAuY2xhc3NMaXN0LmFkZCgnbWV0YXRpcCcpXG4gICAgdGlwLmlubmVySFRNTCA9IGBcbiAgICAgIDxoNT4ke2VsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCl9JHtlbC5pZCAmJiAnIycgKyBlbC5pZH0ke2NyZWF0ZUNsYXNzbmFtZShlbCl9PC9oNT5cbiAgICAgIDxzbWFsbD48c3Bhbj4ke01hdGgucm91bmQod2lkdGgpfTwvc3Bhbj5weCA8c3BhbiBkaXZpZGVyPsOXPC9zcGFuPiA8c3Bhbj4ke01hdGgucm91bmQoaGVpZ2h0KX08L3NwYW4+cHg8L3NtYWxsPlxuICAgICAgPGRpdj4ke25vdExvY2FsTW9kaWZpY2F0aW9ucy5yZWR1Y2UoKGl0ZW1zLCBpdGVtKSA9PiBgXG4gICAgICAgICR7aXRlbXN9XG4gICAgICAgIDxzcGFuIHByb3A+JHtpdGVtLnByb3B9Ojwvc3Bhbj48c3BhbiB2YWx1ZT4ke2l0ZW0udmFsdWV9PC9zcGFuPlxuICAgICAgYCwgJycpfTwvZGl2PlxuICAgICAgJHtsb2NhbE1vZGlmaWNhdGlvbnMubGVuZ3RoID8gYFxuICAgICAgICA8aDY+TG9jYWwgTW9kaWZpY2F0aW9uczwvaDY+XG4gICAgICAgIDxkaXY+JHtsb2NhbE1vZGlmaWNhdGlvbnMucmVkdWNlKChpdGVtcywgaXRlbSkgPT4gYFxuICAgICAgICAgICR7aXRlbXN9XG4gICAgICAgICAgPHNwYW4gcHJvcD4ke2l0ZW0ucHJvcH06PC9zcGFuPjxzcGFuIHZhbHVlPiR7aXRlbS52YWx1ZX08L3NwYW4+XG4gICAgICAgIGAsICcnKX08L2Rpdj5cbiAgICAgIGAgOiAnJ31cbiAgICBgXG5cbiAgICByZXR1cm4gdGlwXG4gIH1cblxuICBjb25zdCBjcmVhdGVDbGFzc25hbWUgPSBlbCA9PiB7XG4gICAgaWYgKCFlbC5jbGFzc05hbWUpIHJldHVybiAnJ1xuICAgIGxldCByYXdDbGFzc25hbWUgPSAnLicgKyBlbC5jbGFzc05hbWUucmVwbGFjZSgvIC9nLCAnLicpXG5cbiAgICByZXR1cm4gcmF3Q2xhc3NuYW1lLmxlbmd0aCA+IDMwXG4gICAgICA/IHJhd0NsYXNzbmFtZS5zdWJzdHJpbmcoMCwzMCkgKyAnLi4uJ1xuICAgICAgOiByYXdDbGFzc25hbWVcbiAgfVxuXG4gIGNvbnN0IHRpcF9rZXkgPSBub2RlID0+XG4gICAgYCR7bm9kZS5ub2RlTmFtZX1fJHtub2RlLmNsYXNzTmFtZX1fJHtub2RlLmNoaWxkcmVuLmxlbmd0aH1fJHtub2RlLmNsaWVudFdpZHRofWBcblxuICBjb25zdCB0aXBfcG9zaXRpb24gPSAobm9kZSwgZSkgPT4gYFxuICAgIHRvcDogJHtlLmNsaWVudFkgPiB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyXG4gICAgICA/IGUucGFnZVkgLSBub2RlLmNsaWVudEhlaWdodFxuICAgICAgOiBlLnBhZ2VZfXB4O1xuICAgIGxlZnQ6ICR7ZS5jbGllbnRYID4gd2luZG93LmlubmVyV2lkdGggLyAyXG4gICAgICA/IGUucGFnZVggLSBub2RlLmNsaWVudFdpZHRoIC0gMjVcbiAgICAgIDogZS5wYWdlWCArIDI1fXB4O1xuICBgXG5cbiAgY29uc3QgbW91c2VPdXQgPSAoe3RhcmdldH0pID0+IHtcbiAgICBpZiAodGlwX21hcFt0aXBfa2V5KHRhcmdldCldICYmICF0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnKSkge1xuICAgICAgJCh0YXJnZXQpLm9mZignbW91c2VvdXQnLCBtb3VzZU91dClcbiAgICAgICQodGFyZ2V0KS5vZmYoJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuICAgICAgdGlwX21hcFt0aXBfa2V5KHRhcmdldCldLnRpcC5yZW1vdmUoKVxuICAgICAgZGVsZXRlIHRpcF9tYXBbdGlwX2tleSh0YXJnZXQpXVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvZ2dsZVBpbm5lZCA9IGUgPT4ge1xuICAgIGlmIChlLmFsdEtleSkge1xuICAgICAgIWUudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tZXRhdGlwJylcbiAgICAgICAgPyBlLnRhcmdldC5zZXRBdHRyaWJ1dGUoJ2RhdGEtbWV0YXRpcCcsIHRydWUpXG4gICAgICAgIDogZS50YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1vdXNlTW92ZSA9IGUgPT4ge1xuICAgIGlmIChlLnRhcmdldC5jbG9zZXN0KCd0b29sLXBhbGxldGUnKSB8fCBlLnRhcmdldC5jbG9zZXN0KCcubWV0YXRpcCcpIHx8IGUudGFyZ2V0LmNsb3Nlc3QoJ2hvdGtleS1tYXAnKSkgcmV0dXJuXG5cbiAgICBlLmFsdEtleVxuICAgICAgPyBlLnRhcmdldC5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGluaG92ZXInLCB0cnVlKVxuICAgICAgOiBlLnRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGluaG92ZXInKVxuXG4gICAgLy8gaWYgbm9kZSBpcyBpbiBvdXIgaGFzaCAoYWxyZWFkeSBjcmVhdGVkKVxuICAgIGlmICh0aXBfbWFwW3RpcF9rZXkoZS50YXJnZXQpXSkge1xuICAgICAgLy8gcmV0dXJuIGlmIGl0J3MgcGlubmVkXG4gICAgICBpZiAoZS50YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1ldGF0aXAnKSkgXG4gICAgICAgIHJldHVyblxuICAgICAgLy8gb3RoZXJ3aXNlIHVwZGF0ZSBwb3NpdGlvblxuICAgICAgY29uc3QgdGlwID0gdGlwX21hcFt0aXBfa2V5KGUudGFyZ2V0KV0udGlwXG4gICAgICB0aXAuc3R5bGUgPSB0aXBfcG9zaXRpb24odGlwLCBlKVxuICAgIH1cbiAgICAvLyBjcmVhdGUgbmV3IHRpcFxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgdGlwID0gdGVtcGxhdGUoZSlcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGlwKVxuXG4gICAgICB0aXAuc3R5bGUgPSB0aXBfcG9zaXRpb24odGlwLCBlKVxuXG4gICAgICAkKGUudGFyZ2V0KS5vbignbW91c2VvdXQgRE9NTm9kZVJlbW92ZWQnLCBtb3VzZU91dClcbiAgICAgICQoZS50YXJnZXQpLm9uKCdjbGljaycsIHRvZ2dsZVBpbm5lZClcblxuICAgICAgdGlwX21hcFt0aXBfa2V5KGUudGFyZ2V0KV0gPSB7IHRpcCwgZSB9XG4gICAgfVxuICB9XG5cbiAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUpXG5cbiAgaG90a2V5cygnZXNjJywgXyA9PiByZW1vdmVBbGwoKSlcblxuICBjb25zdCBoaWRlQWxsID0gKCkgPT5cbiAgICBPYmplY3QudmFsdWVzKHRpcF9tYXApXG4gICAgICAuZm9yRWFjaCgoe3RpcH0pID0+IHtcbiAgICAgICAgdGlwLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgJCh0aXApLm9mZignbW91c2VvdXQnLCBtb3VzZU91dClcbiAgICAgICAgJCh0aXApLm9mZignY2xpY2snLCB0b2dnbGVQaW5uZWQpXG4gICAgICB9KVxuXG4gIGNvbnN0IHJlbW92ZUFsbCA9ICgpID0+IHtcbiAgICBPYmplY3QudmFsdWVzKHRpcF9tYXApXG4gICAgICAuZm9yRWFjaCgoe3RpcH0pID0+IHtcbiAgICAgICAgdGlwLnJlbW92ZSgpXG4gICAgICAgICQodGlwKS5vZmYoJ21vdXNlb3V0JywgbW91c2VPdXQpXG4gICAgICAgICQodGlwKS5vZmYoJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuICAgICAgfSlcbiAgICBcbiAgICAkKCdbZGF0YS1tZXRhdGlwXScpLmF0dHIoJ2RhdGEtbWV0YXRpcCcsIG51bGwpXG5cbiAgICB0aXBfbWFwID0ge31cbiAgfVxuXG4gIE9iamVjdC52YWx1ZXModGlwX21hcClcbiAgICAuZm9yRWFjaCgoe3RpcCxlfSkgPT4ge1xuICAgICAgdGlwLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICB0aXAuaW5uZXJIVE1MID0gdGVtcGxhdGUoZSkuaW5uZXJIVE1MXG4gICAgICB0aXAub24oJ21vdXNlb3V0JywgbW91c2VPdXQpXG4gICAgICB0aXAub24oJ2NsaWNrJywgdG9nZ2xlUGlubmVkKVxuICAgIH0pXG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICAkKCdib2R5Jykub2ZmKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmUpXG4gICAgaG90a2V5cy51bmJpbmQoJ2VzYycpXG4gICAgaGlkZUFsbCgpXG4gIH1cbn0iLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuaW1wb3J0IHsgZ2V0U3R5bGUsIHNob3dIaWRlU2VsZWN0ZWQgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG5jb25zdCBrZXlfZXZlbnRzID0gJ3VwLGRvd24sbGVmdCxyaWdodCdcbiAgLnNwbGl0KCcsJylcbiAgLnJlZHVjZSgoZXZlbnRzLCBldmVudCkgPT4gXG4gICAgYCR7ZXZlbnRzfSwke2V2ZW50fSxzaGlmdCske2V2ZW50fWBcbiAgLCAnJylcbiAgLnN1YnN0cmluZygxKVxuXG5jb25zdCBjb21tYW5kX2V2ZW50cyA9ICdjbWQrdXAsY21kK2Rvd24nXG5cbmV4cG9ydCBmdW5jdGlvbiBCb3hTaGFkb3coc2VsZWN0b3IpIHtcbiAgaG90a2V5cyhrZXlfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgbGV0IHNlbGVjdGVkTm9kZXMgPSAkKHNlbGVjdG9yKVxuICAgICAgLCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuXG4gICAgaWYgKGtleXMuaW5jbHVkZXMoJ2xlZnQnKSB8fCBrZXlzLmluY2x1ZGVzKCdyaWdodCcpKVxuICAgICAga2V5cy5pbmNsdWRlcygnc2hpZnQnKVxuICAgICAgICA/IGNoYW5nZUJveFNoYWRvdyhzZWxlY3RlZE5vZGVzLCBrZXlzLCAnc2l6ZScpXG4gICAgICAgIDogY2hhbmdlQm94U2hhZG93KHNlbGVjdGVkTm9kZXMsIGtleXMsICd4JylcbiAgICBlbHNlXG4gICAgICBrZXlzLmluY2x1ZGVzKCdzaGlmdCcpXG4gICAgICAgID8gY2hhbmdlQm94U2hhZG93KHNlbGVjdGVkTm9kZXMsIGtleXMsICdibHVyJylcbiAgICAgICAgOiBjaGFuZ2VCb3hTaGFkb3coc2VsZWN0ZWROb2Rlcywga2V5cywgJ3knKVxuICB9KVxuXG4gIGhvdGtleXMoY29tbWFuZF9ldmVudHMsIChlLCBoYW5kbGVyKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgbGV0IGtleXMgPSBoYW5kbGVyLmtleS5zcGxpdCgnKycpXG4gICAgY2hhbmdlQm94U2hhZG93KCQoc2VsZWN0b3IpLCBrZXlzLCAnaW5zZXQnKVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JylcbiAgfVxufVxuXG5jb25zdCBlbnN1cmVIYXNTaGFkb3cgPSBlbCA9PiB7XG4gIGlmIChlbC5zdHlsZS5ib3hTaGFkb3cgPT0gJycgfHwgZWwuc3R5bGUuYm94U2hhZG93ID09ICdub25lJylcbiAgICBlbC5zdHlsZS5ib3hTaGFkb3cgPSAnaHNsYSgwLDAlLDAlLDUwJSkgMCAwIDAgMCdcbiAgcmV0dXJuIGVsXG59XG5cbi8vIHRvZG86IHdvcmsgYXJvdW5kIHRoaXMgcHJvcE1hcCB3aXRoIGEgYmV0dGVyIHNwbGl0XG5jb25zdCBwcm9wTWFwID0ge1xuICAneCc6ICAgICAgNCxcbiAgJ3knOiAgICAgIDUsXG4gICdibHVyJzogICA2LFxuICAnc2l6ZSc6ICAgNyxcbiAgJ2luc2V0JzogIDgsXG59XG5cbmNvbnN0IHBhcnNlQ3VycmVudFNoYWRvdyA9IGVsID0+IGdldFN0eWxlKGVsLCAnYm94U2hhZG93Jykuc3BsaXQoJyAnKVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlQm94U2hhZG93KGVscywgZGlyZWN0aW9uLCBwcm9wKSB7XG4gIGVsc1xuICAgIC5tYXAoZW5zdXJlSGFzU2hhZG93KVxuICAgIC5tYXAoZWwgPT4gc2hvd0hpZGVTZWxlY3RlZChlbCwgMTUwMCkpXG4gICAgLm1hcChlbCA9PiAoeyBcbiAgICAgIGVsLCBcbiAgICAgIHN0eWxlOiAgICAgJ2JveFNoYWRvdycsXG4gICAgICBjdXJyZW50OiAgIHBhcnNlQ3VycmVudFNoYWRvdyhlbCksIC8vIFtcInJnYigyNTUsXCIsIFwiMCxcIiwgXCIwKVwiLCBcIjBweFwiLCBcIjBweFwiLCBcIjFweFwiLCBcIjBweFwiXVxuICAgICAgcHJvcEluZGV4OiBwYXJzZUN1cnJlbnRTaGFkb3coZWwpWzBdLmluY2x1ZGVzKCdyZ2JhJykgPyBwcm9wTWFwW3Byb3BdIDogcHJvcE1hcFtwcm9wXSAtIDFcbiAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT4ge1xuICAgICAgbGV0IHVwZGF0ZWQgPSBbLi4ucGF5bG9hZC5jdXJyZW50XVxuICAgICAgbGV0IGN1ciAgICAgPSBwYXJzZUludChwYXlsb2FkLmN1cnJlbnRbcGF5bG9hZC5wcm9wSW5kZXhdKVxuXG4gICAgICBpZiAocHJvcCA9PSAnYmx1cicpIHtcbiAgICAgICAgdXBkYXRlZFtwYXlsb2FkLnByb3BJbmRleF0gPSBkaXJlY3Rpb24uaW5jbHVkZXMoJ2Rvd24nKVxuICAgICAgICAgID8gYCR7Y3VyIC0gMX1weGBcbiAgICAgICAgICA6IGAke2N1ciArIDF9cHhgXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChwcm9wID09ICdpbnNldCcpIHtcbiAgICAgICAgdXBkYXRlZFtwYXlsb2FkLnByb3BJbmRleF0gPSBkaXJlY3Rpb24uaW5jbHVkZXMoJ2Rvd24nKVxuICAgICAgICAgID8gJydcbiAgICAgICAgICA6ICdpbnNldCdcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB1cGRhdGVkW3BheWxvYWQucHJvcEluZGV4XSA9IGRpcmVjdGlvbi5pbmNsdWRlcygnbGVmdCcpIHx8IGRpcmVjdGlvbi5pbmNsdWRlcygndXAnKVxuICAgICAgICAgID8gYCR7Y3VyIC0gMX1weGBcbiAgICAgICAgICA6IGAke2N1ciArIDF9cHhgXG4gICAgICB9XG5cbiAgICAgIHBheWxvYWQudmFsdWUgPSB1cGRhdGVkXG4gICAgICByZXR1cm4gcGF5bG9hZFxuICAgIH0pXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIHZhbHVlfSkgPT5cbiAgICAgIGVsLnN0eWxlW3N0eWxlXSA9IHZhbHVlLmpvaW4oJyAnKSlcbn1cbiIsImltcG9ydCAkIGZyb20gJ2JsaW5nYmxpbmdqcydcbmltcG9ydCBob3RrZXlzIGZyb20gJ2hvdGtleXMtanMnXG5pbXBvcnQgeyBUaW55Q29sb3IgfSBmcm9tICdAY3RybC90aW55Y29sb3InXG5cbmltcG9ydCB7IGdldFN0eWxlLCBzaG93SGlkZVNlbGVjdGVkIH0gZnJvbSAnLi91dGlscy5qcydcblxuY29uc3Qga2V5X2V2ZW50cyA9ICd1cCxkb3duLGxlZnQscmlnaHQnXG4gIC5zcGxpdCgnLCcpXG4gIC5yZWR1Y2UoKGV2ZW50cywgZXZlbnQpID0+IFxuICAgIGAke2V2ZW50c30sJHtldmVudH0sc2hpZnQrJHtldmVudH1gXG4gICwgJycpXG4gIC5zdWJzdHJpbmcoMSlcblxuLy8gdG9kbzogYWxwaGEgYXMgY21kK2xlZnQsY21kK3NoaWZ0K2xlZnQsY21kK3JpZ2h0LGNtZCtzaGlmdCtyaWdodFxuY29uc3QgY29tbWFuZF9ldmVudHMgPSAnY21kK3VwLGNtZCtzaGlmdCt1cCxjbWQrZG93bixjbWQrc2hpZnQrZG93bidcblxuZXhwb3J0IGZ1bmN0aW9uIEh1ZVNoaWZ0KHNlbGVjdG9yKSB7XG4gIGhvdGtleXMoa2V5X2V2ZW50cywgKGUsIGhhbmRsZXIpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGxldCBzZWxlY3RlZE5vZGVzID0gJChzZWxlY3RvcilcbiAgICAgICwga2V5cyA9IGhhbmRsZXIua2V5LnNwbGl0KCcrJylcblxuICAgIGlmIChrZXlzLmluY2x1ZGVzKCdsZWZ0JykgfHwga2V5cy5pbmNsdWRlcygncmlnaHQnKSlcbiAgICAgIGNoYW5nZUh1ZShzZWxlY3RlZE5vZGVzLCBrZXlzLCAncycpXG4gICAgZWxzZVxuICAgICAgY2hhbmdlSHVlKHNlbGVjdGVkTm9kZXMsIGtleXMsICdsJylcbiAgfSlcblxuICBob3RrZXlzKGNvbW1hbmRfZXZlbnRzLCAoZSwgaGFuZGxlcikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGxldCBrZXlzID0gaGFuZGxlci5rZXkuc3BsaXQoJysnKVxuICAgIGNoYW5nZUh1ZSgkKHNlbGVjdG9yKSwga2V5cywgJ2gnKVxuICB9KVxuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgaG90a2V5cy51bmJpbmQoa2V5X2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZChjb21tYW5kX2V2ZW50cylcbiAgICBob3RrZXlzLnVuYmluZCgndXAsZG93bixsZWZ0LHJpZ2h0JylcbiAgfVxufVxuXG4vLyB0b2RvOiBtb3JlIGhvdGtleXNcbi8vIGI6IGJsYWNrXG4vLyB3OiB3aGl0ZVxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUh1ZShlbHMsIGRpcmVjdGlvbiwgcHJvcCkge1xuICBlbHNcbiAgICAubWFwKHNob3dIaWRlU2VsZWN0ZWQpXG4gICAgLm1hcChlbCA9PiB7XG4gICAgICBjb25zdCBGRyA9IG5ldyBUaW55Q29sb3IoZ2V0U3R5bGUoZWwsICdjb2xvcicpKVxuICAgICAgY29uc3QgQkcgPSBuZXcgVGlueUNvbG9yKGdldFN0eWxlKGVsLCAnYmFja2dyb3VuZENvbG9yJykpXG4gICAgICBcbiAgICAgIHJldHVybiBCRy5vcmlnaW5hbElucHV0ICE9ICdyZ2JhKDAsIDAsIDAsIDApJyAgICAgICAgICAgICAvLyBpZiBiZyBpcyBzZXQgdG8gYSB2YWx1ZVxuICAgICAgICA/IHsgZWwsIGN1cnJlbnQ6IEJHLnRvSHNsKCksIHN0eWxlOiAnYmFja2dyb3VuZENvbG9yJyB9IC8vIHVzZSBiZ1xuICAgICAgICA6IHsgZWwsIGN1cnJlbnQ6IEZHLnRvSHNsKCksIHN0eWxlOiAnY29sb3InIH0gICAgICAgICAgIC8vIGVsc2UgdXNlIGZnXG4gICAgfSlcbiAgICAubWFwKHBheWxvYWQgPT5cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF5bG9hZCwge1xuICAgICAgICBhbW91bnQ6ICAgZGlyZWN0aW9uLmluY2x1ZGVzKCdzaGlmdCcpID8gMTAgOiAxLFxuICAgICAgICBuZWdhdGl2ZTogZGlyZWN0aW9uLmluY2x1ZGVzKCdkb3duJykgfHwgZGlyZWN0aW9uLmluY2x1ZGVzKCdsZWZ0JyksXG4gICAgICB9KSlcbiAgICAubWFwKHBheWxvYWQgPT4ge1xuICAgICAgaWYgKHByb3AgPT09ICdzJyB8fCBwcm9wID09PSAnbCcpXG4gICAgICAgIHBheWxvYWQuYW1vdW50ID0gcGF5bG9hZC5hbW91bnQgKiAwLjAxXG5cbiAgICAgIHBheWxvYWQuY3VycmVudFtwcm9wXSA9IHBheWxvYWQubmVnYXRpdmVcbiAgICAgICAgPyBwYXlsb2FkLmN1cnJlbnRbcHJvcF0gLSBwYXlsb2FkLmFtb3VudCBcbiAgICAgICAgOiBwYXlsb2FkLmN1cnJlbnRbcHJvcF0gKyBwYXlsb2FkLmFtb3VudFxuXG4gICAgICBpZiAocHJvcCA9PT0gJ3MnIHx8IHByb3AgPT09ICdsJykge1xuICAgICAgICBpZiAocGF5bG9hZC5jdXJyZW50W3Byb3BdID4gMSkgcGF5bG9hZC5jdXJyZW50W3Byb3BdID0gMVxuICAgICAgICBpZiAocGF5bG9hZC5jdXJyZW50W3Byb3BdIDwgMCkgcGF5bG9hZC5jdXJyZW50W3Byb3BdID0gMFxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGF5bG9hZFxuICAgIH0pXG4gICAgLmZvckVhY2goKHtlbCwgc3R5bGUsIGN1cnJlbnR9KSA9PlxuICAgICAgZWwuc3R5bGVbc3R5bGVdID0gbmV3IFRpbnlDb2xvcihjdXJyZW50KS50b0hzbFN0cmluZygpKVxufVxuIiwiaW1wb3J0ICQgZnJvbSAnYmxpbmdibGluZ2pzJ1xuaW1wb3J0IGhvdGtleXMgZnJvbSAnaG90a2V5cy1qcydcblxuaW1wb3J0IHsgY3Vyc29yLCBtb3ZlLCBzZWFyY2gsIG1hcmdpbiwgcGFkZGluZywgZm9udCwgaW5zcGVjdG9yLFxuICAgICAgICAgdHlwZSwgYWxpZ24sIHRyYW5zZm9ybSwgcmVzaXplLCBib3JkZXIsIGh1ZXNoaWZ0LCBib3hzaGFkb3cgfSBmcm9tICcuL3Rvb2xwYWxsZXRlLmljb25zJyBcbmltcG9ydCB7IFxuICBTZWxlY3RhYmxlLCBNb3ZlYWJsZSwgUGFkZGluZywgTWFyZ2luLCBFZGl0VGV4dCwgRm9udCwgRmxleCwgU2VhcmNoLFxuICBDb2xvclBpY2tlciwgQm94U2hhZG93LCBIdWVTaGlmdCwgTWV0YVRpcFxufSBmcm9tICcuLi9mZWF0dXJlcy8nXG5cbi8vIHRvZG86IHJlc2l6ZVxuLy8gdG9kbzogdW5kb1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVG9vbFBhbGxldGUgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMudG9vbGJhcl9tb2RlbCA9IHtcbiAgICAgIGk6IHsgdG9vbDogJ2luc3BlY3RvcicsIGljb246IGluc3BlY3RvciwgbGFiZWw6ICdJbnNwZWN0JywgZGVzY3JpcHRpb246ICdQZWFrIGludG8gdGhlIGNvbW1vbi9jdXJyZW50IHN0eWxlcyBvZiBhbiBlbGVtZW50JyB9LFxuICAgICAgdjogeyB0b29sOiAnbW92ZScsIGljb246IG1vdmUsIGxhYmVsOiAnTW92ZScsIGRlc2NyaXB0aW9uOiAnU2hpZnQgdGhpbmdzIGFyb3VuZCwgY29weS9wYXN0ZSwgZHVwbGljYXRlJyB9LFxuICAgICAgLy8gcjogeyB0b29sOiAncmVzaXplJywgaWNvbjogcmVzaXplLCBsYWJlbDogJ1Jlc2l6ZScsIGRlc2NyaXB0aW9uOiAnJyB9LFxuICAgICAgbTogeyB0b29sOiAnbWFyZ2luJywgaWNvbjogbWFyZ2luLCBsYWJlbDogJ01hcmdpbicsIGRlc2NyaXB0aW9uOiAnQ2hhbmdlIHRoZSBtYXJnaW4gYXJvdW5kIDEgb3IgbWFueSBzZWxlY3RlZCBlbGVtZW50cycgfSxcbiAgICAgIHA6IHsgdG9vbDogJ3BhZGRpbmcnLCBpY29uOiBwYWRkaW5nLCBsYWJlbDogJ1BhZGRpbmcnLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSB0aGUgcGFkZGluZyBhcm91bmQgMSBvciBtYW55IHNlbGVjdGVkIGVsZW1lbnRzJyB9LFxuICAgICAgLy8gYjogeyB0b29sOiAnYm9yZGVyJywgaWNvbjogYm9yZGVyLCBsYWJlbDogJ0JvcmRlcicsIGRlc2NyaXB0aW9uOiAnJyB9LFxuICAgICAgYTogeyB0b29sOiAnYWxpZ24nLCBpY29uOiBhbGlnbiwgbGFiZWw6ICdGbGV4Ym94IEFsaWduJywgZGVzY3JpcHRpb246ICdRdWljayBhbGlnbm1lbnQgYWRqdXN0bWVudHMnIH0sXG4gICAgICBoOiB7IHRvb2w6ICdodWVzaGlmdCcsIGljb246IGh1ZXNoaWZ0LCBsYWJlbDogJ0h1ZSBTaGlmdGVyJywgZGVzY3JpcHRpb246ICdTaGlmdCB0aGUgYnJpZ2h0bmVzcywgc2F0dXJhdGlvbiAmIGh1ZScgfSxcbiAgICAgIGQ6IHsgdG9vbDogJ2JveHNoYWRvdycsIGljb246IGJveHNoYWRvdywgbGFiZWw6ICdTaGFkb3cnLCBkZXNjcmlwdGlvbjogJ01vdmUgb3IgY3JlYXRlIGEgc2hhZG93JyB9LFxuICAgICAgLy8gdDogeyB0b29sOiAndHJhbnNmb3JtJywgaWNvbjogdHJhbnNmb3JtLCBsYWJlbDogJzNEIFRyYW5zZm9ybScsIGRlc2NyaXB0aW9uOiAnJyB9LFxuICAgICAgZjogeyB0b29sOiAnZm9udCcsIGljb246IGZvbnQsIGxhYmVsOiAnRm9udCBTdHlsZXMnLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSBzaXplLCBsZWFkaW5nLCBrZXJuaW5nLCAmIHdlaWdodHMnIH0sXG4gICAgICBlOiB7IHRvb2w6ICd0ZXh0JywgaWNvbjogdHlwZSwgbGFiZWw6ICdFZGl0IFRleHQnLCBkZXNjcmlwdGlvbjogJ0NoYW5nZSBhbnkgdGV4dCBvbiB0aGUgcGFnZScgfSxcbiAgICAgIHM6IHsgdG9vbDogJ3NlYXJjaCcsIGljb246IHNlYXJjaCwgbGFiZWw6ICdTZWFyY2gnLCBkZXNjcmlwdGlvbjogJ1NlbGVjdCBlbGVtZW50cyBieSBzZWFyY2hpbmcgZm9yIHRoZW0nIH0sXG4gICAgfVxuXG4gICAgdGhpcy4kc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pXG4gICAgdGhpcy4kc2hhZG93LmlubmVySFRNTCA9IHRoaXMucmVuZGVyKClcblxuICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUgPSBTZWxlY3RhYmxlKClcbiAgICB0aGlzLmNvbG9yUGlja2VyICAgID0gQ29sb3JQaWNrZXIodGhpcy4kc2hhZG93LCB0aGlzLnNlbGVjdG9yRW5naW5lKVxuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgJCgnbGlbZGF0YS10b29sXScsIHRoaXMuJHNoYWRvdykub24oJ2NsaWNrJywgZSA9PiBcbiAgICAgIHRoaXMudG9vbFNlbGVjdGVkKGUuY3VycmVudFRhcmdldCkgJiYgZS5zdG9wUHJvcGFnYXRpb24oKSlcblxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMudG9vbGJhcl9tb2RlbCkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PlxuICAgICAgaG90a2V5cyhrZXksIGUgPT4gXG4gICAgICAgIHRoaXMudG9vbFNlbGVjdGVkKFxuICAgICAgICAgICQoYFtkYXRhLXRvb2w9XCIke3ZhbHVlLnRvb2x9XCJdYCwgdGhpcy4kc2hhZG93KVswXSkpKVxuXG4gICAgdGhpcy50b29sU2VsZWN0ZWQoJCgnW2RhdGEtdG9vbD1cImluc3BlY3RvclwiXScsIHRoaXMuJHNoYWRvdylbMF0pXG4gIH1cblxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHt9XG5cbiAgdG9vbFNlbGVjdGVkKGVsKSB7XG4gICAgaWYgKHR5cGVvZiBlbCA9PT0gJ3N0cmluZycpXG4gICAgICBlbCA9ICQoYFtkYXRhLXRvb2w9XCIke2VsfVwiXWAsIHRoaXMuJHNoYWRvdylbMF1cblxuICAgIGlmICh0aGlzLmFjdGl2ZV90b29sICYmIHRoaXMuYWN0aXZlX3Rvb2wuZGF0YXNldC50b29sID09PSBlbC5kYXRhc2V0LnRvb2wpIHJldHVyblxuXG4gICAgaWYgKHRoaXMuYWN0aXZlX3Rvb2wpIHtcbiAgICAgIHRoaXMuYWN0aXZlX3Rvb2wuYXR0cignZGF0YS1hY3RpdmUnLCBudWxsKVxuICAgICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUoKVxuICAgIH1cblxuICAgIGVsLmF0dHIoJ2RhdGEtYWN0aXZlJywgdHJ1ZSlcbiAgICB0aGlzLmFjdGl2ZV90b29sID0gZWxcbiAgICB0aGlzW2VsLmRhdGFzZXQudG9vbF0oKVxuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8b2w+XG4gICAgICAgICR7T2JqZWN0LmVudHJpZXModGhpcy50b29sYmFyX21vZGVsKS5yZWR1Y2UoKGxpc3QsIFtrZXksIHZhbHVlXSkgPT4gYFxuICAgICAgICAgICR7bGlzdH1cbiAgICAgICAgICA8bGkgYXJpYS1sYWJlbD1cIiR7dmFsdWUubGFiZWx9IFRvb2wgKCR7a2V5fSlcIiBhcmlhLWRlc2NyaXB0aW9uPVwiJHt2YWx1ZS5kZXNjcmlwdGlvbn1cIiBkYXRhLXRvb2w9XCIke3ZhbHVlLnRvb2x9XCIgZGF0YS1hY3RpdmU9XCIke2tleSA9PSAnaSd9XCI+JHt2YWx1ZS5pY29ufTwvbGk+XG4gICAgICAgIGAsJycpfVxuICAgICAgICA8bGkgY2xhc3M9XCJjb2xvclwiIGFyaWEtbGFiZWw9XCJGb3JlZ3JvdW5kXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmU7XCI+XG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJjb2xvclwiIGlkPSdmb3JlZ3JvdW5kJyB2YWx1ZT0nJz5cbiAgICAgICAgPC9saT5cbiAgICAgICAgPGxpIGNsYXNzPVwiY29sb3JcIiBhcmlhLWxhYmVsPVwiQmFja2dyb3VuZFwiIHN0eWxlPVwiZGlzcGxheTpub25lO1wiPlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY29sb3JcIiBpZD0nYmFja2dyb3VuZCcgdmFsdWU9Jyc+XG4gICAgICAgIDwvbGk+XG4gICAgICA8L29sPlxuICAgIGBcbiAgfVxuXG4gIHN0eWxlcygpIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgIHRvcDogMXJlbTtcbiAgICAgICAgICBsZWZ0OiAxcmVtO1xuICAgICAgICAgIHotaW5kZXg6IDk5OTk4OyBcblxuICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLXRoZW1lLWJnKTtcbiAgICAgICAgICBib3gtc2hhZG93OiAwIDAuMjVyZW0gMC41cmVtIGhzbGEoMCwwJSwwJSwxMCUpO1xuXG4gICAgICAgICAgLS10aGVtZS1iZzogaHNsKDAsMCUsMTAwJSk7XG4gICAgICAgICAgLS10aGVtZS1jb2xvcjogaG90cGluaztcbiAgICAgICAgICAtLXRoZW1lLWljb25fY29sb3I6IGhzbCgwLDAlLDIwJSk7XG4gICAgICAgICAgLS10aGVtZS10b29sX3NlbGVjdGVkOiBoc2woMCwwJSw5OCUpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgPiBvbCB7XG4gICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xuXG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGkge1xuICAgICAgICAgIGhlaWdodDogMi41cmVtO1xuICAgICAgICAgIHdpZHRoOiAyLjVyZW07XG4gICAgICAgICAgZGlzcGxheTogaW5saW5lLWZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLXRvb2xdOmhvdmVyIHtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgYmFja2dyb3VuZDogaHNsKDAsMCUsOTglKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpW2RhdGEtdG9vbF06aG92ZXI6YWZ0ZXIsXG4gICAgICAgIDpob3N0IGxpLmNvbG9yOmhvdmVyOmFmdGVyIHtcbiAgICAgICAgICBjb250ZW50OiBhdHRyKGFyaWEtbGFiZWwpIFwiXFxcXEFcIiBhdHRyKGFyaWEtZGVzY3JpcHRpb24pO1xuICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICBsZWZ0OiAxMDAlO1xuICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICB6LWluZGV4OiAtMTtcbiAgICAgICAgICBib3gtc2hhZG93OiAwIDAuMXJlbSAwLjFyZW0gaHNsYSgwLDAlLDAlLDEwJSk7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgcGFkZGluZzogMCAwLjVyZW07XG4gICAgICAgICAgYmFja2dyb3VuZDogaG90cGluaztcbiAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgICAgZm9udC1zaXplOiAwLjhyZW07XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpLmNvbG9yOmhvdmVyOmFmdGVyIHtcbiAgICAgICAgICB0b3A6IDA7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLXRvb2w9J2FsaWduJ10gPiBzdmcge1xuICAgICAgICAgIHRyYW5zZm9ybTogcm90YXRlWig5MGRlZyk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLWFjdGl2ZT10cnVlXSB7XG4gICAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tdGhlbWUtdG9vbF9zZWxlY3RlZCk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLWFjdGl2ZT10cnVlXSA+IHN2Zzpub3QoLmljb24tY3Vyc29yKSB7IFxuICAgICAgICAgIGZpbGw6IHZhcigtLXRoZW1lLWNvbG9yKTsgXG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaVtkYXRhLWFjdGl2ZT10cnVlXSA+IC5pY29uLWN1cnNvciB7IFxuICAgICAgICAgIHN0cm9rZTogdmFyKC0tdGhlbWUtY29sb3IpOyBcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGxpLmNvbG9yIHtcbiAgICAgICAgICBoZWlnaHQ6IDIwcHg7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaS5jb2xvciB7XG4gICAgICAgICAgYm9yZGVyLXRvcDogMC4yNXJlbSBzb2xpZCBoc2woMCwwJSw5MCUpO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGkgPiBzdmcge1xuICAgICAgICAgIHdpZHRoOiA1MCU7XG4gICAgICAgICAgZmlsbDogdmFyKC0tdGhlbWUtaWNvbl9jb2xvcik7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBsaSA+IHN2Zy5pY29uLWN1cnNvciB7XG4gICAgICAgICAgd2lkdGg6IDM1JTtcbiAgICAgICAgICBmaWxsOiB3aGl0ZTtcbiAgICAgICAgICBzdHJva2U6IHZhcigtLXRoZW1lLWljb25fY29sb3IpO1xuICAgICAgICAgIHN0cm9rZS13aWR0aDogMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sPVwic2VhcmNoXCJdID4gLnNlYXJjaCB7XG4gICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgIGxlZnQ6IDEwMCU7XG4gICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICB6LWluZGV4OiA5OTk5O1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgbGlbZGF0YS10b29sPVwic2VhcmNoXCJdID4gLnNlYXJjaCA+IGlucHV0IHtcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgZm9udC1zaXplOiAxcmVtO1xuICAgICAgICAgIHBhZGRpbmc6IDAuNGVtO1xuICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIHdpZHRoOiAyNTBweDtcbiAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICAgIGNhcmV0LWNvbG9yOiBob3RwaW5rO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgaW5wdXRbdHlwZT0nY29sb3InXSB7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICAgICAgYm9yZGVyOiB3aGl0ZTtcbiAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgaW5wdXRbdHlwZT0nY29sb3InXTpmb2N1cyB7XG4gICAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IGlucHV0W3R5cGU9J2NvbG9yJ106Oi13ZWJraXQtY29sb3Itc3dhdGNoLXdyYXBwZXIgeyBcbiAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgaW5wdXRbdHlwZT0nY29sb3InXTo6LXdlYmtpdC1jb2xvci1zd2F0Y2ggeyBcbiAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBpbnB1dFt0eXBlPSdjb2xvciddW3ZhbHVlPScnXTo6LXdlYmtpdC1jb2xvci1zd2F0Y2ggeyBcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudCAhaW1wb3J0YW50OyBcbiAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTU1ZGVnLCAjZmZmZmZmIDAlLCNmZmZmZmYgNDYlLCNmZjAwMDAgNDYlLCNmZjAwMDAgNTQlLCNmZmZmZmYgNTUlLCNmZmZmZmYgMTAwJSk7XG4gICAgICAgIH1cbiAgICAgIDwvc3R5bGU+XG4gICAgYFxuICB9XG5cbiAgbW92ZSgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IE1vdmVhYmxlKCdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG4gIH1cblxuICBtYXJnaW4oKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBNYXJnaW4oJ1tkYXRhLXNlbGVjdGVkPXRydWVdJykgXG4gIH1cblxuICBwYWRkaW5nKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gUGFkZGluZygnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKSBcbiAgfVxuXG4gIGZvbnQoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBGb250KCdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG4gIH0gXG5cbiAgdGV4dCgpIHtcbiAgICB0aGlzLnNlbGVjdG9yRW5naW5lLm9uU2VsZWN0ZWRVcGRhdGUoRWRpdFRleHQpXG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSAoKSA9PiBcbiAgICAgIHRoaXMuc2VsZWN0b3JFbmdpbmUucmVtb3ZlU2VsZWN0ZWRDYWxsYmFjayhFZGl0VGV4dClcbiAgfVxuXG4gIGFsaWduKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gRmxleCgnW2RhdGEtc2VsZWN0ZWQ9dHJ1ZV0nKVxuICB9XG5cbiAgc2VhcmNoKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gU2VhcmNoKHRoaXMuc2VsZWN0b3JFbmdpbmUsICQoJ1tkYXRhLXRvb2w9XCJzZWFyY2hcIl0nLCB0aGlzLiRzaGFkb3cpKVxuICB9XG5cbiAgYm94c2hhZG93KCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZV9mZWF0dXJlID0gQm94U2hhZG93KCdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG4gIH1cblxuICBodWVzaGlmdCgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGVfZmVhdHVyZSA9IEh1ZVNoaWZ0KCdbZGF0YS1zZWxlY3RlZD10cnVlXScpXG4gIH1cblxuICBpbnNwZWN0b3IoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlX2ZlYXR1cmUgPSBNZXRhVGlwKClcbiAgfVxuXG4gIGFjdGl2ZVRvb2woKSB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aXZlX3Rvb2wuZGF0YXNldC50b29sXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd0b29sLXBhbGxldGUnLCBUb29sUGFsbGV0ZSkiLCJpbXBvcnQgJCBmcm9tICdibGluZ2JsaW5nanMnXG5pbXBvcnQgaG90a2V5cyBmcm9tICdob3RrZXlzLWpzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIb3RrZXlNYXAgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIFxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLmtleWJvYXJkX21vZGVsID0ge1xuICAgICAgbnVtOiAgICBbJ2AnLCcxJywnMicsJzMnLCc0JywnNScsJzYnLCc3JywnOCcsJzknLCcwJywnLScsJz0nLCdkZWxldGUnXSxcbiAgICAgIHRhYjogICAgWyd0YWInLCdxJywndycsJ2UnLCdyJywndCcsJ3knLCd1JywnaScsJ28nLCdwJywnWycsJ10nLCdcXFxcJ10sXG4gICAgICBjYXBzOiAgIFsnY2FwcycsJ2EnLCdzJywnZCcsJ2YnLCdnJywnaCcsJ2onLCdrJywnbCcsJ1xcJycsJ3JldHVybiddLFxuICAgICAgc2hpZnQ6ICBbJ3NoaWZ0JywneicsJ3gnLCdjJywndicsJ2InLCduJywnbScsJywnLCcuJywnLycsJ3NoaWZ0J10sXG4gICAgICBzcGFjZTogIFsnY3RybCcsJ2FsdCcsJ2NtZCcsJ3NwYWNlYmFyJywnY21kJywnYWx0JywnY3RybCddXG4gICAgfVxuXG4gICAgLy8gaW5kZXg6ZmxleFxuICAgIHRoaXMua2V5X3NpemVfbW9kZWwgPSB7XG4gICAgICBudW06ICAgIHsxMjoyfSxcbiAgICAgIHRhYjogICAgezA6Mn0sXG4gICAgICBjYXBzOiAgIHswOjMsMTE6M30sXG4gICAgICBzaGlmdDogIHswOjYsMTE6Nn0sXG4gICAgICBzcGFjZTogIHszOjEwLDQ6Mn0sXG4gICAgfVxuXG4gICAgdGhpcy4kc2hhZG93ICAgICAgICAgICAgPSB0aGlzLmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSlcbiAgICB0aGlzLiRzaGFkb3cuaW5uZXJIVE1MICA9IHRoaXMucmVuZGVyKClcblxuICAgIHRoaXMudG9vbCAgICAgICAgICAgICAgID0gJ3BhZGRpbmcnXG4gICAgdGhpcy4kY29tbWFuZCAgICAgICAgICAgPSAkKCdbY29tbWFuZF0nLCB0aGlzLiRzaGFkb3cpXG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLiRzaGlmdCAgPSAkKCdba2V5Ym9hcmRdID4gc2VjdGlvbiA+IFtzaGlmdF0nLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kY3RybCAgID0gJCgnW2tleWJvYXJkXSA+IHNlY3Rpb24gPiBbY3RybF0nLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kYWx0ICAgID0gJCgnW2tleWJvYXJkXSA+IHNlY3Rpb24gPiBbYWx0XScsIHRoaXMuJHNoYWRvdylcbiAgICB0aGlzLiRjbWQgICAgPSAkKCdba2V5Ym9hcmRdID4gc2VjdGlvbiA+IFtjbWRdJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJHVwICAgICA9ICQoJ1thcnJvd3NdIFt1cF0nLCB0aGlzLiRzaGFkb3cpXG4gICAgdGhpcy4kZG93biAgID0gJCgnW2Fycm93c10gW2Rvd25dJywgdGhpcy4kc2hhZG93KVxuICAgIHRoaXMuJGxlZnQgICA9ICQoJ1thcnJvd3NdIFtsZWZ0XScsIHRoaXMuJHNoYWRvdylcbiAgICB0aGlzLiRyaWdodCAgPSAkKCdbYXJyb3dzXSBbcmlnaHRdJywgdGhpcy4kc2hhZG93KVxuXG4gICAgaG90a2V5cygnc2hpZnQrLycsIGUgPT5cbiAgICAgIHRoaXMuJHNoYWRvdy5ob3N0LnN0eWxlLmRpc3BsYXkgIT09ICdmbGV4J1xuICAgICAgICA/IHRoaXMuc2hvdygpXG4gICAgICAgIDogdGhpcy5oaWRlKCkpXG4gIH1cblxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBob3RrZXlzLnVuYmluZCgnKicpXG4gIH1cblxuICBzaG93KCkge1xuICAgIHRoaXMuJHNoYWRvdy5ob3N0LnN0eWxlLmRpc3BsYXkgPSAnZmxleCdcbiAgICBob3RrZXlzKCcqJywgKGUsIGhhbmRsZXIpID0+IFxuICAgICAgdGhpcy53YXRjaEtleXMoZSwgaGFuZGxlcikpXG4gIH1cblxuICBoaWRlKCkge1xuICAgIHRoaXMuJHNoYWRvdy5ob3N0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICBob3RrZXlzLnVuYmluZCgnKicpXG4gIH1cblxuICBzZXRUb29sKHRvb2wpIHtcbiAgICBpZiAodG9vbCkgdGhpcy50b29sID0gdG9vbFxuICB9XG5cbiAgd2F0Y2hLZXlzKGUsIGhhbmRsZXIpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICB0aGlzLiRzaGlmdC5hdHRyKCdwcmVzc2VkJywgaG90a2V5cy5zaGlmdClcbiAgICB0aGlzLiRjdHJsLmF0dHIoJ3ByZXNzZWQnLCBob3RrZXlzLmN0cmwpXG4gICAgdGhpcy4kYWx0LmF0dHIoJ3ByZXNzZWQnLCBob3RrZXlzLmFsdClcbiAgICB0aGlzLiRjbWQuYXR0cigncHJlc3NlZCcsIGhvdGtleXMuY21kKVxuICAgIHRoaXMuJHVwLmF0dHIoJ3ByZXNzZWQnLCBlLmNvZGUgPT09ICdBcnJvd1VwJylcbiAgICB0aGlzLiRkb3duLmF0dHIoJ3ByZXNzZWQnLCBlLmNvZGUgPT09ICdBcnJvd0Rvd24nKVxuICAgIHRoaXMuJGxlZnQuYXR0cigncHJlc3NlZCcsIGUuY29kZSA9PT0gJ0Fycm93TGVmdCcpXG4gICAgdGhpcy4kcmlnaHQuYXR0cigncHJlc3NlZCcsIGUuY29kZSA9PT0gJ0Fycm93UmlnaHQnKVxuXG4gICAgbGV0IGFtb3VudCA9IGhvdGtleXMuc2hpZnQgPyAxMCA6IDFcblxuICAgIGxldCBuZWdhdGl2ZSA9IGhvdGtleXMuYWx0ID8gJ1N1YnRyYWN0JyA6ICdBZGQnXG4gICAgbGV0IG5lZ2F0aXZlX21vZGlmaWVyID0gaG90a2V5cy5hbHQgPyAnZnJvbScgOiAndG8nXG5cbiAgICBsZXQgc2lkZSA9ICdbYXJyb3cga2V5XSdcbiAgICBpZiAoZS5jb2RlID09PSAnQXJyb3dVcCcpICAgICBzaWRlID0gJ3RoZSB0b3Agc2lkZSdcbiAgICBpZiAoZS5jb2RlID09PSAnQXJyb3dEb3duJykgICBzaWRlID0gJ3RoZSBib3R0b20gc2lkZSdcbiAgICBpZiAoZS5jb2RlID09PSAnQXJyb3dMZWZ0JykgICBzaWRlID0gJ3RoZSBsZWZ0IHNpZGUnXG4gICAgaWYgKGUuY29kZSA9PT0gJ0Fycm93UmlnaHQnKSAgc2lkZSA9ICd0aGUgcmlnaHQgc2lkZSdcbiAgICBpZiAoaG90a2V5cy5jbWQpICAgICAgICAgICAgICBzaWRlID0gJ2FsbCBzaWRlcydcblxuICAgIHRoaXMuJGNvbW1hbmRbMF0uaW5uZXJIVE1MID0gYFxuICAgICAgPHNwYW4gbmVnYXRpdmU+JHtuZWdhdGl2ZX0gPC9zcGFuPlxuICAgICAgPHNwYW4gdG9vbD4ke3RoaXMudG9vbH08L3NwYW4+XG4gICAgICA8c3BhbiBsaWdodD4gJHtuZWdhdGl2ZV9tb2RpZmllcn0gPC9zcGFuPlxuICAgICAgPHNwYW4gc2lkZT4ke3NpZGV9PC9zcGFuPlxuICAgICAgPHNwYW4gbGlnaHQ+IGJ5IDwvc3Bhbj5cbiAgICAgIDxzcGFuIGFtb3VudD4ke2Ftb3VudH08L3NwYW4+XG4gICAgYFxuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiBgXG4gICAgICAke3RoaXMuc3R5bGVzKCl9XG4gICAgICA8YXJ0aWNsZT5cbiAgICAgICAgPGRpdiBjb21tYW5kPiZuYnNwOzwvZGl2PlxuICAgICAgICA8ZGl2IGNhcmQ+XG4gICAgICAgICAgPGRpdiBrZXlib2FyZD5cbiAgICAgICAgICAgICR7T2JqZWN0LmVudHJpZXModGhpcy5rZXlib2FyZF9tb2RlbCkucmVkdWNlKChrZXlib2FyZCwgW3Jvd19uYW1lLCByb3ddKSA9PiBgXG4gICAgICAgICAgICAgICR7a2V5Ym9hcmR9XG4gICAgICAgICAgICAgIDxzZWN0aW9uICR7cm93X25hbWV9PiR7cm93LnJlZHVjZSgocm93LCBrZXksIGkpID0+IGBcbiAgICAgICAgICAgICAgICAke3Jvd308c3BhbiAke2tleX0gc3R5bGU9XCJmbGV4OiR7dGhpcy5rZXlfc2l6ZV9tb2RlbFtyb3dfbmFtZV1baV0gfHwgMX07XCI+JHtrZXl9PC9zcGFuPlxuICAgICAgICAgICAgICBgLCAnJyl9XG4gICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgIGAsICcnKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHNlY3Rpb24gYXJyb3dzPlxuICAgICAgICAgICAgICA8c3BhbiB1cD7ihpE8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGRvd24+4oaTPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBsZWZ0PuKGkDwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gcmlnaHQ+4oaSPC9zcGFuPlxuICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYXJ0aWNsZT5cbiAgICBgXG4gIH1cblxuICBzdHlsZXMoKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxzdHlsZT5cbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgIHotaW5kZXg6IDk5OTtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIHdpZHRoOiAxMDB2dztcbiAgICAgICAgICBoZWlnaHQ6IDEwMHZoO1xuICAgICAgICAgIGJhY2tncm91bmQ6IGhzbCgwLDAlLDk1JSk7XG5cbiAgICAgICAgICAtLWRhcmstZ3JleTogaHNsKDAsMCUsNDAlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFtjb21tYW5kXSB7XG4gICAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgICAgICAgZm9udC1zaXplOiAzdnc7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IGxpZ2h0ZXI7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuMWVtO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgW2NvbW1hbmRdID4gW2xpZ2h0XSB7XG4gICAgICAgICAgY29sb3I6IGhzbCgwLDAlLDYwJSk7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbY2FyZF0ge1xuICAgICAgICAgIHBhZGRpbmc6IDFyZW07XG4gICAgICAgICAgYmFja2dyb3VuZDogd2hpdGU7XG4gICAgICAgICAgYm94LXNoYWRvdzogMCAwLjI1cmVtIDAuMjVyZW0gaHNsYSgwLDAlLDAlLDIwJSk7XG4gICAgICAgICAgY29sb3I6IHZhcigtLWRhcmstZ3JleSk7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IHNlY3Rpb24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBzZWN0aW9uID4gc3BhbiwgOmhvc3QgW2Fycm93c10gPiBzcGFuIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBoc2woMCwwJSw5MCUpO1xuICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgbWFyZ2luOiAycHg7XG4gICAgICAgICAgcGFkZGluZzogMS41dnc7XG4gICAgICAgICAgZm9udC1zaXplOiAwLjc1cmVtO1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBzcGFuW3ByZXNzZWQ9XCJ0cnVlXCJdIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBoc2woMjAwLCA5MCUsIDcwJSk7XG4gICAgICAgICAgY29sb3I6IGhzbCgyMDAsIDkwJSwgMjAlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFtjYXJkXSA+IGRpdjpub3QoW2tleWJvYXJkXSkge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtZW5kO1xuICAgICAgICAgIG1hcmdpbi1sZWZ0OiAxcmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgW2Fycm93c10ge1xuICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyIDFmcjtcbiAgICAgICAgICBncmlkLXRlbXBsYXRlLXJvd3M6IDFmciAxZnI7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbYXJyb3dzXSA+IHNwYW46bnRoLWNoaWxkKDEpIHtcbiAgICAgICAgICBncmlkLXJvdzogMTtcbiAgICAgICAgICBncmlkLWNvbHVtbjogMjtcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFthcnJvd3NdID4gc3BhbjpudGgtY2hpbGQoMikge1xuICAgICAgICAgIGdyaWQtcm93OiAyO1xuICAgICAgICAgIGdyaWQtY29sdW1uOiAyO1xuICAgICAgICB9XG5cbiAgICAgICAgOmhvc3QgW2Fycm93c10gPiBzcGFuOm50aC1jaGlsZCgzKSB7XG4gICAgICAgICAgZ3JpZC1yb3c6IDI7XG4gICAgICAgICAgZ3JpZC1jb2x1bW46IDE7XG4gICAgICAgIH1cblxuICAgICAgICA6aG9zdCBbYXJyb3dzXSA+IHNwYW46bnRoLWNoaWxkKDQpIHtcbiAgICAgICAgICBncmlkLXJvdzogMjtcbiAgICAgICAgICBncmlkLWNvbHVtbjogMztcbiAgICAgICAgfVxuXG4gICAgICAgIDpob3N0IFtjYXBzXSA+IHNwYW46bnRoLWNoaWxkKDEpIHsganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0OyB9XG4gICAgICAgIDpob3N0IFtzaGlmdF0gPiBzcGFuOm50aC1jaGlsZCgxKSB7IGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsgfVxuICAgICAgICA6aG9zdCBbc2hpZnRdID4gc3BhbjpudGgtY2hpbGQoMTIpIHsganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDsgfVxuICAgICAgPC9zdHlsZT5cbiAgICBgXG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCdob3RrZXktbWFwJywgSG90a2V5TWFwKSJdLCJuYW1lcyI6WyJrZXlfZXZlbnRzIiwiY29tbWFuZF9ldmVu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O0VBQ1QsS0FBSyxFQUFFLEVBQUU7RUFDVCxNQUFNLEVBQUUsRUFBRTtFQUNWLEdBQUcsRUFBRSxFQUFFO0VBQ1AsTUFBTSxFQUFFLEVBQUU7RUFDVixLQUFLLEVBQUUsRUFBRTtFQUNULElBQUksRUFBRSxFQUFFO0VBQ1IsRUFBRSxFQUFFLEVBQUU7RUFDTixLQUFLLEVBQUUsRUFBRTtFQUNULElBQUksRUFBRSxFQUFFO0VBQ1IsR0FBRyxFQUFFLEVBQUU7RUFDUCxNQUFNLEVBQUUsRUFBRTtFQUNWLEdBQUcsRUFBRSxFQUFFO0VBQ1AsTUFBTSxFQUFFLEVBQUU7RUFDVixJQUFJLEVBQUUsRUFBRTtFQUNSLEdBQUcsRUFBRSxFQUFFO0VBQ1AsTUFBTSxFQUFFLEVBQUU7RUFDVixRQUFRLEVBQUUsRUFBRTtFQUNaLFFBQVEsRUFBRSxFQUFFO0VBQ1osR0FBRyxFQUFFLEVBQUU7RUFDUCxHQUFHLEVBQUUsR0FBRztFQUNSLEdBQUcsRUFBRSxHQUFHO0VBQ1IsR0FBRyxFQUFFLEdBQUc7RUFDUixHQUFHLEVBQUUsR0FBRztFQUNSLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUc7RUFDckIsR0FBRyxFQUFFLElBQUksR0FBRyxFQUFFLEdBQUcsR0FBRztFQUNwQixHQUFHLEVBQUUsSUFBSSxHQUFHLEVBQUUsR0FBRyxHQUFHO0VBQ3BCLElBQUksRUFBRSxHQUFHO0VBQ1QsR0FBRyxFQUFFLEdBQUc7RUFDUixHQUFHLEVBQUUsR0FBRztFQUNSLElBQUksRUFBRSxHQUFHO0NBQ1YsQ0FBQzs7QUFFRixJQUFJLFNBQVMsR0FBRztFQUNkLEdBQUcsRUFBRSxFQUFFO0VBQ1AsS0FBSyxFQUFFLEVBQUU7RUFDVCxHQUFHLEVBQUUsRUFBRTtFQUNQLEdBQUcsRUFBRSxFQUFFO0VBQ1AsTUFBTSxFQUFFLEVBQUU7RUFDVixHQUFHLEVBQUUsRUFBRTtFQUNQLElBQUksRUFBRSxFQUFFO0VBQ1IsT0FBTyxFQUFFLEVBQUU7RUFDWCxHQUFHLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxFQUFFO0VBQ3BC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QUFTLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUN2QixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNkLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDcEIsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNsQyxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUU7UUFDYixDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ1Q7U0FDSTtRQUNELFFBQVEsR0FBRztZQUNQLEtBQUssQ0FBQztnQkFDRixDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDbEMsTUFBTTtZQUNWLEtBQUssQ0FBQztnQkFDRixDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLE1BQU07WUFDVixLQUFLLENBQUM7Z0JBQ0YsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixNQUFN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SSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNwRDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDakU7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNwRDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDakU7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNwRDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDakU7SUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPO1lBQ0gsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLEVBQUUsS0FBSyxHQUFHLE1BQU0sR0FBRyxNQUFNO1NBQ2xDLENBQUM7S0FDTDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU87WUFDSCxDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLEVBQUUsS0FBSyxHQUFHLE1BQU0sR0FBRyxLQUFLO1NBQ2pDLENBQUM7S0FDTDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU87WUFDSCxDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUMsRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxDQUFDLEVBQUUsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLEVBQUUsS0FBSyxHQUFHLE1BQU0sR0FBRyxNQUFNO1NBQ2xDLENBQUM7S0FDTDtJQUNELEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxJQUFJLEtBQUssRUFBRTtRQUNQLE9BQU87WUFDSCxDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUMsRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FB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QUFHLEdBQUcsQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUMxQixJQUFJLEtBQUssSUFBSSxPQUFPLEVBQUU7WUFDbEIsQ0FBQyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckI7YUFDSTtZQUNELENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDOUM7UUFDRCxJQUFJLEtBQUssSUFBSSxPQUFPLEVBQUU7WUFDbEIsQ0FBQyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckI7YUFDSTtZQUNELENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDOUM7UUFDRCxJQUFJLEtBQUssSUFBSSxPQUFPLEVBQUU7WUFDbEIsQ0FBQyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckI7YUFDSTtZQUNELENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDOUM7UUFDRCxPQUFPLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0tBQy9DOzs7Ozs7SUFNRCxRQUFRLENBQUMsS0FBSyxFQUFFO1FBQ1osSUFBSSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzdDLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7Ozs7SUFJRCxLQUFLLEdBQUc7UUFDSixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDNUQ7Ozs7O0lBS0QsV0FBVyxHQUFHO1FBQ1YsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEc7Ozs7SUFJRCxLQUFLLEdBQUc7UUFDSixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDNUQ7Ozs7O0lBS0QsV0FBVyxHQUFHO1FBQ1YsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDbEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEc7Ozs7O0lBS0QsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLEVBQUU7UUFDdEIsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdkQ7Ozs7O0lBS0QsV0FBVyxDQUFD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
