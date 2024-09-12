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
import { DEFAULT_THEME_MODS } from '../constants';

export default function DisplaySettings() {
	const [ data, setData ] =
		hooks.useObjectState< DisplaySettings >( DEFAULT_THEME_MODS );

	const { wizardApiFetch } = useWizardApiFetch(
		'newspack-settings/display-settings'
	);

	useEffect( () => {
		wizardApiFetch< DisplaySettings >(
			{
				path: '/newspack/v1/wizard/newspack-settings/related-content',
			},
			{
				onSuccess: setData,
			}
		);
		wizardApiFetch< ThemeData >(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			},
			{
				onSuccess( { theme_mods } ) {
					setData( theme_mods );
				},
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
				<AuthorBio update={ setData } data={ data } />
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
