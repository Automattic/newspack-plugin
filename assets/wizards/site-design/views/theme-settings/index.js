/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';
import { SelectControl, Notice, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Grid,
	ImageUpload,
	SectionHeader,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';
import './style.scss';

/**
 * Theme Settings Screen.
 */
const ThemeSettings = props => {
	const [ imageThumbnail, setImageThumbnail ] = useState( null );
	const { themeSettings, setThemeMods } = props;

	const {
		show_author_bio: authorBio = true,
		show_author_email: authorEmail = false,
		author_bio_length: authorBioLength = 200,
		featured_image_default: featuredImageDefault = 'large',
		post_template_default: postTemplateDefault = 'default',
		featured_image_all_posts: featuredImageAllPosts = 'none',
		post_template_all_posts: postTemplateAllPosts = 'none',
		newspack_image_credits_placeholder_url: imageCreditsPlaceholderUrl,
		newspack_image_credits_class_name: imageCreditsClassName = '',
		newspack_image_credits_prefix_label: imageCreditsPrefix = '',
		newspack_image_credits_auto_populate: imageCreditsAutoPopulate = false,
	} = themeSettings;

	useEffect( () => {
		if ( imageCreditsPlaceholderUrl ) {
			setImageThumbnail( imageCreditsPlaceholderUrl );
		}
	}, [ imageCreditsPlaceholderUrl ] );

	return (
		<Fragment>
			<SectionHeader
				title={ __( 'Author Bio', 'newspack-plugin' ) }
				description={ __( 'Control how author bios are displayed on posts.', 'newspack-plugin' ) }
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<ToggleControl
						label={ __( 'Author Bio', 'newspack-plugin' ) }
						help={ __( 'Display an author bio under individual posts.', 'newspack-plugin' ) }
						checked={ authorBio }
						onChange={ value => setThemeMods( { show_author_bio: value } ) }
					/>
					{ authorBio && (
						<ToggleControl
							label={ __( 'Author Email', 'newspack-plugin' ) }
							help={ __(
								'Display the author email with bio on individual posts.',
								'newspack-plugin'
							) }
							checked={ authorEmail }
							onChange={ value => setThemeMods( { show_author_email: value } ) }
						/>
					) }
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					{ authorBio && (
						<TextControl
							label={ __( 'Length', 'newspack-plugin' ) }
							help={ __(
								'Truncates the author bio on single posts to this approximate character length, but without breaking a word. The full bio appears on the author archive page.',
								'newspack-plugin'
							) }
							type="number"
							value={ authorBioLength }
							onChange={ value => setThemeMods( { author_bio_length: value } ) }
						/>
					) }
				</Grid>
			</Grid>

			<SectionHeader
				title={ __( 'Default Featured Image Position And Post Template', 'newspack-plugin' ) }
				description={ __(
					'Modify how the featured image and post template settings are applied to new posts.',
					'newspack-plugin'
				) }
			/>
			<Grid gutter={ 32 }>
				<SelectControl
					label={ __( 'Default featured image position for new posts', 'newspack-plugin' ) }
					help={ __( 'Set a default featured image position for new posts.', 'newspack-plugin' ) }
					value={ featuredImageDefault }
					options={ [
						{ label: __( 'Large', 'newspack-plugin' ), value: 'large' },
						{ label: __( 'Small', 'newspack-plugin' ), value: 'small' },
						{ label: __( 'Behind article title', 'newspack-plugin' ), value: 'behind' },
						{ label: __( 'Beside article title', 'newspack-plugin' ), value: 'beside' },
						{ label: __( 'Hidden', 'newspack-plugin' ), value: 'hidden' },
					] }
					onChange={ value => setThemeMods( { featured_image_default: value } ) }
				/>
				<SelectControl
					label={ __( 'Default template for new posts', 'newspack-plugin' ) }
					help={ __( 'Set a default template for new posts.', 'newspack-plugin' ) }
					value={ postTemplateDefault }
					options={ [
						{ label: __( 'With sidebar', 'newspack-plugin' ), value: 'default' },
						{ label: __( 'One Column', 'newspack-plugin' ), value: 'single-feature.php' },
						{ label: __( 'One Column Wide', 'newspack-plugin' ), value: 'single-wide.php' },
					] }
					onChange={ value => setThemeMods( { post_template_default: value } ) }
				/>
			</Grid>
			<SectionHeader
				title={ __( 'Featured Image Position And Post Template For All Posts', 'newspack-plugin' ) }
				description={ __(
					'Modify how the featured image and post template settings are applied to existing posts. Warning: saving these options will override all posts.',
					'newspack-plugin'
				) }
			/>
			{ themeSettings.post_count > 1000 && (
				<Notice isDismissible={ false } status="warning" className="ma0 mb2">
					{ __(
						'You have more than 1000 posts. Applying these settings might take a moment.',
						'newspack-plugin'
					) }
				</Notice>
			) }
			<Grid gutter={ 32 }>
				<div>
					<SelectControl
						label={ __( 'Featured image position for all posts', 'newspack-plugin' ) }
						help={ __( 'Set a featured image position for all posts.', 'newspack-plugin' ) }
						value={ featuredImageAllPosts }
						options={ [
							{ label: __( 'Select to change all posts', 'newspack-plugin' ), value: 'none' },
							{ label: __( 'Large', 'newspack-plugin' ), value: 'large' },
							{ label: __( 'Small', 'newspack-plugin' ), value: 'small' },
							{ label: __( 'Behind article title', 'newspack-plugin' ), value: 'behind' },
							{ label: __( 'Beside article title', 'newspack-plugin' ), value: 'beside' },
							{ label: __( 'Hidden', 'newspack-plugin' ), value: 'hidden' },
						] }
						onChange={ value => setThemeMods( { featured_image_all_posts: value } ) }
					/>
					{ featuredImageAllPosts !== 'none' && (
						<Notice isDismissible={ false } status="warning" className="ma0 mt2">
							{ __(
								'After saving the settings with this option selected, all posts will be updated. This cannot be undone.',
								'newspack-plugin'
							) }
						</Notice>
					) }
				</div>

				<div>
					<SelectControl
						label={ __( 'Template for all posts', 'newspack-plugin' ) }
						help={ __( 'Set a template for all posts.', 'newspack-plugin' ) }
						value={ postTemplateAllPosts }
						options={ [
							{ label: __( 'Select to change all posts', 'newspack-plugin' ), value: 'none' },
							{ label: __( 'With sidebar', 'newspack-plugin' ), value: 'default' },
							{ label: __( 'One Column', 'newspack-plugin' ), value: 'single-feature.php' },
							{ label: __( 'One Column Wide', 'newspack-plugin' ), value: 'single-wide.php' },
						] }
						onChange={ value => setThemeMods( { post_template_all_posts: value } ) }
					/>
					{ postTemplateAllPosts !== 'none' && (
						<Notice isDismissible={ false } status="warning" className="ma0 mt2">
							{ __(
								'After saving the settings with this option selected, all posts will be updated. This cannot be undone.',
								'newspack-plugin'
							) }
						</Notice>
					) }
				</div>
			</Grid>

			<SectionHeader
				title={ __( 'Media Credits', 'newspack-plugin' ) }
				description={ __(
					'Control how credits are displayed alongside media attachments.',
					'newspack-plugin'
				) }
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<TextControl
						label={ __( 'Credit Class Name', 'newspack-plugin' ) }
						help={ __(
							'A CSS class name to be applied to all image credit elements. Leave blank to display no class name.',
							'newspack-plugin'
						) }
						value={ imageCreditsClassName }
						onChange={ value => setThemeMods( { newspack_image_credits_class_name: value } ) }
					/>
					<TextControl
						label={ __( 'Credit Label', 'newspack-plugin' ) }
						help={ __(
							'A label to prefix all media credits. Leave blank to display no prefix.',
							'newspack-plugin'
						) }
						value={ imageCreditsPrefix }
						onChange={ value => setThemeMods( { newspack_image_credits_prefix_label: value } ) }
					/>
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					<ImageUpload
						image={ imageThumbnail ? { url: imageThumbnail } : null }
						label={ __( 'Placeholder Image', 'newspack-plugin' ) }
						buttonLabel={ __( 'Select', 'newspack-plugin' ) }
						onChange={ image => {
							setImageThumbnail( image?.url || null );
							setThemeMods( { newspack_image_credits_placeholder: image?.id || null } );
						} }
						help={ __(
							'A placeholder image to be displayed in place of images without credits. If none is chosen, the image will be displayed normally whether or not it has a credit.',
							'newspack-plugin'
						) }
					/>
					<ToggleControl
						label={ __( 'Auto-populate image credits', 'newspack-plugin' ) }
						help={ __(
							'Automatically populate image credits from EXIF or IPTC metadata when uploading new images.',
							'newspack-plugin'
						) }
						checked={ imageCreditsAutoPopulate }
						onChange={ value => setThemeMods( { newspack_image_credits_auto_populate: value } ) }
					/>
				</Grid>
			</Grid>
		</Fragment>
	);
};

ThemeSettings.defaultProps = {
	themeSettings: {},
	setThemeMods: () => null,
};

export default withWizardScreen( ThemeSettings );
