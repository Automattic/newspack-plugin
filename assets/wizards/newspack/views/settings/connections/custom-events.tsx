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
import { WizardError } from '../../../../errors';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { Button, Grid, Notice, TextControl } from '../../../../../components/src';

/**
 * Validate GA4 Measurement ID.
 *
 * @link https://measureschool.com/ga4-measurement-id/
 * @param measurementId Measurement ID to validate
 * @return boolean True if the measurement ID is valid, false otherwise
 */
function isValidGA4MeasurementID( measurementId: string = '' ) {
	const ga4Pattern = /^G-[A-Za-z0-9]{10,}$/;
	return ga4Pattern.test( measurementId );
}

/**
 * Analytics Custom Events screen.
 */
function CustomEvents() {
	const [ ga4Credentials, setGa4Credentials ] = useState< Ga4Credentials >(
		window.newspackSettings.connections.sections.customEvents
	);
	const { wizardApiFetch, errorMessage, resetError, setError } = useWizardApiFetch(
		'newspack-settings/connections/custom-events'
	);

	useEffect( () => {
		if ( ! isValidGA4MeasurementID( ga4Credentials.measurement_id ) ) {
			setError(
				new WizardError(
					__(
						'You need a valid Measurement ID (e.g. "G-ABCDE12345") to activate Newspack Custom Events.',
						'newspack-plugin'
					),
					'ga4_invalid_measurement_id'
				)
			);
			return;
		}
		if ( ! ga4Credentials.measurement_protocol_secret ) {
			setError(
				new WizardError(
					__(
						'You need a valid Measurement API Secret to activate Newspack Custom Events.',
						'newspack-plugin'
					),
					'ga4_invalid_measurement_protocol_secret'
				)
			);
			return;
		}
		resetError();
	}, [ ga4Credentials.measurement_id, ga4Credentials.measurement_protocol_secret ] );

	function updateGa4Credentials() {
		wizardApiFetch< Ga4Credentials >(
			{
				path: '/newspack/v2/wizard/analytics/ga4-credentials',
				method: 'POST',
				data: {
					measurement_id: ga4Credentials.measurement_id,
					measurement_protocol_secret: ga4Credentials.measurement_protocol_secret,
				},
			},
			{
				onSuccess( fetchedData ) {
					window.newspackSettings.connections.sections.customEvents = {
						...window.newspackSettings.connections.sections.customEvents,
						...fetchedData,
					};
					setGa4Credentials( fetchedData );
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
						'You can find this in Site Kit Settings, or in Google Analytics > Admin > Data Streams and clickng the data stream. Example: G-ABCDE12345',
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
					autoComplete="one-time-code"
				/>
			</Grid>
			<Button
				className="newspack__analytics-newspack-custom-events__save-button"
				variant="primary"
				onClick={ updateGa4Credentials }
				disabled={ !! errorMessage }
			>
				{ __( 'Save', 'newspack-plugin' ) }
			</Button>
		</div>
	);
}

export default CustomEvents;
