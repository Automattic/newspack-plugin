/**
 * Configure Plugins Screen
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Configure Plugins Screen
 */
class ConfigurePlugins extends Component {
	componentDidMount = () => {
		const { onMount, plugin } = this.props;
		onMount( plugin );
	};
	/**
	 * Render.
	 */
	render() {
		const { plugin, pluginConfigured } = this.props;
		const classNames = classnames( 'newspack-setup__configure-plugin-card', plugin );
		return (
			<div className="newspack-setup__configure-plugin">
				<div className={ classNames }>
					<p>
						{ 'jetpack' === plugin &&
							__(
								'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
							) }
						{ 'google-site-kit' === plugin &&
							__(
								'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
							) }
					</p>
					{ pluginConfigured && (
						<div className="newspack-service-link_status-container">
							<Dashicon icon="yes" className="checklist__task-icon" />
							{ __( 'Plugin configuration complete' ) }
						</div>
					) }
				</div>
			</div>
		);
	}
}

ConfigurePlugins.defaultProps = {
	plugin: null,
	onMount: () => null,
};

export default withWizardScreen( ConfigurePlugins );
