(function(e, a) { for(var i in a) e[i] = a[i]; }(window, /******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"syndication": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./assets/wizards/syndication/index.js","commons"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/wizards/syndication/index.js":
/*!*********************************************!*\
  !*** ./assets/wizards/syndication/index.js ***!
  \*********************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\");\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\");\n/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\");\n/* harmony import */ var _babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/createSuper */ \"./node_modules/@babel/runtime/helpers/createSuper.js\");\n/* harmony import */ var _babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _shared_js_public_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../shared/js/public-path */ \"./assets/shared/js/public-path.js\");\n/* harmony import */ var _shared_js_public_path__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_shared_js_public_path__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var _components_src__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../components/src */ \"./assets/components/src/index.js\");\n/* harmony import */ var _components_src_proxied_imports_router__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../components/src/proxied-imports/router */ \"./assets/components/src/proxied-imports/router.js\");\n/* harmony import */ var _views__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./views */ \"./assets/wizards/syndication/views/index.js\");\n\n\n\n\n\n/**\n * Syndication\n */\n\n/**\n * WordPress dependencies.\n */\n\n\n\n/**\n * Internal dependencies.\n */\n\n\n\n\nvar HashRouter = _components_src_proxied_imports_router__WEBPACK_IMPORTED_MODULE_8__[\"default\"].HashRouter,\n    Redirect = _components_src_proxied_imports_router__WEBPACK_IMPORTED_MODULE_8__[\"default\"].Redirect,\n    Route = _components_src_proxied_imports_router__WEBPACK_IMPORTED_MODULE_8__[\"default\"].Route,\n    Switch = _components_src_proxied_imports_router__WEBPACK_IMPORTED_MODULE_8__[\"default\"].Switch;\n\nvar SyndicationWizard = /*#__PURE__*/function (_Component) {\n  _babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2___default()(SyndicationWizard, _Component);\n\n  var _super = _babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3___default()(SyndicationWizard);\n\n  function SyndicationWizard() {\n    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default()(this, SyndicationWizard);\n\n    return _super.apply(this, arguments);\n  }\n\n  _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default()(SyndicationWizard, [{\n    key: \"render\",\n    value:\n    /**\n     * Render\n     */\n    function render() {\n      var pluginRequirements = this.props.pluginRequirements;\n      return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"Fragment\"], null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(HashRouter, {\n        hashType: \"slash\"\n      }, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(Switch, null, pluginRequirements, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(Route, {\n        path: \"/\",\n        exact: true,\n        render: function render() {\n          return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(_views__WEBPACK_IMPORTED_MODULE_9__[\"Intro\"], {\n            headerText: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__[\"__\"])('Syndication', 'newspack'),\n            subHeaderText: 'Distribute your content across multiple websites'\n          });\n        }\n      }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(Redirect, {\n        to: \"/\"\n      }))));\n    }\n  }]);\n\n  return SyndicationWizard;\n}(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"Component\"]);\n\nObject(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"render\"])(Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__[\"createElement\"])(Object(_components_src__WEBPACK_IMPORTED_MODULE_7__[\"withWizard\"])(SyndicationWizard, ['fb-instant-articles', 'publish-to-apple-news'])), document.getElementById('newspack-syndication-wizard'));\n\n//# sourceURL=webpack:///./assets/wizards/syndication/index.js?");

/***/ }),

/***/ "./assets/wizards/syndication/views/index.js":
/*!***************************************************!*\
  !*** ./assets/wizards/syndication/views/index.js ***!
  \***************************************************/
/*! exports provided: Intro */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _intro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./intro */ \"./assets/wizards/syndication/views/intro/index.js\");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, \"Intro\", function() { return _intro__WEBPACK_IMPORTED_MODULE_0__[\"default\"]; });\n\n\n\n//# sourceURL=webpack:///./assets/wizards/syndication/views/index.js?");

/***/ }),

/***/ "./assets/wizards/syndication/views/intro/index.js":
/*!*********************************************************!*\
  !*** ./assets/wizards/syndication/views/intro/index.js ***!
  \*********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\");\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\");\n/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/inherits */ \"./node_modules/@babel/runtime/helpers/inherits.js\");\n/* harmony import */ var _babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/createSuper */ \"./node_modules/@babel/runtime/helpers/createSuper.js\");\n/* harmony import */ var _babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/element */ \"@wordpress/element\");\n/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ \"@wordpress/i18n\");\n/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _components_src__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../../components/src */ \"./assets/components/src/index.js\");\n\n\n\n\n\n\n/**\n * Syndication Intro View\n */\n\n/**\n * WordPress dependencies\n */\n\n\n/**\n * Internal dependencies\n */\n\n\n/**\n * Syndication Intro screen.\n */\n\nvar Intro = /*#__PURE__*/function (_Component) {\n  _babel_runtime_helpers_inherits__WEBPACK_IMPORTED_MODULE_2___default()(Intro, _Component);\n\n  var _super = _babel_runtime_helpers_createSuper__WEBPACK_IMPORTED_MODULE_3___default()(Intro);\n\n  function Intro() {\n    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default()(this, Intro);\n\n    return _super.apply(this, arguments);\n  }\n\n  _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default()(Intro, [{\n    key: \"render\",\n    value:\n    /**\n     * Render.\n     */\n    function render() {\n      return Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__[\"createElement\"])(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__[\"Fragment\"], null, Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__[\"createElement\"])(_components_src__WEBPACK_IMPORTED_MODULE_6__[\"ActionCard\"], {\n        title: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__[\"__\"])('Apple News'),\n        description: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__[\"__\"])('Export and sync posts to Apple format.'),\n        actionText: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__[\"__\"])('Configure'),\n        handoff: \"publish-to-apple-news\"\n      }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__[\"createElement\"])(_components_src__WEBPACK_IMPORTED_MODULE_6__[\"ActionCard\"], {\n        title: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__[\"__\"])('Facebook Instant Articles'),\n        description: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__[\"__\"])('Add support for Instant Articles for Facebook to your WordPress site.'),\n        actionText: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__[\"__\"])('Configure'),\n        handoff: \"fb-instant-articles\"\n      }), Object(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__[\"createElement\"])(_components_src__WEBPACK_IMPORTED_MODULE_6__[\"PluginToggle\"], {\n        plugins: {\n          distributor: true\n        }\n      }));\n    }\n  }]);\n\n  return Intro;\n}(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__[\"Component\"]);\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Object(_components_src__WEBPACK_IMPORTED_MODULE_6__[\"withWizardScreen\"])(Intro));\n\n//# sourceURL=webpack:///./assets/wizards/syndication/views/intro/index.js?");

/***/ }),

/***/ "@wordpress/api-fetch":
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"apiFetch\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22apiFetch%22%5D?");

/***/ }),

/***/ "@wordpress/components":
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"components\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22components%22%5D?");

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"element\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22element%22%5D?");

/***/ }),

/***/ "@wordpress/html-entities":
/*!**************************************!*\
  !*** external ["wp","htmlEntities"] ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"htmlEntities\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22htmlEntities%22%5D?");

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"i18n\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22i18n%22%5D?");

/***/ }),

/***/ "@wordpress/keycodes":
/*!**********************************!*\
  !*** external ["wp","keycodes"] ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"keycodes\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22keycodes%22%5D?");

/***/ }),

/***/ "@wordpress/primitives":
/*!************************************!*\
  !*** external ["wp","primitives"] ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"primitives\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22primitives%22%5D?");

/***/ }),

/***/ "@wordpress/url":
/*!*****************************!*\
  !*** external ["wp","url"] ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"wp\"][\"url\"]; }());\n\n//# sourceURL=webpack:///external_%5B%22wp%22,%22url%22%5D?");

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"lodash\"]; }());\n\n//# sourceURL=webpack:///external_%22lodash%22?");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("(function() { module.exports = window[\"React\"]; }());\n\n//# sourceURL=webpack:///external_%22React%22?");

/***/ })

/******/ })));