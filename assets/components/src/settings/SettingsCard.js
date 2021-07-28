/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import { Grid, ActionCard } from '../';

const SettingsCard = ( { children, className, ...props } ) => {
	return (
		<ActionCard
			{ ...props }
			className={ classnames( className, 'newspack-settings__card' ) }
			notificationLevel="info"
		>
			<Grid columns="3" gutter={ 24 }>
				{ children }
			</Grid>
		</ActionCard>
	);
};

export default SettingsCard;
