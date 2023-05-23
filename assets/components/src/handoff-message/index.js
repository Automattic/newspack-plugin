/**
 * WordPress dependencies.
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { HANDOFF_KEY } from '../consts';
import { Notice } from '../';

/**
 * Handoff Message Component.
 */
export default function HandoffMessage() {
	const [ handoffMessage, setHandoffMessage ] = useState( false );
	useEffect( () => {
		// Slight delay to allow for localStorage to be updated by RAS component.
		setTimeout( () => {
			const handoff = JSON.parse( localStorage.getItem( HANDOFF_KEY ) );
			if ( handoff?.message ) {
				setHandoffMessage( handoff.message );
			} else {
				setHandoffMessage( false );
			}
		}, 100 );
	}, [] );
	if ( ! handoffMessage ) return null;
	return <Notice isHandoff isDismissible={ false } rawHTML noticeText={ handoffMessage } />;
}
