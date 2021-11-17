/**
 * External dependencies.
 */
import { Chart as GoogleChart } from 'react-google-charts';

const Chart = ( { data } ) => {
	return (
		<GoogleChart
			width={ '100%' }
			height={ '400px' }
			chartType="AreaChart"
			data={ data }
			options={ {
				animation: {
					duration: 500,
					easing: 'in-out',
					startup: true,
				},
				legend: 'none',
			} }
		/>
	);
};

export default Chart;
