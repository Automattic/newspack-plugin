/* globals newspack_content_gate */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { BaseControl, Button, Card, CardBody, CardDivider, CardFooter, DropdownMenu, PanelRow, TextareaControl } from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import ProductControl from './product-control';

function AccessRules( { editPost, rules } ) {
	const availableRules = newspack_content_gate?.access_rules || {};
	if ( Object.keys( availableRules ).length === 0 ) {
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
							{ availableRules[ rule.slug ].type === 'boolean' && (
								<BaseControl
									id={ rule.slug }
									label={ availableRules[ rule.slug ].name }
									help={ availableRules[ rule.slug ].description }
								/>
							) }
							{ availableRules[ rule.slug ].type === 'string' && (
								<>
									<PanelRow>
										<BaseControl
											id={ rule.slug }
											label={ availableRules[ rule.slug ].name }
											help={ availableRules[ rule.slug ].description }
										/>
									</PanelRow>
									<PanelRow>
										<TextareaControl
											value={ rules.find( item => item.slug === rule.slug )?.value || availableRules[ rule.slug ].default }
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
							{ rule.slug === 'subscription' && (
								<ProductControl
									rule={ availableRules[ rule.slug ] }
									value={ rules.find( item => item.slug === rule.slug )?.value || availableRules[ rule.slug ].default }
									onChange={ value =>
										editPost( {
											meta: {
												access_rules: [
													...rules.filter( item => item.slug !== rule.slug ),
													{ slug: rule.slug, value: value.map( item => item.value ) },
												],
											},
										} )
									}
								/>
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
						controls={ Object.keys( availableRules ).map( rule => ( {
							title: availableRules[ rule ].name,
							onClick: () => editPost( { meta: { access_rules: [ ...rules, { slug: rule } ] } } ),
							isDisabled:
								rules.find( item => item.slug === rule ) ||
								( availableRules[ rule ].conflicts?.length > 0 &&
									availableRules[ rule ].conflicts.some( conflict => rules.find( item => item.slug === conflict ) ) ),
						} ) ) }
					/>
				</CardFooter>
			</Card>
		</PluginDocumentSettingPanel>
	);
}

export default AccessRules;
