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
 * Hook for managing granular errors within a specific Wizard data object.
 * @param slug       Name of the state group to store data in
 * @param propPrefix Property prefix in state group name to manage errors for.
 * @param props      Array of properties in state group name to manage errors for.
 *
 * @return           Object containing callbacks and value to manage errors
 *
 * @example
 * ```ts
 * const { errors, setError, getError, resetError } = useWizardDataPropErrors( 'slug', 'propPrefix', [ 'prop1', 'prop2' ] );
 * ```
 */
function useWizardDataPropErrors( slug: string, propPrefix: string, props: string[] ) {
	const { setDataPropError } = useDispatch( WIZARD_STORE_NAMESPACE );

	const errors = props.reduce( ( acc: Record< string, string >, prop ) => {
		acc[ `${ propPrefix }/${ prop }` ] = Wizard.useWizardDataProp(
			slug,
			`${ propPrefix }/${ prop }`
		).error;
		return acc;
	}, {} );

	return {
		errors,
		setError( prop: string, err: string | Error ) {
			let message = __( 'Something went wrong.', 'newspack-plugin' );
			if ( typeof err === 'string' ) {
				message = err;
			} else if ( 'message' in err ) {
				message = err.message;
			}
			setDataPropError( { slug, prop: `${ propPrefix }/${ prop }`, message } );
		},
		getError( prop: string ) {
			return errors[ `${ propPrefix }/${ prop }` ];
		},
		resetError( prop: string ) {
			setDataPropError( { slug, prop, message: '' } );
		},
	};
}

export default useWizardDataPropErrors;
