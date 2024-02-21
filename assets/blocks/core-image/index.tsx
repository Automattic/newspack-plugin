/**
 * Newspack Core Image group of components for overriding
 * caption behavior.
 */

/**
 * Dependencies
 */
// External
import classnames from 'classnames';
// WordPress
import { addFilter } from '@wordpress/hooks';
import { useState, useEffect } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
// Internal
import './style.scss';
import Loader from './loader';
import Toolbar from './toolbar';
import Figcaption from './figcaption';
/**
 * TS
 */
import * as CoreImageBlockTypes from './types';

/**
 * Add image credit meta to core/image block attributes
 */
addFilter(
	'blocks.registerBlockType',
	'newspack-plugin/register-hook/core-image',
	( settings, name ) => {
		if ( name !== 'core/image' ) {
			return settings;
		}
		return {
			...settings,
			attributes: {
				...settings.attributes,
				meta: {
					type: 'object',
					default: {},
				},
			},
		};
	}
);

/**
 * Populate attributes with meta data.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-edit-hook/core-image',
	createHigherOrderComponent( Edit => {
		const BlockEditHoc = (
			props: CoreImageBlockTypes.BaseProps< CoreImageBlockTypes.Attributes >
		) => {
			const caption = ( props.attributes.caption ?? '' ).trim();
			const [ isCaptionVisible, setIsCaptionVisible ] = useState< boolean >( '' !== caption );

			// If caption visibility is toggled off, clear the caption
			useEffect( () => {
				if ( ! isCaptionVisible && '' !== caption ) {
					props.setAttributes( { caption: '' } );
				}
			}, [ isCaptionVisible ] );

			if ( props.name === 'core/image' ) {
				const id = props.attributes.id ?? 0;
				const classes = classnames( props.className, 'newspack-block__core-image' );
				return (
					<div className={ classes }>
						<Edit { ...props } />
						{ id !== 0 && (
							<>
								<Figcaption
									attributes={ props.attributes }
									setAttributes={ props.setAttributes }
									isCaptionVisible={ isCaptionVisible }
								/>
								<Loader attributes={ props.attributes } setAttributes={ props.setAttributes } />
								<Toolbar
									isCaptionVisible={ isCaptionVisible }
									setIsCaptionVisible={ setIsCaptionVisible }
								/>
							</>
						) }
					</div>
				);
			}
			return <Edit { ...props } />;
		};
		return BlockEditHoc;
	}, 'withCustomMetaData' )
);
