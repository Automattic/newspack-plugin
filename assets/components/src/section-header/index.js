/**
 * Section Header
 */

/**
 * Internal dependencies
 */
import { Grid } from '..';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

const SectionHeader = ( {
	centered,
	className,
	description,
	heading,
	isWhite,
	noMargin,
	title,
} ) => {
	const classes = classnames(
		'newspack-section-header',
		centered && 'newspack-section-header--is-centered',
		isWhite && 'newspack-section-header--is-white',
		noMargin && 'newspack-section-header--no-margin',
		className
	);

	const HeadingTag = `h${ heading }`;

	return (
		<Grid columns={ 1 } gutter={ 8 } className={ classes }>
			{ typeof title === 'string' && <HeadingTag>{ title }</HeadingTag> }
			{ typeof title === 'function' && <HeadingTag>{ title() }</HeadingTag> }
			{ typeof description === 'string' && <p>{ description }</p> }
			{ typeof description === 'function' && <p>{ description() }</p> }
		</Grid>
	);
};

SectionHeader.defaultProps = {
	heading: 2,
};

export default SectionHeader;
