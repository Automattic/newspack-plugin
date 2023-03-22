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
						title={ __( 'Jetpack', 'newspack' ) }
						description={
							jetpack
								? __( 'Jetpack is connected.', 'newspack' )
								: __( 'Jetpack is not connected. ', 'newspack' )
						}
						actionText={ ! jetpack && __( 'Connect', 'newspack' ) }
						handoff="jetpack"
					/>
					<ActionCard
						className={ sitekit ? 'newspack-card__is-supported' : 'newspack-card__is-unsupported' }
						title={ __( 'Google Site Kit', 'newspack' ) }
						description={
							sitekit
								? __( 'Site Kit is connected.', 'newspack' )
								: __( 'Site Kit is not connected. ', 'newspack' )
						}
						actionText={ ! sitekit && __( 'Connect', 'newspack' ) }
						handoff="google-site-kit"
					/>
				</Fragment>
			)
		);
	}
}

export default withWizardScreen( Configuration );
