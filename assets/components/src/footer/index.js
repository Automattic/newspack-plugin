/**
 * Footer
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { PatronsLogo } from '../';
import './style.scss';

const Footer = ( { simple } ) => {
	const componentsDemo = window && window.newspack_urls && window.newspack_urls.components_demo;
	const setupWizard = window && window.newspack_urls && window.newspack_urls.setup_wizard;
	const resetUrl = window && window.newspack_urls && window.newspack_urls.reset_url;
	const pluginVersion = window && window.newspack_urls && window.newspack_urls.plugin_version;
	const removeStarterContent =
		window && window.newspack_urls && window.newspack_urls.remove_starter_content;
	const footerElements = [
		{
			label: pluginVersion.label,
			url: 'https://newspack.pub/category/release-notes/',
			external: true,
		},
		{
			label: __( 'About', 'newspack' ),
			url: 'https://newspack.pub/',
			external: true,
		},
		{
			label: __( 'Documentation', 'newspack' ),
			url: 'https://newspack.pub/support/',
			external: true,
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
	if ( removeStarterContent ) {
		footerElements.push( {
			label: __( 'Remove Starter Content', 'newspack' ),
			url: removeStarterContent,
		} );
	}
	return (
		<div className="newspack-footer">
			{ ! simple && (
				<div className="newspack-footer__inner">
					<ul>
						{ footerElements.map( ( { url, label, external }, index ) => (
							<li key={ index }>
								{ external ? (
									<ExternalLink href={ url }>{ label }</ExternalLink>
								) : (
									<a href={ url }>{ label }</a>
								) }
							</li>
						) ) }
					</ul>
				</div>
			) }
			<div className="newspack-footer__logo">
				<PatronsLogo />
			</div>
		</div>
	);
};

export default Footer;
