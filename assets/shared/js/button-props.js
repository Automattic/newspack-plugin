/**
 * Internal dependencies
 */
import { isFunction, isString, isObject } from 'lodash';

export default function buttonProps( action ) {
	const props = {};
	if ( isFunction( action ) ) {
		props.onClick = action;
	}
	if ( isString( action ) ) {
		props.href = action;
	}
	return props;
}
