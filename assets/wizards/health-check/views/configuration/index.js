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
		const { configurationStatus, ampStandardMode, repairConfiguration } = this.props;
		const { amp } = configurationStatus || {};
		return (
			<ActionCard
				className={ amp ? 'newspack-card__is-supported' : 'newspack-card__is-unsupported' }
				title={ __( 'AMP', 'newspack' ) }
				description={
					amp
						? __( 'AMP plugin is in standard mode.', 'newspack' )
						: __( 'AMP plugin is not in standard mode. ', 'newspack' )
				}
				actionText={ ! amp && __( 'Repair', 'newspack' ) }
				onClick={ () => repairConfiguration( 'amp' ) }
			/>
		);
	}
}

export default withWizardScreen( Configuration );
