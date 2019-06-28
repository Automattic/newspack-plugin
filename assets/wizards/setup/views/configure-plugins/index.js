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
	constructor() {
		super( ...arguments );
		this.state = {
			configured: {},
		};
	}

	handoffReady = pluginInfo => {
		const { onAllConfigured } = this.props;
		const { configured } = this.state;
		if ( pluginInfo.Configured ) {
			configured[ pluginInfo.Slug ] = true;
		}
		this.setState(
			{ configured },
			() =>
				configured[ 'google-site-kit' ] && configured[ 'jetpack' ] && onAllConfigured( configured )
		);
	};

	/**
	 * Render.
	 */
	render() {
		return (
			<div className="newspack-setup-wizard__configure-plugins">
				<PluginLinkCard plugin="jetpack" onReady={ this.handoffReady }>
					{ __(
						'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
					) }
				</PluginLinkCard>
				<PluginLinkCard plugin="google-site-kit" onReady={ this.handoffReady }>
					{ __( 'Bringing the best of Google tools to WordPress. ' ) }
				</PluginLinkCard>
			</div>
		);
	}
}

ConfigurePlugins.defaultProps = {
	onAllConfigured: () => null,
};

export default withWizardScreen( ConfigurePlugins );
