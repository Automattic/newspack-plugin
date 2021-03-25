/**
 * Segment criteria component.
 */

/**
 * Internal dependencies.
 */
import { ActionCard } from '../../../../components/src';

const SegmentCriteria = props => {
	const { children } = props;
	return (
		<ActionCard { ...props } notificationLevel="warning">
			{ children }
		</ActionCard>
	);
};

export default SegmentCriteria;
