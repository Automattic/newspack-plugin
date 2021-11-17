/**
 * WordPress dependencies.
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '.';

export const createAction = type => payload => ( { type, payload } );

export const useWizardData = defaultValue =>
	useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).getWizardAPIData( 'newspack-reader-revenue-wizard' )
	) || defaultValue;
