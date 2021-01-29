/**
 * Secondary Popup Action Card
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies.
 */
import { CategoryAutocomplete, Popover, SelectControl } from '../../../../components/src';
import { filterOutUncategorized, frequenciesForPopup, isOverlay } from '../../utils';
import './style.scss';

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
		options,
	} = popup;
	const { frequency, selected_segment_id: selectedSegmentId } = options;
	return (
		<Popover
			position="bottom left"
			onFocusOutside={ onFocusOutside }
			onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside() }
			padding={ 8 }
			className="newspack-popover__campaigns__secondary-popover"
		>
			<MenuItem onClick={ () => onFocusOutside() } className="screen-reader-text">
				{ __( 'Close Popover', 'newspack' ) }
			</MenuItem>
			{ 'test' !== frequency && (
				<SelectControl
					onChange={ value => {
						updatePopup( id, { frequency: value } );
						onFocusOutside();
					} }
					options={ frequenciesForPopup( popup ) }
					value={ frequency }
					label={ __( 'Frequency', 'newspack' ) }
				/>
			) }
			<SelectControl
				onChange={ value => {
					updatePopup( id, { selected_segment_id: value } );
					onFocusOutside();
				} }
				options={ [
					{ label: __( 'Default (no segment)', 'newspack' ), value: '' },
					...segments.map( ( { name, id: segmentId } ) => ( { label: name, value: segmentId } ) ),
				] }
				value={ selectedSegmentId }
				label={ __( 'Segment', 'newspack' ) }
			/>
			<CategoryAutocomplete
				value={ campaignGroups || [] }
				onChange={ tokens => setTermsForPopup( id, tokens, 'newspack_popups_taxonomy' ) }
				label={ __( 'Campaigns', 'newspack' ) }
				taxonomy="newspack_popups_taxonomy"
			/>
			{ ! sitewideDefault && (
				<CategoryAutocomplete
					value={ filterOutUncategorized( categories ) || [] }
					onChange={ tokens => setTermsForPopup( id, tokens, 'category' ) }
					label={ __( 'Category filtering', 'newspack ' ) }
					disabled={ sitewideDefault }
				/>
			) }
		</Popover>
	);
};
export default SecondaryPopupPopover;
