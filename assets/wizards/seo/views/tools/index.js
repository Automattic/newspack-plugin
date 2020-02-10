/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TextControl, withWizardScreen } from '../../../../components/src';

/**
 * SEO Tools screen.
 */
class Tools extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const { verification } = data;
		const { google, bing } = verification;
		return (
			<Fragment>
				<h2>Webmaster tools verification</h2>
				<p>
					{ __(
						'You can use the boxes below to verify with the different Webmaster Tools. Thius feature will add a verification meta tag on your home page. Follow the links to the different Webmaster Tools and look for instructions for the meta tag verification method to get the verification code.',
						'newspack'
					) }
				</p>
				<TextControl
					helper={ __( 'Get your Google verification code in Google Search Console.', 'newspack' ) }
					label={ __( 'Google', 'newspack' ) }
					onChange={ value => onChange( { verification: { ...verification, google: value } } ) }
					value={ google }
				/>
				<TextControl
					helper={ __( 'Get your Bing verification code in Bing Wevnaster Tools.', 'newspack' ) }
					label={ __( 'Bing', 'newspack' ) }
					onChange={ value => onChange( { verification: { ...verification, bing: value } } ) }
					value={ bing }
				/>
			</Fragment>
		);
	}
}
Tools.defaultProps = {
	data: {},
};

export default withWizardScreen( Tools );
