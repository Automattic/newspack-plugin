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
import { isOverlay } from '../../utils';
import './style.scss';

const frequencyMap = {
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page', 'newspack' ),
	manual: __( 'Manual Placement', 'newspack' ),
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
	const { campaign_groups: campaignGroups, categories, id, options } = popup;
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
				label={ __( 'Campaign groups', 'newspack' ) }
				taxonomy="newspack_popups_taxonomy"
			/>
			<CategoryAutocomplete
				value={ categories || [] }
				onChange={ tokens => setTermsForPopup( id, tokens, 'category' ) }
				label={ __( 'Category filtering', 'newspack ' ) }
			/>
		</Popover>
	);
};
export default SecondaryPopupPopover;
