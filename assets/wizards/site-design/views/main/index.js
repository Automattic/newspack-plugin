/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { alignCenter, alignLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { TextareaControl, ToggleControl } from '@wordpress/components';

/**
 * External dependencies
 */
import omit from 'lodash/omit';

/**
 * Internal dependencies
 */
import {
	ButtonCard,
	Card,
	ColorPicker,
	Grid,
	ImageUpload,
	SectionHeader,
	SelectControl,
	StyleCard,
	TextControl,
	WebPreview,
	hooks,
	withWizardScreen,
} from '../../../../components/src';
import ThemeSelection from '../../components/theme-selection';
import {
	getFontsList,
	isFontInOptions,
	getFontImportURL,
	LOGO_SIZE_OPTIONS,
	parseLogoSize,
} from './utils';
import './style.scss';

const TYPOGRAPHY_OPTIONS = [
	{ value: 'curated', label: __( 'Default', 'newspack' ) },
	{ value: 'custom', label: __( 'Custom', 'newspack' ) },
];

const Main = ( { wizardApiFetch, setError, renderPrimaryButton, isPartOfSetup = true } ) => {
	const [ themeSlug, updateThemeSlug ] = useState();
	const [ homepagePatterns, updateHomepagePatterns ] = useState( [] );
	const [ mods, updateMods ] = hooks.useObjectState();
	const [ typographyOptionsType, updateTypographyOptionsType ] = useState(
		TYPOGRAPHY_OPTIONS[ 0 ].value
	);

	const finishSetup = () => {
		const params = {
			path: `/newspack/v1/wizard/newspack-setup-wizard/complete`,
			method: 'POST',
			quiet: true,
		};
		wizardApiFetch( params ).catch( setError );
	};

	const isDisplayingHomepageLayoutPicker = isPartOfSetup && homepagePatterns.length > 0;

	const updateSettings = response => {
		updateMods( response.theme_mods );
		updateThemeSlug( response.theme );
		updateHomepagePatterns( response.homepage_patterns );
		const { font_header: headerFont, font_body: bodyFont } = response.theme_mods;
		if (
			( headerFont && ! isFontInOptions( headerFont ) ) ||
			( bodyFont && ! isFontInOptions( bodyFont ) )
		) {
			updateTypographyOptionsType( TYPOGRAPHY_OPTIONS[ 1 ].value );
		}
	};
	useEffect( () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
		} )
			.then( updateSettings )
			.catch( setError );
	}, [] );

	const saveSettings = () =>
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/theme/',
			method: 'POST',
			data: {
				theme_mods: omit(
					mods,
					isDisplayingHomepageLayoutPicker ? [] : [ 'homepage_pattern_index' ]
				),
				theme: themeSlug,
			},
			quiet: true,
		} )
			.then( updateSettings )
			.catch( setError );

	const renderCustomFontChoice = type => {
		const isHeadings = type === 'headings';
		const label = isHeadings ? __( 'Headings', 'newspack' ) : __( 'Body', 'newspack' );
		return (
			<Grid columns={ 1 } gutter={ 16 }>
				<TextareaControl
					label={ label + ' - ' + __( 'Font provider import code or URL', 'newspack' ) }
					placeholder={
						'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap'
					}
					value={
						isHeadings ? mods.custom_font_import_code : mods.custom_font_import_code_alternate
					}
					onChange={ updateMods(
						isHeadings ? 'custom_font_import_code' : 'custom_font_import_code_alternate'
					) }
					rows={ 3 }
				/>
				<TextControl
					label={ label + ' - ' + __( 'Font name', 'newspack' ) }
					value={ isHeadings ? mods.font_header : mods.font_body }
					onChange={ updateMods( isHeadings ? 'font_header' : 'font_body' ) }
				/>
				<SelectControl
					label={ label + ' - ' + __( 'Font fallback stack', 'newspack' ) }
					options={ [
						{ value: 'serif', label: __( 'Serif', 'newspack' ) },
						{ value: 'sans-serif', label: __( 'Sans Serif', 'newspack' ) },
						{ value: 'display', label: __( 'Display', 'newspack' ) },
						{ value: 'monospace', label: __( 'Monospace', 'newspack' ) },
					] }
					value={ isHeadings ? mods.font_header_stack : mods.font_body_stack }
					onChange={ updateMods( isHeadings ? 'font_header_stack' : 'font_body_stack' ) }
				/>
			</Grid>
		);
	};

	return (
		<Card noBorder className="newspack-design">
			{ ! isPartOfSetup && (
				<>
					<SectionHeader
						title={ __( 'Theme', 'newspack' ) }
						description={ __( 'Select the theme for your site', 'newspack' ) }
					/>
					<ThemeSelection theme={ themeSlug } updateTheme={ updateThemeSlug } />
				</>
			) }
			{ isDisplayingHomepageLayoutPicker ? (
				<>
					<SectionHeader
						title={ __( 'Homepage', 'newspack' ) }
						description={ __( 'Select a homepage layout', 'newspack' ) }
						className="newspack-design__header"
					/>
					<Grid columns={ 6 } gutter={ 16 }>
						{ homepagePatterns.map( ( pattern, i ) => (
							<StyleCard
								key={ i }
								image={ { __html: pattern.image } }
								imageType="html"
								isActive={ i === mods.homepage_pattern_index }
								onClick={ () => updateMods( { homepage_pattern_index: i } ) }
								ariaLabel={ __( 'Activate Layout', 'newspack' ) + ' ' + ( i + 1 ) }
							/>
						) ) }
					</Grid>
				</>
			) : null }
			<SectionHeader
				title={ __( 'Colors', 'newspack' ) }
				description={ __( 'Pick your primary and secondary colors', 'newspack' ) }
			/>
			<Grid gutter={ 32 }>
				{ /* This UI does not enable setting 'theme_colors' to 'default'. As soon as a color is picked, 'theme_colors' will be 'custom'. */ }
				<ColorPicker
					label={ __( 'Primary' ) }
					color={ mods.primary_color_hex }
					onChange={ primary_color_hex =>
						updateMods( { primary_color_hex, theme_colors: 'custom' } )
					}
				/>
				<ColorPicker
					label={ __( 'Secondary' ) }
					color={ mods.secondary_color_hex }
					onChange={ secondary_color_hex =>
						updateMods( { secondary_color_hex, theme_colors: 'custom' } )
					}
				/>
			</Grid>
			<SectionHeader
				title={ __( 'Typography', 'newspack' ) }
				description={ __( 'Define the font pairing to use throughout your site', 'newspack' ) }
			/>
			<Grid columns={ 1 } gutter={ 16 }>
				<SelectControl
					label={ __( 'Typography Options', 'newspack' ) }
					hideLabelFromVision
					value={ typographyOptionsType ? typographyOptionsType : 'curated' }
					onChange={ updateTypographyOptionsType }
					buttonOptions={ TYPOGRAPHY_OPTIONS }
				/>
				<Grid gutter={ 32 }>
					{ typographyOptionsType === 'curated' ? (
						<>
							<SelectControl
								label={ __( 'Headings', 'newspack' ) }
								optgroups={ getFontsList( true ) }
								value={ mods.font_header }
								onChange={ ( value, group ) =>
									updateMods( {
										font_header: value,
										custom_font_import_code: getFontImportURL( value ),
										font_header_stack: group?.fallback,
									} )
								}
							/>
							<SelectControl
								label={ __( 'Body', 'newspack' ) }
								optgroups={ getFontsList() }
								value={ mods.font_body }
								onChange={ ( value, group ) =>
									updateMods( {
										font_body: value,
										custom_font_import_code_alternate: getFontImportURL( value ),
										font_body_stack: group?.fallback,
									} )
								}
							/>
						</>
					) : (
						<>
							{ renderCustomFontChoice( 'headings' ) }
							{ renderCustomFontChoice( 'body' ) }
						</>
					) }
				</Grid>
				<ToggleControl
					checked={ mods.accent_allcaps === true }
					onChange={ updateMods( 'accent_allcaps' ) }
					label={ __( 'Use all-caps for accent text', 'newspack' ) }
				/>
			</Grid>
			<SectionHeader
				title={ __( 'Header', 'newspack' ) }
				description={ __( 'Update the header and add your logo', 'newspack' ) }
				className="newspack-design__header"
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<Grid gutter={ 16 } className="newspack-design__header__style-size">
						<SelectControl
							className="icon-only"
							label={ __( 'Style', 'newspack' ) }
							value={ mods.header_center_logo ? 'center' : 'left' }
							onChange={ value => updateMods( 'header_center_logo' )( value === 'center' ) }
							buttonOptions={ [
								{ value: 'left', icon: alignLeft },
								{ value: 'center', icon: alignCenter },
							] }
						/>
						<SelectControl
							className="icon-only"
							label={ __( 'Size', 'newspack' ) }
							value={ mods.header_simplified ? 'small' : 'large' }
							onChange={ value => updateMods( 'header_simplified' )( value === 'small' ) }
							buttonOptions={ [
								{ value: 'small', label: 'S' },
								{ value: 'large', label: 'L' },
							] }
						/>
					</Grid>
					<ToggleControl
						checked={ mods.header_solid_background }
						onChange={ updateMods( 'header_solid_background' ) }
						label={ __( 'Apply a background color to the header', 'newspack' ) }
					/>
					{ mods.header_solid_background && (
						<ColorPicker
							label={ __( 'Background color' ) }
							color={ mods.header_color_hex }
							onChange={ updateMods( 'header_color_hex' ) }
						/>
					) }
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					<ImageUpload
						className="newspack-design__header__logo"
						style={ {
							...( mods.header_solid_background
								? {
										backgroundColor: mods.header_color_hex,
								  }
								: {} ),
						} }
						label={ __( 'Logo', 'newspack' ) }
						image={ mods.custom_logo }
						onChange={ custom_logo =>
							updateMods( {
								custom_logo,
								header_text: ! custom_logo,
								header_display_tagline: ! custom_logo,
							} )
						}
					/>
					{ mods.custom_logo && (
						<SelectControl
							className="icon-only"
							label={ __( 'Logo Size', 'newspack' ) }
							value={ parseLogoSize( mods.logo_size ) }
							onChange={ updateMods( 'logo_size' ) }
							buttonOptions={ LOGO_SIZE_OPTIONS }
						/>
					) }
				</Grid>
			</Grid>
			<SectionHeader
				title={ __( 'Footer', 'newspack' ) }
				description={ __( 'Personalize the footer of your site', 'newspack' ) }
				className="newspack-design__footer"
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<Card noBorder className="newspack-design__footer__copyright">
						<TextControl
							label={ __( 'Copyright information', 'newspack' ) }
							value={ mods.footer_copyright || '' }
							onChange={ updateMods( 'footer_copyright' ) }
						/>
					</Card>
					<ToggleControl
						checked={ mods.footer_color !== 'default' }
						onChange={ checked => updateMods( 'footer_color' )( checked ? 'custom' : 'default' ) }
						label={ __( 'Apply a background color to the footer', 'newspack' ) }
					/>
					{ mods.footer_color === 'custom' && (
						<ColorPicker
							label={ __( 'Background color' ) }
							color={ mods.footer_color_hex }
							onChange={ updateMods( 'footer_color_hex' ) }
						/>
					) }
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					<ImageUpload
						className="newspack-design__footer__logo"
						label={ __( 'Alternative Logo', 'newspack' ) }
						help={ __( 'Optional alternative logo to be displayed in the footer.', 'newspack' ) }
						style={ {
							...( mods.footer_color === 'custom' && mods.footer_color_hex
								? { backgroundColor: mods.footer_color_hex }
								: {} ),
						} }
						image={ mods.newspack_footer_logo }
						onChange={ updateMods( 'newspack_footer_logo' ) }
					/>
					{ mods.newspack_footer_logo && (
						<SelectControl
							className="icon-only"
							label={ __( 'Alternative logo - Size', 'newspack' ) }
							value={ mods.footer_logo_size }
							onChange={ updateMods( 'footer_logo_size' ) }
							buttonOptions={ [
								{ value: 'small', label: 'S' },
								{ value: 'medium', label: 'M' },
								{ value: 'large', label: 'L' },
								{ value: 'xlarge', label: 'XL' },
							] }
						/>
					) }
				</Grid>
			</Grid>
			{ isPartOfSetup && (
				<div className="newspack-floating-button">
					<WebPreview
						url="/?newspack_design_preview"
						renderButton={ ( { showPreview } ) => (
							<ButtonCard
								onClick={ () => saveSettings().then( showPreview ) }
								title={ __( 'Preview', 'newspack' ) }
								desc={ __( 'See how your site looks like', 'newspack' ) }
								chevron
								isSmall
							/>
						) }
					/>
				</div>
			) }
			<div className="newspack-buttons-card">
				{ renderPrimaryButton(
					isPartOfSetup
						? {
								onClick: () => saveSettings().then( finishSetup ),
								children: __( 'Finish', 'newspack' ),
						  }
						: {
								onClick: () => saveSettings(),
								children: __( 'Save', 'newspack' ),
						  }
				) }
			</div>
		</Card>
	);
};

export default withWizardScreen( Main, { hidePrimaryButton: true } );
