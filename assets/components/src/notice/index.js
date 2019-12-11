/**
 * Notice
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

class Notice extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, isError, isSuccess, isPrimary, noticeText } = this.props;
		const classes = classNames(
			'newspack-notice',
			className,
			isError && 'newspack-notice__is-error',
			isSuccess && 'newspack-notice__is-success',
			isPrimary && 'newspack-notice__is-primary'
		);
		const errorIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
			</SVG>
		);
		const infoIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
			</SVG>
		);
		const successIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
			</SVG>
		);
		let noticeIcon;
		if ( isError ) {
  		noticeIcon = errorIcon;
		} else if ( isSuccess ) {
			noticeIcon = successIcon;
		} else {
		  noticeIcon = infoIcon;
		}
		return (
			<div className={ classes }>
				{ noticeIcon }
				{ noticeText }
			</div>
		);
	}
}

export default Notice;
