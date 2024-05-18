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
	const { setDataPropError } = useDispatch( WIZARD_STORE_NAMESPACE );
	const { error } = Wizard.useWizardDataProp( slug, prop );

	return {
		error,
		isError: !! error,
		setError(
			err: string | Error | { message: string },
			defaultVal = __( 'Something went wrong.', 'newspack-plugin' )
		) {
			let message;
			if ( ! err ) {
				message = defaultVal;
			} else if ( typeof err === 'string' ) {
				message = err;
			} else if ( err instanceof Error || 'message' in err ) {
				message = err.message;
			}
			setDataPropError( { slug, prop, message } );
		},
		resetError() {
			setDataPropError( { slug, prop, message: '' } );
		},
	};
}

export default useWizardError;
