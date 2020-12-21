/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';

export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

export const useStateWithPersistence = ( keyName, fallback ) => {
	let defaultValue;
	try {
		defaultValue = JSON.parse( localStorage.getItem( `newspack_${ keyName }` ) );
	} catch ( e ) {}
	const [ value, setValue ] = useState( defaultValue || fallback );
	return [
		value,
		newValue => {
			setValue( newValue );
			localStorage.setItem( `newspack_${ keyName }`, JSON.stringify( newValue ) );
		},
	];
};
