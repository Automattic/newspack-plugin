/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createContext, useContext, useEffect, useMemo, useState } from '@wordpress/element';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { useUserAvatar, usePostAuthors } from './hooks';
import { useCustomByline, extractAuthorIdsFromByline } from '../../shared/hooks/use-custom-byline';

/**
 * Fallback context that always returns null.
 * Used when the shared AuthorContext from newspack-blocks is not available.
 */
const FallbackAuthorContext = createContext( null );

/**
 * Get the shared AuthorContext from newspack-blocks if available, otherwise use fallback.
 * Resolved at render time (not module load) so it works regardless of script load order.
 */
const getSharedAuthorContext = () =>
	typeof window !== 'undefined' && window.NewspackAuthorContext ? window.NewspackAuthorContext : FallbackAuthorContext;

const AvatarInspectorControls = ( { setAttributes, attributes } ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Settings', 'newspack-plugin' ) }>
			<RangeControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Image size', 'newspack-plugin' ) }
				onChange={ newSize =>
					setAttributes( {
						size: newSize,
					} )
				}
				min={ 16 }
				max={ 128 }
				initialPosition={ attributes.size }
				value={ attributes.size }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Link to author archive', 'newspack-plugin' ) }
				onChange={ () => setAttributes( { linkToAuthorArchive: ! attributes.linkToAuthorArchive } ) }
				checked={ attributes.linkToAuthorArchive }
			/>
		</PanelBody>
	</InspectorControls>
);

const AvatarWrapper = ( { avatar, size, attributes, placeholder = false } ) => {
	const { className } = useBlockProps();
	const borderProps = useBorderProps( attributes );

	// Debounce the size used for image fetching so dragging the slider
	// doesn't fire a network request on every pixel change.
	const [ imageFetchSize, setImageFetchSize ] = useState( attributes?.size ?? 48 );
	useEffect( () => {
		const timer = setTimeout( () => setImageFetchSize( attributes?.size ?? 48 ), 150 );
		return () => clearTimeout( timer );
	}, [ attributes?.size ] );

	const avatarSrc = avatar?.src;
	if ( ! avatarSrc && ! placeholder ) {
		return null;
	}

	const duotoneClassName = className ? className.split( ' ' ).filter( classes => classes.includes( 'wp-duotone' ) ) : '';
	const classNames = clsx( 'newspack-avatar-wrapper', duotoneClassName );

	// Render placeholder for text-only bylines.
	if ( placeholder ) {
		return (
			<div
				className={ clsx( 'newspack-avatar-wrapper--placeholder', classNames ) }
				style={ {
					'--avatar-size': size + 'px',
					filter: duotoneClassName?.length ? `url(#${ duotoneClassName[ 0 ] })` : undefined,
					...borderProps.style,
				} }
				role="img"
				aria-label={ __( 'No avatar available', 'newspack-plugin' ) }
			>
				<svg
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 60 60"
					preserveAspectRatio="none"
					aria-hidden="true"
					focusable="false"
				>
					<path vectorEffect="non-scaling-stroke" d="M60 60 0 0" />
				</svg>
			</div>
		);
	}

	const doubledSizedSrc = addQueryArgs( removeQueryArgs( avatarSrc, [ 's' ] ), {
		s: imageFetchSize * 2,
	} );
	const avatarImage = (
		<img
			src={ doubledSizedSrc }
			alt={ avatar.alt || '' }
			className={ clsx( 'avatar', 'avatar-' + size, 'photo', 'wp-block-newspack-avatar__image', borderProps.className ) }
			style={ {
				width: size,
				height: size,
				...borderProps.style,
			} }
		/>
	);
	return (
		<div
			className={ classNames }
			style={ {
				'--avatar-size': size + 'px',
			} }
		>
			{ attributes.linkToAuthorArchive ? (
				<a href="#avatar-pseudo-link" className="wp-block-newspack-avatar__link" onClick={ event => event.preventDefault() }>
					{ avatarImage }
				</a>
			) : (
				avatarImage
			) }
		</div>
	);
};

const Edit = ( { attributes, context, setAttributes } ) => {
	const blockProps = useBlockProps();

	// Check for parent block context first (nested mode - single author).
	const authorFromBlockContext = context[ 'newspack-blocks/author' ];
	const ResolvedAuthorContext = getSharedAuthorContext();
	const authorFromReactContext = useContext( ResolvedAuthorContext );
	const authorFromParent = authorFromBlockContext || authorFromReactContext;

	// Hooks must be called unconditionally per React rules.
	const { postId, postType } = context;
	const avatar = useUserAvatar( { userId: attributes?.userId, postId, postType } );
	const allAuthors = usePostAuthors( { postId, postType } );
	const { bylineActive, bylineContent } = useCustomByline( postId, postType );

	// Memoize author ID extraction to avoid running regex on every render.
	const authorIds = useMemo( () => extractAuthorIdsFromByline( bylineContent ), [ bylineContent ] );

	const renderAvatar = ( currentAvatar, key ) => (
		<AvatarWrapper key={ key } avatar={ currentAvatar } size={ attributes.size } attributes={ attributes } />
	);

	// Nested mode: render single author from parent context.
	if ( authorFromParent ) {
		let avatarUrl = '';
		if ( authorFromParent.avatar ) {
			if ( authorFromParent.avatar.includes( '<img' ) ) {
				const match = authorFromParent.avatar.match( /src=["']([^"']+)["']/ );
				avatarUrl = match?.[ 1 ] || '';
			} else {
				avatarUrl = authorFromParent.avatar;
			}
		}

		if ( ! avatarUrl ) {
			return null;
		}

		const parentAvatar = {
			src: avatarUrl,
			alt: authorFromParent.name || '',
			minSize: 16,
			maxSize: 128,
		};

		return (
			<>
				<AvatarInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
				<div { ...blockProps }>{ renderAvatar( parentAvatar, 'nested-author' ) }</div>
			</>
		);
	}

	// Text-only custom byline (no [Author] shortcodes) — show placeholder.
	const isTextOnlyByline = bylineActive && ( ! bylineContent || authorIds.length === 0 );
	if ( isTextOnlyByline ) {
		return (
			<>
				<AvatarInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
				<AvatarWrapper size={ attributes.size } attributes={ attributes } placeholder />
			</>
		);
	}

	// Standalone mode: get authors from post context.
	const authors = allAuthors?.length ? allAuthors : null;

	// Wait until we have something to render
	if ( ! avatar?.src && ! authors?.length ) {
		return <div { ...blockProps }>{ __( 'Loading avatar…', 'newspack-plugin' ) }</div>;
	}

	return (
		<>
			<AvatarInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			<div { ...blockProps }>
				{ authors?.length
					? authors.map( ( author, index ) => {
							const currentAvatar = {
								src: author.avatarSrc,
								alt: author?.name || author?.display_name || '',
							};
							return renderAvatar( currentAvatar, author.id || index );
					  } )
					: renderAvatar( avatar, 'single-author' ) }
			</div>
		</>
	);
};

export default Edit;
