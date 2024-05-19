/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Wizard } from '../../components/src';
import { WIZARD_STORE_NAMESPACE } from '../../components/src/wizard/store';
/**
 * Hook for managing granular error within a specific Wizard data object.
 *
 * @param slug State group name to store data in
 * @param prop Property in state group name to manage errors for.
 *
 * @return     Object containing callback and value to manage errors
 *
 * @example
 * ```ts
 * const { error, setError, resetError } = useWizardError( 'slug', 'prop' );
 * ```
 */
function useWizardError( slug: string, prop: string ) {
	const { updateWizardSettings } = useDispatch( WIZARD_STORE_NAMESPACE );
	const { error } = Wizard.useWizardDataProp( slug, prop );

	return {
		error,
		isError: !! error,
		setError(
			err: string | Error | { message: string },
			defaultVal = __( 'Something went wrong.', 'newspack-plugin' )
		) {
			let value;
			if ( ! err ) {
				value = defaultVal;
			} else if ( typeof err === 'string' ) {
				value = err;
			} else if ( err instanceof Error || 'message' in err ) {
				value = err.message;
			}
			updateWizardSettings( {
				slug,
				path: [ prop, 'error' ],
				value,
			} );
		},
		resetError() {
			updateWizardSettings( {
				slug,
				path: [ prop, 'error' ],
				value: '',
			} );
		},
	};
}

export default useWizardError;
