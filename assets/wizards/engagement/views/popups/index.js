/**
 * Popups screen.
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, PluginInstaller, SelectControl, withWizardScreen } from '../../../../components/src';

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
				<ActionCard
					title={ __( 'Newspack Pop-ups' ) }
					description={ __( 'AMP-compatible popup notifications.' ) }
					actionText={ __( 'Manage' ) }
					href="edit.php?post_type=newspack_popups_cpt"
				/>
				<hr />
				<h2>{ __( 'Configure active Pop-up' ) }</h2>
				<SelectControl
					label={ __( 'Sitewide default' ) }
					value={ '' }
					options={ [
						{ value: '', label: __( '- Select -' ), disabled: true }
					] }
					value={ '' }
				/>
				<div className="newspack-buttons-card">
					<Button onClick="/post-new.php?post_type=newspack_popups_cpt" isPrimary>
						{ __( 'Add new Pop-up' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( Popups );
