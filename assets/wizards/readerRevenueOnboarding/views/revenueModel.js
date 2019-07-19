/**
 * Revenue model select Screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { RadioControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
} from '../../../components/src';

/**
 * Revenue model setup.
 */
class RevenueModel extends Component {
	/**
	 * Render.
	 */
	render() {
		const { revenueModel, onClickFinish, onClickCancel, onChange } = this.props;

		const options = [
			{
				label: __( 'Donations (Recommended)' ),
				value: 'donations',
				info: __( 'Solicit voluntary payments from your readers for the purpose of funding your reporting. This is the simplest option and is suitable for most publications.' )
			},
			{
				label: __( 'Subscriptions' ),
				value: 'subscriptions',
				info: __( 'Create and manage individual subscription plans. This option is suitable for publications that want to provide custom, tiered benefits for members.' )
			},
		];

		return (
			<div className='newspack-revenue-model-setup-screen'>
				<fieldset className="newspack-revenue-model-setup-screen__fieldset">
					{ options.map( ( { value, label, info } ) => (
						<div key={ value } className="newspack-revenue-model-setup-screen__choice_info">
							<input
								type="radio"
								value={ value }
								onChange={ () => onChange( value ) }
								checked={ value === revenueModel }
								id={ `newspack-revenue-model-setup-screen__choice-${ value }` }
								aria-describedby={ `newspack-revenue-model-setup-screen__choice-${ value }-description` }
								className="newspack-revenue-model-setup-screen__choice"
							/>
							<label
								id={ `newspack-revenue-model-setup-screen__choice-${ value }-label` }
								htmlFor={ `newspack-revenue-model-setup-screen__choice-${ value }` }
								className="newspack-revenue-model-setup-screen__choice-label"
							>
								{ label }
							</label>
							<p 
								id={ `newspack-revenue-model-setup-screen__choice-${ value }-description` }
								className="newspack-revenue-model-setup-screen__choice-description">
								{ info }
							</p>
						</div>
					) ) }
				</fieldset>
			</div>
		);
	}
}

export default withWizardScreen( RevenueModel );
