/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { update } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import ServerSideRender from '@wordpress/server-side-render';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import meta from './block.json';

/**
 * Edit function for the Correction Box block.
 *
 * @return {JSX.Element} The Correction Box block.
 */
export default function Edit() {
	const [ isRefreshing, setIsRefreshing ] = useState( false );
	const postType = useSelect( select => select( 'core/editor' ).getCurrentPostType(), [] );

	/**
	 * Placeholder when no Corrections are available.
	 *
	 * @return {JSX.Element} The Empty Placeholder JSX.
	 */
	function EmptyPlaceholder() {
		return (
			<>
				<p>
					{ __(
						'This is the Corrections block, it will display all the corrections and clarifications.',
						'newspack-plugin'
					) }
				</p>
				<p>
					{ __(
						'If there are no corrections or clarifications, this block will not be displayed.',
						'newspack-plugin'
					) }
				</p>
			</>
		);
	}

	/**
	 * Toggle Refresh state.
	 */
	const toggleRefresh = () => {
		setIsRefreshing( ! isRefreshing );
	};

	return 'wp_template' === postType ? (
		<EmptyPlaceholder />
	) : (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ update }
						label={ __( 'Refresh', 'newspack-plugin' ) }
						onClick={ toggleRefresh }
					/>
				</ToolbarGroup>
			</BlockControls>
			<ServerSideRender
				block={ meta.name }
				EmptyResponsePlaceholder={ EmptyPlaceholder }
				refresh={ isRefreshing }
			/>
		</>
	);
}
