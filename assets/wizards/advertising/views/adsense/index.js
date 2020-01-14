/**
 * Ad Sense "management" screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen, Card, Handoff, Notice } from '../../../../components/src';

/**
 * Screen for handing off to Site Kit AdSense setup.
 */
class AdSense extends Component {
	/**
	 * Render.
	 */
	render() {
		const { complete } = this.props;

		return (
			<Fragment>
				{ complete && <Notice isSuccess noticeText={ __( 'AdSense is set up.' ) } /> }
				<Card noBackground className="newspack-card__buttons-card">
					<Handoff
						plugin="google-site-kit"
						editLink="admin.php?page=googlesitekit-module-adsense"
						className="is-centered"
						isDefault
					>
						{ complete ? __( 'AdSense Settings' ) : __( 'Set up Google AdSense' ) }
					</Handoff>
				</Card>
			</Fragment>
		);
	}
}

export default withWizardScreen( AdSense );
