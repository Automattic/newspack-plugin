/**
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Edit function for the Content Gate IP Check block.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 * @return {JSX.Element} The block editor component.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { successUrl, failureUrl } = attributes;
	const blockProps = useBlockProps( { className: 'newspack-content-gate-ip-check-block' } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Redirect URLs', 'newspack-plugin' ) }>
					<TextControl
						label={ __( 'Success URL', 'newspack-plugin' ) }
						help={ __( 'Redirect here when IP is verified.', 'newspack-plugin' ) }
						type="url"
						value={ successUrl }
						onChange={ value => setAttributes( { successUrl: value } ) }
					/>
					<TextControl
						label={ __( 'Failure URL', 'newspack-plugin' ) }
						help={ __( 'Redirect here when IP is not verified.', 'newspack-plugin' ) }
						type="url"
						value={ failureUrl }
						onChange={ value => setAttributes( { failureUrl: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<p>
					<strong>{ __( 'IP Check Gate', 'newspack-plugin' ) }</strong>
				</p>
				<p>
					{ __( 'Success URL:', 'newspack-plugin' ) } { successUrl || <em>{ __( '(not set)', 'newspack-plugin' ) }</em> }
				</p>
				<p>
					{ __( 'Failure URL:', 'newspack-plugin' ) } { failureUrl || <em>{ __( '(not set)', 'newspack-plugin' ) }</em> }
				</p>
			</div>
		</>
	);
}
