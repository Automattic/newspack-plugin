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
							<div className="newspack-memberships-page-wizard-wizard__notice setup-error">
								<Dashicon icon="no-alt" />
								<h4>
									{ __(
										'Your memberships landing page is not published yet. You should edit and publish it.'
									) }
								</h4>
							</div>
						) }
						{ 'publish' === donationPage.status && (
							<div className="newspack-memberships-page-wizard-wizard__notice setup-success">
								<Dashicon icon="yes-alt" />
								<h4>{ __( 'Your memberships landing page is set up and live.' ) }</h4>
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
