/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ImageUpload,
	TextControl,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';
import { ColorPicker } from '@wordpress/components';

/**
 * Theme Selection Screen.
 */
class ThemeMods extends Component {
	/**
	 * Render.
	 */
	render() {
		const { themeMods, setThemeMods } = this.props;
		const {
			header_solid_background: headerSolidBackground,
			header_simplified: headerSimplified,
			header_center_logo: headerCenterLogo,
			primary_color_hex: primaryColorHex,
			author_bio_length: authorBioLength,
			newspack_footer_logo: newspackFooterLogo,
		} = themeMods;
		return (
			<Fragment>
				<h2>{ __( 'Header', 'newspack' ) }</h2>
				<ToggleControl
					label={ __( 'Solid background', 'newspack') }
					help={ __( 'Use the primary color as the header background.', 'newspack' ) }
					checked={ headerSolidBackground }
					onChange={ value => setThemeMods( { header_solid_background: value } ) }
				/>
				<ToggleControl
					label={ __( 'Center logo', 'newspack' ) }
					help={ __( 'Center the logo in the header.', 'newspack' ) }
					checked={ headerCenterLogo }
					onChange={ value => setThemeMods( { header_center_logo: value } ) }
				/>
				<ToggleControl
					label={ __( 'Short header', 'newspack' ) }
					help={ __( 'Display the header as a shorter, simpler version', 'newspack' ) }
					checked={ headerSimplified }
					onChange={ value => setThemeMods( { header_simplified: value } ) }
				/>
				<hr />
				<h2>{ __( 'Author bio', 'newspack' ) }</h2>
				<TextControl
					label={ __( 'Length', 'newspack' ) }
					help={ __( 'Truncates the author bio on single posts to this approximate character length, but without breaking a word. The full bio appears on the author archive page.', 'newspack' ) }
					type="number"
					value={ authorBioLength }
					onChange={ value => setThemeMods( { author_bio_length: value } ) }
				/>
				<ImageUpload
					image={ newspackFooterLogo }
					onChange={ value => setThemeMods( { newspack_footer_logo: value } ) }
				/>
				{ primaryColorHex && (
					<ColorPicker
						color={ primaryColorHex }
						onChangeComplete={ value => setThemeMods( { primary_color_hex: value.hex } ) }
						disableAlpha
					/>
				) }
				<ToggleControl
					label={ __(
						'Header style with solid background, centered logo, and short layout',
						'newspack'
					) }
					checked={ headerSolidBackground && headerCenterLogo && headerSimplified }
					onChange={ value =>
						setThemeMods( {
							header_solid_background: value,
							header_center_logo: value,
							header_simplified: value,
						} )
					}
				>
					{ __( 'Centered/Solid/Short Logo' ) }
				</ToggleControl>
			</Fragment>
		);
	}
}

ThemeMods.defaultProps = {
	themeMods: {},
	setThemeMods: () => null,
};

export default withWizardScreen( ThemeMods );
