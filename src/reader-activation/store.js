/* globals newspack_reader_data */
window.newspack_reader_data = window.newspack_reader_data || {};

import { EVENTS, emit } from './events';

/**
 * Store configuration.
 *
 * @type {Object}
 * @property {string}  storePrefix          Prefix for store items.
 * @property {Storage} storage              Storage object.
 * @property {Object}  collections          Configuration of collections that are created through store.add().
 * @property {number}  collections.maxItems Maximum number of items in a collection.
 * @property {number}  collections.maxAge   Maximum age of a collection item if 'timestamp' is set.
 */
const config = {
	storePrefix: newspack_reader_data?.store_prefix || 'np_reader_',
	storage: newspack_reader_data?.is_temporary ? window.sessionStorage : window.localStorage,
	collections: {
		maxItems: 1000,
		maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days.
	},
};

/**
 * Queue of keys to sync with the server every second.
 * No need to sync data for temporary sessions.
 *
 * @type {string[]} Array of keys.
 */
const syncQueue = [];

setInterval( () => {
	if ( ! syncQueue.length || newspack_reader_data?.is_temporary ) {
		return;
	}
	const key = syncQueue.shift();
	syncItem( key )
		.then( () => clearPendingSync( key ) )
		.catch( () => setPendingSync( key ) );
}, 1000 );

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
 * Set a key as pending sync.
 *
 * @param {string} key
 */
function setPendingSync( key ) {
	const unsynced = _get( 'unsynced', true ) || [];
	if ( unsynced.includes( key ) ) {
		return;
	}
	unsynced.push( key );
	_set( 'unsynced', unsynced, true );
}

/**
 * Clear a key from pending sync.
 *
 * @param {string} key
 */
function clearPendingSync( key ) {
	const unsynced = _get( 'unsynced', true ) || [];
	if ( ! unsynced.includes( key ) ) {
		return;
	}
	unsynced.splice( unsynced.indexOf( key ), 1 );
	_set( 'unsynced', unsynced, true );
}

/**
 * Send a data item to the server.
 *
 * @param {string} key Data key.
 *
 * @return {Promise} Promise that resolves when the request is complete.
 */
function syncItem( key ) {
	if ( ! key ) {
		return Promise.reject( 'Key is required.' );
	}
	if ( ! newspack_reader_data.api_url || ! newspack_reader_data.nonce ) {
		return Promise.reject( 'API not available.' );
	}

	const value = _get( key );
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
				return reject( req );
			}
			return resolve( req );
		};
	} );
}

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
	if ( value === undefined || value === null ) {
		throw new Error( 'Value cannot be undefined or null.' );
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
	// Push unsynced items to the sync queue.
	const unsynced = _get( 'unsynced', true ) || [];
	for ( const key of unsynced ) {
		syncQueue.push( key );
	}

	// Rehydrate items from server. No need to rehydrate for temporary sessions.
	if ( newspack_reader_data?.items && ! newspack_reader_data?.is_temporary ) {
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
				setPendingSync( key );
				syncQueue.push( key );
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
			setPendingSync( key );
			syncQueue.push( key );
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
