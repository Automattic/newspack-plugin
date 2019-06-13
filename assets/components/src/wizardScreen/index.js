/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';


import { Card, Button } from '../';
import murielClassnames from '../../../shared/js/muriel-classnames';

class WizardScreen extends Component {
	render() {
		const {
			identifier,
			completeButtonText,
			onCompleteButtonClicked,
			subCompleteButtonText,
			onSubCompleteButtonClicked,
			children,
			className,
			noBackground,
		} = this.props;
		const classes = murielClassnames(
			'muriel-wizardScreen',
			className,
			identifier
		);

		return (
			<Fragment>
				<Card className={ classes } noBackground={ noBackground }>
					<div className='muriel-wizardScreen__content'>
						{ children }
					</div>
					{ completeButtonText && (
						<Button isPrimary className='is-centered' onClick={ () => onCompleteButtonClicked( identifier ) }>
							{ completeButtonText }
						</Button>
					) }
				</Card>
				{ subCompleteButtonText && (
					<Button isTertiary className='is-centered' onClick={ () => onSubCompleteButtonClicked( identifier ) }>
						{ subCompleteButtonText }
					</Button>
				) }
			</Fragment>
		);
	}
}
export default WizardScreen;
