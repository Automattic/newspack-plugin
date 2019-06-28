/**
 * Location setup Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Handoff, withWizardScreen } from '../../../../components/src';
import { PluginLinkCard } from '../../components/';
import './style.scss';

/**
 * Location Setup Screen.
 */
class ConfigurePlugins extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pluginInfoReady } = this.props;
		return (
			<div className="newspack-setup-wizard__configure-plugins">
				<PluginLinkCard plugin="jetpack" onReady={ pluginInfoReady }>
					{ __(
						'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
					) }
				</PluginLinkCard>
				<PluginLinkCard plugin="google-site-kit" onReady={ pluginInfoReady }>
					{ __( 'Bringing the best of Google tools to WordPress. ' ) }
				</PluginLinkCard>
			</div>
		);
	}
}

ConfigurePlugins.defaultProps = {
	pluginInfoReady: () => {},
};

export default withWizardScreen( ConfigurePlugins );
