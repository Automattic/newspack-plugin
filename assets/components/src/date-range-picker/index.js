/**
 * External dependencies.
 */
import { default as ReactDateRangePicker } from 'react-daterange-picker';
import origMoment from 'moment';
import { extendMoment } from 'moment-range';
import 'react-daterange-picker/dist/css/react-calendar.css';

/**
 * Internal dependencies.
 */
import './style.scss';

const moment = extendMoment( origMoment );

const DateRangePicker = ( { start, end, onChange } ) => {
	return (
		<ReactDateRangePicker
			value={ moment.range( moment( start ), moment( end ) ) }
			firstOfWeek={ 1 }
			onSelect={ range => {
				onChange( {
					start: range.start._d,
					end: range.end._d,
				} );
			} }
		/>
	);
};

export default DateRangePicker;
