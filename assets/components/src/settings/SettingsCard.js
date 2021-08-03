/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import { Grid, ActionCard } from '../';

const SettingsCard = ( { children, className, columns, ...props } ) => {
	return (
		<ActionCard
			{ ...props }
			className={ classnames( className, 'newspack-settings__card' ) }
			notificationLevel="info"
		>
			<Grid columns={ columns } gutter={ 32 }>
				{ children }
			</Grid>
		</ActionCard>
	);
};

SettingsCard.defaultProps = {
	columns: 3,
};

export default SettingsCard;
