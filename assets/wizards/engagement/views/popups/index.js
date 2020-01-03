/**
 * Popups screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Disqus dependencies
 */
import { ActionCard, PluginInstaller, withWizardScreen } from '../../../../components/src';

/**
 * Popups Screen
 */
class Popups extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			pluginRequirementsMet: false,
		};
	}
	/**
	 * Render.
	 */
	render() {
		const { pluginRequirementsMet } = this.state;
		if ( ! pluginRequirementsMet ) {
			return (
				<PluginInstaller
					plugins={ [ 'newspack-popups' ] }
					onStatus={ ( { complete } ) => this.setState( { pluginRequirementsMet: complete } ) }
				/>
			);
		}
		return (
			<Fragment>
				<p>{ __( 'Explanatory text TK' ) }</p>
				<ActionCard
					title={ __( 'Newspack Pop-ups' ) }
					description={ __( 'AMP-compatible popup notifications.' ) }
					actionText={ __( 'Configure' ) }
					href="edit.php?post_type=newspack_popups_cpt"
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( Popups );
