/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { withWizardScreen, Handoff } from '../../../components/src';

/**
 * Screen for handing off to Site Kit AdSense setup.
 */
class GoogleAnalyticsSetup extends Component {

	/**
	 * Render.
	 */
	render() {
		const { complete } = this.props;

		return(
			<Fragment>
				{ complete && (
					<div className='newspack-google-analytics-wizard__success'>
						<Dashicon icon="yes-alt" />
						<h4>{ __( 'Google Analytics is set up' ) }</h4>
					</div>
				) }
				<Handoff
					plugin='google-site-kit'
					editLink='admin.php?page=googlesitekit-module-analytics'
					className='is-centered'
					isPrimary={ ! complete }
					isDefault={ !! complete }
				>{ complete ? __( 'Google Analytics Settings' ) : __( 'Set up Google Analytics' ) }</Handoff>
			</Fragment>
		);
	}
}

export default withWizardScreen( GoogleAnalyticsSetup );