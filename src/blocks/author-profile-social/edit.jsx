/**
 * WordPress dependencies
 */
import { useContext, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { BlockControls, useBlockProps, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Button, ToolbarButton, ToolbarGroup, Tooltip } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getSharedAuthorContext } from '../../shared/author-context';
import { getAvailableServices, getIconSizeOptions, roundIconSize } from './utils';

const ALLOWED_BLOCKS = [ 'newspack/author-social-link' ];

// Module-level cache so multiple block instances share one fetch.
let allServiceKeysCache = null;
const fetchAllServiceKeys = () => {
	if ( ! allServiceKeysCache ) {
		allServiceKeysCache = apiFetch( { path: '/newspack/v1/social-icons' } )
			.then( svgs => Object.keys( svgs ) )
			.catch( () => [] );
	}
	return allServiceKeysCache;
};

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
	const [ allServiceKeys, setAllServiceKeys ] = useState( null ); // null = loading

	const blockProps = useBlockProps( {
		className: 'wp-block-newspack-author-profile-social',
		style: {
			'--icon-size': `${ roundIconSize( iconSize ) }px`,
		},
	} );

	// Get inner blocks (stable reference from the store).
	const innerBlocks = useSelect( select => select( 'core/block-editor' ).getBlocks( clientId ), [ clientId ] );
	const innerBlockCount = innerBlocks.length;
	const currentServices = useMemo( () => innerBlocks.map( b => b.attributes.service ).filter( Boolean ), [ innerBlocks ] );

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	// Fetch the full list of supported services from the social icons endpoint.
	useEffect( () => {
		fetchAllServiceKeys().then( setAllServiceKeys );
	}, [] );

	// Auto-populate inner blocks from author data on first render (when no saved inner blocks).
	// Wait for the service keys fetch to complete so we can use the full list.
	useEffect( () => {
		if ( hasPopulated.current || innerBlockCount > 0 || allServiceKeys === null ) {
			return;
		}

		const services = allServiceKeys.length > 0 ? allServiceKeys : getAvailableServices( author );
		if ( services.length === 0 ) {
			return;
		}

		hasPopulated.current = true;

		const blocks = services.map( service => createBlock( 'newspack/author-social-link', { service } ) );
		replaceInnerBlocks( clientId, blocks, false );
	}, [ author, allServiceKeys, innerBlockCount, clientId, replaceInnerBlocks ] );

	const services = getAvailableServices( author );
	const missingServices = services.filter( s => ! currentServices.includes( s ) );

	const resetLinks = () => {
		const resetWith = allServiceKeys?.length > 0 ? allServiceKeys : services;
		const blocks = resetWith.map( service => createBlock( 'newspack/author-social-link', { service } ) );
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
					<Tooltip text={ __( 'Reset links', 'newspack-plugin' ) }>
						<ToolbarButton label={ __( 'Reset links', 'newspack-plugin' ) } onClick={ resetLinks }>
							{ __( 'Reset', 'newspack-plugin' ) }
						</ToolbarButton>
					</Tooltip>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'newspack-plugin' ) }>
					<SelectControl
						label={ __( 'Icon size', 'newspack-plugin' ) }
						value={ iconSize ?? 24 }
						options={ getIconSizeOptions() }
						onChange={ value => setAttributes( { iconSize: value } ) }
						__next40pxDefaultSize
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
					<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } orientation="horizontal" renderAppender={ false } />
				</ul>
			</div>
		</>
	);
}
