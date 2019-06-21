/**
 * One screen from a Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Card, Button } from '../';
import murielClassnames from '../../../shared/js/muriel-classnames';
import './style.scss';

/**
 * Internal dependencies.
 */
import { Route } from 'react-router-dom';

/**
 * One Wizard screen.
 */
class WizardScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const {
			path,
			completeButtonText,
			subCompleteButtonText,
			onSubCompleteButtonClicked,
			children,
			className,
			noBackground,
			next,
		} = this.props;
		const classes = murielClassnames( 'muriel-wizardScreen', className, noBackground ? 'muriel-wizardScreen__no-background' : '' );

		return (
			<Route path={ path } render={ routeProps => (
				<Fragment>
					<Card className={ classes } noBackground={ noBackground }>
						<div className="muriel-wizardScreen__content">{ children }</div>
						{ completeButtonText && (
							<Button
								isPrimary
								className="is-centered muriel-wizardScreen__completeButton"
								href={ `#${next}` }
							>
								{ completeButtonText }
							</Button>
						) }
					</Card>
					{ subCompleteButtonText && (
						<Button
							isTertiary
							className="is-centered muriel-wizardScreen__subCompleteButton"
							onClick={ () => onSubCompleteButtonClicked( path ) }
						>
							{ subCompleteButtonText }
						</Button>
					) }
				</Fragment>
			) } />
		);
	}
}
export default WizardScreen;
