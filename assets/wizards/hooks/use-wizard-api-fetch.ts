/**
 * Custom hook for making API fetch requests using the wizard API.
 */

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../components/src/wizard/store';
import { WizardApiError } from '../errors';

type WpFetchError = Error & {
	code: string;
	data?: null | {
		status: 404;
	};
};

type WizardData = {
	error: WizardApiError | null;
} & {
	[ key: string ]: { [ k in 'GET' | 'POST' | 'PUT' | 'DELETE' ]?: Record< string, any > | null };
};

let promiseCache: Record< string, any > = {};

const parseApiError = ( error: WpFetchError | string ): WizardApiError | null => {
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

const onCallbacks = < T >( callbacks: ApiFetchCallbacks< T > ) => ( {
	on( cb: keyof ApiFetchCallbacks< T >, d: any = null ) {
		const callback = callbacks?.[ cb ];
		if ( callback && typeof callback === 'function' ) {
			callback( d );
		}
	},
} );

export function useWizardApiFetch( slug: string ) {
	const [ isFetching, setIsFetching ] = useState( false );
	const { wizardApiFetch, updateWizardSettings } = useDispatch( WIZARD_STORE_NAMESPACE );
	const wizardData: WizardData = useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).getWizardData( slug )
	);
	const [ error, setError ] = useState< WizardApiError | null >( wizardData.error ?? null );

	useEffect( () => {
		updateWizardSettings( {
			slug,
			path: [ 'error' ],
			value: error,
		} );
	}, [ error, updateWizardSettings, slug ] );

	function resetError() {
		setError( null );
	}

	function updateWizardData( path: string | null ) {
		return ( prop: string | string[], value: any, p = path ) => {
			return updateWizardSettings( {
				slug,
				path: [ p, ...( Array.isArray( prop ) ? prop : [ prop ] ) ].filter(
					str => typeof str === 'string'
				),
				value,
			} );
		};
	}

	const apiFetch = useCallback(
		async < T = any >( opts: ApiFetchOptions, callbacks?: ApiFetchCallbacks< T > ) => {
			if ( isFetching ) {
				return;
			}
			const { on } = onCallbacks< T >( callbacks ?? {} );
			const updateSettings = updateWizardData( opts.path );
			const { path, method = 'GET' } = opts;
			const {
				isCached = method === 'GET',
				updateCacheKey = null,
				updateCacheMethods = [],
				...options
			} = opts;

			const { error: cachedError, [ path ]: { [ method ]: cachedMethod = null } = {} }: WizardData =
				wizardData;

			function thenCallback( response: T ) {
				if ( isCached ) {
					updateSettings( method, response );
				}
				if ( updateCacheKey && updateCacheKey instanceof Object ) {
					updateSettings( Object.entries( updateCacheKey )[ 0 ], response, null );
				}
				for ( const replaceMethod of updateCacheMethods ) {
					updateSettings( replaceMethod, response );
				}
				on( 'onSuccess', response );
				return response;
			}

			function catchCallback( err: WpFetchError ) {
				const newError = parseApiError( err );
				setError( newError );
				on( 'onError', newError );
				throw newError;
			}

			function finallyCallback() {
				setIsFetching( false );
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { [ path ]: _removed, ...newData } = promiseCache;
				promiseCache = newData;
				on( 'onFinally' );
			}

			/**
			 * If the promise is already in progress, return it before making a new request.
			 */
			if ( promiseCache[ path ] ) {
				setIsFetching( true );
				return promiseCache[ path ]
					.then( thenCallback )
					.catch( catchCallback )
					.finally( finallyCallback );
			}

			/**
			 * Cache exists and is not empty, return it.
			 */
			if ( isCached && ( cachedError || cachedMethod ) ) {
				setError( cachedError );
				on( 'onSuccess', cachedMethod );
				return cachedMethod;
			}

			setIsFetching( true );
			on( 'onStart' );

			promiseCache[ path ] = wizardApiFetch< Promise< T > >( {
				isQuietFetch: true,
				isLocalError: true,
				...options,
			} )
				.then( thenCallback )
				.catch( catchCallback )
				.finally( finallyCallback );

			return promiseCache[ slug ];
		},
		[ wizardApiFetch, wizardData, updateWizardSettings, isFetching, slug ]
	);

	return {
		wizardApiFetch: apiFetch,
		isFetching,
		errorMessage: error ? error.message : null,
		error,
		setError( value: string | Error | { message: string } ) {
			setError( parseApiError( value as WpFetchError ) );
		},
		resetError,
	};
}
