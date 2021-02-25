/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ColorPicker,
	SectionHeader,
	hooks,
	Grid,
} from '../../../../components/src';
import ThemeSelection from '../../components/theme-selection';

const Main = ( { wizardApiFetch, setError, renderPrimaryButton, buttonText } ) => {
	const [ settings, updateSettings ] = hooks.useObjectState( { theme: null, theme_mods: {} } );
	useEffect( () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
		} )
			.then( updateSettings )
			.catch( setError );
	}, [] );

	const updateTheme = theme => {
		updateSettings( { theme } );
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/' + theme,
			method: 'POST',
		} )
			.then( updateSettings )
			.catch( setError );
	};
	const saveSettings = () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme-mods/',
			method: 'POST',
			data: settings,
			quiet: true,
		} )
			.then( updateSettings )
			.catch( setError );
	};

	const mods = settings.theme_mods;
	const updateThemeMod = key => value => updateSettings( { theme_mods: { [ key ]: value } } );

	return (
		<>
			<SectionHeader
				title={ __( 'Theme', 'newspack' ) }
				description={ __( 'Activate a theme you like to get started', 'newspack' ) }
			/>
			<ThemeSelection theme={ settings.theme } updateTheme={ updateTheme } />
			<SectionHeader
				title={ __( 'Colors', 'newspack' ) }
				description={ __( 'Define your primary and secondary colors', 'newspack' ) }
			/>
			<Grid>
				<ColorPicker
					label={ __( 'Primary' ) }
					color={ mods.primary_color_hex }
					onChange={ updateThemeMod( 'primary_color_hex' ) }
				/>
				<ColorPicker
					label={ __( 'Secondary' ) }
					color={ mods.secondary_color_hex }
					onChange={ updateThemeMod( 'secondary_color_hex' ) }
				/>
			</Grid>
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
