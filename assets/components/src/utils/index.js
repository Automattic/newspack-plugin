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

/**
 * Debugging utility to log the current state. With text and background color,
 * font-size styling based on status type (error, warning, success, info). `isCollapsed` is used to collapse the log.
 */
export const debug = ( label, state, status = 'info', size = 's', isCollapsed = false ) => {
	const color = {
		error: 'red',
		warning: 'orange',
		success: 'green',
		info: 'blue',
	}[ status ];
	const sizeMap = {
		s: '1em',
		m: '1.5em',
		l: '2em',
	};
	console[ isCollapsed ? 'groupCollapsed' : 'group' ](
		`%c${ label.toUpperCase() }`,
		`color: white; background-color: ${ color }; font-size: ${ sizeMap[ size ] };`
	);
	console.log( state );
	console.groupEnd();
};

export default {
	InteractiveDiv,
	confirmAction,
};
