/**
 * WordPress dependencies.
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '.';

export const createAction = type => payload => ( { type, payload } );

export const useWizardData = ( wizardName, defaultValue = {} ) =>
	useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).getWizardAPIData( `newspack-${ wizardName }-wizard` )
	) || defaultValue;

/**
 * Hook to select a specific property in Wizard data/state.
 *
 * @param {string} slug         Wizard property to select data for.
 * @param {string} prop         Property in Wizard data to select from.
 * @param {string} defaultValue Default value to return when `prop` doesn't exist.
 * @return {any}                Return a specific wizard props value.
 */
export const useWizardDataProp = ( slug, prop, defaultValue = '' ) => {
	const { [ prop ]: data = defaultValue } = useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).getWizardData( slug )
	);
	return data;
};
