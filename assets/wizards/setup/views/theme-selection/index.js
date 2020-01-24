/**
 * Theme Selection Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { StyleCard, StyleCardGroup, withWizardScreen } from '../../../../components/src';
import DefaultImg from './images/default.png';
import ScottImg from './images/scott.png';
import NelsonImg from './images/nelson.png';
import KatharineImg from './images/katharine.png';
import SachaImg from './images/sacha.png';
import JosephImg from './images/joseph.png';

/**
 * Theme Selection Screen.
 */
class ThemeSelection extends Component {
	/**
	 * Render.
	 */
	render() {
		const { updateTheme, theme } = this.props;
		return (
			<StyleCardGroup>
				<StyleCard
					cardTitle={ __( 'Default', 'newspack-plugin' ) }
					image={ DefaultImg }
					url="//newspack.blog"
					isActive={ theme === 'newspack-theme' }
					onClick={ () => updateTheme( 'newspack-theme' ) }
				/>
				<StyleCard
					cardTitle="Scott"
					image={ ScottImg }
					isActive={ theme === 'newspack-scott' }
					onClick={ () => updateTheme( 'newspack-scott' ) }
				/>
				<StyleCard
					cardTitle="Nelson"
					image={ NelsonImg }
					url="//elsoberano.org"
					isActive={ theme === 'newspack-nelson' }
					onClick={ () => updateTheme( 'newspack-nelson' ) }
				/>
				<StyleCard
					cardTitle="Katharine"
					image={ KatharineImg }
					url="//thelensnola.org"
					isActive={ theme === 'newspack-katharine' }
					onClick={ () => updateTheme( 'newspack-katharine' ) }
				/>
				<StyleCard
					cardTitle="Sacha"
					image={ SachaImg }
					isActive={ theme === 'newspack-sacha' }
					onClick={ () => updateTheme( 'newspack-sacha' ) }
				/>
				<StyleCard
					cardTitle="Joseph"
					image={ JosephImg }
					url="//oklahomawatch.org"
					isActive={ theme === 'newspack-joseph' }
					onClick={ () => updateTheme( 'newspack-joseph' ) }
				/>
			</StyleCardGroup>
		);
	}
}

export default withWizardScreen( ThemeSelection );
