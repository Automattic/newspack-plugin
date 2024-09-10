/**
 * Newspack > Settings > Emails.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import AuthorBio from './author-bio';
import Recirculation from './recirculation';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { Button, hooks } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

export default function DisplaySettings() {
	const [ data, setData ] = hooks.useObjectState< DisplaySettingsData >( {
		// Recirculation.
		relatedPostsEnabled: false,
		relatedPostsError: null,
		relatedPostsMaxAge: 0,
		relatedPostsUpdated: false,
		// Author Bio.
		show_author_bio: true,
		show_author_email: false,
		author_bio_length: 200,
		// Default settings.
		featured_image_default: 'large',
		post_template_default: 'default',
		featured_image_all_posts: 'none',
		post_template_all_posts: 'none',
		newspack_image_credits_placeholder_url: '',
		newspack_image_credits_class_name: '',
		newspack_image_credits_prefix_label: '',
		newspack_image_credits_auto_populate: false,
	} );

	const { wizardApiFetch } = useWizardApiFetch(
		'newspack-settings/display-settings'
	);

	useEffect( () => {
		wizardApiFetch< RecirculationData >(
			{
				path: '/newspack/v1/wizard/newspack-settings/related-content',
			},
			{
				onSuccess: setData,
			}
		);
		wizardApiFetch< RecirculationData >(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			},
			{
				// onSuccess( { theme_mods } ) {
				// 	setData( theme_mods );
				// },
			}
		);
	}, [] );

	function save() {
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
				method: 'POST',
				updateCacheMethods: [ 'GET' ],
				data: { theme_mods: data },
			},
			{
				onSuccess: setData,
			}
		);
	}

	return (
		<WizardsTab title={ __( 'Display Settings', 'newspack-plugin' ) }>
			<pre>{ JSON.stringify( data, null, 2 ) }</pre>
			<WizardSection title={ __( 'Recirculation', 'newspack-plugin' ) }>
				<Recirculation update={ setData } data={ data } />
			</WizardSection>
			<WizardSection title={ __( 'Author Bio', 'newspack-plugin' ) }>
				<AuthorBio
					update={ theme_mods => setData( {} /* { theme_mods } */ ) }
					data={ data }
				/>
			</WizardSection>
			<div className="newspack-buttons-card">
				<Button variant="tertiary">
					{ __( 'Advanced Settings', 'newspack-plugin' ) }
				</Button>
				<Button variant="primary" onClick={ save }>
					{ __( 'Save', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
}
