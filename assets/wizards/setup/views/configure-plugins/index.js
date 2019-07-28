/**
 * Configure Plugins Screen
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';
import { PluginLinkCard } from '../../components/';

/**
 * Configure Plugins Screen
 */
class ConfigurePlugins extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pluginInfoReady, plugin } = this.props;
		return (
			<div className="newspack-setup-wizard__configure-plugins">
				<PluginLinkCard plugin={ plugin } onReady={ pluginInfoReady }>
					{ 'jetpack' === plugin &&
						__(
							'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
						) }
					{ 'google-site-kit' === plugin &&
						__(
							'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
						) }
				</PluginLinkCard>
			</div>
		);
	}
}

ConfigurePlugins.defaultProps = {
	pluginInfoReady: () => {},
};

export default withWizardScreen( ConfigurePlugins );
