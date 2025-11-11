/* globals newspack_content_gate */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	Button,
	CheckboxControl,
	ComboboxControl,
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ColorPaletteControls from '../../../packages/components/src/color-palette-controls';

function CountdownSettings() {
	const { meta } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		return {
			meta: getEditedPostAttribute( 'meta' ),
		};
	} );
	const { editPost } = useDispatch( 'core/editor' );
	return (
		<>
			<BaseControl
				id="content-gate-countdown-banner"
				help={
					! meta.metering
						? __( 'Metering must be enabled to show a countdown banner.', 'newspack-plugin' )
						: __( 'Show a countdown banner before the content is restricted.', 'newspack-plugin' )
				}
			>
				{ meta.metering && (
					<CheckboxControl
						label={ __( 'Enable countdown banner', 'newspack-plugin' ) }
						disabled={ ! meta.metering }
						checked={ meta.metering_countdown }
						onChange={ value => editPost( { meta: { metering_countdown: value } } ) }
					/>
				) }
				{ ! meta.metering && (
					<Button variant="secondary" onClick={ () => editPost( { meta: { metering: true, metering_countdown: true } } ) }>
						{ __( 'Enable metering', 'newspack-plugin' ) }
					</Button>
				) }
			</BaseControl>
			{ meta.metering && meta.metering_countdown && (
				<>
					<TextControl
						label={ __( 'Countdown text', 'newspack-plugin' ) }
						value={ meta.metering_countdown_text }
						onChange={ value => editPost( { meta: { metering_countdown_text: value } } ) }
					/>
					<TextControl
						label={ __( 'Countdown CTA text', 'newspack-plugin' ) }
						value={ meta.metering_countdown_cta_text }
						onChange={ value => editPost( { meta: { metering_countdown_cta_text: value } } ) }
					/>
					<ToggleGroupControl
						label={ __( 'Countdown CTA type', 'newspack-plugin' ) }
						value={ meta.metering_countdown_cta_type }
						onChange={ value => editPost( { meta: { metering_countdown_cta_type: value } } ) }
						isBlock
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption value="url" label={ __( 'URL', 'newspack-plugin' ) } />
						<ToggleGroupControlOption value="product" label={ __( 'Product', 'newspack-plugin' ) } />
					</ToggleGroupControl>
					{ meta.metering_countdown_cta_type === 'url' && (
						<TextControl
							label={ __( 'Countdown CTA URL', 'newspack-plugin' ) }
							help={ __( 'The URL to redirect to when the CTA is clicked.', 'newspack-plugin' ) }
							value={ meta.metering_countdown_cta_url }
							onChange={ value => editPost( { meta: { metering_countdown_cta_url: value } } ) }
							placeholder={ __( 'https://example.com', 'newspack-plugin' ) }
						/>
					) }
					{ meta.metering_countdown_cta_type === 'product' && (
						<BaseControl
							label={ __( 'Countdown CTA product', 'newspack-plugin' ) }
							help={ __( 'Start a checkout with the selected product when the CTA is clicked.', 'newspack-plugin' ) }
							id="content-gate-countdown-cta-product"
						>
							<ComboboxControl
								value={ meta.metering_countdown_cta_product_id }
								onChange={ value => editPost( { meta: { metering_countdown_cta_product_id: value ? parseInt( value ) : 0 } } ) }
								options={ newspack_content_gate.available_products }
								__next40pxDefaultSize
							/>
						</BaseControl>
					) }
					<ColorPaletteControls
						colors={ [
							{
								label: __( 'Background color', 'newspack-plugin' ),
								value: meta.metering_countdown_background_color,
								onChange: value => editPost( { meta: { metering_countdown_background_color: value } } ),
							},
							{
								label: __( 'Text color', 'newspack-plugin' ),
								value: meta.metering_countdown_text_color,
								onChange: value => editPost( { meta: { metering_countdown_text_color: value } } ),
							},
							{
								label: __( 'CTA background color', 'newspack-plugin' ),
								value: meta.metering_countdown_cta_background_color,
								onChange: value => editPost( { meta: { metering_countdown_cta_background_color: value } } ),
							},
							{
								label: __( 'CTA text color', 'newspack-plugin' ),
								value: meta.metering_countdown_cta_text_color,
								onChange: value => editPost( { meta: { metering_countdown_cta_text_color: value } } ),
							},
						] }
					/>
				</>
			) }
		</>
	);
}

export default CountdownSettings;
