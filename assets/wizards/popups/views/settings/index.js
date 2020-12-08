/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { withWizardScreen, CheckboxControl } from '../../../../components/src';

const ENDPOINT = `/newspack/v1/wizard/newspack-popups-wizard/settings`;

const Settings = ( { isLoading, startLoading, doneLoading } ) => {
	const [ settings, setSettings ] = useState( [] );

	const handleSettingChange = option_name => option_value => {
		startLoading();
		apiFetch( {
			path: ENDPOINT,
			method: 'POST',
			data: { option_name, option_value },
		} ).then( response => {
			setSettings( response );
			doneLoading();
		} );
	};

	useEffect( () => {
		startLoading();
		apiFetch( {
			path: ENDPOINT,
			method: 'GET',
		} ).then( response => {
			setSettings( response );
			doneLoading();
		} );
	}, [] );

	return (
		<>
			{ settings.map( setting =>
				setting.label ? (
					<CheckboxControl
						key={ setting.key }
						label={ setting.label }
						disabled={ isLoading }
						checked={ setting.value === '1' }
						onChange={ handleSettingChange( setting.key ) }
					/>
				) : null
			) }
		</>
	);
};

export default withWizardScreen( Settings );
