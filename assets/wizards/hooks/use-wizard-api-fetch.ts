/**
 * Custom hook for making API fetch requests using the wizard API.
 */

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../components/src/wizard/store';

export function useWizardApiFetch() {
	const { wizardApiFetch } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ isFetching, setIsFetching ] = useState( false );

	const apiFetch = useCallback(
		async < T = any >( options: ApiFetchOptions, callbacks?: ApiFetchCallbacks< T > ) => {
			if ( callbacks?.onStart ) {
				callbacks.onStart();
			}
			setIsFetching( true );
			try {
				const response: T = await wizardApiFetch< T >( {
					isQuietFetch: true,
					isLocalError: true,
					...options,
				} );
				if ( callbacks?.onSuccess ) {
					callbacks.onSuccess( response );
				}
				return response;
			} catch ( err ) {
				if ( callbacks?.onError ) {
					callbacks.onError( err );
				}
				throw err;
			} finally {
				if ( callbacks?.onFinally ) {
					callbacks.onFinally();
				}
				setIsFetching( false );
			}
		},
		[ wizardApiFetch ]
	);

	return { wizardApiFetch: apiFetch, isFetching };
}
