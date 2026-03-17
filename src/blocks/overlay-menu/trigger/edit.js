/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { menu as menuIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PanelPreviewToggle from '../panel-preview-toggle';

/**
 * Edit component for the Overlay Menu Trigger block.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @param {string}   props.clientId      Block client ID.
 * @param {Object}   props.context       Block context (instanceId from parent).
 *
 * @return {JSX.Element} The block editor UI.
 */
export default function OverlayMenuTriggerEdit( { attributes, setAttributes, clientId, context } ) {
	const { triggerText, className: blockClassName } = attributes;
	const instanceId = context[ 'newspack-overlay-menu/instanceId' ] ?? '';

	const classes = ( blockClassName || '' ).split( ' ' );
	const isIconOnly = classes.includes( 'is-style-icon-only' );
	const isTextOnly = classes.includes( 'is-style-text-only' );
	const showTriggerIcon = ! isTextOnly;

	// Find the panel sibling block so we can mirror and control its preview state.
	const panelBlock = useSelect(
		select => {
			const { getBlockRootClientId, getBlocks } = select( 'core/block-editor' );
			const parentClientId = getBlockRootClientId( clientId );
			return getBlocks( parentClientId ).find( b => b.name === 'newspack/overlay-menu-panel' );
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const isPanelOpen = panelBlock?.attributes?.isPreviewOpen ?? false;

	const blockProps = useBlockProps( {
		className: 'overlay-menu__trigger wp-block-button__link wp-element-button',
	} );

	return (
		<>
			<PanelPreviewToggle
				isOpen={ isPanelOpen }
				onToggle={ () =>
					panelBlock &&
					updateBlockAttributes( panelBlock.clientId, {
						isPreviewOpen: ! isPanelOpen,
					} )
				}
			/>

			<button
				{ ...blockProps }
				type="button"
				aria-label={ triggerText || __( 'Menu', 'newspack-plugin' ) }
				aria-controls={ instanceId ? `newspack-overlay-panel-${ instanceId }` : undefined }
				onClick={ e => e.preventDefault() }
			>
				{ showTriggerIcon && (
					<span className="overlay-menu__icon" aria-hidden="true">
						{ menuIcon }
					</span>
				) }
				<RichText
					tagName="span"
					className={ isIconOnly ? 'screen-reader-text' : undefined }
					aria-label={ __( 'Button text', 'newspack-plugin' ) }
					placeholder={ __( 'Menu', 'newspack-plugin' ) }
					value={ triggerText }
					onChange={ val => setAttributes( { triggerText: stripHTML( val ) } ) }
					withoutInteractiveFormatting
				/>
			</button>
		</>
	);
}
