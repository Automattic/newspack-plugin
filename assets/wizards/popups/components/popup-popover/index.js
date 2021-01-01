/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { MenuItem } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies.
 */
import { Popover, SelectControl, ToggleControl } from '../../../../components/src';
import { isOverlay } from '../../utils';
import './style.scss';

const frequencyMap = {
	never: __( 'Never', 'newspack' ),
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page', 'newspack' ),
};

const frequenciesForPopup = popup => {
	return Object.keys( frequencyMap )
		.filter( key => ! ( 'always' === key && isOverlay( popup ) ) )
		.map( key => ( { label: frequencyMap[ key ], value: key } ) );
};
class PopupPopover extends Component {
	/**
	 * Render.
	 */
	render = () => {
		const {
			deletePopup,
			popup,
			previewPopup,
			setSitewideDefaultPopup,
			onFocusOutside,
			publishPopup,
			segments,
			updatePopup,
		} = this.props;
		const { id, sitewide_default: sitewideDefault, edit_link: editLink, options, status } = popup;
		const { frequency, selected_segment_id: selectedSegmentId } = options;
		const isDraft = 'draft' === status;
		const isTestMode = 'test' === frequency;
		return (
			<Popover
				position="bottom left"
				onFocusOutside={ onFocusOutside }
				onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside() }
			>
				{ isOverlay( { options } ) && ! isTestMode && ! isDraft && (
					<MenuItem
						onClick={ () => {
							setSitewideDefaultPopup( id, ! sitewideDefault );
							onFocusOutside();
						} }
						className="newspack-button"
					>
						<div className="newspack-popup-action-card-popover-control">
							{ __( 'Sitewide default', 'newspack' ) }
							<ToggleControl checked={ sitewideDefault } onChange={ () => null } />
						</div>
					</MenuItem>
				) }
				<MenuItem
					onClick={ () => {
						updatePopup( id, { frequency: isTestMode ? 'daily' : 'test' } );
						onFocusOutside();
					} }
					className="newspack-button"
				>
					<div className="newspack-popup-action-card-popover-control">
						{ __( 'Test mode', 'newspack' ) }
						<ToggleControl checked={ isTestMode } onChange={ () => null } />
					</div>
				</MenuItem>
				{ 'test' !== frequency && (
					<MenuItem className="newspack-button newspack-popup-action-card-select-button">
						<SelectControl
							onChange={ value => {
								updatePopup( id, { frequency: value } );
								onFocusOutside();
							} }
							className="newspack-popup-action-card-select"
							options={ frequenciesForPopup( popup ) }
							value={ frequency }
						/>
					</MenuItem>
				) }
				<MenuItem className="newspack-button newspack-popup-action-card-select-button">
					<SelectControl
						onChange={ value => {
							updatePopup( id, { selected_segment_id: value } );
							onFocusOutside();
						} }
						className="newspack-popup-action-card-select"
						options={ [
							{ label: __( 'Default (no segment)', 'newspck' ), value: '' },
							...segments.map( segment => ( { label: segment.name, value: segment.id } ) ),
						] }
						value={ selectedSegmentId }
					/>
				</MenuItem>
				<MenuItem
					onClick={ () => {
						onFocusOutside();
						previewPopup( popup );
					} }
					className="newspack-button"
				>
					{ __( 'Preview', 'newspack' ) }
				</MenuItem>
				<MenuItem href={ decodeEntities( editLink ) } className="newspack-button" isLink>
					{ __( 'Edit', 'newspack' ) }
				</MenuItem>
				{ publishPopup && (
					<MenuItem onClick={ () => publishPopup( id ) } className="newspack-button">
						{ __( 'Publish', 'newspack' ) }
					</MenuItem>
				) }
				<MenuItem onClick={ () => deletePopup( id ) } className="newspack-button">
					{ __( 'Delete', 'newspack' ) }
				</MenuItem>
				<div className="newspack-popup-info">
					{ __( 'ID:', 'newspack' ) } { popup.id }
				</div>
			</Popover>
		);
	};
}

export default PopupPopover;
