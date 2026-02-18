/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSharedAuthorContext } from '../../shared/author-context';
import { getSocialIconSvg } from './social-icons';
import { getServiceUrl, getServiceData } from './utils';

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
