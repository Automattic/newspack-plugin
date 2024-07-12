/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, createElement } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { useWizardApiFetch } from './use-wizard-api-fetch';
import { Waiting } from '../../components/src';

/**
 * Hook to perform toggle operations using the Wizard API.
 */
function useWizardApiFetchToggle< T >( {
	path,
	apiNamespace,
	refreshOn = [],
	data,
	description,
}: {
	path: `/newspack/v${ string }`;
	apiNamespace: string;
	refreshOn?: ApiMethods[];
	data: T;
	description: string;
} ) {
	const [ apiData, setApiData ] = useState< T >( data );

	const [ actionText, setActionText ] = useState< React.ReactNode >( null );

	const { wizardApiFetch, isFetching, errorMessage } = useWizardApiFetch( apiNamespace );

	/**
	 * Perform `GET` request on initial load.
	 */
	useEffect( () => {
		apiFetchToggle();
	}, [] );

	/**
	 * Toggle function for the Wizard API fetch.
	 *
	 * @param isToggleOn If set method will default to POST, otherwise GET.
	 */
	function apiFetchToggle( data?: T, isToggleOn?: boolean ) {
		const method = typeof isToggleOn === 'boolean' ? 'POST' : 'GET';

		const options: ApiFetchOptions = {
			path,
			method,
		};
		if ( data ) {
			options.data = data;
		}
		wizardApiFetch< T >( options, {
			onSuccess: setApiData,
			onFinally() {
				if ( refreshOn.includes( method ) ) {
					setActionText(
						createElement(
							'span',
							{ className: 'gray' },
							__( 'Page reloading…', 'newspack-plugin' )
						)
					);
					window.location.reload();
				}
			},
		} );
	}
	return {
		actionText: isFetching ? createElement( Waiting ) : actionText,
		apiData,
		apiFetchToggle,
		isFetching,
		errorMessage,
		description: isFetching ? __( 'Loading…', 'newspack-plugin' ) : description,
	};
}

export default useWizardApiFetchToggle;
