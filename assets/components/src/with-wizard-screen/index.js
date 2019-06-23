/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Button, Card } from '../';
import { murielClassnames, buttonProps } from '../../../shared/js/';

export default function withWizardScreen( WrappedComponent, config ) {
	return class extends Component {
		render() {
			const { className, buttonText, buttonAction, noBackground } = this.props;
			const classes = murielClassnames(
				'muriel-wizardScreen',
				className,
				noBackground ? 'muriel-wizardScreen__no-background' : ''
			);
			return (
				<Card className={ classes } noBackground={ noBackground }>
					<div className="muriel-wizardScreen__content">
						<WrappedComponent { ...this.props } />
					</div>
					{ buttonText && buttonAction && (
						<Button
							isPrimary
							className="is-centered muriel-wizardScreen__completeButton"
							{ ...buttonProps( buttonAction ) }
						>
							{ buttonText }
						</Button>
					) }
				</Card>
			);
		}
	};
}
