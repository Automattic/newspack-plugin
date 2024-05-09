/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Button, Grid, Notice, TextControl } from '../../../../../../components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../components/src/wizard/store';

/**
 * Analytics Custom Events screen.
 */
const CustomEvents = () => {
	const [ ga4Credentials, setGa4Credentials ] = useState< {
		measurement_protocol_secret: string;
		measurement_id: string;
	} >( window.newspackSettings.tabs.connections.sections.analytics );
	const [ error, setError ] = useState< undefined | string >();
	const { wizardApiFetch } = useDispatch( WIZARD_STORE_NAMESPACE );

	const handleApiError = ( { message: err }: { message: string } ) => setError( err );

	const updateGa4Credentials = () => {
		wizardApiFetch<
			Promise< {
				measurement_protocol_secret: string;
				measurement_id: string;
			} >
		>( {
			path: '/newspack/v1/wizard/analytics/ga4-credentials',
			method: 'POST',
			isQuietFetch: true,
			data: {
				measurement_id: ga4Credentials.measurement_id,
				measurement_protocol_secret: ga4Credentials.measurement_protocol_secret,
			},
		} )
			.then( ( response: { measurement_protocol_secret: string; measurement_id: string } ) =>
				setGa4Credentials( response )
			)
			.catch( handleApiError );
	};

	return (
		<div className="newspack__analytics-configuration">
			<div className="newspack__analytics-configuration__header">
				<p>
					{ __(
						"Newspack already sends some custom event data to your GA account, but adding the credentials below enables enhanced events that are fired from your site's backend. For example, when a donation is confirmed or when a user successfully subscribes to a newsletter.",
						'newspack-plugin'
					) }
				</p>
			</div>

			{ error && <Notice isError noticeText={ error } /> }
			<Grid noMargin rowGap={ 16 }>
				<TextControl
					value={ ga4Credentials.measurement_id }
					label={ __( 'Measurement ID', 'newspack-plugin' ) }
					help={ __(
						'You can find this in Site Kit Settings, or in Google Analytics > Admin > Data Streams and clickng the data stream. Example: G-ABCD1234',
						'newspack-plugin'
					) }
					onChange={ ( value: string ) =>
						setGa4Credentials( { ...ga4Credentials, measurement_id: value } )
					}
					autoComplete="off"
				/>
				<TextControl
					type="password"
					value={ ga4Credentials.measurement_protocol_secret }
					label={ __( 'Measurement Protocol API Secret', 'newspack-plugin' ) }
					help={ __(
						'Generate an API secret from your GA dashboard in Admin > Data Streams and opening your data stream. Select "Measurement Protocol API secrets" under the Events section. Create a new secret.',
						'newspack-plugin'
					) }
					onChange={ ( value: string ) =>
						setGa4Credentials( { ...ga4Credentials, measurement_protocol_secret: value } )
					}
					autoComplete="off"
				/>
			</Grid>
			<Button
				className="newspack__analytics-newspack-custom-events__save-button"
				variant="primary"
				onClick={ updateGa4Credentials }
			>
				{ __( 'Save', 'newspack-plugin' ) }
			</Button>
		</div>
	);
};

export default CustomEvents;
