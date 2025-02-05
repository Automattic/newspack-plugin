/* globals newspackBylines */

/**
 * WordPress dependencies
 */
import { Button, ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { RichText } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';

const BYLINE_ID = 'newspack-byline';

const TagInlineBlock = ( { tag, onRemove, onEdit } ) => {
	return (
		<span
			className="tag-inline-block"
			style={ {
				background: '#e1e1e1',
				padding: '2px 6px',
				borderRadius: '4px',
				margin: '0 4px',
			} }
		>
			<Button
				isLink
				onClick={ onEdit }
				style={ { padding: '0', margin: '0' } }
			>
				{ tag.name }
			</Button>
			<Button
				isLink
				onClick={ onRemove }
				style={ { padding: '0', margin: '0 0 0 4px' } }
			>
				x
			</Button>
		</span>
	);
};

const BylinesSettingsPanel = ( { setAttributes } ) => {
	const tags = [
		{
			id: 0,
			name: 'Maria',
		},
		{
			id: 1,
			name: 'Jose',
		},
	];

	// Add a tag
	const handleAddTag = tag => {
		const updatedTags = [ ...tags, tag ];
		setAttributes( { tags: updatedTags } );
	};

	// Remove a tag
	const handleRemoveTag = tagToRemove => {
		const updatedTags = tags.filter( tag => tag.id !== tagToRemove.id );
		setAttributes( { tags: updatedTags } );
	};

	// Edit text
	const handleChangeText = newText => {
		setAttributes( { content: newText } );
	};

	const { editPost } = useDispatch( 'core/editor' );

	const { getEditedPostAttribute } = useSelect( select =>
		select( 'core/editor' )
	);

	const [ byline ] = useState(
		getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] || ''
	);

	const [ isEnabled, setIsEnabled ] = useState(
		!! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ]
	);

	// Update byline text in editor.
	useEffect( () => {
		prependBylineToContent( isEnabled ? byline : '' );
	}, [ byline, isEnabled ] );

	// Enabled toggle handler.
	const handleEnableToggle = value => {
		editPost( { meta: { [ newspackBylines.metaKeyActive ]: value } } );
		setIsEnabled( value );
	};

	const prependBylineToContent = text => {
		const contentEl = document.querySelector( '.wp-block-post-content' );
		if ( contentEl ) {
			let bylineEl = document.getElementById( BYLINE_ID );
			if ( ! bylineEl ) {
				bylineEl = document.createElement( 'div' );
				bylineEl.id = BYLINE_ID;
				contentEl.insertBefore( bylineEl, contentEl.firstChild );
			}
			// If there are author tags
			if ( /<Author id=(\d+)>/.test( text ) ) {
				text = text.replace(
					/<Author id=(\d+)>([^<]+)<\/Author>/g,
					( match, authorId, authorName ) => {
						return `<a href="${ newspackBylines.siteUrl }/?author=${ authorId }">${ authorName }</a>`;
					}
				);
			}
			bylineEl.innerHTML = text;
		}
	};

	return (
		<PluginDocumentSettingPanel
			className="newspack-byline"
			name="Newspack Byline Settings Panel"
			title={ __( 'Newspack Custom Byline', 'newspack-plugin' ) }
		>
			<ToggleControl
				className="newspack-byline-toggle"
				checked={ isEnabled }
				label={ __( 'Enable custom byline', 'newspack-plugin' ) }
				onChange={ () => handleEnableToggle( ! isEnabled ) }
			/>
			{ isEnabled && (
				<>
					<RichText
						className="newspack-byline-textarea"
						tagName="div"
						value={ byline }
						onChange={ handleChangeText }
						placeholder={ __(
							'Enter custom byline…',
							'newspack-plugin'
						) }
						rows="4"
					/>

					<div className="tags">
						{ tags.map( tag => (
							<TagInlineBlock
								key={ tag.id }
								tag={ tag }
								onRemove={ () => handleRemoveTag( tag ) }
							/>
						) ) }
					</div>

					{ /* Add tags button */ }
					<Button
						onClick={ () =>
							handleAddTag( { id: Date.now(), name: 'New Tag' } )
						}
					>
						{ __( 'Add Tag', 'textdomain' ) }
					</Button>
				</>
			) }
		</PluginDocumentSettingPanel>
	);
};

registerPlugin( 'newspack-bylines-sidebar', {
	render: BylinesSettingsPanel,
	icon: false,
} );
