/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { alignCenter, alignLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ColorPicker,
	TextControl,
	SelectControl,
	ToggleControl,
	SectionHeader,
	ImageUpload,
	hooks,
	Grid,
} from '../../../../components/src';
import ThemeSelection from '../../components/theme-selection';
import { getFontsList, getFontImportURL, LOGO_SIZE_OPTIONS, parseLogoSize } from './utils';

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
				checked={ mods.accent_allcaps === true }
				onChange={ updateMods( 'accent_allcaps' ) }
				label={ __( 'Use all-caps for accent text', 'newspack' ) }
			/>
			<SectionHeader
				title={ __( 'Header', 'newspack' ) }
				description={ __( 'Customize the header and add your logo', 'newspack' ) }
			/>
			<Grid>
				<div>
					<div className="flex items-baseline">
						<SelectControl
							className="mv0 mr3 dib"
							label={ __( 'Style', 'newspack' ) }
							value={ mods.header_center_logo ? 'center' : 'left' }
							onChange={ value => updateMods( 'header_center_logo' )( value === 'center' ) }
							buttonOptions={ [
								{ value: 'left', icon: alignLeft },
								{ value: 'center', icon: alignCenter },
							] }
						/>
						<SelectControl
							className="mv0 dib"
							label={ __( 'Size', 'newspack' ) }
							value={ mods.header_simplified ? 'small' : 'large' }
							onChange={ value => updateMods( 'header_simplified' )( value === 'small' ) }
							buttonOptions={ [ { value: 'small', label: 'S' }, { value: 'large', label: 'L' } ] }
						/>
					</div>
					<div style={ { marginTop: '-32px' } }>
						<ToggleControl
							checked={ mods.header_solid_background }
							onChange={ updateMods( 'header_solid_background' ) }
							label={ __( 'Apply a background color to the header', 'newspack' ) }
						/>
						{ mods.header_solid_background && (
							<ToggleControl
								checked={ mods.header_color !== 'default' }
								onChange={ checked =>
									updateMods( 'header_color' )( checked ? 'custom' : 'default' )
								}
								label={ __( 'Apply a custom background color to the header', 'newspack' ) }
							/>
						) }
						{ mods.header_solid_background && mods.header_color === 'custom' && (
							<ColorPicker
								className="mt2"
								label={ __( 'Background color' ) }
								color={ mods.header_color_hex }
								onChange={ updateMods( 'header_color_hex' ) }
							/>
						) }
					</div>
				</div>
				<div>
					<ImageUpload
						className="mt0"
						style={ {
							height: '96px',
							...( mods.header_solid_background
								? {
										backgroundColor:
											mods.header_color === 'custom'
												? mods.header_color_hex
												: mods.primary_color_hex,
								  }
								: {} ),
						} }
						label={ __( 'Logo', 'newspack' ) }
						image={ mods.custom_logo }
						onChange={ updateMods( 'custom_logo' ) }
					/>
					{ mods.custom_logo && (
						<>
							<SelectControl
								className="mv0 dib"
								label={ __( 'Size', 'newspack' ) }
								value={ parseLogoSize( mods.logo_size ) }
								onChange={ updateMods( 'logo_size' ) }
								buttonOptions={ LOGO_SIZE_OPTIONS }
							/>
							<ToggleControl
								checked={ mods.header_text }
								onChange={ updateMods( 'header_text' ) }
								label={ __( 'Display Site Title', 'newspack' ) }
							/>
							<ToggleControl
								checked={ mods.header_display_tagline }
								onChange={ updateMods( 'header_display_tagline' ) }
								label={ __( 'Display Tagline', 'newspack' ) }
							/>
						</>
					) }
				</div>
			</Grid>
			<SectionHeader
				title={ __( 'Footer', 'newspack' ) }
				description={ __( 'Personalize the footer of your site', 'newspack' ) }
			/>
			<Grid>
				<div>
					<TextControl
						className="mt0"
						label={ __( 'Copyright information', 'newspack' ) }
						help={ __(
							'Add custom text to be displayed next to a copyright symbol and current year in the footer. By default, it will display your site title.',
							'newspack'
						) }
						value={ mods.footer_copyright || '' }
						onChange={ updateMods( 'footer_copyright' ) }
					/>
					<ToggleControl
						className="mv0"
						checked={ mods.footer_color !== 'default' }
						onChange={ checked => updateMods( 'footer_color' )( checked ? 'custom' : 'default' ) }
						label={ __( 'Apply a background color to the footer', 'newspack' ) }
					/>
					{ mods.footer_color === 'custom' && (
						<ColorPicker
							className="mt2"
							label={ __( 'Background color' ) }
							color={ mods.footer_color_hex }
							onChange={ updateMods( 'footer_color_hex' ) }
						/>
					) }
				</div>
				<ImageUpload
					label={ __( 'Alternative Logo', 'newspack' ) }
					info={ __( 'Optional alternative logo to be displayed in the footer.', 'newspack' ) }
					style={ {
						height: '96px',
						...( mods.footer_color === 'custom' && mods.footer_color_hex
							? { backgroundColor: mods.footer_color_hex }
							: {} ),
					} }
					image={ mods.newspack_footer_logo }
					onChange={ updateMods( 'newspack_footer_logo' ) }
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
