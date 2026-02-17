/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSocialIconSvg } from './social-icons';

/**
 * Get the shared AuthorContext from newspack-blocks (via window global).
 * Falls back to a local context if not available.
 */
const FallbackAuthorContext = createContext( null );
const getSharedAuthorContext = () =>
	typeof window !== 'undefined' && window.NewspackAuthorContext ? window.NewspackAuthorContext : FallbackAuthorContext;

/**
 * Get the URL for a service from author data.
 *
 * @param {Object} author  Author data object.
 * @param {string} service Service key.
 * @return {string|null} URL or null.
 */
function getServiceUrl( author, service ) {
	if ( ! author || ! service ) {
		return null;
	}

	if ( service === 'email' ) {
		const email = author.email;
		if ( ! email ) {
			return null;
		}
		if ( typeof email === 'object' ) {
			return email.url || null;
		}
		return `mailto:${ email }`;
	}

	if ( service === 'phone' ) {
		const phone = author.newspack_phone_number;
		if ( ! phone ) {
			return null;
		}
		if ( typeof phone === 'object' ) {
			return phone.url || null;
		}
		return `tel:${ phone }`;
	}

	// Social services.
	const socialData = author.social?.[ service ];
	if ( ! socialData?.url ) {
		return null;
	}
	return socialData.url;
}

/**
 * Get the author data object for a service (for SVG lookup).
 *
 * @param {Object} author  Author data object.
 * @param {string} service Service key.
 * @return {Object|null} Service data with optional svg property.
 */
function getServiceData( author, service ) {
	if ( ! author || ! service ) {
		return null;
	}

	if ( service === 'email' ) {
		const email = author.email;
		return typeof email === 'object' ? email : null;
	}

	if ( service === 'phone' ) {
		const phone = author.newspack_phone_number;
		return typeof phone === 'object' ? phone : null;
	}

	return author.social?.[ service ] || null;
}

/**
 * Edit component for a single Author Social Link block.
 *
 * @param {Object} props            Block props.
 * @param {Object} props.attributes Block attributes.
 * @param {Object} props.context    Block context.
 * @return {JSX.Element|null} The edit component.
 */
export default function AuthorSocialLinkEdit( { attributes, context } ) {
	const AuthorContext = getSharedAuthorContext();
	const author = useContext( AuthorContext );
	const { service } = attributes;
	const iconSize = context?.[ 'newspack-blocks/iconSize' ] ?? 24;

	const blockProps = useBlockProps( {
		className: 'wp-block-newspack-author-social-link',
	} );

	const url = getServiceUrl( author, service );
	if ( ! url ) {
		return null;
	}

	const serviceData = getServiceData( author, service );
	const svg = getSocialIconSvg( service, serviceData );

	const serviceLabel =
		{
			facebook: 'Facebook',
			twitter: 'X (Twitter)',
			instagram: 'Instagram',
			linkedin: 'LinkedIn',
			youtube: 'YouTube',
			bluesky: 'Bluesky',
			pinterest: 'Pinterest',
			myspace: 'Myspace',
			soundcloud: 'SoundCloud',
			tumblr: 'Tumblr',
			wikipedia: 'Wikipedia',
			email: __( 'Email', 'newspack-plugin' ),
			phone: __( 'Phone', 'newspack-plugin' ),
		}[ service ] || service;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ serviceLabel }>
					<p style={ { wordBreak: 'break-all', fontSize: '12px', color: '#757575' } }>
						<ExternalLink href={ url }>{ url }</ExternalLink>
					</p>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<a href={ url } aria-label={ serviceLabel } onClick={ e => e.preventDefault() }>
					{ svg ? (
						<span dangerouslySetInnerHTML={ { __html: svg } } style={ { width: iconSize, height: iconSize } } aria-hidden="true" />
					) : (
						<span className="service-name">{ service }</span>
					) }
				</a>
			</li>
		</>
	);
}
