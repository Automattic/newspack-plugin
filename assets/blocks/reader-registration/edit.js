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
	const defaultPlaceholder = __( 'Enter your email address', 'newspack' );
	const defaultLabel = __( 'Register', 'newspack' );
	const blockProps = useBlockProps();
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form settings', 'newspack' ) }>
					<TextControl
						label={ __( 'Input placeholder', 'newspack' ) }
						value={ placeholder }
						placeholder={ defaultPlaceholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
					/>
					<TextControl
						label={ __( 'Button label', 'newspack' ) }
						value={ label }
						placeholder={ defaultLabel }
						onChange={ value => setAttributes( { label: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="newspack-reader-registration">
					<form onSubmit={ ev => ev.preventDefault() }>
						<input type="email" placeholder={ placeholder || defaultPlaceholder } />
						<input type="submit" value={ label || defaultLabel } />
					</form>
				</div>
			</div>
		</>
	);
}
