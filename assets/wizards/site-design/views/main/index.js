/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ColorPicker,
	SelectControl,
	ToggleControl,
	SectionHeader,
	hooks,
	Grid,
} from '../../../../components/src';
import ThemeSelection from '../../components/theme-selection';
import { getFontsList, getFontImportURL } from './utils';

const Main = ( { wizardApiFetch, setError, renderPrimaryButton, buttonText } ) => {
	const [ themeSlug, updateThemeSlug ] = useState();
	const [ mods, updateMods ] = hooks.useObjectState();

	const updateSettings = response => {
		updateMods( response.theme_mods );
		updateThemeSlug( response.theme );
	};
	useEffect( () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
		} )
			.then( updateSettings )
			.catch( setError );
	}, [] );

	const saveSettings = () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/',
			method: 'POST',
			data: { theme_mods: mods, theme: themeSlug },
			quiet: true,
		} )
			.then( updateSettings )
			.catch( setError );
	};

	return (
		<>
			<SectionHeader
				title={ __( 'Theme', 'newspack' ) }
				description={ __( 'Activate a theme you like to get started', 'newspack' ) }
			/>
			<ThemeSelection theme={ themeSlug } updateTheme={ updateThemeSlug } />
			<SectionHeader
				title={ __( 'Colors', 'newspack' ) }
				description={ __( 'Define your primary and secondary colors', 'newspack' ) }
			/>
			<Grid>
				<ColorPicker
					label={ __( 'Primary' ) }
					color={ mods.primary_color_hex }
					onChange={ updateMods( 'primary_color_hex' ) }
				/>
				<ColorPicker
					label={ __( 'Secondary' ) }
					color={ mods.secondary_color_hex }
					onChange={ updateMods( 'secondary_color_hex' ) }
				/>
			</Grid>
			<SectionHeader
				title={ __( 'Typography', 'newspack' ) }
				description={ __( 'Pick the font pairing to use throughout your site', 'newspack' ) }
			/>
			<Grid>
				<SelectControl
					label={ __( 'Headings', 'newspack' ) }
					optgroups={ getFontsList( true ) }
					value={ mods.font_header }
					onChange={ value =>
						updateMods( {
							font_header: value,
							custom_font_import_code: getFontImportURL( value ),
						} )
					}
				/>
				<SelectControl
					label={ __( 'Body', 'newspack' ) }
					optgroups={ getFontsList() }
					value={ mods.font_body }
					onChange={ value =>
						updateMods( {
							font_body: value,
							custom_font_import_code_alternate: getFontImportURL( value ),
						} )
					}
				/>
			</Grid>
			<ToggleControl
				checked={ mods.accent_allcaps }
				onChange={ updateMods( 'accent_allcaps' ) }
				label={ __( 'Use all-caps for accent text', 'newspack' ) }
			/>
			<div className="newspack-buttons-card">
				{ renderPrimaryButton( {
					onClick: saveSettings,
					children: buttonText || __( 'Save', 'newspack' ),
				} ) }
			</div>
		</>
	);
};

export default withWizardScreen( Main, { hidePrimaryButton: true } );
