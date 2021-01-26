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
import { Popover, ToggleControl } from '../../../../components/src';
import { isOverlay } from '../../utils';
import './style.scss';

const PrimaryPopupPopover = ( {
	deletePopup,
	popup,
	previewPopup,
	setSitewideDefaultPopup,
	onFocusOutside,
	publishPopup,
	unpublishPopup,
} ) => {
	const { id, sitewide_default: sitewideDefault, edit_link: editLink, options, status } = popup;
	const isDraft = 'draft' === status;
	return (
		<Popover
			position="bottom left"
			onFocusOutside={ onFocusOutside }
			onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside() }
			className="newspack-popover__campaigns__primary-popover"
		>
			<MenuItem onClick={ () => onFocusOutside() } className="screen-reader-text">
				{ __( 'Close Popover', 'newspack' ) }
			</MenuItem>
			{ isOverlay( { options } ) && ! isDraft && (
				<MenuItem
					onClick={ () => {
						setSitewideDefaultPopup( id, ! sitewideDefault );
						onFocusOutside();
					} }
					className="newspack-button"
				>
					<div className="newspack-popover__campaigns__toggle-control">
						{ __( 'Sitewide default', 'newspack' ) }
						<ToggleControl checked={ sitewideDefault } onChange={ () => null } />
					</div>
				</MenuItem>
			) }
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
				<MenuItem
					onClick={ () => {
						onFocusOutside();
						publishPopup( id );
					} }
					className="newspack-button"
				>
					{ __( 'Activate', 'newspack' ) }
				</MenuItem>
			) }
			{ unpublishPopup && (
				<MenuItem
					onClick={ () => {
						onFocusOutside();
						unpublishPopup( id );
					} }
					className="newspack-button"
				>
					{ __( 'Deactivate', 'newspack' ) }
				</MenuItem>
			) }
			<MenuItem onClick={ () => deletePopup( id ) } className="newspack-button">
				{ __( 'Delete', 'newspack' ) }
			</MenuItem>
			<div className="newspack-popover__campaigns__info">
				{ __( 'ID:', 'newspack' ) } { popup.id }
			</div>
		</Popover>
	);
};
export default PrimaryPopupPopover;
