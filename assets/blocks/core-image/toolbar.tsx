/**
 * Newspack Core Image, Toolbar
 */

/**
 * Dependencies
 */
// External
import { Dispatch } from 'react';
// WordPress
import { __ } from '@wordpress/i18n';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
// Internal
import Icon from './icon';
import * as CoreImageBlockTypes from './types';

/**
 * Allow `group` prop on component.
 */
const CoreImageBlockControls: CoreImageBlockTypes.BlockControls = BlockControls;

/**
 * Toolbar
 */
const Toolbar = ( {
	setIsCaptionVisible,
	isCaptionVisible = false,
}: {
	setIsCaptionVisible: Dispatch< boolean >;
	isCaptionVisible: boolean;
} ) => {
	return (
		<CoreImageBlockControls group="block">
			<ToolbarGroup>
				<ToolbarButton
					icon={ Icon }
					label={
						isCaptionVisible
							? __( 'Add caption', 'newspack-plugin' )
							: __( 'Remove caption', 'newspack-plugin' )
					}
					className="newspack-block__core-image-caption-btn"
					isPressed={ isCaptionVisible }
					onClick={ () => {
						setIsCaptionVisible( ! isCaptionVisible );
					} }
				/>
			</ToolbarGroup>
		</CoreImageBlockControls>
	);
};

export default Toolbar;
