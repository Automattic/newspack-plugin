/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

import { merge } from 'lodash';

/**
 * A useState for an object.
 */
export default ( initial = {} ) => {
	const [ stateObject, setStateObject ] = useState( initial );

	const runUpdate = update => setStateObject( _stateObject => merge( {}, _stateObject, update ) );

	const updateStateObject = keyOrUpdate => {
		if ( typeof keyOrUpdate === 'string' ) {
			return value => runUpdate( { [ keyOrUpdate ]: value } );
		}
		runUpdate( keyOrUpdate );
	};
	return [ stateObject, updateStateObject ];
};
