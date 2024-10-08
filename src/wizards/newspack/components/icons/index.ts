/**
 * Newspack Dashboard, Icons
 */

/**
 * WordPress dependencies
 */
export { Icon } from '@wordpress/icons';
import {
	help,
	settings,
	megaphone,
	payment,
	tool,
	store,
	postList,
	mapMarker,
	rotateRight,
	currencyDollar,
	formatListBullets,
	plugins,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import blockPostDate from './block-post-date';
import positionCenterCenter from './position-center-center';
import gift from './gift';
import ad from './ad';
import mail from './mail';
import post from './post';
import dashboard from './dashboard';

/**
 * Export Dashboard Icons
 */
export const icons = {
	help,
	settings,
	megaphone,
	payment,
	tool,
	store,
	postList,
	mapMarker,
	rotateRight,
	currencyDollar,
	formatListBullets,
	plugins,
	// Custom
	post,
	blockPostDate,
	positionCenterCenter,
	gift,
	ad,
	mail,
	dashboard,
};

export default icons;
