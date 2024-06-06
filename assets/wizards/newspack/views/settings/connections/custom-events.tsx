/**
 * Settings Wizard: Connections > Custom Events
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { Button, Grid, Notice, TextControl } from '../../../../../components/src';

/**
 * Analytics Custom Events screen.
 */
function CustomEvents() {
	const [ ga4Credentials, setGa4Credentials ] = useState< Ga4Credentials >(
		window.newspackSettings.connections.sections.customEvents
	);
	const { wizardApiFetch, errorMessage, resetError } = useWizardApiFetch(
		'newspack-settings/connections/custom-events'
	);

	useEffect( () => {
		resetError();
	}, [] );

	function updateGa4Credentials() {
		wizardApiFetch< Ga4Credentials >(
			{
				path: '/newspack/v1/wizard/analytics/ga4-credentials',
				method: 'POST',
				data: {
					measurement_id: ga4Credentials.measurement_id,
					measurement_protocol_secret: ga4Credentials.measurement_protocol_secret,
				},
			},
			{
				onSuccess( fetchedData ) {
					window.newspackSettings.connections.sections.analytics = {
						...window.newspackSettings.connections.sections.analytics,
						...fetchedData,
					};
					setGa4Credentials( fetchedData );
					resetError();
				},
			}
		);
	}

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

			{ errorMessage && <Notice isError noticeText={ errorMessage } /> }
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
				disabled={ ! ga4Credentials.measurement_id || ! ga4Credentials.measurement_protocol_secret }
			>
				{ __( 'Save', 'newspack-plugin' ) }
			</Button>
		</div>
	);
}

export default CustomEvents;
