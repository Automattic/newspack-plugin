/**
 * Theme Style Selection Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ButtonGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Button, withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * Theme Style Selection Screen.
 */
class ThemeStyleSelection extends Component {
	/**
	 * Render.
	 */
	render() {
		const { updateThemeStyle, themeStyle } = this.props;
		return (
			<div className="newspack-setup-wizard__welcome">
				<p>{ __( 'Choose a theme style.' ) }</p>
				<ButtonGroup>
					<Button
						onClick={ () => updateThemeStyle( 'default' ) }
						isSmall
						isPrimary={ themeStyle === 'default' }
					>
						{ __( 'Default', 'newspack-plugin' ) }
					</Button>
					<Button
						onClick={ () => updateThemeStyle( 'style-1' ) }
						isSmall
						isPrimary={ themeStyle === 'style-1' }
					>
						{ __( 'Style 1', 'newspack-plugin' ) }
					</Button>
					<Button
						onClick={ () => updateThemeStyle( 'style-2' ) }
						isSmall
						isPrimary={ themeStyle === 'style-2' }
					>
						{ __( 'Style 2', 'newspack-plugin' ) }
					</Button>
					<Button
						onClick={ () => updateThemeStyle( 'style-3' ) }
						isSmall
						isPrimary={ themeStyle === 'style-3' }
					>
						{ __( 'Style 3', 'newspack-plugin' ) }
					</Button>
					<Button
						onClick={ () => updateThemeStyle( 'style-4' ) }
						isSmall
						isPrimary={ themeStyle === 'style-4' }
					>
						{ __( 'Style 4', 'newspack-plugin' ) }
					</Button>
					<Button
						onClick={ () => updateThemeStyle( 'style-5' ) }
						isSmall
						isPrimary={ themeStyle === 'style-5' }
					>
						{ __( 'Style 5', 'newspack-plugin' ) }
					</Button>
				</ButtonGroup>
			</div>
		);
	}
}

export default withWizardScreen( ThemeStyleSelection );
