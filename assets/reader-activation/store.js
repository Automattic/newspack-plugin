/* globals newspack_reader_data */
window.newspack_reader_data = window.newspack_reader_data || {};

import { EVENTS, emit } from './events';

const STORE_KEY = 'newspack-reader';

const storage = window.localStorage;
const reservedKeys = [ 'activity', 'data', 'config' ];

/**
 * Activity config.
 */
const maxItems = 1000;
const maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days.

/**
 * Whether the reader can sync data with the server.
 *
 * @return {boolean} Whether the reader can sync data with the server.
 */
function canSyncData() {
	return !! newspack_reader_data.api_url && !! newspack_reader_data.nonce;
}

/**
 * Sync a data key with the server.
 *
 * @param {string} key   Data key.
 * @param {any}    value Data value.
 *
 * @return {Promise} Promise.
 */
function syncItem( key, value ) {
	if ( ! canSyncData() ) {
		return Promise.reject( 'Not allowed to sync data.' );
	}

	if ( ! key ) {
		return Promise.reject( 'Key is required.' );
	}

	if ( ! value ) {
		value = _get()[ key ];
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
				return reject( req );
			}
			removePendingSync( key );
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
	if ( ! str ) {
		return {};
	} else if ( 'object' === typeof str ) {
		return str;
	}
	return JSON.parse( str );
}

/**
 * Internal get function to fetch data from storage.
 *
 * @return {Object} Store data.
 */
function _get() {
	const defaultData = {
		activity: [],
		config: {
			pendingSync: [],
		},
	};
	return { ...defaultData, ...decode( storage.getItem( STORE_KEY ) ) } || defaultData;
}

/**
 * Internal set function to set data in storage.
 *
 * @param {string}  key      Key to set.
 * @param {any}     value    Value to set.
 * @param {boolean} internal Whether it's internal and should bypass reserved keys check.
 */
function _set( key, value, internal = false ) {
	if ( ! key ) {
		throw new Error( 'Key is required.' );
	}
	if ( ! internal && reservedKeys.includes( key ) ) {
		throw new Error( `Key '${ key }' is reserved.` );
	}
	const data = _get();
	data[ key ] = value;
	storage.setItem( STORE_KEY, encode( data ) );
	emit( EVENTS.data, { key, value } );
}

/**
 * Set a key as pending sync.
 *
 * @param {string} key Key to set as pending sync.
 */
function setPendingSync( key ) {
	const config = _get().config;
	if ( ! config.pendingSync.includes( key ) ) {
		config.pendingSync.push( key );
	}
	_set( 'config', config, true );
}

/**
 * Remove a key from pending sync.
 *
 * @param {string} key Key to remove from pending sync.
 */
function removePendingSync( key ) {
	const config = _get().config;
	if ( config.pendingSync.includes( key ) ) {
		config.pendingSync.splice( config.pendingSync.indexOf( key ), 1 );
	}
	_set( 'config', config, true );
}

/**
 * Store.
 *
 * @return {Object} The store object.
 */
export default function Store() {
	const initialData = _get();

	// Sync missing items.
	const pendingSync = initialData.config.pendingSync;
	if ( canSyncData() ) {
		for ( const key of pendingSync ) {
			syncItem( key, initialData[ key ] );
		}
	}

	// Rehydrate items from server.
	if ( newspack_reader_data?.items ) {
		const items = {};
		const keys = Object.keys( newspack_reader_data.items );
		for ( const key of keys ) {
			// Do not overwrite items that were pending sync.
			if ( pendingSync.includes( key ) ) {
				continue;
			}
			const item = JSON.parse( newspack_reader_data.items[ key ] );
			if ( item ) {
				items[ key ] = item;
			}
		}
		storage.setItem( STORE_KEY, encode( { ...initialData, ...items } ) );
	}

	return {
		get: key => {
			const data = _get();
			if ( ! key ) {
				return data;
			}
			return data[ key ];
		},
		set: ( key, value ) => {
			_set( key, value, false );
			if ( canSyncData() ) {
				syncItem( key );
			} else {
				setPendingSync( key );
			}
		},
		delete: key => {
			if ( ! key ) {
				throw new Error( 'Key is required.' );
			}
			const data = _get();
			delete data[ key ];
			storage.setItem( STORE_KEY, encode( data ) );
			if ( canSyncData() ) {
				syncItem( key );
			} else {
				setPendingSync( key );
			}
		},
		add: ( key, value ) => {
			if ( ! key ) {
				throw new Error( 'Key is required.' );
			}
			const data = _get();
			data[ key ] = data[ key ] || [];
			if ( ! Array.isArray( data[ key ] ) ) {
				throw new Error( `Store key '${ key }' is not an array.` );
			}

			// Remove items older than max age if `timestamp` is set.
			if ( maxAge ) {
				const now = Date.now();
				data[ key ] = data[ key ].filter(
					item => ! item.timestamp || now - item.timestamp < maxAge
				);
			}

			data[ key ].push( value );

			// Remove items if max items is reached.
			data[ key ] = data[ key ].slice( -maxItems );

			_set( key, data[ key ], true );
		},
	};
}
