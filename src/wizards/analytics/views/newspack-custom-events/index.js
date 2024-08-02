/* global newspack_analytics_wizard_data */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	Grid,
	Notice,
	SectionHeader,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Analytics Custom Events screen.
 */
class NewspackCustomEvents extends Component {
	state = {
		ga4Credendials: newspack_analytics_wizard_data.ga4_credentials,
		error: false,
	};

	handleAPIError = ( { message: error } ) => this.setState( { error } );

	updateGa4Credentials = () => {
		const { wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/analytics/ga4-credentials',
			method: 'POST',
			quiet: true,
			data: {
				measurement_id: this.state.ga4Credendials.measurement_id,
				measurement_protocol_secret: this.state.ga4Credendials.measurement_protocol_secret,
			},
		} )
			.then( response => this.setState( { ga4Credendials: response, error: false } ) )
			.catch( this.handleAPIError );
	};

	render() {
		const { error, ga4Credendials } = this.state;
		const { isLoading } = this.props;

		return (
			<div className="newspack__analytics-configuration">
				<div className="newspack__analytics-configuration__header">
					<SectionHeader
						title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
						description={ __(
							'Allows Newspack to send enhanced custom event data to your Google Analytics.',
							'newspack-plugin'
						) }
						noMargin
					/>
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
						value={ ga4Credendials?.measurement_id }
						label={ __( 'Measurement ID', 'newspack-plugin' ) }
						help={ __(
							'You can find this in Site Kit Settings, or in Google Analytics > Admin > Data Streams and clickng the data stream. Example: G-ABCD1234',
							'newspack-plugin'
						) }
						onChange={ value =>
							this.setState( {
								...this.state,
								ga4Credendials: { ...ga4Credendials, measurement_id: value },
							} )
						}
						disabled={ isLoading }
						autoComplete="off"
					/>
					<TextControl
						type="password"
						value={ ga4Credendials?.measurement_protocol_secret }
						label={ __( 'Measurement Protocol API Secret', 'newspack-plugin' ) }
						help={ __(
							'Generate an API secret from your GA dashboard in Admin > Data Streams and opening your data stream. Select "Measurement Protocol API secrets" under the Events section. Create a new secret.',
							'newspack-plugin'
						) }
						onChange={ value =>
							this.setState( {
								...this.state,
								ga4Credendials: { ...ga4Credendials, measurement_protocol_secret: value },
							} )
						}
						disabled={ isLoading }
						autoComplete="off"
					/>
				</Grid>
				<Button
					className="newspack__analytics-newspack-custom-events__save-button"
					variant="primary"
					disabled={ isLoading }
					onClick={ this.updateGa4Credentials }
				>
					{ __( 'Save', 'newspack-plugin' ) }
				</Button>
			</div>
		);
	}
}

export default withWizardScreen( NewspackCustomEvents );
