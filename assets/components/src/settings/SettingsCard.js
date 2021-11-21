/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import { Grid, ActionCard } from '../';

const SettingsCard = ( { children, className, columns, gutter, ...props } ) => {
	return (
		<ActionCard
			{ ...props }
			className={ classnames( className, 'newspack-settings__card' ) }
			notificationLevel="info"
		>
			<Grid columns={ columns } gutter={ gutter }>
				{ children }
			</Grid>
		</ActionCard>
	);
};

SettingsCard.defaultProps = {
	columns: 3,
	gutter: 32,
};

export default SettingsCard;
