/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	useBlockProps,
	/* eslint-disable @wordpress/no-unsafe-wp-apis */
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	/* eslint-enable @wordpress/no-unsafe-wp-apis */
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

function MyAccountButtonEdit( { attributes, setAttributes } ) {
	const { signedInLabel, signedOutLabel, style } = attributes;
	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const blockProps = useBlockProps( {
		className: classnames(
			'wp-block-button__link',
			'newspack-reader__account-link',
			'wp-block-newspack-my-account-button__link',
			colorProps.className,
			borderProps.className,
			{
				// For backwards compatibility add style that isn't
				// provided via block support.
				'no-border-radius': style?.border?.radius === 0,
			}
		),
		style: {
			...borderProps.style,
			...colorProps.style,
			...spacingProps.style,
		},
	} );

	function setButtonText( newText ) {
		// Remove anchor tags from button text content.
		setAttributes( { signedInLabel: newText.replace( /<\/?a[^>]*>/g, '' ) } );
	}

	return (
		<>
			<RichText
				{ ...blockProps }
				tagName="a"
				aria-label={ __( 'Button text', 'newspack-plugin' ) }
				placeholder={ __( 'My Account', 'newspack-plugin' ) }
				value={ signedInLabel }
				onChange={ value => setButtonText( value ) }
				withoutInteractiveFormatting
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Labels', 'newspack-plugin' ) }>
					<TextControl
						label={ __( 'Signed-in label', 'newspack-plugin' ) }
						value={ signedInLabel }
						onChange={ value => setAttributes( { signedInLabel: value } ) }
					/>
					<TextControl
						label={ __( 'Signed-out label', 'newspack-plugin' ) }
						value={ signedOutLabel }
						onChange={ value => setAttributes( { signedOutLabel: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default MyAccountButtonEdit;
