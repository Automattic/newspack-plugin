/**
 * Settings Wizard: Connections > Plugins
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsPluginCard from '../../../../wizards-plugin-card';

const { plugins: pluginsSection, analytics: analyticsSection } =
	window.newspackSettings.connections.sections;

const PLUGINS: Record< string, PluginCard > = {
	jetpack: {
		slug: 'jetpacks',
		path: '/newspack/v1/plugins/jetpacks',
		title: __( 'Jetpack', 'newspack-plugin' ),
		editLink: 'admin.php?page=jetpack#/settings',
	},
	'google-site-kit': {
		slug: 'google-site-kit',
		path: '/newspack/v1/plugins/google-site-kit',
		editLink: analyticsSection.editLink,
		title: __( 'Site Kit by Google', 'newspack-plugin' ),
		statusDescription: {
			notConfigured: __( 'Not connected for this user', 'newspack-plugin' ),
		},
	},
	everlit: {
		slug: 'everlit',
		path: '/newspack/v1/plugins/everlit',
		editLink: 'admin.php?page=everlit_settings',
		title: __( 'Everlit', 'newspack-plugin' ),
		subTitle: __( 'AI-Generated Audio Stories', 'newspack-plugin' ),
		description: (
			<>
				{ __(
					'Complete setup and licensing agreement to unlock 5 free audio stories per month.',
					'newspack-plugin'
				) }{ ' ' }
				<a href="https://everlit.audio/" target="_blank" rel="noreferrer">
					{ __( 'Learn more', 'newspack-plugin' ) }
				</a>
			</>
		),
		statusDescription: {
			uninstalled: __( 'Not installed.', 'newspack-plugin' ),
			inactive: __( 'Inactive.', 'newspack-plugin' ),
			notConfigured: __( 'Pending.', 'newspack-plugin' ),
		},
	},
};

/**
 * Newspack Settings Plugins section.
 */
function Plugins() {
	const plugins = Object.keys( PLUGINS ).reduce(
		( acc: Record< string, PluginCard >, pluginKey ) => {
			if ( ! Boolean( PLUGINS[ pluginKey ].isHidden ) ) {
				acc[ pluginKey ] = {
					...PLUGINS[ pluginKey ],
					isHidden: ( pluginsSection.enabled?.[ pluginKey ] ?? false ) === false,
				};
			}
			return acc;
		},
		{}
	);
	return (
		<Fragment>
			{ Object.keys( plugins ).map( pluginKey => {
				return <WizardsPluginCard key={ pluginKey } { ...plugins[ pluginKey ] } />;
			} ) }
		</Fragment>
	);
}

export default Plugins;
