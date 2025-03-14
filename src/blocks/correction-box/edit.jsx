/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { update } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import ServerSideRender from '@wordpress/server-side-render';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	PanelBody,
	PanelRow,
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import meta from './block.json';

/**
 * Edit function for the Correction Box block.
 *
 * @param {Object}   props               The block properties.
 * @param {Object}   props.attributes    The block attributes.
 * @param {Function} props.setAttributes The block attributes setter.
 *
 * @return {JSX.Element} The Correction Box block.
 */
export default function Edit( { attributes, setAttributes } ) {
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

	/**
	 * Correction Settings Panel.
	 *
	 * @return {JSX.Element} The Correction Settings Panel JSX.
	 */
	function CorrectionSettings() {
		return (
			<InspectorControls>
				<PanelBody title={ __( 'Correction Box Settings', 'newspack-plugin' ) }>
					<PanelRow>
						<SelectControl
							label={ __( 'Corrections by Location', 'newspack-plugin' ) }
							help={ __(
								'Filter corrections by their location.',
								'newspack-plugin'
							) }
							value={ attributes.location }
							options={ [
								{ label: __( 'Top', 'newspack-plugin' ), value: 'top' },
								{ label: __( 'Bottom', 'newspack-plugin' ), value: 'bottom' },
								{ label: __( 'All', 'newspack-plugin' ), value: 'all' },
							] }
							onChange={ value => setAttributes( { location : value } ) }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
		);
	}

	return 'wp_template' === postType ? (
		<>
			<EmptyPlaceholder />
			<CorrectionSettings />
		</>
	) : (
		<>
			<CorrectionSettings />
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
				attributes={ attributes }
			/>
		</>
	);
}
