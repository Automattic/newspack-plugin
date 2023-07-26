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
						title={ __( 'Additional Newspack Custom Events', 'newspack' ) }
						description={ __(
							'Adds support for back-end events tracking for Google Analytics 4',
							'newspack'
						) }
						noMargin
					/>
					<p>
						{ __(
							'Newspack tracks some custom events to your configured Google Analytics account.',
							'newspack'
						) }
						{ __(
							"By adding the credentials below, you will enable additional events that are fired from your site's backend, like when a donation is confirmed or when a user subscribes to a Newsletter.",
							'newspack'
						) }
					</p>
				</div>

				{ error && <Notice isError noticeText={ error } /> }
				<Grid noMargin rowGap={ 16 }>
					<TextControl
						value={ ga4Credendials?.measurement_id }
						label={ __( 'Measurement ID', 'newspack' ) }
						help={ __(
							'The same measurement ID you have configured in your GA plugin. Example: G-ABCD1234',
							'newspack'
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
						label={ __( 'Measurement Protocol API Secret', 'newspack' ) }
						help={ __(
							'You can grab your API Secret from your Google Analytics dashboard in Admin > Dat a Stream. Click in your data stream and then on Measurement Protocol API secrets',
							'newspack'
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
					{ __( 'Save', 'newspack' ) }
				</Button>
			</div>
		);
	}
}

export default withWizardScreen( NewspackCustomEvents );
