/**
 * WordPress dependencies.
 */
import { ENTER } from '@wordpress/keycodes';

const InteractiveDiv = ( { style = {}, ...props } ) => (
	<div
		tabIndex="0"
		role="button"
		onKeyDown={ event => ENTER === event.keyCode && props.onClick() }
		style={ { cursor: 'pointer', ...style } }
		{ ...props }
	/>
);

const confirmAction = message => {
	// eslint-disable-next-line no-alert
	if ( confirm( message ) ) {
		return true;
	}
	return false;
};

/**
 * Is Empty Check for primitive and non-primitive data types.
 *
 * @param {any} data Value to check if empty
 * @return {boolean} True if data is empty, false otherwise
 */
export const isEmpty = data => {
	if ( Array.isArray( data ) ) {
		return data.length === 0;
	}
	if ( data instanceof Object ) {
		return Object.keys( data ).length === 0;
	}
	return ! Boolean( data );
};

export default {
	InteractiveDiv,
	confirmAction,
};
