/**
 * Segment criteria component.
 */

/**
 * Internal dependencies.
 */
import { ActionCard } from '../../../../components/src';
import './style.scss';

const SegmentCriteria = props => {
	const { children, toggleChecked } = props;
	return (
		<div
			className={
				'newspack-campaigns-wizard-segments__criteria' + ( toggleChecked ? ' is-enabled' : '' )
			}
		>
			<ActionCard { ...props }>{ toggleChecked ? children : null }</ActionCard>
		</div>
	);
};

export default SegmentCriteria;
