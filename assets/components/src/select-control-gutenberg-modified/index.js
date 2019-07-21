import _extends from "@babel/runtime/helpers/esm/extends";
import _toConsumableArray from "@babel/runtime/helpers/esm/toConsumableArray";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import { createElement } from "@wordpress/element";

/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
/**
 * WordPress dependencies
 */

import { withInstanceId } from '@wordpress/compose';
/**
 * Internal dependencies
 */

// import BaseControl from '../base-control';
import BaseControl from './../../../../node_modules/@wordpress/components/build-module/base-control';

// function SelectControl(_ref) {
function SelectControlFunction(_ref) {
  var help = _ref.help,
      instanceId = _ref.instanceId,
      label = _ref.label,
      _ref$multiple = _ref.multiple,
      multiple = _ref$multiple === void 0 ? false : _ref$multiple,
      onChange = _ref.onChange,
      _ref$options = _ref.options,
      options = _ref$options === void 0 ? [] : _ref$options,
      className = _ref.className,
      props = _objectWithoutProperties(_ref, ["help", "instanceId", "label", "multiple", "onChange", "options", "className"]);

  var id = "inspector-select-control-".concat(instanceId);

  var onChangeValue = function onChangeValue(event) {
    if (multiple) {
      var selectedOptions = _toConsumableArray(event.target.options).filter(function (_ref2) {
        var selected = _ref2.selected;
        return selected;
      });

      var newValues = selectedOptions.map(function (_ref3) {
        var value = _ref3.value;
        return value;
      });
      onChange(newValues);
      return;
    }

    onChange(event.target.value);
  }; // Disable reason: A select with an onchange throws a warning

  /* eslint-disable jsx-a11y/no-onchange */


  return !isEmpty(options) && createElement(BaseControl, {
    label: label,
    id: id,
    help: help,
    className: className
  }, createElement("select", _extends({
    id: id,
    className: "components-select-control__input",
    onChange: onChangeValue,
    "aria-describedby": !!help ? "".concat(id, "__help") : undefined,
    multiple: multiple
  }, props), options.map(function (option, index) {
    return createElement("option", {
      key: "".concat(option.label, "-").concat(option.value, "-").concat(index),
      value: option.value,
      disabled: option.disabled
    }, option.label);
  })));
  /* eslint-enable jsx-a11y/no-onchange */
}

// export default withInstanceId(SelectControl);
export const SelectControl = withInstanceId(SelectControlFunction);
//# sourceMappingURL=index.js.map