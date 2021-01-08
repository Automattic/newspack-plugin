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

const frequencyMap = {
	never: __( 'Never', 'newspack' ),
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page', 'newspack' ),
};

const PrimaryPopupPopover = ( {
	deletePopup,
	popup,
	previewPopup,
	setSitewideDefaultPopup,
	onFocusOutside,
	publishPopup,
	updatePopup,
} ) => {
	const { id, sitewide_default: sitewideDefault, edit_link: editLink, options, status } = popup;
	const { frequency } = options;
	const isDraft = 'draft' === status;
	const isTestMode = 'test' === frequency;
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
			{ isOverlay( { options } ) && ! isTestMode && ! isDraft && (
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
					updatePopup( id, { frequency: isTestMode ? 'daily' : 'test' } );
					onFocusOutside();
				} }
				className="newspack-button"
			>
				<div className="newspack-popover__campaigns__toggle-control">
					{ __( 'Test mode', 'newspack' ) }
					<ToggleControl checked={ isTestMode } onChange={ () => null } />
				</div>
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
			<div className="newspack-popover__campaigns__info">
				{ __( 'ID:', 'newspack' ) } { popup.id }
			</div>
		</Popover>
	);
};
export default PrimaryPopupPopover;
