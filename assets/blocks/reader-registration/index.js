/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { TextControl, PanelBody } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';
import { Icon, box } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.scss';

const edit = ( { setAttributes, attributes } ) => {
	const defaultPlaceholder = __( 'Enter your email address', 'newspack' );
	const defaultButtonLabel = __( 'Register', 'newspack' );
	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ __( 'Form settings', 'newspack' ) }>
					<TextControl
						label={ __( 'Input placeholder', 'newspack' ) }
						value={ attributes.placeholder }
						placeholder={ defaultPlaceholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
					/>
					<TextControl
						label={ __( 'Button label', 'newspack' ) }
						value={ attributes.button_label }
						placeholder={ defaultButtonLabel }
						onChange={ value => setAttributes( { button_label: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className="newspack-reader-registration-block">
				<form
					onSubmit={ ev => {
						ev.preventDefault();
					} }
				>
					<input type="email" placeholder={ attributes.placeholder || defaultPlaceholder } />
					<button>{ attributes.button_label || defaultButtonLabel }</button>
				</form>
			</div>
		</Fragment>
	);
};

export default function registerReaderRegistrationBlock() {
	registerBlockType( 'newspack/reader-registration', {
		category: 'newspack',
		attributes: {
			placeholder: {
				type: 'string',
				default: '',
			},
			button_label: {
				type: 'string',
				default: '',
			},
		},
		supports: [ 'align' ],
		title: __( 'Reader Registration', 'newspack' ),
		icon: <Icon icon={ box } />,
		edit,
		save: () => null,
	} );
}
