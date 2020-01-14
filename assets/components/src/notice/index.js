/**
 * Notice
 */

/**
 * WordPress dependencies.
 */
import { Component, RawHTML } from '@wordpress/element';

/**
 * Material UI dependencies.
 */
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classNames from 'classnames';

class Notice extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, isError, isSuccess, isWarning, isPrimary, noticeText } = this.props;
		const classes = classNames(
			'newspack-notice',
			className,
			isError && 'newspack-notice__is-error',
			isSuccess && 'newspack-notice__is-success',
			isWarning && 'newspack-notice__is-warning',
			isPrimary && 'newspack-notice__is-primary'
		);
		let noticeIcon;
		if ( isError ) {
			noticeIcon = <ErrorIcon />;
		} else if ( isSuccess ) {
			noticeIcon = <CheckCircleIcon />;
		} else if ( isWarning ) {
			noticeIcon = <WarningIcon />;
		} else {
			noticeIcon = <InfoIcon />;
		}
		return (
			<div className={ classes }>
				{ noticeIcon }
				<RawHTML className="newspack-notice__content">{ noticeText }</RawHTML>
			</div>
		);
	}
}

export default Notice;
