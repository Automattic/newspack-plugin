/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { DateRangePicker, Modal, Button, SelectControl } from '../../../../components/src';
import { formatDate, parseDate } from '../../utils';

/**
 * External dependencies.
 */
import { format } from 'date-fns';

const formatDateWithMonthName = formattedDate =>
	format( parseDate( formattedDate ), 'MMM do yyyy' );

const Info = ( { filtersState, labelFilters, eventActionFilters, onChange, disabled } ) => {
	const [ isRangePickerVisible, setIsRangePickerVisible ] = useState( false );
	return (
		<div className="newspack-campaigns-wizard-analytics__filters">
			<div className="newspack-campaigns-wizard-analytics__filters__date">
				<Button
					isSecondary
					isSmall
					icon={ chevronDown }
					iconSize={ 18 }
					disabled={ disabled }
					onClick={ () => setIsRangePickerVisible( _isVisible => ! _isVisible ) }
				>
					{ `${ formatDateWithMonthName( filtersState.start_date ) } ${ __(
						'to',
						'newspack'
					) } ${ formatDateWithMonthName( filtersState.end_date ) }` }
				</Button>
				{ isRangePickerVisible && (
					<Modal
						title={ __( 'Choose a date range', 'newspack' ) }
						onRequestClose={ () => {
							setIsRangePickerVisible( false );
						} }
						isNarrow
					>
						<DateRangePicker
							start={ parseDate( filtersState.start_date ) }
							end={ parseDate( filtersState.end_date ) }
							onChange={ range => {
								onChange( 'SET_RANGE_FILTER' )( {
									start_date: formatDate( range.start ),
									end_date: formatDate( range.end ),
								} );
								setIsRangePickerVisible( false );
							} }
						/>
					</Modal>
				) }
			</div>
			<div className="newspack-campaigns-wizard-analytics__filters__group">
				<SelectControl
					options={ [ { label: __( 'All Prompts', 'newspack' ), value: '' }, ...labelFilters ] }
					onChange={ onChange( 'SET_EVENT_LABEL_FILTER' ) }
					value={ filtersState.event_label_id }
					disabled={ disabled }
					isSmall
				/>
				<SelectControl
					options={ [
						{ label: __( 'All Events', 'newspack' ), value: '' },
						...eventActionFilters,
					] }
					onChange={ onChange( 'SET_EVENT_ACTION_FILTER' ) }
					value={ filtersState.event_action }
					disabled={ disabled }
					isSmall
				/>
			</div>
		</div>
	);
};

export default Info;
