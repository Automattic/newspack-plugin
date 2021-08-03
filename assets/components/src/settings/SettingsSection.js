/**
 * Internal dependencies.
 */
import { Card, InfoButton } from '../';

const SettingSection = ( { title, description, children } ) => (
	<Card isSmall noBorder className="newspack-settings__section">
		<div className="newspack-settings__section__title">
			<h3>{ title }</h3>
			{ description && <InfoButton text={ description } /> }
		</div>
		<div className="newspack-settings__section__content">{ children }</div>
	</Card>
);

export default SettingSection;
