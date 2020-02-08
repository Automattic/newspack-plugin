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
				<ToggleControl
					label={ __( 'Header: Solid Background' ) }
					checked={ headerSolidBackground }
					onChange={ value => setThemeMods( { header_solid_background: value } ) }
				/>
				<ToggleControl
					label={ __( 'Header: Centered' ) }
					checked={ headerCenterLogo }
					onChange={ value => setThemeMods( { header_center_logo: value } ) }
				/>
				<ToggleControl
					label={ __( 'Header: Short Header' ) }
					checked={ headerSimplified }
					onChange={ value => setThemeMods( { header_simplified: value } ) }
				/>
				<TextControl
					label={ __( 'Author Bio Length', 'newspack' ) }
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
