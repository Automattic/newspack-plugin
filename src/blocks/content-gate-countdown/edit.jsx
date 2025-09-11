/**
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls, InnerBlocks, RichText } from '@wordpress/block-editor';
import { PanelBody, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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

	const handleChange = ( key, value ) => {
		setAttributes( { [ key ]: value } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Content Gate Countdown Settings', 'newspack-plugin' ) }>
					<TextareaControl
						label={ __( 'Text', 'newspack-plugin' ) }
						value={ text }
						onChange={ value => handleChange( 'text', value ) }
						placeholder={ __( 'Get unlimited access.', 'newspack-plugin' ) }
						help={ __( 'The call to action text that appears above the subscribe button.', 'newspack-plugin' ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="wp-block-newspack-content-gate-countdown__content">
					<div className="wp-block-newspack-content-gate-countdown__notice">
						{ ' ' }
						<span className="wp-block-newspack-content-gate-countdown__views">3 / 3</span>
						<p>{ __( 'remaining articles this month.', 'newspack-plugin' ) }</p>
					</div>
					<div className="wp-blocks-newspack-content-gate-countdown__actions">
						<RichText
							tagName="div"
							className="wp-block-newspack-blocks-content-gate-countdown__text"
							value={ text }
							onChange={ value => handleChange( 'text', value ) }
							placeholder={ __( 'CTA text…', 'newspack-plugin' ) }
							allowedFormats={ [] }
						/>
						<InnerBlocks
							allowedBlocks={ [ 'newspack-blocks/checkout-button', 'core/buttons' ] }
							template={ [ [ 'newspack-blocks/checkout-button', { text: __( 'Subscribe now', 'newspack-plugin' ) } ] ] }
						/>
					</div>
				</div>
			</div>
		</>
	);
}
