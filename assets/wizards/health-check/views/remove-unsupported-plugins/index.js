/**
 * Remove unsupported plugins.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Button, withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * SEO Intro screen.
 */
class RemoveUnsupportedPlugins extends Component {
	/**
	 * Render.
	 */
	render() {
		const { unsupportedPlugins, deactivateAllPlugins } = this.props;
		const unhealthyIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
			</SVG>
		);
		const healthyIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
			</SVG>
		);
		return (
			<Fragment>
				{ unsupportedPlugins && unsupportedPlugins.length > 0 && (
					<Fragment>
						<p className="newspack-text-intro is-unhealthy">
							{ unhealthyIcon }
							{ __( 'Newspack does not support these plugins:' ) }
						</p>
						{ unsupportedPlugins.map( unsupportedPlugin => (
							<ActionCard
								title={ unsupportedPlugin.Name }
								key={ unsupportedPlugin.Slug }
								description={ unsupportedPlugin.Description }
								className= "newspack-card__is-unsupported"
							/>
						) ) }
						<div className="newspack-buttons-card">
							<Button isPrimary onClick={ deactivateAllPlugins }>
								{ __( 'Deactivate All' ) }
							</Button>
						</div>
					</Fragment>
				) }
				{ unsupportedPlugins && unsupportedPlugins.length === 0 && (
					<Fragment>
						<p className="newspack-text-intro is-healthy">
							{ healthyIcon }
							{ __( 'No unsupported plugins found.' ) }
						</p>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( RemoveUnsupportedPlugins );
