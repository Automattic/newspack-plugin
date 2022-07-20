/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl, PanelBody, ToggleControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	useBlockProps,
	InspectorControls,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.scss';

const variantOptions = [
	{ label: __( 'Initial', 'newspack' ), value: 'initial' },
	{ label: __( 'Success', 'newspack' ), value: 'success' },
];
export default function ReaderRegistrationEdit( {
	setAttributes,
	attributes: { placeholder, label },
} ) {
	const blockProps = useBlockProps();
	const [ variant, setVariant ] = useState( variantOptions[ 0 ].value );
	const isInitial = variant === 'initial';

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			renderAppender: InnerBlocks.ButtonBlockAppender,
			template: [
				// Quirk: this will only get applied to the block (as inner blocks) if it's *rendered* in the editor.
				// If the user never switches the state view, it will not be applied, so PHP code contains a fallback.
				[ 'core/paragraph', { content: __( 'Thank you for registering!', 'newspack' ) } ],
				[
					'core/paragraph',
					{ content: __( 'Check your email for a confirmation link.', 'newspack' ) },
				],
			],
		}
	);

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
				<div className="newspack-registration__state-bar">
					<span>{ __( 'Edited State', 'newspack' ) }</span>
					<div>
						<Button
							data-is-active={ isInitial }
							variant="secondary"
							onClick={ () => setVariant( 'initial' ) }
						>
							{ __( 'Initial', 'newspack' ) }
						</Button>
						<Button
							data-is-active={ ! isInitial }
							variant="secondary"
							onClick={ () => setVariant( 'success' ) }
						>
							{ __( 'Success', 'newspack' ) }
						</Button>
					</div>
				</div>
				{ variant === 'initial' && (
					<div className="newspack-registration">
						<form onSubmit={ ev => ev.preventDefault() }>
							<input type="email" placeholder={ placeholder } />
							<input type="submit" value={ label } />
						</form>
					</div>
				) }
				{ variant === 'success' && <div { ...innerBlocksProps } /> }
			</div>
		</>
	);
}
