/**
 * Newspack Core Image, Toolbar
 */
/**
 * Dependencies
 */
// External
import { Dispatch } from 'react';
// WordPress
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
					label="Add a caption"
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
