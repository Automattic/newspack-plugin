/**
 * Segment criteria component.
 */

/**
 * Internal dependencies.
 */
import { ActionCard } from '../../../../components/src';

const SegmentCriteria = props => {
	const { children, toggleChecked } = props;
	return (
		<ActionCard { ...props } notificationLevel="warning">
			{ toggleChecked ? children : null }
		</ActionCard>
	);
};

export default SegmentCriteria;
