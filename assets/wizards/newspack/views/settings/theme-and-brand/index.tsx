/**
 * Newspack > Settings > Theme and Brand
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import ThemeSelection from './theme-select';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

function ThemeBrand() {
	const { wizardApiFetch } = useWizardApiFetch( 'newspack-settings/theme-and-brand' );
	const [ data, setDataState ] = useState< ThemeBrandData >( {
		theme: 'newspack-theme',
	} );

	function setData( d: ThemeBrandData ) {
		// Remove unwanted properties
		const { theme_mods, homepage_patterns, ...newData } = d;
		setDataState( { ...data, ...newData } );
	}

	function save() {
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
				method: 'POST',
			},
			{}
		);
	}

	useEffect( () => {
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			},
			{
				onSuccess( data ) {
					setData( data );
				},
			}
		);
	}, [] );

	return (
		<WizardsTab title={ __( 'Theme and Brand', 'newspack-plugin' ) }>
			<pre>{ JSON.stringify( data, null, 2 ) }</pre>
			<WizardSection>
				<ThemeSelection theme="newspack-theme" updateTheme={ e => console.log( 'updating', e ) } />
			</WizardSection>
		</WizardsTab>
	);
}

export default ThemeBrand;
