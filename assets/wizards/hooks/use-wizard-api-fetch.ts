/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../components/src/wizard/store';

/**
 * Custom hook for making API fetch requests using the wizard API.
 * @return An object containing the `wizardApiFetch` function and the `isLoading` boolean.
 */
export function useWizardApiFetch() {
	const { wizardApiFetch } = useDispatch( WIZARD_STORE_NAMESPACE );
	const isLoading: boolean = useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).isQuietLoading()
	);

	const apiFetch = useCallback(
		async < T = any >( options: ApiFetchOptions, callbacks?: ApiFetchCallbacks< T > ) => {
			if ( callbacks?.onStart ) {
				callbacks.onStart();
			}
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
				throw err; // Optionally re-throw the error if you need to handle it outside as well
			} finally {
				if ( callbacks?.onFinally ) {
					callbacks.onFinally();
				}
			}
		},
		[ wizardApiFetch ]
	);

	return { wizardApiFetch: apiFetch, isLoading };
}
