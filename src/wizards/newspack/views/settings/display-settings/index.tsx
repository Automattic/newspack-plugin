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
import { DEFAULT_THEME_MODS } from '../constants';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { Button, hooks } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

export default function DisplaySettings() {
	const [ data, setData ] = hooks.useObjectState< DisplaySettings >( {
		...DEFAULT_THEME_MODS,
	} );

	const [ recirculationData, setRecirculationData ] =
		hooks.useObjectState< Recirculation >( {
			relatedPostsMaxAge: 0,
			relatedPostsEnabled: false,
			relatedPostsError: null,
			relatedPostsUpdated: false,
		} );

	const { wizardApiFetch, isFetching } = useWizardApiFetch(
		'newspack-settings/display-settings'
	);

	useEffect( () => {
		wizardApiFetch< Recirculation >(
			{
				path: '/newspack/v1/wizard/newspack-settings/related-content',
			},
			{
				onSuccess: setRecirculationData,
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
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-settings/related-posts-max-age',
				method: 'POST',
				updateCacheKey: {
					'/newspack/v1/wizard/newspack-settings/related-content':
						'GET',
				},
				data: recirculationData,
			},
			{
				onSuccess: setRecirculationData,
			}
		);
	}

	return (
		<WizardsTab
			title={ __( 'Display Settings', 'newspack-plugin' ) }
			isFetching={ isFetching }
		>
			<WizardSection title={ __( 'Recirculation', 'newspack-plugin' ) }>
				<Recirculation
					update={ setRecirculationData }
					data={ recirculationData }
				/>
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
