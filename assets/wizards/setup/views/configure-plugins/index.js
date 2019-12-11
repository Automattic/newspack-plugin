/**
 * Configure Plugins Screen
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';
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
		const activeIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
			</SVG>
		);
		return (
			<div className="newspack-setup__configure-plugin">
				<div className={ classNames }>
					<h2>
						{ 'jetpack' === plugin && 'Jetpack' }
						{ 'google-site-kit' === plugin && 'Google Site Kit' }
					</h2>
					<p>
						{ 'jetpack' === plugin &&
							__(
								'The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.'
							) }
						{ 'google-site-kit' === plugin &&
							__(
								'The one-stop solution to deploy, manage, and get insights from critical Google tools to make the site successful on the web.'
							) }
					</p>
					{ pluginConfigured && (
						<div className="newspack-service-link_status-container">
							{ activeIcon }
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
