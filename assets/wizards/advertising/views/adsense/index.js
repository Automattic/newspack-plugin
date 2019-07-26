/**
 * Ad Sense "management" screen.
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
import { withWizardScreen, Handoff } from '../../../../components/src';

/**
 * Screen for handing off to Site Kit AdSense setup.
 */
class AdSense extends Component {

	/**
	 * Render.
	 */
	render() {
		const { complete } = this.props;

		return(
			<Fragment>
				{ complete && (
					<div className='newspack-google-adsense-wizard__success'>
						<Dashicon icon="yes-alt" />
						<h4>{ __( 'AdSense is set up' ) }</h4>
					</div>
				) }
				<Handoff
					plugin='google-site-kit'
					editLink='admin.php?page=googlesitekit-module-adsense'
					className='is-centered'
					isPrimary={ ! complete }
					isDefault={ !! complete }
				>{ complete ? __( 'AdSense Settings' ) : __( 'Set up Google AdSense' ) }</Handoff>
			</Fragment>
		);
	}
}

export default withWizardScreen( AdSense );
