/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PluginSettings } from '../../../../components/src';

export default function Pixel( {
	title,
	description,
	pixelKey,
	fieldDescription,
	fieldHelp,
	pixelValueType,
} ) {
	const apiEndpoint = `/newspack/v1/wizard/newspack-engagement-wizard/social/${ pixelKey }_pixel`;
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ settings, setSettings ] = useState( null );
	const [ sectionSettingsButtonDisabled, setSectionSettingsButtonDisabled ] = useState( true );

	useEffect( async () => {
		setInFlight( true );
		try {
			const response = await apiFetch( { path: apiEndpoint } );
			setSettings( response );
		} catch ( err ) {
			setSettings( null );
		}
		setInFlight( false );
		setSectionSettingsButtonDisabled( true );
	}, [] );

	const handleChange = ( key, value ) => {
		setSettings( {
			...settings,
			[ key ]: value,
		} );
		setSectionSettingsButtonDisabled( false );
	};

	const handleUpdate = async data => {
		setError( null );
		setInFlight( true );
		try {
			const result = await apiFetch( {
				path: apiEndpoint,
				method: 'POST',
				data: {
					...settings,
					...data,
				},
			} );
			setSettings( result );
		} catch ( err ) {
			setError( err );
		}
		setInFlight( false );
		setSectionSettingsButtonDisabled( true );
	};

	if ( ! settings ) {
		return null;
	}

	const fields = [
		{
			key: 'pixel_id',
			type: pixelValueType,
			description: fieldDescription,
			help: fieldHelp,
			value: settings.pixel_id,
		},
	];

	return (
		<PluginSettings.Section
			error={ error }
			disabled={ inFlight }
			sectionKey="pixel-settings"
			title={ title }
			description={ description }
			active={ settings.active }
			fields={ fields }
			onUpdate={ handleUpdate }
			onChange={ handleChange }
			sectionSettingsButtonDisabled={ sectionSettingsButtonDisabled }
		/>
	);
}
