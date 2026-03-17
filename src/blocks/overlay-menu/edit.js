/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PanelPreviewToggle from './panel-preview-toggle';

const BLOCKS_TEMPLATE = [ [ 'newspack/overlay-menu-trigger' ], [ 'newspack/overlay-menu-panel' ] ];

/**
 * Edit component for the Overlay Menu block.
 *
 * Provides a locked template containing the trigger and panel child blocks.
 * The instanceId is set on first insert and shared with children via block context.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @param {string}   props.clientId      Block client ID.
 *
 * @return {JSX.Element} The block editor UI.
 */
export default function OverlayMenuEdit( { attributes, setAttributes, clientId } ) {
	const { instanceId } = attributes;

	// Set a stable instance ID derived from the block's client ID on first insert.
	useEffect( () => {
		if ( ! instanceId ) {
			setAttributes( { instanceId: clientId.replace( /-/g, '' ).slice( 0, 12 ) } );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Find the child panel block so we can read and toggle its isPreviewOpen attribute.
	const panelBlock = useSelect( select => {
		const block = select( 'core/block-editor' ).getBlock( clientId );
		return block?.innerBlocks?.find( b => b.name === 'newspack/overlay-menu-panel' );
	} );

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const isPreviewOpen = panelBlock?.attributes?.isPreviewOpen ?? false;

	const togglePreview = () => {
		if ( panelBlock ) {
			updateBlockAttributes( panelBlock.clientId, { isPreviewOpen: ! isPreviewOpen } );
		}
	};

	const blockProps = useBlockProps( {
		className: 'is-layout-flex',
	} );

	return (
		<>
			<PanelPreviewToggle isOpen={ isPreviewOpen } onToggle={ togglePreview } />
			<div { ...blockProps }>
				<InnerBlocks
					template={ BLOCKS_TEMPLATE }
					templateLock="all"
					allowedBlocks={ [ 'newspack/overlay-menu-trigger', 'newspack/overlay-menu-panel' ] }
				/>
			</div>
		</>
	);
}
