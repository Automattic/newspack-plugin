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
 * External dependencies.
 */
import { Route, withRouter } from 'react-router-dom';

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
			onCompleteButtonClicked,
			subCompleteButtonText,
			onSubCompleteButtonClicked,
			children,
			className,
			noBackground,
			next,
			history,
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
								onClick={ () => onCompleteButtonClicked( history ) }
								href={ next && `#${next}` }
							>
								{ completeButtonText }
							</Button>
						) }
					</Card>
					{ subCompleteButtonText && (
						<Button
							isTertiary
							className="is-centered muriel-wizardScreen__subCompleteButton"
							onClick={ () => onSubCompleteButtonClicked( history ) }
						>
							{ subCompleteButtonText }
						</Button>
					) }
				</Fragment>
			) } />
		);
	}
}

WizardScreen.defaultProps = {
	onCompleteButtonClicked: () => null,
	onSubCompleteButtonClicked: () => null,
}

export default withRouter( WizardScreen );
