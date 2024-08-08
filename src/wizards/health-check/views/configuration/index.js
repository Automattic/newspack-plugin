/**
 * Notify about site misconfigurations.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';

/**
 * SEO Intro screen.
 */
class Configuration extends Component {
	/**
	 * Render.
	 */
	render() {
		const { configurationStatus, hasData } = this.props;
		const { jetpack, sitekit } = configurationStatus || {};
		return (
			hasData && (
				<Fragment>
					<ActionCard
						className={ jetpack ? 'newspack-card__is-supported' : 'newspack-card__is-unsupported' }
						title={ __( 'Jetpack', 'newspack-plugin' ) }
						description={
							jetpack
								? __( 'Jetpack is connected.', 'newspack-plugin' )
								: __( 'Jetpack is not connected. ', 'newspack-plugin' )
						}
						actionText={ ! jetpack && __( 'Connect', 'newspack-plugin' ) }
						handoff="jetpack"
					/>
					<ActionCard
						className={ sitekit ? 'newspack-card__is-supported' : 'newspack-card__is-unsupported' }
						title={ __( 'Google Site Kit', 'newspack-plugin' ) }
						description={
							sitekit
								? __( 'Site Kit is connected.', 'newspack-plugin' )
								: __( 'Site Kit is not connected. ', 'newspack-plugin' )
						}
						actionText={ ! sitekit && __( 'Connect', 'newspack-plugin' ) }
						handoff="google-site-kit"
					/>
				</Fragment>
			)
		);
	}
}

export default withWizardScreen( Configuration );
