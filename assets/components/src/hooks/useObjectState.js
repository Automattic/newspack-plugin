/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

import { merge } from 'lodash';

/**
 * A useState for an object.
 */
export default ( initial, callback ) => {
	const [ isAwaitingCallback, setIsAwaitingCallback ] = useState( false );
	const [ stateObject, setStateObject ] = useState( initial );

	const runUpdate = async ( update, { skipCallback } = {} ) => {
		setStateObject( _stateObject => merge( {}, _stateObject, update ) );
		if ( callback && ! skipCallback ) {
			setIsAwaitingCallback( true );
			await callback( update );
			setIsAwaitingCallback( false );
		}
	};

	const updateStateObject = ( keyOrUpdate, options ) => {
		if ( typeof keyOrUpdate === 'string' ) {
			return value => runUpdate( { [ keyOrUpdate ]: value }, options );
		}
		runUpdate( keyOrUpdate, options );
	};
	return [ stateObject, updateStateObject, isAwaitingCallback ];
};
