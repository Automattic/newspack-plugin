/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';

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

	if ( ! settings ) {
		return null;
	}

	const fields = [
		{
			key: 'pixel_id',
			type: 'integer',
			description: __( 'Pixel ID', 'newspack' ),
			help: createInterpolateElement(
				__(
					'The Meta Pixel ID. You only need to add the number, not the full code. Example: 123456789123456789. You can get this information <linkToFb>here</linkToFb>.',
					'newspack'
				),
				{
					linkToFb: <a href="https://www.facebook.com/ads/manager/pixel/facebook_pixel" target="_blank" />,
				}
			),
			value: settings.pixel_id,
		},
	];

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
