/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl, PanelBody } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './style.scss';

export default function ReaderRegistrationEdit( {
	setAttributes,
	attributes: { placeholder, label },
} ) {
	const defaultPlaceholder = __( 'Enter your email address', 'newspack' );
	const defaultLabel = __( 'Register', 'newspack' );
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
			<div className="newspack-reader-registration">
				<form
					onSubmit={ ev => {
						ev.preventDefault();
					} }
				>
					<input type="email" placeholder={ placeholder || defaultPlaceholder } />
					<button>{ label || defaultLabel }</button>
				</form>
			</div>
		</>
	);
}
