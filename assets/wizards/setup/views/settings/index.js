/**
 * WordPress dependencies
 */
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { SelectControl, withWizardScreen, hooks } from '../../../../components/src';
import './style.scss';

/**
 * Settings Setup Screen.
 */
const Settings = ( { setError, wizardApiFetch } ) => {
	const updateProfile = profile =>
		apiFetch( {
			path: '/newspack/v1/profile/',
			method: 'POST',
			data: { profile },
		} );
	const [ { currencies = [], countries = [] }, setOptions ] = useState( {} );
	const [ profileData, updateProfileData, isLoading ] = hooks.useObjectState( {}, updateProfile );

	useEffect( () => {
		wizardApiFetch( { path: '/newspack/v1/profile/', method: 'GET' } )
			.then( response => {
				setOptions( { currencies: response.currencies, countries: response.countries } );
				updateProfileData( response.profile, { skipCallback: true } );
			} )
			.catch( setError );
	}, [] );

	return (
		<Fragment>
			<SelectControl
				disabled={ isLoading }
				label={ __( 'Where is your business based?' ) }
				value={ profileData.country }
				onChange={ updateProfileData( 'country' ) }
				options={ countries }
			/>
			<SelectControl
				disabled={ isLoading }
				label={ __( 'Currency' ) }
				value={ profileData.currency }
				onChange={ updateProfileData( 'currency' ) }
				options={ currencies }
			/>
		</Fragment>
	);
};

export default withWizardScreen( Settings );
