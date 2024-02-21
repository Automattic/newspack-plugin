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
import { useState } from '@wordpress/element';
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
			const { caption = null } = props.attributes;
			const { _media_credit: credit = '' } = props.attributes.meta ?? {};
			const [ isCaptionVisible, setIsCaptionVisible ] = useState< boolean >(
				'' !== caption || '' !== credit
			);
			if ( props.name === 'core/image' ) {
				const id = props.attributes.id ?? 0;
				const classes = classnames(
					'newspack-block__core-image',
					props.className,
					id > 0 && 'has-image',
					isCaptionVisible && 'caption-visible'
				);
				return (
					<div className={ classes }>
						<Edit { ...props } />
						{ id !== 0 && (
							<>
								<Figcaption { ...{ ...props, isCaptionVisible } } />
								<Loader attributes={ props.attributes } setAttributes={ props.setAttributes } />
								<Toolbar { ...{ isCaptionVisible, setIsCaptionVisible } } />
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
