/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PluginSettings } from '../../../../components/src';

export default function MetaPixel() {
	const apiEndpoint = '/newspack/v1/wizard/newspack-engagement-wizard/social/meta_pixel';
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ settings, setSettings ] = useState( null );

	useEffect( async () => {
		setInFlight( true );
		try {
			const response = await apiFetch( { path: apiEndpoint } );
			setSettings( response );
		} catch ( err ) {
			setSettings( null );
		}
		setInFlight( false );
	}, [] );

	const handleChange = ( key, value ) => {
		setSettings( {
			...settings,
			[ key ]: value,
		} );
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
	};

	const fields = [
		{
			key: 'pixel_id',
			type: 'integer',
			description: __( 'Pixel ID', 'newspack' ),
			help: __(
				'The Meta Pixel ID of your account. You can take this information in XXXXXXXX. EXAMPLE.',
				'newspack'
			),
		},
	];

	if ( ! settings ) {
		return null;
	}

	fields[0].value = settings.pixel_id;

	return (
		<PluginSettings.Section
			error={ error }
			disabled={ inFlight }
			sectionKey="ad-refresh-control"
			title={ __( 'Meta Pixel', 'newspack' ) }
			description={ __(
				'Add the Meta pixel (formely known as Facebook pixel) to your site.',
				'newspack'
			) }
			active={ settings.active }
			fields={ fields }
			onUpdate={ handleUpdate }
			onChange={ handleChange }
		/>
	);
}
