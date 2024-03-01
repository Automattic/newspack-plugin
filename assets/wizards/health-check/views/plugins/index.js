/**
 * Remove unsupported plugins.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Grid,
	PluginInstaller,
	Notice,
	withWizardScreen,
} from '../../../../components/src';

/**
 * SEO Intro screen.
 */
class Plugins extends Component {
	/**
	 * Render.
	 */
	render() {
		const { unsupportedPlugins, missingPlugins, deactivateAllPlugins } = this.props;
		return (
			<Grid columns={ 1 } gutter={ 64 }>
				{ missingPlugins.length ? (
					<Grid columns={ 1 } gutter={ 16 }>
						<Notice
							noticeText={ __( 'These plugins shoud be active:', 'newspack-plugin' ) }
							isWarning
						/>
						<PluginInstaller plugins={ missingPlugins } />
					</Grid>
				) : null }
				{ unsupportedPlugins.length ? (
					<Grid columns={ 1 } gutter={ 16 }>
						<Notice
							noticeText={ __( 'Newspack does not support these plugins:', 'newspack-plugin' ) }
							isError
						/>
						{ unsupportedPlugins.map( unsupportedPlugin => (
							<ActionCard
								title={ unsupportedPlugin.Name }
								key={ unsupportedPlugin.Slug }
								description={ unsupportedPlugin.Description }
								className="newspack-card__is-unsupported"
							/>
						) ) }
						<div className="newspack-buttons-card">
							<Button isPrimary onClick={ deactivateAllPlugins }>
								{ __( 'Deactivate All', 'newspack-plugin' ) }
							</Button>
						</div>
					</Grid>
				) : (
					<Notice
						noticeText={ __( 'No unsupported plugins found.', 'newspack-plugin' ) }
						isSuccess
					/>
				) }
			</Grid>
		);
	}
}

export default withWizardScreen( Plugins );
