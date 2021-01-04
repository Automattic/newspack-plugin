/**
 * Segmentation Preview component.
 * Extension of WebPreview with support for "view-as-segment" functionality.
 */

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies.
 */
import { WebPreview } from '../../../../components/src';

const SegmentationPreview = props => {
	const postPreviewLink = window?.newspack_popups_wizard_data?.preview_post;
	const frontendUrl = window?.newspack_popups_wizard_data?.frontend_url || '/';

	const {
		campaignGroups = [],
		onLoad = () => {},
		segment = '',
		url = postPreviewLink || frontendUrl,
	} = props;

	const decorateURL = urlToDecorate => {
		const params = {
			view_as: [
				`groups:${ campaignGroups.join( ',' ) }`,
				...( segment.length ? [ `segment:${ segment }` ] : [] ),
			].join( ';' ),
		};
		return addQueryArgs( urlToDecorate, params );
	};

	const onWebPreviewLoad = iframeEl => {
		if ( iframeEl ) {
			[ ...iframeEl.contentWindow.document.querySelectorAll( 'a' ) ].forEach( anchor => {
				const href = anchor.getAttribute( 'href' );
				if ( href.indexOf( frontendUrl ) === 0 ) {
					anchor.setAttribute( 'href', decorateURL( href ) );
				}
			} );
			onLoad( iframeEl );
		}
	};

	const beforeLoad = () => {
		localStorage.setItem( 'newspack_campaigns-preview-segmentId', JSON.stringify( segment ) );
		localStorage.setItem(
			'newspack_campaigns-preview-groupTaxIds',
			JSON.stringify( campaignGroups )
		);
	};

	const onClose = () => {
		localStorage.removeItem( 'newspack_campaigns-preview-segmentId' );
		localStorage.removeItem( 'newspack_campaigns-preview-groupTaxIds' );
	};

	return (
		<WebPreview
			{ ...props }
			beforeLoad={ beforeLoad }
			onClose={ onClose }
			onLoad={ onWebPreviewLoad }
			url={ decorateURL( url ) }
		/>
	);
};

export default SegmentationPreview;
