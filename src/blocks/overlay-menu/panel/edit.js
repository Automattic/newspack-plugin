/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { close as closeIcon } from '@wordpress/icons';
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	useSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PanelPreviewToggle from '../panel-preview-toggle';

const DIRECTION_CONFIG = {
	left: { positionClass: 'overlay-menu__panel--left' },
	right: { positionClass: 'overlay-menu__panel--right' },
};

const INNER_BLOCKS_TEMPLATE = [ [ 'core/navigation', { layout: { type: 'flex', orientation: 'vertical' } } ] ];

/**
 * Edit component for the Overlay Menu Panel block.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {string}   props.clientId      Block client ID.
 * @param {Function} props.setAttributes Attribute setter.
 *
 * @return {JSX.Element} The block editor UI.
 */
export default function OverlayMenuPanelEdit( { attributes, clientId, setAttributes } ) {
	const { slideDirection, overlayColor, panelBackgroundColor, panelTextColor, isPreviewOpen: attrPreviewOpen } = attributes;

	// Always start closed — isPreviewOpen is ephemeral editor UI, not content.
	// Initialising from the attribute would re-open the panel on every editor
	// load if the post was saved while the preview was open.
	const [ isPreviewOpen, setIsPreviewOpen ] = useState( false );

	// Track whether the initial render has passed so we can skip the first
	// effect run and avoid restoring a stale saved value.
	const isMounted = useRef( false );

	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
			// Clear any stale persisted value from the previous editor session.
			if ( attrPreviewOpen ) {
				setAttributes( { isPreviewOpen: false } );
			}
			return;
		}
		// Sync when toggled externally (e.g. from the trigger block's toolbar).
		setIsPreviewOpen( attrPreviewOpen ?? false );
	}, [ attrPreviewOpen ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Update both local state and the saved attribute together.
	const togglePreview = open => {
		setIsPreviewOpen( open );
		setAttributes( { isPreviewOpen: open } );
	};

	const { positionClass } = DIRECTION_CONFIG[ slideDirection ] ?? DIRECTION_CONFIG.left;

	// Fetch the theme's color palette for the color panel.
	const [ colorSettings ] = useSettings( 'color.palette' );

	const panelClassName = isPreviewOpen
		? `overlay-menu__panel is-layout-constrained ${ positionClass } overlay-menu__panel--open`
		: 'overlay-menu__editor-panel-hidden';
	const panelStyle = isPreviewOpen
		? {
				// Force fixed positioning in the editor — Gutenberg can override
				// class-based position on block root elements, so we use an inline
				// style to guarantee it takes effect.
				position: 'fixed',
				...( panelBackgroundColor && { background: panelBackgroundColor } ),
				...( panelTextColor && { color: panelTextColor } ),
		  }
		: {};

	const blockProps = useBlockProps( { className: panelClassName, style: panelStyle } );

	return (
		<>
			<PanelPreviewToggle isOpen={ isPreviewOpen } onToggle={ () => togglePreview( ! isPreviewOpen ) } />

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'newspack-plugin' ) } initialOpen={ true }>
					<ToggleGroupControl
						label={ __( 'Slide direction', 'newspack-plugin' ) }
						help={ __( 'Choose which side of the screen the panel slides in from.', 'newspack-plugin' ) }
						value={ slideDirection }
						onChange={ val => setAttributes( { slideDirection: val } ) }
						isBlock
					>
						<ToggleGroupControlOption value="left" label={ __( 'Left', 'newspack-plugin' ) } />
						<ToggleGroupControlOption value="right" label={ __( 'Right', 'newspack-plugin' ) } />
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>

			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					settings={ [
						{
							label: __( 'Text', 'newspack-plugin' ),
							colorValue: panelTextColor,
							onColorChange: val => setAttributes( { panelTextColor: val ?? '' } ),
						},
						{
							label: __( 'Background', 'newspack-plugin' ),
							colorValue: panelBackgroundColor,
							onColorChange: val => setAttributes( { panelBackgroundColor: val ?? '' } ),
						},
						{
							label: __( 'Overlay', 'newspack-plugin' ),
							colorValue: overlayColor,
							onColorChange: val => setAttributes( { overlayColor: val ?? '' } ),
						},
					] }
					panelId={ clientId }
					colors={ colorSettings }
					gradients={ [] }
					enableAlpha
					disableCustomGradients
					__experimentalIsRenderedInSidebar
				/>
			</InspectorControls>

			{ /* Scrim — outside block wrapper so it covers the full editor canvas. */ }
			{ isPreviewOpen && (
				<div
					className="overlay-menu__scrim alignfull"
					style={ overlayColor ? { background: overlayColor } : {} }
					onClick={ () => togglePreview( false ) }
					aria-hidden="true"
				/>
			) }

			<div { ...blockProps }>
				<div className="overlay-menu__close-wrapper">
					<button type="button" className="overlay-menu__close" onClick={ () => togglePreview( false ) }>
						<span className="overlay-menu__icon" aria-hidden="true">
							{ closeIcon }
						</span>
						<span className="screen-reader-text">{ __( 'Close', 'newspack-plugin' ) }</span>
					</button>
				</div>
				<div className="overlay-menu__content">
					<InnerBlocks template={ INNER_BLOCKS_TEMPLATE } templateLock={ false } />
				</div>
			</div>
		</>
	);
}
