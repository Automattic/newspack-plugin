/**
 * Progress bar for displaying visual feedback about steps-completed.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * Progress bar.
 */
class ProgressBar extends Component {

	/**
	 * Get completion as a percentage.
	 *
	 * @return int
	 */
	getCompletionPercentage() {
		let { completed, total } = this.props;
		completed = parseInt( completed );
		total = parseInt( total );

		if ( ! total ) {
			return 100;
		}

		return Math.min( Math.round( ( completed / total ) * 100 ), 100 );
	}

	/**
	 * Render.
	 */
	render() {
		const { label, completed, total, displayFraction } = this.props;

		const barStyle = {
			width: this.getCompletionPercentage() + '%',
		}

		return (
			<div className="muriel-progress-bar">
				{ ( label || displayFraction ) && (
					<div className="muriel-progress-bar__headings">
						{ label && (
							<div className="muriel-progress-bar__label">
								{ label }
							</div>
						) }
						{ displayFraction && (
							<div className="muriel-progress-bar__fraction">
								{ completed }/{ total}
							</div>
						) }
					</div>
				) }

				<div className="muriel-progress-bar__bar" style={ barStyle } ></div>
			</div>
		);
	}
}

export default ProgressBar;
