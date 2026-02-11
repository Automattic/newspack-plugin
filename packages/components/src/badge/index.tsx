/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

type BadgeProps = {
	text: string;
	level?: 'info' | 'success' | 'warning' | 'error' | 'brand';
};

/**
 * Badge component
 */
const Badge = ( { text, level = 'info' }: BadgeProps ) => {
	const classes = classnames( 'newspack-badge', `newspack-badge__badge-level-${ level }` );
	return <span className={ classes }>{ text }</span>;
};

export default Badge;
