/* globals newspack_reader_data */
window.newspack_reader_data = window.newspack_reader_data || {};

import { EVENTS, emit } from './events';

const config = {
	storeKey: 'newspack-reader',
	storage: window.localStorage,
	reservedKeys: [ 'activity', 'data', 'config' ], // Reserved keys that cannot be used with store.set().
	lists: {
		maxItems: 1000, // Maximum number of items in a list.
		maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days.
	},
};

/**
 * Sync a data key with the server.
 *
 * @param {string} key   Data key.
 * @param {any}    value Data value.
 * @param {Object} data  Source data object.
 *
 * @return {Promise} Promise resolving when the sync is complete.
 */
function syncItem( key, value, data ) {
	if ( ! key ) {
		return Promise.reject( 'Key is required.' );
	}

	if ( ! data ) {
		data = _get();
	}

	const setPending = () => {
		if ( ! data.config.pendingSync.includes( key ) ) {
			data.config.pendingSync.push( key );
		}
		_set( 'config', data.config, true );
	};
	const clearPending = () => {
		if ( data.config.pendingSync.includes( key ) ) {
			data.config.pendingSync.splice( data.config.pendingSync.indexOf( key ), 1 );
		}
		_set( 'config', data.config, true );
	};

	if ( ! newspack_reader_data.api_url || ! newspack_reader_data.nonce ) {
		setPending();
		return Promise.resolve();
	}

	if ( ! value ) {
		value = data[ key ];
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
	return { ...defaultData, ...decode( config.storage.getItem( config.storeKey ) ) } || defaultData;
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
	if ( ! internal && config.reservedKeys.includes( key ) ) {
		throw new Error( `Key '${ key }' is reserved.` );
	}
	const data = _get();
	data[ key ] = value;
	config.storage.setItem( config.storeKey, encode( data ) );
	emit( EVENTS.data, { key, value } );
}

/**
 * Store.
 *
 * @return {Object} The store object.
 */
export default function Store() {
	const initialData = _get();

	// Attempt to sync missing items.
	const pendingSync = initialData.config.pendingSync;
	for ( const key of pendingSync ) {
		syncItem( key, initialData[ key ], initialData );
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
		config.storage.setItem( config.storeKey, encode( { ...initialData, ...items } ) );
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
			syncItem( key );
		},
		delete: key => {
			if ( ! key ) {
				throw new Error( 'Key is required.' );
			}
			const data = _get();
			delete data[ key ];
			config.storage.setItem( config.storeKey, encode( data ) );
			emit( EVENTS.data, { key, value: undefined } );
			syncItem( key );
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
			if ( config.lists.maxAge ) {
				const now = Date.now();
				data[ key ] = data[ key ].filter(
					item => ! item.timestamp || now - item.timestamp < config.lists.maxAge
				);
			}

			data[ key ].push( value );

			// Remove items if max items is reached.
			data[ key ] = data[ key ].slice( -config.lists.maxItems );

			_set( key, data[ key ], true );
		},
	};
}
