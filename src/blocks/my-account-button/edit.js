/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	BlockControls,
	RichText,
	useBlockProps,
	/* eslint-disable @wordpress/no-unsafe-wp-apis */
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	/* eslint-enable @wordpress/no-unsafe-wp-apis */
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { readerRegistration } from '../../../packages/icons';

function MyAccountButtonEdit( { attributes, setAttributes } ) {
	const { signedInLabel, signedOutLabel, style, previewState } = attributes;
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

	const isSignedOutPreview = previewState === 'signedout';
	const activeLabel = isSignedOutPreview ? signedOutLabel : signedInLabel;
	const placeholderText = isSignedOutPreview ? __( 'Sign in', 'newspack-plugin' ) : __( 'My Account', 'newspack-plugin' );

	function setButtonText( newText ) {
		const cleaned = stripHTML( newText );
		setAttributes( isSignedOutPreview ? { signedOutLabel: cleaned } : { signedInLabel: cleaned } );
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton isPressed={ ! isSignedOutPreview } onClick={ () => setAttributes( { previewState: 'signedin' } ) }>
						{ __( 'Signed in', 'newspack-plugin' ) }
					</ToolbarButton>
					<ToolbarButton isPressed={ isSignedOutPreview } onClick={ () => setAttributes( { previewState: 'signedout' } ) }>
						{ __( 'Signed out', 'newspack-plugin' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<a { ...blockProps }>
				<span className="newspack-reader__account-link__icon" aria-hidden="true">
					<Icon icon={ readerRegistration } />
				</span>
				<RichText
					tagName="span"
					aria-label={ __( 'Button text', 'newspack-plugin' ) }
					placeholder={ placeholderText }
					value={ activeLabel || '' }
					onChange={ value => setButtonText( value ) }
					withoutInteractiveFormatting
				/>
			</a>
		</>
	);
}

export default MyAccountButtonEdit;
