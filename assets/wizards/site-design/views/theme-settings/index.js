/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Grid,
	ImageUpload,
	RadioControl,
	SectionHeader,
	TextControl,
	ToggleControl,
	ToggleGroup,
	withWizardScreen,
} from '../../../../components/src';
import './style.scss';

/**
 * Theme Settings Screen.
 */
const ThemeSettings = props => {
	const [ imageThumbnail, setImageThumbnail ] = useState( null );
	const { themeMods, setThemeMods } = props;

	const {
		show_author_bio: authorBio = true,
		show_author_email: authorEmail = false,
		author_bio_length: authorBioLength = 200,
		featured_image_default: featuredImageDefault,
		newspack_image_credits_placeholder_url: imageCreditsPlaceholderUrl,
		newspack_image_credits_class_name: imageCreditsClassName = '',
		newspack_image_credits_prefix_label: imageCreditsPrefix = '',
	} = themeMods;

	useEffect( () => {
		if ( imageCreditsPlaceholderUrl ) {
			setImageThumbnail( imageCreditsPlaceholderUrl );
		}
	}, [ imageCreditsPlaceholderUrl ] );

	return (
		<Fragment>
			<SectionHeader
				title={ __( 'Author Bio', 'newspack' ) }
				description={ __( 'Control how author bios are displayed on posts.', 'newspack' ) }
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<ToggleGroup
						title={ __( 'Author bio', 'newspack' ) }
						description={ __( 'Display an author bio under individual posts.', 'newspack' ) }
						checked={ authorBio }
						onChange={ value => setThemeMods( { show_author_bio: value } ) }
					>
						<ToggleControl
							isDark
							label={ __( 'Author email', 'newspack' ) }
							help={ __( 'Display the author email with bio on individual posts.', 'newspack' ) }
							checked={ authorEmail }
							onChange={ value => setThemeMods( { show_author_email: value } ) }
						/>
					</ToggleGroup>
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					{ authorBio && (
						<TextControl
							label={ __( 'Length', 'newspack' ) }
							help={ __(
								'Truncates the author bio on single posts to this approximate character length, but without breaking a word. The full bio appears on the author archive page.',
								'newspack'
							) }
							type="number"
							value={ authorBioLength }
							onChange={ value => setThemeMods( { author_bio_length: value } ) }
						/>
					) }
				</Grid>
			</Grid>

			<SectionHeader
				title={ __( 'Featured Image', 'newspack' ) }
				description={ __( 'Set a default featured image position for new posts.', 'newspack' ) }
			/>
			<RadioControl
				label={ __( 'Default position', 'newspack' ) }
				selected={ featuredImageDefault || 'large' }
				options={ [
					{ label: __( 'Large', 'newspack' ), value: 'large' },
					{ label: __( 'Small', 'newspack' ), value: 'small' },
					{ label: __( 'Behind article title', 'newspack' ), value: 'behind' },
					{ label: __( 'Beside article title', 'newspack' ), value: 'beside' },
					{ label: __( 'Hidden', 'newspack' ), value: 'hidden' },
				] }
				onChange={ value => setThemeMods( { featured_image_default: value } ) }
			/>

			<SectionHeader
				title={ __( 'Media Credits', 'newspack' ) }
				description={ __(
					'Control how credits are displayed alongside media attachments.',
					'newspack'
				) }
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<TextControl
						label={ __( 'Credit Class Name', 'newspack' ) }
						help={ __(
							'A CSS class name to be applied to all image credit elements. Leave blank to display no class name.',
							'newspack'
						) }
						value={ imageCreditsClassName }
						onChange={ value => setThemeMods( { newspack_image_credits_class_name: value } ) }
					/>
					<TextControl
						label={ __( 'Credit Label', 'newspack' ) }
						help={ __(
							'A label to prefix all media credits. Leave blank to display no prefix.',
							'newspack'
						) }
						value={ imageCreditsPrefix }
						onChange={ value => setThemeMods( { newspack_image_credits_prefix_label: value } ) }
					/>
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					<ImageUpload
						image={ imageThumbnail ? { url: imageThumbnail } : null }
						label={ __( 'Placeholder Image', 'newspack' ) }
						buttonLabel={ __( 'Select', 'newspack' ) }
						onChange={ image => {
							setImageThumbnail( image.url || null );
							setThemeMods( { newspack_image_credits_placeholder: image?.id || null } );
						} }
						help={ __(
							'A placeholder image to be displayed in place of images without credits. If none is chosen, the image will be displayed normally whether or not it has a credit.',
							'newspack'
						) }
					/>
				</Grid>
			</Grid>
		</Fragment>
	);
};

ThemeSettings.defaultProps = {
	themeMods: {},
	setThemeMods: () => null,
};

export default withWizardScreen( ThemeSettings );
