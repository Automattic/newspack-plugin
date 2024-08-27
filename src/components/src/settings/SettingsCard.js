/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import { Grid, ActionCard } from '../';

const SettingsCard = ( { children, className, columns, gutter, noBorder, rowGap, ...props } ) => {
	const classes = classnames(
		'newspack-settings__card',
		noBorder && 'newspack-settings__no-border',
		className
	);

	return (
		<ActionCard { ...props } className={ classes } notificationLevel="info" noBorder={ noBorder }>
			<Grid columns={ columns } gutter={ gutter } rowGap={ rowGap }>
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
