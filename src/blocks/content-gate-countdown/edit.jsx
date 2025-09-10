/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, TextareaControl } from '@wordpress/components';

/**
 * Edit function for the Content Gate Countdown block.
 *
 * @param {Object}   props               The block properties.
 * @param {Object}   props.attributes    The block attributes.
 * @param {Function} props.setAttributes The block attributes setter.
 *
 * @return {JSX.Element} The Content Gate Countdown block.
 */
export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const { text } = attributes;

	const placeholder = __( 'Add countdown text…', 'newspack-plugin' );

	const handleChange = value => {
		setAttributes( { text: value } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Content Gate Countdown Settings', 'newspack-plugin' ) }>
					<TextareaControl
						label={ __( 'Countdown Text', 'newspack-plugin' ) }
						value={ text }
						onChange={ value => handleChange( value ) }
						placeholder={ placeholder }
						help={ __( 'This text will be shown alongside the countdown timer on the frontend.', 'newspack-plugin' ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<RichText
					aria-label={ __( 'Countdown text' ) }
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ value => handleChange( value ) }
					withoutInteractiveFormatting
					identifier="text"
				/>
			</div>
		</>
	);
}
