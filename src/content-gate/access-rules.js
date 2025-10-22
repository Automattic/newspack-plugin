/* globals newspack_content_gate */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	BaseControl,
	Button,
	Card,
	CardBody,
	CardDivider,
	CardFooter,
	DropdownMenu,
	PanelRow,
	TextControl,
	SelectControl,
} from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';

function AccessRules( { editPost, rules } ) {
	const availableAccessRules = newspack_content_gate?.access_rules || {};
	if ( Object.keys( availableAccessRules ).length === 0 ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel name="content-gate-access-rules-panel" title={ __( 'Access Rules', 'newspack-plugin' ) }>
			<p>{ __( 'Configure how readers can bypass this content gate.', 'newspack-plugin' ) }</p>
			<Card className="newspack-content-gate-access-rules" isRounded={ false } size="small">
				{ rules.map( ( rule, index ) => (
					<Fragment key={ rule.slug }>
						{ index > 0 && <CardDivider margin={ '8px' } /> }
						<CardBody>
							{ availableAccessRules[ rule.slug ].is_boolean && (
								<BaseControl
									id={ rule.slug }
									label={ availableAccessRules[ rule.slug ].name }
									help={ availableAccessRules[ rule.slug ].description }
								/>
							) }
							{ availableAccessRules[ rule.slug ].options?.length <= 0 && (
								<>
									<PanelRow>
										<BaseControl
											id={ rule.slug }
											label={ availableAccessRules[ rule.slug ].name }
											help={ availableAccessRules[ rule.slug ].description }
										/>
									</PanelRow>
									<PanelRow>
										<TextControl
											value={
												rules.find( item => item.slug === rule.slug )?.value || availableAccessRules[ rule.slug ].default
											}
											onChange={ value =>
												editPost( {
													meta: {
														access_rules: [
															...rules.filter( item => item.slug !== rule.slug ),
															{ slug: rule.slug, value },
														],
													},
												} )
											}
										/>
									</PanelRow>
								</>
							) }
							{ availableAccessRules[ rule.slug ].options?.length > 0 && (
								<PanelRow>
									<SelectControl
										value={ rules.find( item => item.slug === rule.slug )?.value || availableAccessRules[ rule.slug ].default }
										onChange={ value => editPost( { meta: { access_rules: [ ...rules, { slug: rule.slug, value } ] } } ) }
										options={ availableAccessRules[ rule.slug ].options }
									/>
								</PanelRow>
							) }
							<PanelRow>
								<Button
									isDestructive
									size="small"
									variant="secondary"
									onClick={ () =>
										editPost( {
											meta: { access_rules: rules.filter( item => item.slug !== rule.slug ) },
										} )
									}
								>
									{ __( 'Delete', 'newspack-plugin' ) }
								</Button>
							</PanelRow>
						</CardBody>
					</Fragment>
				) ) }
				<CardFooter>
					<DropdownMenu
						icon="plus"
						text={ __( 'Add Access Rule', 'newspack-plugin' ) }
						label={ __( 'Add Access Rule', 'newspack-plugin' ) }
						controls={ Object.keys( availableAccessRules ).map( rule => ( {
							title: availableAccessRules[ rule ].name,
							onClick: () => editPost( { meta: { access_rules: [ ...rules, { slug: rule } ] } } ),
							isDisabled:
								rules.find( item => item.slug === rule ) ||
								( availableAccessRules[ rule ].conflicts?.length > 0 &&
									availableAccessRules[ rule ].conflicts.some( conflict => rules.find( item => item.slug === conflict ) ) ),
						} ) ) }
					/>
				</CardFooter>
			</Card>
		</PluginDocumentSettingPanel>
	);
}

export default AccessRules;
