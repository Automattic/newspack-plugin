/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search as searchIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	RichText,
	useBlockProps,
	/* eslint-disable @wordpress/no-unsafe-wp-apis */
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	/* eslint-enable @wordpress/no-unsafe-wp-apis */
} from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';

export default function SearchOverlayEdit( { attributes, setAttributes } ) {
	const { triggerText, className: blockClassName } = attributes;

	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );

	const classes = ( blockClassName || '' ).split( ' ' );
	const isIconOnly = classes.includes( 'is-style-icon-only' );
	const isTextOnly = classes.includes( 'is-style-text-only' );
	const isLabelVisible = ! isIconOnly;
	const isIconVisible = ! isTextOnly;

	const blockProps = useBlockProps( {
		className: classnames(
			blockClassName,
			'wp-block-button__link',
			'newspack-search-overlay__trigger',
			colorProps.className,
			borderProps.className
		),
		style: {
			...borderProps.style,
			...colorProps.style,
			...spacingProps.style,
		},
	} );

	return (
		<div className={ classnames( 'wp-block-buttons', 'is-layout-flex', blockClassName ) }>
			<div className="wp-block-button">
				<button { ...blockProps } type="button" onClick={ e => e.preventDefault() }>
					{ isIconVisible && (
						<span className="newspack-search-overlay__icon" aria-hidden="true">
							<Icon icon={ searchIcon } />
						</span>
					) }
					<RichText
						tagName="span"
						className={ ! isLabelVisible ? 'screen-reader-text' : undefined }
						aria-label={ __( 'Button text', 'newspack-plugin' ) }
						placeholder={ __( 'Search', 'newspack-plugin' ) }
						value={ triggerText || '' }
						onChange={ val => setAttributes( { triggerText: stripHTML( val ) } ) }
						withoutInteractiveFormatting
					/>
				</button>
			</div>
		</div>
	);
}
