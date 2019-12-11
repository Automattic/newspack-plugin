/**
 * Revenue Main Screen
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
		const publishedIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
			</SVG>
		);
		return (
			<Fragment>
				{ donationPage && (
					<Fragment>
						{ 'publish' !== donationPage.status && (
							<div className="newspack-memberships-page-wizard-wizard__notice">
								{ __(
									'Your donations landing page has been created, but is not yet published. You can now edit it and publish when you\'re ready.'
								) }
							</div>
						) }
						{ 'publish' === donationPage.status && (
							<div className="newspack-memberships-page-wizard-wizard__notice setup-success">
								{ __( 'Your memberships landing page is set up and published.' ) }
								{ publishedIcon }
							</div>
						) }
						<div className="newspack-buttons-card">
							<Handoff
								plugin="woocommerce"
								editLink={ donationPage.editUrl }
								isPrimary
								showOnBlockEditor
							>
								{ __( 'Edit Memberships Page' ) }
							</Handoff>
						</div>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( ConfigureLandingPage );
