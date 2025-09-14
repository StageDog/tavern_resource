import { compare } from "https://testingcf.jsdelivr.net/npm/compare-versions/+esm";
import { createPinia, defineStore, storeToRefs } from "https://testingcf.jsdelivr.net/npm/pinia/+esm";
/******/ var __webpack_modules__ = ({

/***/ 99:
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ 141:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(876);
if(content.__esModule) content = content.default;
if(typeof content === 'string') content = [[module.id, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var add = (__webpack_require__(424)/* ["default"] */ .A)
var update = add("ee3cdd88", content, false, {"ssrId":true});
// Hot Module Replacement
if(false) // removed by dead control flow
{}

/***/ }),

/***/ 226:
/***/ ((module) => {



module.exports = function (i) {
  return i[1];
};

/***/ }),

/***/ 341:
/***/ ((__unused_webpack_module, exports) => {

var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
// runtime helper for setting properties on components
// in a tree-shakable way
exports.A = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
        target[key] = val;
    }
    return target;
};


/***/ }),

/***/ 424:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ addStylesClient)
});

;// ./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/listToStyles.js
/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}

;// ./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/addStylesClient.js
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/



var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}
var options = null
var ssrIdKey = 'data-vue-ssr-id'

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

function addStylesClient (parentId, list, _isProduction, _options) {
  isProduction = _isProduction

  options = _options || {}

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[' + ssrIdKey + '~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }
  if (options.ssrId) {
    styleElement.setAttribute(ssrIdKey, obj.id)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),

/***/ 876:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(226);
/* harmony import */ var _node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(99);
/* harmony import */ var _node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_pnpm_css_loader_7_1_2_webpack_5_101_3_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.input_helper_block[data-v-4b4e7a61]{margin-bottom:10px}.input_helper_block label[data-v-4b4e7a61]{margin-left:5px}.integrated_button_settings[data-v-4b4e7a61]{display:flex;flex-direction:column;gap:5px;margin-top:5px}.integrated-button-row[data-v-4b4e7a61]{display:flex;align-items:center;padding:5px 8px;border:1px solid var(--SmartThemeBorderColor);border-radius:5px;background-color:rgba(30,30,30,.3);cursor:default;transition:background-color .2s,transform .1s}.integrated-button-row input[type=checkbox][data-v-4b4e7a61]{margin-right:8px}.integrated-button-row label[data-v-4b4e7a61]{flex-grow:1;margin-right:10px}.integrated-button-row.sortable-helper[data-v-4b4e7a61]{background-color:rgba(50,50,80,.6);transform:scale(1.02);box-shadow:0 4px 8px rgba(0,0,0,.3)}.integrated-button-row.sortable-placeholder[data-v-4b4e7a61]{visibility:visible !important;background-color:rgba(30,30,50,.3);border:1px dashed var(--SmartThemeBorderColor);height:38px}.button-preview[data-v-4b4e7a61]{width:40px;height:25px;display:flex;align-items:center;justify-content:center;background-color:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:5px;margin-right:8px;filter:grayscale(0.5);font-family:var(--mainFontFamily)}.note[data-v-4b4e7a61]{font-size:12px;color:var(--SmartThemeEmColor);margin-bottom:8px;font-style:italic}.edit-button[data-v-4b4e7a61],.delete-button[data-v-4b4e7a61]{background:none;border:none;font-size:16px;cursor:pointer;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;margin-right:5px;opacity:.7;transition:opacity .2s}.edit-button[data-v-4b4e7a61]:hover,.delete-button[data-v-4b4e7a61]:hover{opacity:1}.delete-button[data-v-4b4e7a61]{color:rgba(255,80,80,.9)}.add_button[data-v-4b4e7a61]{width:100%;margin:10px 0;padding:8px}.drag-handle[data-v-4b4e7a61]{cursor:grab;margin-right:8px;color:var(--SmartThemeEmColor);opacity:.6;transition:opacity .3s}.drag-handle[data-v-4b4e7a61]:hover{opacity:1}.drag-handle[data-v-4b4e7a61]:active{cursor:grabbing}.modal-overlay[data-v-4b4e7a61]{position:fixed;inset:0;width:100%;height:100vh;background-color:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999}.modal-content[data-v-4b4e7a61]{background-color:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:20px;min-width:300px;max-width:90vw;max-height:90vh;overflow-y:auto}.modal-content h3[data-v-4b4e7a61]{margin:0 0 15px 0;color:var(--SmartThemeBodyColor)}.form-group[data-v-4b4e7a61]{margin-bottom:15px;display:flex;align-items:center;gap:10px}.form-group label[data-v-4b4e7a61]{flex-shrink:0;min-width:90px;color:var(--SmartThemeBodyColor);font-weight:500}.form-group input[type=text][data-v-4b4e7a61],.form-group input[type=number][data-v-4b4e7a61]{flex:1;padding:8px 12px;border:1px solid var(--SmartThemeBorderColor);border-radius:4px;background-color:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:14px}.form-group input[type=text][data-v-4b4e7a61]:focus,.form-group input[type=number][data-v-4b4e7a61]:focus{outline:none;border-color:var(--SmartThemeEmColor)}.form-group input[type=checkbox][data-v-4b4e7a61]{margin-right:8px;transform:scale(1.2)}.form-group select[data-v-4b4e7a61]{flex:1;padding:8px 12px;border:1px solid var(--SmartThemeBorderColor);border-radius:4px;background-color:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor);font-size:14px;cursor:pointer}.form-group select[data-v-4b4e7a61]:focus{outline:none;border-color:var(--SmartThemeEmColor)}.form-group select option[data-v-4b4e7a61]{background-color:var(--SmartThemeBlurTintColor);color:var(--SmartThemeBodyColor)}.form-group .cursor-position-wrapper[data-v-4b4e7a61]{display:flex;gap:8px;align-items:center}.form-group .cursor-position-wrapper select[data-v-4b4e7a61]{flex:1;min-width:0}.form-group .cursor-position-wrapper .custom-cursor-input[data-v-4b4e7a61]{width:100px;flex-shrink:0}.modal-buttons[data-v-4b4e7a61]{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}.modal-buttons button[data-v-4b4e7a61]{padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;transition:background-color .2s}.modal-buttons button.button-cancel[data-v-4b4e7a61]{background-color:rgba(0,0,0,0);border:1px solid var(--SmartThemeBorderColor);color:var(--SmartThemeBodyColor)}.modal-buttons button.button-cancel[data-v-4b4e7a61]:hover{background-color:hsla(0,0%,100%,.1)}.modal-buttons button.button-save[data-v-4b4e7a61]{background-color:rgba(0,0,0,0);border:1px solid var(--SmartThemeBorderColor);color:var(--SmartThemeBodyColor)}.modal-buttons button.button-save[data-v-4b4e7a61]:hover{background-color:hsla(0,0%,100%,.1)}`, ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		id: moduleId,
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// external "Vue"
const external_Vue_namespaceObject = Vue;
;// external "https://testingcf.jsdelivr.net/npm/compare-versions/+esm"

;// ./src/util.ts

function assign_inplace(destination, new_array) {
    destination.length = 0;
    destination.push(...new_array);
    return destination;
}
function chunk_by(array, predicate) {
    if (array.length === 0) {
        return [];
    }
    const chunks = [[array[0]]];
    for (const [lhs, rhs] of _.zip(_.drop(array), _.dropRight(array))) {
        if (predicate(lhs, rhs)) {
            chunks[chunks.length - 1].push(lhs);
        }
        else {
            chunks.push([lhs]);
        }
    }
    return chunks;
}
async function check_minimum_version(expected, title) {
    if (compare(await getTavernHelperVersion(), expected, '<')) {
        toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
    }
}
async function load_readme(url) {
    const readme = await fetch(url);
    if (!readme.ok) {
        return false;
    }
    const readme_text = await readme.text();
    replaceScriptInfo(readme_text);
    return true;
}
function teleport_style() {
    if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) {
        return;
    }
    const $div = $(`<div>`).attr('script_id', getScriptId()).append($(`head > style`, document).clone());
    $('head').append($div);
}
function deteleport_style() {
    $(`head > div[script_id="${getScriptId()}"]`).remove();
}

;// external "https://testingcf.jsdelivr.net/npm/pinia/+esm"

;// ./src/酒馆助手/输入助手/type.ts
const Button = z.object({
    name: z.string(),
    enable: z.boolean(),
    description: z.string(),
    content: z.string(),
    cursor_position: z.number(),
    insert_position: z.enum(['prepend', 'as_is', 'append', 'newline']),
});
const Settings = z.object({
    buttons: z.array(Button).default([
        {
            name: '**',
            enable: true,
            description: '星号之间',
            content: '**',
            cursor_position: 1,
            insert_position: 'as_is',
        },
        {
            name: '“”',
            enable: true,
            description: '双引号之间',
            content: '“”',
            cursor_position: 1,
            insert_position: 'as_is',
        },
        {
            name: '（）',
            enable: true,
            description: '圆括号之间',
            content: '（）',
            cursor_position: 1,
            insert_position: 'as_is',
        },
        {
            name: '「」',
            enable: true,
            description: '直角单开引号之间',
            content: '「」',
            cursor_position: 1,
            insert_position: 'as_is',
        },
        {
            name: '『』',
            enable: true,
            description: '直角双开引号之间',
            content: '『』',
            cursor_position: 1,
            insert_position: 'as_is',
        },
        {
            name: '《》',
            enable: true,
            description: '书名号之间',
            content: '《》',
            cursor_position: 1,
            insert_position: 'as_is',
        },
        {
            name: '⇤',
            enable: true,
            description: '移到行首',
            content: '',
            cursor_position: 0,
            insert_position: 'prepend',
        },
        {
            name: '⇥',
            enable: true,
            description: '移到行尾',
            content: '',
            cursor_position: 0,
            insert_position: 'append',
        },
        {
            name: '⏎',
            enable: true,
            description: '换行',
            content: '\n',
            cursor_position: 0,
            insert_position: 'append',
        },
        {
            name: 'user',
            enable: true,
            description: '用户标记',
            content: '<user>',
            cursor_position: 6,
            insert_position: 'as_is',
        },
        {
            name: 'char',
            enable: true,
            description: '角色标记',
            content: '<char>',
            cursor_position: 6,
            insert_position: 'as_is',
        },
    ]),
});

;// ./src/酒馆助手/输入助手/settings.ts



const use_settings_store = defineStore('settings', () => {
    const settings = (0,external_Vue_namespaceObject.ref)(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
    (0,external_Vue_namespaceObject.watchEffect)(() => {
        replaceVariables(_.cloneDeep(settings.value), { type: 'script', script_id: getScriptId() });
    });
    return {
        settings,
    };
});

;// ./node_modules/.pnpm/ts-loader@9.5.4_typescript@6.0.0-dev.20250807_webpack@5.101.3/node_modules/ts-loader/index.js??clonedRuleSet-72!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.21_typescript@6.0.0-dev.20250807__webpack@5.101.3/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[4].use[0]!./src/酒馆助手/输入助手/panel.vue?vue&type=script&setup=true&lang=ts


const _hoisted_1 = { class: "inline-drawer" };
const _hoisted_2 = { class: "inline-drawer-content" };
const _hoisted_3 = { class: "integrated_button_settings" };
const _hoisted_4 = ["data-original-index"];
const _hoisted_5 = ["onUpdate:modelValue"];
const _hoisted_6 = { class: "button-preview" };
const _hoisted_7 = ["for"];
const _hoisted_8 = ["data-index", "onClick"];
const _hoisted_9 = ["data-index", "onClick"];
const _hoisted_10 = { class: "form-group" };
const _hoisted_11 = { class: "form-group" };
const _hoisted_12 = { class: "form-group" };
const _hoisted_13 = { class: "form-group" };
const _hoisted_14 = { class: "form-group" };
const _hoisted_15 = {
    key: 1,
    class: "cursor-position-wrapper"
};



/* harmony default export */ const panelvue_type_script_setup_true_lang_ts = (/*@__PURE__*/(0,external_Vue_namespaceObject.defineComponent)({
    __name: 'panel',
    setup(__props) {
        const { settings } = storeToRefs(use_settings_store());
        const modal = (0,external_Vue_namespaceObject.ref)({
            show: false,
            title: '',
            editing_index: -1,
            form_data: {
                name: '',
                description: '',
                content: '',
                insert_position: 'as_is',
                cursor_position: 0,
            },
            cursor_position_type: 'middle',
        });
        const modal_teleport = $('body')[0];
        function update_button_indices() {
            (0,external_Vue_namespaceObject.nextTick)(() => {
                $('.integrated-button-row').each(function (index) {
                    $(this).attr('data-original-index', index);
                    $(this).find('.edit-button, .delete-button').attr('data-index', index);
                });
            });
        }
        async function delete_button(index) {
            const result = await SillyTavern.callGenericPopup(`确定要删除按钮 '${settings.value.buttons[index].name}' 吗? 此操作无法撤销`, SillyTavern.POPUP_TYPE.CONFIRM);
            if (result) {
                settings.value.buttons.splice(index, 1);
                update_button_indices();
            }
        }
        function add_button() {
            modal.value.title = '添加按钮';
            modal.value.editing_index = -1;
            modal.value.form_data = {
                name: '',
                description: '',
                content: '',
                cursor_position: 0,
                insert_position: 'as_is',
            };
            modal.value.cursor_position_type = 'end';
            modal.value.show = true;
        }
        function edit_button(index) {
            modal.value.title = '编辑按钮';
            modal.value.editing_index = index;
            const button = settings.value.buttons[index];
            modal.value.form_data.name = button.name;
            modal.value.form_data.description = button.description;
            modal.value.form_data.content = button.content;
            modal.value.form_data.cursor_position = button.cursor_position;
            modal.value.form_data.insert_position = button.insert_position;
            const get_position_type = () => {
                switch (button.cursor_position) {
                    case 0:
                        return 'begin';
                    case Math.floor(button.content.length / 2):
                        return 'middle';
                    case button.content.length:
                        return 'end';
                    default:
                        return 'custom';
                }
            };
            modal.value.cursor_position_type = get_position_type();
            modal.value.form_data.cursor_position = modal.value.form_data.cursor_position;
            modal.value.show = true;
        }
        function close_modal() {
            modal.value.show = false;
        }
        function save_button() {
            if (modal.value.form_data.name === '') {
                return;
            }
            const get_position_number = () => {
                switch (modal.value.cursor_position_type) {
                    case 'begin':
                        return 0;
                    case 'middle':
                        return Math.floor(modal.value.form_data.content.length / 2);
                    case 'end':
                        return modal.value.cursor_position_type.length;
                    case 'custom':
                        return modal.value.form_data.cursor_position;
                    default:
                        return 0;
                }
            };
            const cursor_position = get_position_number();
            const button = {
                name: modal.value.form_data.name,
                enable: settings.value.buttons.at(modal.value.editing_index)?.enable ?? true,
                description: modal.value.form_data.description,
                content: modal.value.form_data.content,
                insert_position: modal.value.form_data.insert_position,
                cursor_position: cursor_position,
            };
            if (modal.value.editing_index === -1) {
                settings.value.buttons.push(button);
            }
            else {
                settings.value.buttons[modal.value.editing_index] = button;
            }
            close_modal();
            update_button_indices();
        }
        (0,external_Vue_namespaceObject.onMounted)(() => {
            (0,external_Vue_namespaceObject.nextTick)(() => {
                $('.integrated_button_settings').sortable({
                    handle: '.drag-handle',
                    placeholder: 'sortable-placeholder',
                    cursor: 'move',
                    tolerance: 'pointer',
                    update: function (_event, ui) {
                        const item = ui.item;
                        const old_index = item.data('original-index');
                        let new_index = item.index();
                        const button_to_move = settings.value.buttons[old_index];
                        settings.value.buttons.splice(old_index, 1);
                        settings.value.buttons.splice(new_index, 0, button_to_move);
                        update_button_indices();
                    },
                    start: function (_event, ui) {
                        ui.helper.addClass('sortable-helper');
                    },
                    stop: function (_event, ui) {
                        ui.item.removeClass('sortable-helper');
                    },
                });
            });
        });
        return (_ctx, _cache) => {
            return ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", _hoisted_1, [
                _cache[18] || (_cache[18] = (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "inline-drawer-toggle inline-drawer-header" }, [
                    (0,external_Vue_namespaceObject.createElementVNode)("b", null, "输入助手"),
                    (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "inline-drawer-icon fa-solid fa-circle-chevron-down down" })
                ], -1 /* CACHED */)),
                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_2, [
                    _cache[9] || (_cache[9] = (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "input_helper_block" }, [
                        (0,external_Vue_namespaceObject.createElementVNode)("b", null, "按钮管理"),
                        (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "note" }, "管理按钮显示和快捷键，点击输入框并按下键盘组合可设置快捷键"),
                        (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "note" }, "拖动排序按钮调整工具栏中的显示顺序")
                    ], -1 /* CACHED */)),
                    (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_3, [
                        ((0,external_Vue_namespaceObject.openBlock)(true), (0,external_Vue_namespaceObject.createElementBlock)(external_Vue_namespaceObject.Fragment, null, (0,external_Vue_namespaceObject.renderList)((0,external_Vue_namespaceObject.unref)(settings).buttons, (button, index) => {
                            return ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", {
                                key: button.name,
                                "data-original-index": index,
                                class: "integrated-button-row"
                            }, [
                                _cache[8] || (_cache[8] = (0,external_Vue_namespaceObject.createElementVNode)("span", { class: "drag-handle menu-handle" }, "☰", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    "onUpdate:modelValue": ($event) => ((button.enable) = $event),
                                    type: "checkbox"
                                }, null, 8 /* PROPS */, _hoisted_5), [
                                    [external_Vue_namespaceObject.vModelCheckbox, button.enable]
                                ]),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_6, (0,external_Vue_namespaceObject.toDisplayString)(button.name), 1 /* TEXT */),
                                (0,external_Vue_namespaceObject.createElementVNode)("label", {
                                    for: button.description
                                }, (0,external_Vue_namespaceObject.toDisplayString)(button.description), 9 /* TEXT, PROPS */, _hoisted_7),
                                (0,external_Vue_namespaceObject.createElementVNode)("button", {
                                    class: "edit-button fa-solid fa-pencil fa-xs",
                                    "data-index": index,
                                    onClick: ($event) => (edit_button(index))
                                }, null, 8 /* PROPS */, _hoisted_8),
                                (0,external_Vue_namespaceObject.createElementVNode)("button", {
                                    class: "delete-button fa-solid fa-trash fa-xs",
                                    "data-index": index,
                                    onClick: ($event) => (delete_button(index))
                                }, null, 8 /* PROPS */, _hoisted_9)
                            ], 8 /* PROPS */, _hoisted_4));
                        }), 128 /* KEYED_FRAGMENT */))
                    ]),
                    (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "input_helper_block" }, [
                        (0,external_Vue_namespaceObject.createElementVNode)("button", {
                            class: "add_button menu_button",
                            onClick: add_button
                        }, "添加按钮")
                    ])
                ]),
                ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createBlock)(external_Vue_namespaceObject.Teleport, { to: (0,external_Vue_namespaceObject.unref)(modal_teleport) }, [
                    (modal.value.show)
                        ? ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", {
                            key: 0,
                            class: "modal-overlay",
                            onClick: close_modal
                        }, [
                            (0,external_Vue_namespaceObject.createElementVNode)("div", {
                                class: "modal-content",
                                onClick: _cache[7] || (_cache[7] = (0,external_Vue_namespaceObject.withModifiers)(() => { }, ["stop"]))
                            }, [
                                (0,external_Vue_namespaceObject.createElementVNode)("h3", null, (0,external_Vue_namespaceObject.toDisplayString)(modal.value.title), 1 /* TEXT */),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_10, [
                                    _cache[10] || (_cache[10] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "button-name" }, "显示名称:", -1 /* CACHED */)),
                                    (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                        id: "button-name",
                                        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => ((modal.value.form_data.name) = $event)),
                                        type: "text",
                                        placeholder: "请输入按钮名称"
                                    }, null, 512 /* NEED_PATCH */), [
                                        [external_Vue_namespaceObject.vModelText, modal.value.form_data.name]
                                    ])
                                ]),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_11, [
                                    _cache[11] || (_cache[11] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "button-description" }, "描述:", -1 /* CACHED */)),
                                    (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                        id: "button-description",
                                        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => ((modal.value.form_data.description) = $event)),
                                        type: "text",
                                        placeholder: "请输入按钮描述"
                                    }, null, 512 /* NEED_PATCH */), [
                                        [external_Vue_namespaceObject.vModelText, modal.value.form_data.description]
                                    ])
                                ]),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_12, [
                                    _cache[12] || (_cache[12] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "button-content" }, "内容:", -1 /* CACHED */)),
                                    (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                        id: "button-content",
                                        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => ((modal.value.form_data.content) = $event)),
                                        type: "text",
                                        placeholder: "请输入按钮内容"
                                    }, null, 512 /* NEED_PATCH */), [
                                        [external_Vue_namespaceObject.vModelText, modal.value.form_data.content]
                                    ])
                                ]),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_13, [
                                    _cache[14] || (_cache[14] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "button-insert-method" }, "插入位置:", -1 /* CACHED */)),
                                    (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("select", {
                                        id: "button-insert-method",
                                        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => ((modal.value.form_data.insert_position) = $event))
                                    }, [...(_cache[13] || (_cache[13] = [
                                            (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "prepend" }, "当前行开头", -1 /* CACHED */),
                                            (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "as_is" }, "当前光标位置", -1 /* CACHED */),
                                            (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "append" }, "当前行结尾", -1 /* CACHED */),
                                            (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "newline" }, "下一行", -1 /* CACHED */)
                                        ]))], 512 /* NEED_PATCH */), [
                                        [external_Vue_namespaceObject.vModelSelect, modal.value.form_data.insert_position]
                                    ])
                                ]),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_14, [
                                    _cache[17] || (_cache[17] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "button-position" }, "插入后光标:", -1 /* CACHED */)),
                                    (modal.value.cursor_position_type !== 'custom')
                                        ? (0,external_Vue_namespaceObject.withDirectives)(((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("select", {
                                            key: 0,
                                            id: "button-position",
                                            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => ((modal.value.cursor_position_type) = $event))
                                        }, [...(_cache[15] || (_cache[15] = [
                                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "begin" }, "内容开头", -1 /* CACHED */),
                                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "middle" }, "内容中间", -1 /* CACHED */),
                                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "end" }, "内容结尾", -1 /* CACHED */),
                                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "custom" }, "自定义", -1 /* CACHED */)
                                            ]))], 512 /* NEED_PATCH */)), [
                                            [external_Vue_namespaceObject.vModelSelect, modal.value.cursor_position_type]
                                        ])
                                        : (0,external_Vue_namespaceObject.createCommentVNode)("v-if", true),
                                    (modal.value.cursor_position_type === 'custom')
                                        ? ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", _hoisted_15, [
                                            (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("select", {
                                                id: "button-position",
                                                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => ((modal.value.cursor_position_type) = $event))
                                            }, [...(_cache[16] || (_cache[16] = [
                                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "begin" }, "内容开头", -1 /* CACHED */),
                                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "middle" }, "内容中间", -1 /* CACHED */),
                                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "end" }, "内容结尾", -1 /* CACHED */),
                                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "custom" }, "自定义", -1 /* CACHED */)
                                                ]))], 512 /* NEED_PATCH */), [
                                                [external_Vue_namespaceObject.vModelSelect, modal.value.cursor_position_type]
                                            ]),
                                            (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                                id: "custom-cursor-position",
                                                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => ((modal.value.form_data.cursor_position) = $event)),
                                                type: "number",
                                                min: "0",
                                                placeholder: "位置数字",
                                                class: "custom-cursor-input"
                                            }, null, 512 /* NEED_PATCH */), [
                                                [
                                                    external_Vue_namespaceObject.vModelText,
                                                    modal.value.form_data.cursor_position,
                                                    void 0,
                                                    { number: true }
                                                ]
                                            ])
                                        ]))
                                        : (0,external_Vue_namespaceObject.createCommentVNode)("v-if", true)
                                ]),
                                (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "modal-buttons" }, [
                                    (0,external_Vue_namespaceObject.createElementVNode)("button", {
                                        class: "button-cancel",
                                        onClick: close_modal
                                    }, "取消"),
                                    (0,external_Vue_namespaceObject.createElementVNode)("button", {
                                        class: "button-save",
                                        onClick: save_button
                                    }, "保存")
                                ])
                            ])
                        ]))
                        : (0,external_Vue_namespaceObject.createCommentVNode)("v-if", true)
                ], 8 /* PROPS */, ["to"]))
            ]));
        };
    }
}));

;// ./src/酒馆助手/输入助手/panel.vue?vue&type=script&setup=true&lang=ts
 
// EXTERNAL MODULE: ./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/index.js??clonedRuleSet-74.use[0]!./node_modules/.pnpm/css-loader@7.1.2_webpack@5.101.3/node_modules/css-loader/dist/cjs.js??clonedRuleSet-74.use[1]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.21_typescript@6.0.0-dev.20250807__webpack@5.101.3/node_modules/vue-loader/dist/stylePostLoader.js!./node_modules/.pnpm/postcss-loader@8.2.0_postcss@8.5.6_typescript@6.0.0-dev.20250807_webpack@5.101.3/node_modules/postcss-loader/dist/cjs.js!./node_modules/.pnpm/sass-loader@16.0.5_sass@1.92.1_webpack@5.101.3/node_modules/sass-loader/dist/cjs.js!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.21_typescript@6.0.0-dev.20250807__webpack@5.101.3/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[4].use[0]!./src/酒馆助手/输入助手/panel.vue?vue&type=style&index=0&id=4b4e7a61&lang=scss&scoped=true
var panelvue_type_style_index_0_id_4b4e7a61_lang_scss_scoped_true = __webpack_require__(141);
;// ./src/酒馆助手/输入助手/panel.vue?vue&type=style&index=0&id=4b4e7a61&lang=scss&scoped=true

// EXTERNAL MODULE: ./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.21_typescript@6.0.0-dev.20250807__webpack@5.101.3/node_modules/vue-loader/dist/exportHelper.js
var exportHelper = __webpack_require__(341);
;// ./src/酒馆助手/输入助手/panel.vue



;


const __exports__ = /*#__PURE__*/(0,exportHelper/* default */.A)(panelvue_type_script_setup_true_lang_ts, [['__scopeId',"data-v-4b4e7a61"]])

/* harmony default export */ const panel = (__exports__);
;// ./src/酒馆助手/输入助手/panel.ts




const app = (0,external_Vue_namespaceObject.createApp)(panel);
function init_panel() {
    teleport_style();
    const $app = $('<div>').attr('script_id', getScriptId());
    $('#extensions_settings2').append($app);
    app.use(createPinia()).mount($app[0]);
}
function destroy_panel() {
    app.unmount();
    $(`#extensions_settings2 > div[script_id="${getScriptId()}"]`).remove();
    deteleport_style();
}

;// ./src/酒馆助手/输入助手/index.ts




function click_button(button) {
    const $textarea = $('#send_textarea');
    const text = $textarea.val();
    const { start_position, end_position } = (() => {
        let start = $textarea.prop('selectionStart');
        let end = $textarea.prop('selectionEnd');
        switch (button.insert_position) {
            case 'prepend': {
                const previous_newline_position = text.lastIndexOf('\n', start);
                start = end = previous_newline_position === -1 ? 0 : previous_newline_position;
                break;
            }
            case 'as_is':
                break;
            case 'append':
            case 'newline': {
                const next_newline_position = text.indexOf('\n', end);
                start = end = next_newline_position === -1 ? text.length : next_newline_position;
                break;
            }
        }
        return { start_position: start, end_position: end };
    })();
    $textarea.val(text.substring(0, start_position) +
        (button.insert_position === 'newline' ? '\n' : '') +
        button.content +
        text.substring(end_position));
    setTimeout(() => {
        const cursor_position = start_position +
            _.clamp(button.cursor_position, 0, button.content.length) +
            (button.insert_position === 'newline' ? 1 : 0);
        $textarea.prop('selectionStart', cursor_position);
        $textarea.prop('selectionEnd', cursor_position);
        $textarea.trigger('focus');
    });
}
function rebind_buttons(buttons) {
    replaceScriptButtons(buttons.map(button => ({
        name: button.name,
        visible: true,
    })));
    eventClearAll();
    buttons.forEach(button => {
        eventOn(getButtonEvent(button.name), () => click_button(button));
    });
}
$(() => {
    check_minimum_version('3.4.19', '输入助手');
    load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/输入助手/README.md');
    init_panel();
    const settings_store = use_settings_store();
    (0,external_Vue_namespaceObject.watchEffect)(() => {
        rebind_buttons(settings_store.settings.buttons.filter(button => button.enable));
    });
});
$(window).on('pagehide', () => {
    destroy_panel();
    replaceScriptButtons([]);
});

