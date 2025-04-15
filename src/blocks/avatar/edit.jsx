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
import { isRTL, __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	ResizableBox,
	ToggleControl,
} from '@wordpress/components';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { useUserAvatar, usePostAuthors } from './hooks';
const AvatarInspectorControls = ( {
	setAttributes,
	attributes,
} ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Settings', 'newspack-plugin' ) }>
			<RangeControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Image size', 'newspack-plugin' ) }
				onChange={ ( newSize ) =>
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
				label={ __( 'Link to user profile', 'newspack-plugin' ) }
				onChange={ () =>
					setAttributes( { linkToAuthorArchive: ! attributes.linkToAuthorArchive } )
				}
				checked={ attributes.linkToAuthorArchive }
			/>
		</PanelBody>
	</InspectorControls>
);

const ResizableAvatar = ( {
	setAttributes,
	attributes,
	avatar,
	isSelected,
} ) => {
	const { className } = useBlockProps();
	const duotoneClassName = className
		? className.split( ' ' ).filter( ( classes ) => classes.includes( 'wp-duotone' ) )
		: '';
	const classNames = clsx(
		'newspack-avatar-wrapper',
		duotoneClassName,
	);
	const borderProps = useBorderProps( attributes );
	const doubledSizedSrc  = addQueryArgs(
		removeQueryArgs( avatar?.src, [ 's' ] ),
		{
			s: attributes?.size * 2,
		}
	);
	return (
			<ResizableBox
				className={classNames}
				size={ {
					width: attributes.size,
					height: attributes.size,
				} }
				showHandle={ isSelected }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						size: parseInt(
							attributes.size + ( delta.height || delta.width ),
							10
						),
					} );
				} }
				lockAspectRatio
				enable={ {
					top: false,
					right: ! isRTL(),
					bottom: true,
					left: isRTL(),
				} }
				minWidth={ attributes.minWidth }
				maxWidth={ attributes.maxWidth }
			>
				<img
					src={ doubledSizedSrc }
					alt={ avatar.alt }
					className={ clsx(
						'avatar',
						'avatar-' + attributes.size,
						'photo',
						'wp-block-newspack-avatar__image',
						borderProps.className
					) }
					style={ borderProps.style }
				/>
			</ResizableBox>
	);
};

const Edit = ( { attributes, context, setAttributes, isSelected } ) => {
	const { postId, postType } = context;
	const avatar = useUserAvatar( { userId: attributes?.userId, postId, postType } );
	const allAuthors = usePostAuthors( { postId, postType } );
	const blockProps = useBlockProps();

	const authors = allAuthors?.length ? allAuthors : null;

	// Wait until we have something to render
	if ( ! avatar?.src && !authors?.length ) {
		return <div { ...blockProps }>{ __( 'Loading avatar…', 'newspack-plugin' ) }</div>;
	}

	const renderAvatar = ( currentAvatar, key ) => {
		const avatarEl = (
			<ResizableAvatar
				key={ key }
				attributes={ attributes }
				avatar={ currentAvatar }
				isSelected={ isSelected }
				setAttributes={ setAttributes }
			/>
		);

		if ( attributes.linkToAuthorArchive ) {
			return (
				<a
					key={ key }
					href="#avatar-pseudo-link"
					className="wp-block-newspack-avatar__link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ avatarEl }
				</a>
			);
		}

		return avatarEl;
	};

	return (
		<>
			<AvatarInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			{authors?.length
				? authors.map( ( author, index ) => {
						const currentAvatar = {
							src: author?.avatar_urls?.['96'],
							alt: author?.name,
							minSize: 16,
							maxSize: 128,
						};
						return renderAvatar( currentAvatar, author.id || index );
					} )
				: renderAvatar( avatar, 'single-author' )}
		</>
	);
};


export default Edit;
