/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';
import { BlockControls, useBlockProps, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, Button, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getSharedAuthorContext } from '../../shared/author-context';
import { getAvailableServices, buildTemplate } from './utils';

const ALLOWED_BLOCKS = [ 'newspack/author-social-link' ];

/**
 * Edit component for the Author Social Links inner block.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 * @param {string}   props.clientId      Block client ID.
 * @return {JSX.Element} The edit component.
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const AuthorContext = getSharedAuthorContext();
	const author = useContext( AuthorContext );
	const { iconSize } = attributes;
	const hasPopulated = useRef( false );

	const blockProps = useBlockProps( {
		className: 'wp-block-newspack-author-profile-social',
		style: {
			'--icon-size': `${ iconSize }px`,
		},
	} );

	// Check current inner blocks.
	const { innerBlockCount, currentServices, innerBlocks } = useSelect(
		select => {
			const editor = select( 'core/block-editor' );
			const blocks = editor.getBlocks( clientId );
			return {
				innerBlockCount: blocks.length,
				currentServices: blocks.map( b => b.attributes.service ).filter( Boolean ),
				innerBlocks: blocks,
			};
		},
		[ clientId ]
	);

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	// Auto-populate inner blocks from author data on first render (when no saved inner blocks).
	useEffect( () => {
		if ( hasPopulated.current || innerBlockCount > 0 ) {
			return;
		}

		const services = getAvailableServices( author );
		if ( services.length === 0 ) {
			return;
		}

		hasPopulated.current = true;

		const blocks = services.map( service => createBlock( 'newspack/author-social-link', { service } ) );
		replaceInnerBlocks( clientId, blocks, false );
	}, [ author, innerBlockCount, clientId, replaceInnerBlocks ] );

	const services = getAvailableServices( author );
	const missingServices = services.filter( s => ! currentServices.includes( s ) );

	const resetLinks = () => {
		const blocks = services.map( service => createBlock( 'newspack/author-social-link', { service } ) );
		replaceInnerBlocks( clientId, blocks, false );
	};

	const addMissingLinks = () => {
		const newBlocks = missingServices.map( service => createBlock( 'newspack/author-social-link', { service } ) );
		replaceInnerBlocks( clientId, [ ...innerBlocks, ...newBlocks ], false );
	};

	if ( services.length === 0 && innerBlockCount === 0 ) {
		return (
			<div { ...blockProps }>
				<p className="social-links-placeholder">{ __( 'Social links will appear here.', 'newspack-plugin' ) }</p>
			</div>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton icon={ backup } label={ __( 'Reset links', 'newspack-plugin' ) } onClick={ resetLinks } />
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Social Links Settings', 'newspack-plugin' ) }>
					<RangeControl
						label={ __( 'Icon Size', 'newspack-plugin' ) }
						value={ iconSize }
						onChange={ value => setAttributes( { iconSize: value } ) }
						min={ 16 }
						max={ 48 }
					/>
					{ missingServices.length > 0 && (
						<Button variant="secondary" onClick={ addMissingLinks }>
							{ __( 'Add missing links', 'newspack-plugin' ) }
						</Button>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<ul className="author-profile-social__list">
					<InnerBlocks
						allowedBlocks={ ALLOWED_BLOCKS }
						template={ buildTemplate( services ) }
						orientation="horizontal"
						renderAppender={ false }
					/>
				</ul>
			</div>
		</>
	);
}
