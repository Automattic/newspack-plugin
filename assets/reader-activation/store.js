/* globals newspack_reader_data */
window.newspack_reader_data = window.newspack_reader_data || {};

import { EVENTS, emit } from './events';

const config = {
	storePrefix: 'np_reader_',
	storage: window.localStorage,
	collections: {
		// Configuration of collections that are created through store.add().
		maxItems: 1000, // Maximum number of items in a collection.
		maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days, maximum age of a collection item if 'timestamp' is set.
	},
};

/**
 * Queue of requests to sync with the polling strategy.
 */
const syncRequests = [];

/**
 * Get store item key
 *
 * @param {string}  key      Key to get.
 * @param {boolean} internal Whether it's an internal value.
 *
 * @return {string} Store item key.
 */
export function getStoreItemKey( key, internal = false ) {
	if ( ! key ) {
		throw new Error( 'Key is required.' );
	}
	const parts = [ config.storePrefix ];
	if ( internal ) {
		parts.push( '_' );
	}
	parts.push( key );
	return parts.join( '' );
}

/**
 * Sync a data key with the server.
 *
 * @param {string} key   Data key.
 * @param {any}    value Data value.
 *
 * @return {Promise} Promise resolving when the sync is complete.
 */
function syncItem( key, value ) {
	if ( ! key ) {
		return Promise.reject( 'Key is required.' );
	}

	const unsynced = _get( 'unsynced', true ) || [];

	const setPending = () => {
		if ( unsynced.includes( key ) ) {
			return;
		}
		unsynced.push( key );
		_set( 'unsynced', unsynced, true );
	};
	const clearPending = () => {
		if ( ! unsynced.includes( key ) ) {
			return;
		}
		unsynced.splice( unsynced.indexOf( key ), 1 );
		_set( 'unsynced', unsynced, true );
	};

	if ( ! newspack_reader_data.api_url || ! newspack_reader_data.nonce ) {
		setPending();
		return Promise.resolve();
	}

	if ( ! value ) {
		value = _get( key );
	}

	const payload = { key };
	if ( value ) {
		payload.value = JSON.stringify( value );
	}

	const req = new XMLHttpRequest();
	req.open( payload.value ? 'POST' : 'DELETE', newspack_reader_data.api_url, true );
	req.setRequestHeader( 'Content-Type', 'application/json' );
	req.setRequestHeader( 'X-WP-Nonce', newspack_reader_data.nonce );

	// Send request.
	req.send( JSON.stringify( payload ) );

	return new Promise( ( resolve, reject ) => {
		req.onreadystatechange = () => {
			if ( 4 !== req.readyState ) {
				return;
			}
			if ( 200 !== req.status ) {
				setPending();
				return reject( req );
			}
			clearPending();
			return resolve( req );
		};
	} );
}

/**
 * Poll sync requests queue.
 */
setInterval( () => {
	if ( ! syncRequests.length ) {
		return;
	}
	const { key, value } = syncRequests.shift();
	syncItem( key, value );
}, 1000 );

/**
 * Encode object to be stored.
 *
 * @param {Object} object Object to encode.
 *
 * @return {string} Encoded object.
 */
function encode( object ) {
	return JSON.stringify( object );
}

/**
 * Decode object to be read.
 *
 * @param {string} str String to decode.
 *
 * @return {Object} Decoded string.
 */
function decode( str ) {
	if ( ! str || 'string' !== typeof str ) {
		return str;
	}
	return JSON.parse( str );
}

/**
 * Internal get function to fetch data from storage.
 *
 * @param {string}  key      Key to get.
 * @param {boolean} internal Whether it's an internal value.
 *
 * @return {any|null} Value. Null if not set.
 */
function _get( key, internal = false ) {
	if ( ! key ) {
		throw new Error( 'Key is required.' );
	}
	return decode( config.storage.getItem( getStoreItemKey( key, internal ) ) );
}

/**
 * Internal set function to set data in storage.
 *
 * @param {string}  key      Key to set.
 * @param {any}     value    Value to set.
 * @param {boolean} internal Whether it's an internal value.
 */
function _set( key, value, internal = false ) {
	if ( ! key ) {
		throw new Error( 'Key is required.' );
	}
	if ( value === undefined ) {
		throw new Error( 'Value cannot be undefined.' );
	}
	if ( '_' === key[ 0 ] ) {
		throw new Error( 'Key cannot start with an underscore.' );
	}
	config.storage.setItem( getStoreItemKey( key, internal ), encode( value ) );
	if ( ! internal ) {
		emit( EVENTS.data, { key, value } );
	}
}

/**
 * Store.
 *
 * @return {Object} The store object.
 */
export default function Store() {
	// Push unsynced items to sync requests polling.
	const unsynced = _get( 'unsynced', true ) || [];
	for ( const key of unsynced ) {
		syncRequests.push( { key, value: _get( key ) } );
	}

	// Rehydrate items from server.
	if ( newspack_reader_data?.items ) {
		const keys = Object.keys( newspack_reader_data.items );
		for ( const key of keys ) {
			// Do not overwrite items that were pending sync.
			if ( unsynced.includes( key ) ) {
				continue;
			}
			_set( key, JSON.parse( newspack_reader_data.items[ key ] ) );
		}
	}

	return {
		/**
		 * Get a value from the store.
		 *
		 * @param {string} key Key to get.
		 *
		 * @return {any} Value. Undefined if not set.
		 */
		get: key => {
			if ( ! key ) {
				throw new Error( 'Key is required.' );
			}
			return _get( key );
		},
		/**
		 * Set a value in the store.
		 *
		 * @param {string}  key   Key to set.
		 * @param {any}     value Value to set.
		 * @param {boolean} sync  Whether to sync the value with the server. Default true.
		 */
		set: ( key, value, sync = true ) => {
			_set( key, value, false );
			if ( sync ) {
				syncRequests.push( { key, value } );
			}
		},
		/**
		 * Delete a value from the store.
		 *
		 * @param {string} key Key to delete.
		 */
		delete: key => {
			if ( ! key ) {
				throw new Error( 'Key is required.' );
			}
			config.storage.removeItem( getStoreItemKey( key ) );
			emit( EVENTS.data, { key, value: undefined } );
			syncRequests.push( { key, value: undefined } );
		},
		/**
		 * Add a value to a collection.
		 *
		 * @param {string} key             Collection key to add to.
		 * @param {any}    value           Value to add.
		 * @param {number} value.timestamp Optional timestamp to use for max age.
		 */
		add: ( key, value ) => {
			if ( ! key ) {
				throw new Error( 'Key cannot be empty.' );
			}
			if ( ! value ) {
				throw new Error( 'Value cannot be empty.' );
			}
			let collection = _get( key ) || [];
			if ( ! Array.isArray( collection ) ) {
				throw new Error( `Store key '${ key }' is not an array.` );
			}

			// Remove items older than max age if `timestamp` is set.
			if ( config.collections.maxAge ) {
				const now = Date.now();
				collection = collection.filter(
					item => ! item.timestamp || now - item.timestamp < config.collections.maxAge
				);
			}

			collection.push( value );

			// Remove items if max items is reached.
			collection = collection.slice( -config.collections.maxItems );

			_set( key, collection );
		},
	};
}
