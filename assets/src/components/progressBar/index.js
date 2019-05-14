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
	 * @param  int completed The number of steps completed.
	 * @param  int total     The total number of steps.
	 * @return int
	 */
	getCompletionPercentage( completed, total ) {
		if ( ! total ) {
			return 100;
		}

		return Math.max( Math.min( Math.round( ( completed / total ) * 100 ), 100 ), 0 );
	}

	/**
	 * Render.
	 */
	render() {
		const { label, completed, total, displayFraction } = this.props;
		const cleanTotal = Math.max( 0, parseInt( total ) || 0 );
		const cleanCompleted = Math.max( 0, Math.min( ( parseInt( completed ) || 0 ), parseInt( cleanTotal ) ) );

		const barStyle = {
			width: this.getCompletionPercentage( cleanCompleted, cleanTotal ) + '%',
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
								{ cleanCompleted }/{ cleanTotal}
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
