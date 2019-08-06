/**
 * Revenue Main Screen
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Handoff, Button, withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * Revenue Main Screen Component
 */
class ConfigureLandingPage extends Component {

	/**
	 * Render.
	 */
	render() {
		const { donationPage } = this.props;
		return (
			<Fragment>
				{ donationPage && (
					<Fragment>
						{ 'publish' !== donationPage.status && (
							<div className="newspack-memberships-page-wizard-wizard__notice">
								<Dashicon icon="warning" />
								<h4>
									{ __(
										'Your donations landing page has been created, but is not yet published. You can now edit it and publish when you\'re ready.'
									) }
								</h4>
							</div>
						) }
						{ 'publish' === donationPage.status && (
							<div className="newspack-memberships-page-wizard-wizard__notice setup-success">
								<Dashicon icon="yes-alt" />
								<h4>{ __( 'Your memberships landing page is set up and published.' ) }</h4>
							</div>
						) }
						<Handoff
							plugin="woocommerce"
							editLink={ donationPage.editUrl }
							className="is-centered"
							isDefault={ 'publish' === donationPage.status }
							isPrimary={ 'publish' !== donationPage.status }
							showOnBlockEditor
						>
							{ __( 'Edit Memberships Page' ) }
						</Handoff>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( ConfigureLandingPage );
