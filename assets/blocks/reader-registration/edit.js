/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl, PanelBody } from '@wordpress/components';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.scss';

export default function ReaderRegistrationEdit( {
	setAttributes,
	attributes: { placeholder, label },
} ) {
	const blockProps = useBlockProps();
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form settings', 'newspack' ) }>
					<TextControl
						label={ __( 'Input placeholder', 'newspack' ) }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
					/>
					<TextControl
						label={ __( 'Button label', 'newspack' ) }
						value={ label }
						onChange={ value => setAttributes( { label: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="newspack-registration">
					<form onSubmit={ ev => ev.preventDefault() }>
						<input type="email" placeholder={ placeholder } />
						<input type="submit" value={ label } />
					</form>
				</div>
			</div>
		</>
	);
}
