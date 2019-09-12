/**
 * Remove unsupported plugins.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Button, withWizardScreen } from '../../../../components/src';

/**
 * SEO Intro screen.
 */
class RemoveUnsupportedPlugins extends Component {
	/**
	 * Render.
	 */
	render() {
		const { unsupportedPlugins, deactivateAllPlugins } = this.props;
		return (
			<Fragment>
				{ unsupportedPlugins && unsupportedPlugins.length > 0 && (
					<Fragment>
						<h2>{ __( 'Newspack Does Not Support These Plugins' ) }</h2>
						{ unsupportedPlugins.map( unsupportedPlugin => (
							<ActionCard
								title={ unsupportedPlugin.Name }
								key={ unsupportedPlugin.Slug }
								description={ unsupportedPlugin.Description }
							/>
						) ) }
						<Button isPrimary onClick={ deactivateAllPlugins }>
							{ __( 'Deactivate All' ) }
						</Button>
					</Fragment>
				) }
				{ unsupportedPlugins && unsupportedPlugins.length === 0 && <h2>{ __( 'No Unsupported Plugins Found' ) }</h2> }
			</Fragment>
		);
	}
}

export default withWizardScreen( RemoveUnsupportedPlugins );
