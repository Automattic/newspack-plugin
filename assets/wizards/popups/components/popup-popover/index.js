/**
 * Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
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
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page', 'newspack' ),
};

const frequenciesForPopup = popup => {
	return Object.keys( frequencyMap )
		.filter( key => ! ( 'always' === key && isOverlay( popup ) ) )
		.map( key => ( { label: frequencyMap[ key ], value: key } ) );
};

const PopupPopover = ( {
	deletePopup,
	popup,
	previewPopup,
	setSitewideDefaultPopup,
	onFocusOutside,
	publishPopup,
	segments,
	updatePopup,
} ) => {
	const { id, sitewide_default: sitewideDefault, edit_link: editLink, options, status } = popup;
	const { frequency, selected_segment_id: selectedSegmentId } = options;
	const isDraft = 'draft' === status;
	return (
		<Popover
			position="bottom left"
			onFocusOutside={ onFocusOutside }
			onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside() }
		>
			{ isOverlay( { options } ) && ! isDraft && (
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
			<MenuItem className="newspack-button newspack-popup-action-card-select-button">
				<SelectControl
					onChange={ value => {
						updatePopup( id, { selected_segment_id: value } );
						onFocusOutside();
					} }
					className="newspack-popup-action-card-select"
					options={ [
						{ label: __( 'Default (no segment)', 'newspck' ), value: '' },
						...segments.map( ( { name, id: segmentId } ) => ( { label: name, value: segmentId } ) ),
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
			{ 'publish' !== status && (
				<MenuItem onClick={ () => publishPopup( id, true ) } className="newspack-button">
					{ __( 'Publish', 'newspack' ) }
				</MenuItem>
			) }
			{ 'publish' === status && (
				<MenuItem onClick={ () => publishPopup( id, false ) } className="newspack-button">
					{ __( 'Unpublish', 'newspack' ) }
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
export default PopupPopover;
