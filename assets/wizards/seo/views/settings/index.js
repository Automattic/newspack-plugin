/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Grid,
	SectionHeader,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * SEO Settings screen.
 */
class Settings extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const { verification, underConstruction, urls } = data;
		const { google, bing } = verification;
		const { facebook, linkedin, twitter, youtube, instagram, pinterest } = urls;
		return (
			<>
				<SectionHeader
					title={ __( 'Webmaster Tools', 'newspack' ) }
					description={ __( 'Add verification meta tags to your site', 'newspack' ) }
				/>
				<Grid>
					<TextControl
						label="Google"
						onChange={ value => onChange( { verification: { ...verification, google: value } } ) }
						value={ google }
						help={
							<>
								{ __( 'Get your verification code in', 'newspack' ) + ' ' }
								<ExternalLink href="https://www.google.com/webmasters/verification/verification?tid=alternate">
									{ __( 'Google Search Console', 'newspack' ) }
								</ExternalLink>
							</>
						}
					/>
					<TextControl
						label="Bing"
						onChange={ value => onChange( { verification: { ...verification, bing: value } } ) }
						value={ bing }
						help={
							<>
								{ __( 'Get your verification code in', 'newspack' ) + ' ' }
								<ExternalLink href="https://www.bing.com/toolbox/webmaster/#/Dashboard/">
									{ __( 'Bing Webmaster Tool', 'newspack' ) }
								</ExternalLink>
							</>
						}
					/>
				</Grid>
				<SectionHeader
					title={ __( 'Social Accounts', 'newspack' ) }
					description={ __(
						'Let search engines know which social profiles are associated to your site',
						'newspack'
					) }
				/>
				<Grid columns={ 1 } gutter={ 64 }>
					<Grid columns={ 3 } rowGap={ 16 }>
						<TextControl
							label={ __( 'Facebook Page', 'newspack' ) }
							onChange={ value => onChange( { urls: { ...urls, facebook: value } } ) }
							value={ facebook }
							placeholder={ __( 'https://facebook.com/page', 'newspack' ) }
						/>
						<TextControl
							label={ __( 'Twitter', 'newspack' ) }
							onChange={ value => onChange( { urls: { ...urls, twitter: value } } ) }
							value={ twitter }
							placeholder={ __( 'username', 'newspack' ) }
						/>
						<TextControl
							label="Instagram"
							onChange={ value => onChange( { urls: { ...urls, instagram: value } } ) }
							value={ instagram }
							placeholder={ __( 'https://instagram.com/user', 'newspack' ) }
						/>
						<TextControl
							label="LinkedIn"
							onChange={ value => onChange( { urls: { ...urls, linkedin: value } } ) }
							value={ linkedin }
							placeholder={ __( 'https://linkedin.com/user', 'newspack' ) }
						/>
						<TextControl
							label="YouTube"
							onChange={ value => onChange( { urls: { ...urls, youtube: value } } ) }
							value={ youtube }
							placeholder={ __( 'https://youtube.com/c/channel', 'newspack' ) }
						/>
						<TextControl
							label="Pinterest"
							onChange={ value => onChange( { urls: { ...urls, pinterest: value } } ) }
							value={ pinterest }
							placeholder={ __( 'https://pinterest.com/user', 'newspack' ) }
						/>
					</Grid>
					<ActionCard
						isMedium
						title={ __( 'Under construction', 'newspack' ) }
						description={ __( 'Discourage search engines from indexing this site.', 'newspack' ) }
						toggleChecked={ underConstruction }
						toggleOnChange={ value => onChange( { underConstruction: value } ) }
					/>
				</Grid>
			</>
		);
	}
}
Settings.defaultProps = {
	data: {},
};

export default withWizardScreen( Settings );
