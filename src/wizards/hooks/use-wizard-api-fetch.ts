/**
 * Custom hook for making API fetch requests using the wizard API.
 */

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../components/src/wizard/store';
import { WizardApiError } from '../errors';

/**
 * Holds in-progress promises for each fetch request.
 */
let promiseCache: Record< string, any > = {};

/**
 * Parses the API error response into a WizardApiError object.
 *
 * @param error The error response from the API.
 * @return      Parsed error object or null if no error.
 */
const parseApiError = (
	error: WpFetchError | string
): WizardApiError | null => {
	const newError = {
		message: 'An unknown API error occurred.',
		statusCode: 500,
		errorCode: 'api_unknown_error',
		details: '',
	};

	if ( ! error ) {
		return null;
	} else if ( typeof error === 'string' ) {
		newError.message = error;
	} else if ( error instanceof Error || 'message' in error ) {
		newError.message = error.message ?? newError.message;
		newError.statusCode = error.data?.status ?? newError.statusCode;
		newError.errorCode = error.code ?? newError.errorCode;
		newError.details = '';
	}

	return new WizardApiError(
		newError.message,
		newError.statusCode,
		newError.errorCode,
		newError.details
	);
};

/**
 * Executes the provided callback function if it exists.
 *
 * @template T
 * @param    callbacks Object containing callback functions.
 * @return             Object with an `on` method to trigger callbacks.
 */
const onCallbacks = < T >( callbacks: ApiFetchCallbacks< T > ) => ( {
	on( cb: keyof ApiFetchCallbacks< T >, d: any = null ) {
		const callback = callbacks?.[ cb ];
		if ( callback && typeof callback === 'function' ) {
			callback( d );
		}
	},
} );

/**
 * Custom hook to perform API fetch requests using the wizard API.
 *
 * @param slug Unique identifier for the wizard data.
 * @return     Object containing fetch function, error handlers and state.
 */
export function useWizardApiFetch( slug: string ) {
	const [ isFetching, setIsFetching ] = useState( false );
	const { wizardApiFetch, updateWizardSettings } = useDispatch(
		WIZARD_STORE_NAMESPACE
	);
	const wizardData: WizardData = useSelect(
		( select: ( namespace: string ) => WizardSelector ) =>
			select( WIZARD_STORE_NAMESPACE ).getWizardData( slug ),
		[ slug ]
	);
	const [ error, setError ] = useState< WizardApiError | null >(
		wizardData.error ?? null
	);

	const requestQueue = useRef< Array< () => Promise< any > > >( [] );
	const processingQueue = useRef( false );

	const processQueue = useCallback( async () => {
		if ( requestQueue.current.length === 0 ) {
			processingQueue.current = false;
			setIsFetching( false );
			return;
		}

		processingQueue.current = true;
		setIsFetching( true );

		const nextRequest = requestQueue.current.shift();
		if ( nextRequest ) {
			await nextRequest();
			processQueue();
		}
	}, [] );

	function resetError() {
		setError( null );
	}

	/**
	 * Updates the wizard data at the specified path.
	 *
	 * @param path The path to update in the wizard data.
	 * @return     Function to update the wizard data.
	 */
	function updateWizardData( path: string | null ) {
		return ( prop: string | string[], value: any, p = path ) =>
			updateWizardSettings( {
				slug,
				path: [
					p,
					...( Array.isArray( prop ) ? prop : [ prop ] ),
				].filter( str => typeof str === 'string' ),
				value,
			} );
	}

	/**
	 * Makes an API fetch request using the wizard API.
	 *
	 * @template T
	 * @param    opts        The options for the API fetch request.
	 * @param    [callbacks] Optional callback functions for different stages of the fetch request.
	 * @return               The result of the API fetch request.
	 */
	const apiFetch = useCallback(
		async < T = any >(
			opts: ApiFetchOptions,
			callbacks?: ApiFetchCallbacks< T >
		) => {
			const { on } = onCallbacks< T >( callbacks ?? {} );
			const updateSettings = updateWizardData( opts.path );
			const { path, method = 'GET' } = opts;
			const {
				isCached = method === 'GET',
				updateCacheKey = null,
				updateCacheMethods = [],
				...options
			} = opts;

			const {
				error: cachedError,
				[ path ]: { [ method ]: cachedMethod = null } = {},
			}: WizardData = wizardData;

			// Handle cached requests immediately
			if ( isCached && ( cachedError || cachedMethod ) ) {
				setError( cachedError );
				on( 'onSuccess', cachedMethod );
				return cachedMethod as T;
			}

			async function executeRequest(): Promise< T > {
				on( 'onStart' );

				try {
					const response: Promise< T > = await wizardApiFetch( {
						isQuietFetch: true,
						isLocalError: true,
						...options,
					} );

					if ( isCached ) {
						updateSettings( method, response );
					}
					if ( updateCacheKey && updateCacheKey instanceof Object ) {
						updateSettings(
							Object.entries( updateCacheKey )[ 0 ],
							response,
							null
						);
					}
					for ( const replaceMethod of updateCacheMethods ) {
						updateSettings( replaceMethod, response );
					}
					on( 'onSuccess', response );
					return response;
				} catch ( err ) {
					const newError = parseApiError( err as WpFetchError );
					setError( newError );
					on( 'onError', newError );
					throw newError;
				} finally {
					on( 'onFinally' );
					// Remove the current request from promiseCache
					const { [ path ]: _removed, ...newData } = promiseCache;
					promiseCache = newData;
				}
			}

			// For non-cached requests, use the queue system
			if ( ! isCached ) {
				requestQueue.current.push( executeRequest );

				if ( ! processingQueue.current ) {
					processQueue();
				}

				return new Promise< T >( resolve => {
					const checkResult = setInterval( () => {
						if (
							! processingQueue.current &&
							! requestQueue.current.includes( executeRequest )
						) {
							clearInterval( checkResult );
							// The request has been processed, resolve with the cached result
							resolve( wizardData[ path ]?.[ method ] as T );
						}
					}, 100 );
				} );
			}

			// For cached requests that weren't in the cache, execute immediately
			return executeRequest();
		},
		[ wizardApiFetch, wizardData, updateWizardSettings, slug, processQueue ]
	);

	return {
		wizardApiFetch: apiFetch,
		isFetching,
		errorMessage: error ? error.message : null,
		error,
		setError(
			value: string | WizardErrorType | null | { message: string }
		) {
			if ( value === null ) {
				resetError();
			} else {
				setError( parseApiError( value as WpFetchError ) );
			}
		},
		resetError,
	};
}
