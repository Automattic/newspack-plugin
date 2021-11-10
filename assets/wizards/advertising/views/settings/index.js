/**
 * Ad Settings view.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginSettings, withWizardScreen } from '../../../../components/src';
import Placements from './placements';

/**
 * Advertising management screen.
 */
class Settings extends Component {
	render() {
		const { adUnits } = this.props;
		return (
			<Fragment>
				<Placements adUnits={ adUnits } />
				<PluginSettings
					pluginSlug="newspack-ads"
					title={ __( 'General Settings', 'newspack' ) }
					description={ __( 'Configure display and advanced settings for your ads.', 'newspack' ) }
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( Settings );
