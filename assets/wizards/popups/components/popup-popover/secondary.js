/**
 * Secondary Popup Action Card
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
import {
	CategoryAutocomplete,
	Popover,
	SelectControl,
	ToggleControl,
} from '../../../../components/src';
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

const SecondaryPopupPopover = ( {
	popup,
	onFocusOutside,
	segments,
	setTermsForPopup,
	updatePopup,
} ) => {
	const {
		campaign_groups: campaignGroups,
		categories,
		id,
		sitewide_default: sitewideDefault,
		edit_link: editLink,
		options,
		status,
	} = popup;
	const { frequency, selected_segment_id: selectedSegmentId } = options;
	const isDraft = 'draft' === status;
	const isTestMode = 'test' === frequency;
	return (
		<Popover
			position="bottom left"
			onFocusOutside={ onFocusOutside }
			onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside() }
		>
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
						...segments.map( ( { name, id: segmentId } ) => ( { label: name, value: segmentId } ) ),
					] }
					value={ selectedSegmentId }
				/>
			</MenuItem>
			<MenuItem className="newspack-button newspack-popup-action-card-select-button">
				<CategoryAutocomplete
					value={ campaignGroups || [] }
					onChange={ tokens => setTermsForPopup( id, tokens, 'newspack_popups_taxonomy' ) }
					label={ __( 'Campaign groups', 'newspack' ) }
					taxonomy="newspack_popups_taxonomy"
				/>
			</MenuItem>
			{ ! sitewideDefault && (
				<MenuItem className="newspack-button newspack-popup-action-card-select-button">
					<CategoryAutocomplete
						value={ categories || [] }
						onChange={ tokens => setTermsForPopup( id, tokens, 'category' ) }
						label={ __( 'Category filtering', 'newspack ' ) }
						disabled={ sitewideDefault }
					/>
				</MenuItem>
			) }
		</Popover>
	);
};
export default SecondaryPopupPopover;
