/**
 * Newspack Core Image, Figcaption
 */

/**
 * Dependencies
 */
// WordPress
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import * as CoreImageBlockTypes from './types';

/**
 * Helper to parse credit meta
 */
function parseCreditToText( credit: CoreImageBlockTypes.AttributesMeta ) {
	const parsed = {
		credit: credit._media_credit ?? undefined,
		url: credit._media_credit_url ?? undefined,
		org: credit._navis_media_credit_org ?? undefined,
	};
	if ( ! parsed.credit ) {
		return '';
	}
	const org = `${ parsed.org ? ` / ${ parsed.org }` : '' }`;
	const creditElem = parsed.url ? (
		<a href={ parsed.url } target="_blank" rel="noreferrer">
			{ `${ parsed.credit }${ org }` }
		</a>
	) : (
		`${ parsed.credit }${ org }`
	);
	return (
		<>
			{ __( 'Credit', 'newspack-plugin' ) }: { creditElem }
		</>
	);
}

const FigcaptionCredit = ( {
	attributes,
	setAttributes,
	isCaptionVisible,
}: CoreImageBlockTypes.AttributeProps & { isCaptionVisible: boolean } ) => {
	const { caption } = attributes;
	const credit = parseCreditToText( attributes.meta ?? '' );

	const onChangeCaption = ( newCaption: string ) => {
		setAttributes( { caption: newCaption } );
	};

	return (
		<div className="newspack-block__core-image-caption">
			{ isCaptionVisible && (
				<RichText
					tagName="span"
					value={ caption }
					allowedFormats={ [] }
					onChange={ onChangeCaption }
					placeholder="Enter caption here."
				/>
			) }
			{ credit !== '' && <span>{ credit }</span> }
		</div>
	);
};

export default FigcaptionCredit;
