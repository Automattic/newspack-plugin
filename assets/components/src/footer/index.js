/**
 * Footer
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import './style.scss';

const Footer = () => {
	const componentsDemo = window && window.newspack_urls && window.newspack_urls.components_demo;
	const setupWizard = window && window.newspack_urls && window.newspack_urls.setup_wizard;
	const resetUrl = window && window.newspack_urls && window.newspack_urls.reset_url;
	const resetWpcomUrl = window && window.newspack_urls && window.newspack_urls.reset_wpcom_url;
	const pluginVersion = window && window.newspack_urls && window.newspack_urls.plugin_version;
	const footerElements = [
		{
			label: pluginVersion,
		},
		{
			label: __( 'About', 'newspack' ),
			url: 'https://newspack.pub/',
		},
	];
	if ( componentsDemo ) {
		footerElements.push( {
			label: __( 'Components Demo', 'newspack' ),
			url: componentsDemo,
		} );
	}
	if ( setupWizard ) {
		footerElements.push( {
			label: __( 'Setup Wizard', 'newspack' ),
			url: setupWizard,
		} );
	}
	if ( resetUrl ) {
		footerElements.push( {
			label: __( 'Reset Newspack', 'newspack' ),
			url: resetUrl,
		} );
	}
	if ( resetWpcomUrl ) {
		footerElements.push( {
			label: __( 'Reset WordPress.com Authentication', 'newspack' ),
			url: resetWpcomUrl,
		} );
	}
	return (
		<div className="newspack__footer">
			<ul>
				{ footerElements.map( ( { url, label }, index ) => (
					<li key={ index }>
						<a href={ url }>{ label }</a>
					</li>
				) ) }
			</ul>
		</div>
	);
};

export default Footer;
