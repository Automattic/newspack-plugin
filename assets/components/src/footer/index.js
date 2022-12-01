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
	const {
		components_demo: componentsDemo = false,
		support = false,
		setup_wizard: setupWizard = false,
		reset_url: resetUrl = false,
		plugin_version: pluginVersion = { label: 'Newspack' },
		remove_starter_content: removeStarterContent = false,
		support_email: supportEmail,
	} = window.newspack_urls || {};

	const footerElements = [
		{
			label: pluginVersion.label,
			url: 'https://newspack.com/category/release-notes/',
			external: true,
		},
		{
			label: __( 'About', 'newspack' ),
			url: 'https://newspack.com/',
			external: true,
		},
		{
			label: __( 'Documentation', 'newspack' ),
			url: support,
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
	if ( supportEmail ) {
		footerElements.push( {
			label: __( 'Contact Support', 'newspack' ),
			url: `mailto:${ supportEmail }`,
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
