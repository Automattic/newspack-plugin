/**
 * External dependencies.
 */
import { format } from 'date-fns';
import humanNumber from 'human-number';
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
} from 'recharts';

const Chart = ( { data } ) => (
	<div className="newspack-campaigns-wizard-analytics__chart">
		<ResponsiveContainer width={ '100%' } height={ 300 }>
			<AreaChart data={ data } margin={ { top: 5, right: 20, bottom: 5, left: -15 } }>
				<Area stackId="1" type="monotoneX" dataKey="value" stroke="#36f" fill="#3366ff1c" />
				<CartesianGrid stroke="#ddd" strokeDasharray="4 4" />
				<XAxis
					dataKey="date"
					tickFormatter={ date => format( new Date( date ), 'MMM d' ) }
					tickMargin={ 8 }
					stroke="#1e1e1e"
				/>
				<YAxis allowDecimals={ false } tickFormatter={ humanNumber } stroke="#1e1e1e" />
				<Tooltip formatter={ value => humanNumber( value ) } />
			</AreaChart>
		</ResponsiveContainer>
	</div>
);

export default Chart;
