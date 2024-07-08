/**
 * Newspack > Settings > Social
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import WizardsPluginCard from '../../../../wizards-plugin-card';

function Publicize() {
	return (
		<WizardsPluginCard
			name={ __( 'Publicize', 'newspack-plugin' ) }
			badge="Jetpack"
			slug="jetpack"
			path=""
			description={ __(
				"Publicize makes it easy to share your site's posts on several social media networks automatically when you publish a new post.",
				'newspack-plugin'
			) }
			actionText={ __( 'Configure', 'newspack-plugin' ) }
			// handoff="jetpack"
			editLink="admin.php?page=jetpack#/sharing"
		/>
	);
}

export default Publicize;
