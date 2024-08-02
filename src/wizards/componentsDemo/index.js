import '../../shared/js/public-path';

/* eslint-disable jsx-a11y/anchor-is-valid, no-console */

/**
 * Components Demo
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { audio, home, plus, reusableBlock, typography } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	AutocompleteWithSuggestions,
	Button,
	ButtonCard,
	Card,
	ColorPicker,
	Footer,
	Grid,
	Handoff,
	ImageUpload,
	Modal,
	NewspackIcon,
	Notice,
	PluginInstaller,
	PluginSettings,
	PluginToggle,
	ProgressBar,
	SelectControl,
	Waiting,
	WebPreview,
} from '../../components/src';

class ComponentsDemo extends Component {
	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			selectedPostForAutocompleteWithSuggestions: [],
			selectedPostsForAutocompleteWithSuggestionsMultiSelect: [],
			image: null,
			selectValue1: '2nd',
			selectValue2: '',
			selectValue3: '',
			selectValues: [],
			modalShown: false,
			color1: '#3366ff',
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			selectedPostForAutocompleteWithSuggestions,
			selectedPostsForAutocompleteWithSuggestionsMultiSelect,
			selectValue1,
			selectValue2,
			selectValue3,
			modalShown,
			actionCardToggleChecked,
			color1,
		} = this.state;

		return (
			<Fragment>
				{ newspack_aux_data.is_debug_mode && <Notice debugMode /> }
				<div className="newspack-wizard__header">
					<div className="newspack-wizard__header__inner">
						<div className="newspack-wizard__title">
							<Button
								isLink
								href={ newspack_urls.dashboard }
								label={ __( 'Return to Dashboard', 'newspack-plugin' ) }
								showTooltip={ true }
								icon={ home }
								iconSize={ 36 }
							>
								<NewspackIcon size={ 36 } />
							</Button>
							<div>
								<h2>{ __( 'Components Demo', 'newspack-plugin' ) }</h2>
								<span>
									{ __(
										'Simple components used for composing the UI of Newspack',
										'newspack-plugin'
									) }
								</span>
							</div>
						</div>
					</div>
				</div>
				<div className="newspack-wizard newspack-wizard__content">
					<Card>
						<h2>{ __( 'Autocomplete with Suggestions (single-select)', 'newspack-plugin' ) }</h2>
						<AutocompleteWithSuggestions
							label={ __( 'Search for a post', 'newspack-plugin' ) }
							help={ __(
								'Begin typing post title, click autocomplete result to select.',
								'newspack-plugin'
							) }
							onChange={ items =>
								this.setState( { selectedPostForAutocompleteWithSuggestions: items } )
							}
							selectedItems={ selectedPostForAutocompleteWithSuggestions }
						/>

						<hr />

						<h2>{ __( 'Autocomplete with Suggestions (multi-select)', 'newspack-plugin' ) }</h2>
						<AutocompleteWithSuggestions
							hideHelp
							multiSelect
							label={ __( 'Search widgets', 'newspack-plugin' ) }
							help={ __(
								'Begin typing post title, click autocomplete result to select.',
								'newspack-plugin'
							) }
							onChange={ items =>
								this.setState( { selectedPostsForAutocompleteWithSuggestionsMultiSelect: items } )
							}
							postTypes={ [
								{ slug: 'page', label: 'Pages' },
								{ slug: 'post', label: 'Posts' },
							] }
							postTypeLabel={ 'widget' }
							postTypeLabelPlural={ 'widgets' }
							selectedItems={ selectedPostsForAutocompleteWithSuggestionsMultiSelect }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin toggles', 'newspack-plugin' ) }</h2>
						<PluginToggle
							plugins={ {
								woocommerce: {
									shouldRefreshAfterUpdate: true,
								},
								'fb-instant-articles': {
									actionText: __( 'Configure Instant Articles', 'newspack-plugin' ),
									href: '/wp-admin/admin.php?page=newspack',
								},
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Web Previews', 'newspack-plugin' ) }</h2>
						<Card buttonsCard noBorder className="items-center">
							<WebPreview
								url="//newspack.com/"
								label={ __( 'Preview Newspack Blog', 'newspack-plugin' ) }
								variant="primary"
							/>
							<WebPreview
								url="//newspack.com/"
								renderButton={ ( { showPreview } ) => (
									<a href="#" onClick={ showPreview }>
										{ __( 'Preview Newspack Blog', 'newspack-plugin' ) }
									</a>
								) }
							/>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Waiting', 'newspack-plugin' ) }</h2>
						<Card buttonsCard noBorder>
							<Grid columns={ 1 } gutter={ 16 } className="w-100">
								<Waiting />
								<div className="flex items-center">
									<Waiting isLeft />
									{ __( 'Spinner on the left', 'newspack-plugin' ) }
								</div>
								<div className="flex items-center">
									<Waiting isRight />
									{ __( 'Spinner on the right', 'newspack-plugin' ) }
								</div>
								<Waiting isCenter />
							</Grid>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Color picker', 'newspack-plugin' ) }</h2>
						<ColorPicker
							label={ __( 'Color Picker', 'newspack-plugin' ) }
							color={ color1 }
							onChange={ color => this.setState( { color1: color } ) }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Handoff Buttons', 'newspack-plugin' ) }</h2>
						<Card buttonsCard noBorder>
							<Handoff
								modalTitle={ __( 'Manage AMP', 'newspack-plugin' ) }
								modalBody={ __(
									'Click to go to the AMP dashboard. There will be a notification bar at the top with a link to return to Newspack.',
									'newspack-plugin'
								) }
								plugin="amp"
								isTertiary
							/>
							<Handoff plugin="jetpack" />
							<Handoff plugin="google-site-kit" />
							<Handoff plugin="woocommerce" />
							<Handoff
								plugin="wordpress-seo"
								isPrimary
								editLink="/wp-admin/admin.php?page=wpseo_dashboard#top#features"
							>
								{ __( 'Specific Yoast Page', 'newspack-plugin' ) }
							</Handoff>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Modal', 'newspack-plugin' ) }</h2>
						<Card buttonsCard noBorder>
							<Button isPrimary onClick={ () => this.setState( { modalShown: true } ) }>
								{ __( 'Open modal', 'newspack-plugin' ) }
							</Button>
						</Card>
						{ modalShown && (
							<Modal
								title={ __( 'This is the modal title', 'newspack-plugin' ) }
								onRequestClose={ () => this.setState( { modalShown: false } ) }
							>
								<p>
									{ __(
										'Based on industry research, we advise to test the modal component, and continuing this sentence so we can see how the text wraps is one good way of doing that.',
										'newspack-plugin'
									) }
								</p>
								<Card buttonsCard noBorder className="justify-end">
									<Button isPrimary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Dismiss', 'newspack-plugin' ) }
									</Button>
									<Button isSecondary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Also dismiss', 'newspack-plugin' ) }
									</Button>
								</Card>
							</Modal>
						) }
					</Card>
					<Card>
						<h2>{ __( 'Notice', 'newspack-plugin' ) }</h2>
						<Notice noticeText={ __( 'This is an info notice.', 'newspack-plugin' ) } />
						<Notice noticeText={ __( 'This is an error notice.', 'newspack-plugin' ) } isError />
						<Notice noticeText={ __( 'This is a help notice.', 'newspack-plugin' ) } isHelp />
						<Notice noticeText={ __( 'This is a success notice.', 'newspack-plugin' ) } isSuccess />
						<Notice noticeText={ __( 'This is a warning notice.', 'newspack-plugin' ) } isWarning />
					</Card>
					<Card>
						<h2>{ __( 'Plugin installer', 'newspack-plugin' ) }</h2>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'wordpress-seo' ] }
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin installer (small)', 'newspack-plugin' ) }</h2>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'wordpress-seo' ] }
							isSmall
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<ActionCard
						title={ __( 'Example One', 'newspack-plugin' ) }
						description={ __( 'Has an action button.', 'newspack-plugin' ) }
						actionText={ __( 'Install', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Two', 'newspack-plugin' ) }
						description={ __( 'Has action button and secondary button.', 'newspack-plugin' ) }
						actionText={ __( 'Edit', 'newspack-plugin' ) }
						secondaryActionText={ __( 'Delete', 'newspack-plugin' ) }
						secondaryDestructive
						onClick={ () => {
							console.log( 'Edit clicked' );
						} }
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Three', 'newspack-plugin' ) }
						description={ __( 'Waiting/in-progress state, no action button.', 'newspack-plugin' ) }
						actionText={ __( 'Installing…', 'newspack-plugin' ) }
						isWaiting
					/>
					<ActionCard
						title={ __( 'Example Four', 'newspack-plugin' ) }
						description={ __( 'Error notification', 'newspack-plugin' ) }
						actionText={ __( 'Install', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
						notification={
							<Fragment>
								Plugin cannot be installed <a href="#">Retry</a> | <a href="#">Documentation</a>
							</Fragment>
						}
						notificationLevel="error"
					/>
					<ActionCard
						title={ __( 'Example Five', 'newspack-plugin' ) }
						description={ __( 'Warning notification, action button', 'newspack-plugin' ) }
						notification={
							<Fragment>
								There is a new version available. <a href="#">View details</a> or{ ' ' }
								<a href="#">update now</a>
							</Fragment>
						}
						notificationLevel="warning"
					/>
					<ActionCard
						title={ __( 'Example Six', 'newspack-plugin' ) }
						description={ __( 'Static text, no button', 'newspack-plugin' ) }
						actionText={ __( 'Active', 'newspack-plugin' ) }
					/>
					<ActionCard
						title={ __( 'Example Seven', 'newspack-plugin' ) }
						description={ __( 'Static text, secondary action button.', 'newspack-plugin' ) }
						actionText={ __( 'Active', 'newspack-plugin' ) }
						secondaryActionText={ __( 'Delete', 'newspack-plugin' ) }
						secondaryDestructive
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Eight', 'newspack-plugin' ) }
						description={ __( 'Image with link and action button.', 'newspack-plugin' ) }
						actionText={ __( 'Configure', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Configure clicked' );
						} }
						image="https://i0.wp.com/newspack.com/wp-content/uploads/2020/06/pexels-photo-3183150.jpeg"
						imageLink="https://newspack.com"
					/>
					<ActionCard
						title={ __( 'Example Nine', 'newspack-plugin' ) }
						description={ __( 'Action Card with Toggle Control.', 'newspack-plugin' ) }
						actionText={ actionCardToggleChecked && __( 'Configure', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Configure clicked' );
						} }
						toggleOnChange={ checked => this.setState( { actionCardToggleChecked: checked } ) }
						toggleChecked={ actionCardToggleChecked }
					/>
					<ActionCard
						badge={ __( 'Premium', 'newspack-plugin' ) }
						title={ __( 'Example Ten', 'newspack-plugin' ) }
						description={ __( 'An example of an action card with a badge.', 'newspack-plugin' ) }
						actionText={ __( 'Install', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						isSmall
						title={ __( 'Example Eleven', 'newspack-plugin' ) }
						description={ __( 'An example of a small action card.', 'newspack-plugin' ) }
						actionText={ __( 'Installing', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Twelve', 'newspack-plugin' ) }
						description={ __( 'Action card with an unchecked checkbox.', 'newspack-plugin' ) }
						actionText={ __( 'Configure', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Configure' );
						} }
						checkbox="unchecked"
					/>
					<ActionCard
						title={ __( 'Example Thirteen', 'newspack-plugin' ) }
						description={ __( 'Action card with a checked checkbox.', 'newspack-plugin' ) }
						secondaryActionText={ __( 'Disconnect', 'newspack-plugin' ) }
						onSecondaryActionClick={ () => {
							console.log( 'Disconnect' );
						} }
						checkbox="checked"
					/>
					<ActionCard
						badge={ [ __( 'Premium', 'newspack-plugin' ), __( 'Archived', 'newspack-plugin' ) ] }
						title={ __( 'Example Fourteen', 'newspack-plugin' ) }
						description={ __( 'An example of an action card with two badges.', 'newspack-plugin' ) }
						actionText={ __( 'Install', 'newspack-plugin' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Handoff', 'newspack-plugin' ) }
						description={ __( 'An example of an action card with Handoff.', 'newspack-plugin' ) }
						actionText={ __( 'Configure', 'newspack-plugin' ) }
						handoff="jetpack"
					/>
					<ActionCard
						title={ __( 'Handoff', 'newspack-plugin' ) }
						description={ __(
							' An example of an action card with Handoff and EditLink.',
							'newspack-plugin'
						) }
						actionText={ __( 'Configure', 'newspack-plugin' ) }
						handoff="jetpack"
						editLink="admin.php?page=jetpack#/settings"
					/>
					<ActionCard
						expandable
						title={ __( 'Expandable', 'newspack-plugin' ) }
						description={ __(
							' An example of an action card with expandable inner content.',
							'newspack-plugin'
						) }
					>
						<p>
							{ __(
								'Some inner content to display when the card is expanded.',
								'newspack-plugin'
							) }
						</p>
					</ActionCard>
					<Card>
						<h2>{ __( 'Image Uploader', 'newspack-plugin' ) }</h2>
						<ImageUpload
							image={ this.state.image }
							onChange={ image => {
								this.setState( { image } );
								console.log( 'Image:' );
								console.log( image );
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Progress bar', 'newspack-plugin' ) }</h2>
						<ProgressBar completed="2" total="3" />
						<ProgressBar
							completed="2"
							total="5"
							label={ __( 'Progress made', 'newspack-plugin' ) }
						/>
						<ProgressBar completed="0" total="5" displayFraction />
						<ProgressBar
							completed="3"
							total="8"
							label={ __( 'Progress made', 'newspack-plugin' ) }
							displayFraction
						/>
					</Card>
					<Card>
						<h2>{ __( 'Select dropdowns', 'newspack-plugin' ) }</h2>
						<Grid columns={ 1 } gutter={ 16 }>
							<SelectControl
								label={ __( 'Label for Select with a preselection', 'newspack-plugin' ) }
								value={ selectValue1 }
								options={ [
									{ value: null, label: __( '- Select -', 'newspack-plugin' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack-plugin' ) },
									{ value: '2nd', label: __( 'Second', 'newspack-plugin' ) },
									{ value: '3rd', label: __( 'Third', 'newspack-plugin' ) },
								] }
								onChange={ value => this.setState( { selectValue1: value } ) }
							/>
							<SelectControl
								label={ __( 'Label for Select with no preselection', 'newspack-plugin' ) }
								value={ selectValue2 }
								options={ [
									{ value: null, label: __( '- Select -', 'newspack-plugin' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack-plugin' ) },
									{ value: '2nd', label: __( 'Second', 'newspack-plugin' ) },
									{ value: '3rd', label: __( 'Third', 'newspack-plugin' ) },
								] }
								onChange={ value => this.setState( { selectValue2: value } ) }
							/>
							<SelectControl
								label={ __( 'Label for disabled Select', 'newspack-plugin' ) }
								disabled
								options={ [
									{ value: null, label: __( '- Select -', 'newspack-plugin' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack-plugin' ) },
									{ value: '2nd', label: __( 'Second', 'newspack-plugin' ) },
									{ value: '3rd', label: __( 'Third', 'newspack-plugin' ) },
								] }
							/>
							<SelectControl
								label={ __( 'Small', 'newspack-plugin' ) }
								value={ selectValue3 }
								isSmall
								options={ [
									{ value: null, label: __( '- Select -', 'newspack-plugin' ), disabled: true },
									{ value: '1st', label: __( 'First', 'newspack-plugin' ) },
									{ value: '2nd', label: __( 'Second', 'newspack-plugin' ) },
									{ value: '3rd', label: __( 'Third', 'newspack-plugin' ) },
								] }
								onChange={ value => this.setState( { selectValue3: value } ) }
							/>
							<SelectControl
								multiple
								label={ __( 'Multi-select', 'newspack-plugin' ) }
								value={ this.state.selectValues }
								options={ [
									{ value: '1st', label: __( 'First', 'newspack-plugin' ) },
									{ value: '2nd', label: __( 'Second', 'newspack-plugin' ) },
									{ value: '3rd', label: __( 'Third', 'newspack-plugin' ) },
									{ value: '4th', label: __( 'Fourth', 'newspack-plugin' ) },
									{ value: '5th', label: __( 'Fifth', 'newspack-plugin' ) },
									{ value: '6th', label: __( 'Sixth', 'newspack-plugin' ) },
									{ value: '7th', label: __( 'Seventh', 'newspack-plugin' ) },
								] }
								onChange={ selectValues => this.setState( { selectValues } ) }
							/>
							<Notice
								noticeText={
									<>
										{ __( 'Selected:', 'newspack-plugin' ) }{ ' ' }
										{ this.state.selectValues.length > 0
											? this.state.selectValues.join( ', ' )
											: __( 'none', 'newspack-plugin' ) }
									</>
								}
							/>
						</Grid>
					</Card>
					<Card>
						<h2>{ __( 'Buttons', 'newspack-plugin' ) }</h2>
						<Grid columns={ 1 } gutter={ 16 }>
							<p>
								<strong>{ __( 'Default', 'newspack-plugin' ) }</strong>
							</p>
							<Card buttonsCard noBorder>
								<Button variant="primary">{ __( 'Primary', 'newspack-plugin' ) }</Button>
								<Button variant="secondary">{ __( 'Secondary', 'newspack-plugin' ) }</Button>
								<Button variant="tertiary">{ __( 'Tertiary', 'newspack-plugin' ) }</Button>
								<Button>{ __( 'Default', 'newspack-plugin' ) }</Button>
								<Button isLink>{ __( 'isLink', 'newspack-plugin' ) }</Button>
							</Card>
							<p>
								<strong>{ __( 'Disabled', 'newspack-plugin' ) }</strong>
							</p>
							<Card buttonsCard noBorder>
								<Button variant="primary" disabled>
									{ __( 'Primary', 'newspack-plugin' ) }
								</Button>
								<Button variant="secondary" disabled>
									{ __( 'Secondary', 'newspack-plugin' ) }
								</Button>
								<Button variant="tertiary" disabled>
									{ __( 'Tertiary', 'newspack-plugin' ) }
								</Button>
								<Button disabled>{ __( 'Default', 'newspack-plugin' ) }</Button>
								<Button isLink disabled>
									{ __( 'isLink', 'newspack-plugin' ) }
								</Button>
							</Card>
							<p>
								<strong>{ __( 'Small', 'newspack-plugin' ) }</strong>
							</p>
							<Card buttonsCard noBorder>
								<Button variant="primary" isSmall>
									{ __( 'isPrimary', 'newspack-plugin' ) }
								</Button>
								<Button variant="secondary" isSmall>
									{ __( 'isSecondary', 'newspack-plugin' ) }
								</Button>
								<Button variant="tertiary" isSmall>
									{ __( 'isTertiary', 'newspack-plugin' ) }
								</Button>
								<Button isSmall>{ __( 'Default', 'newspack-plugin' ) }</Button>
								<Button isLink isSmall>
									{ __( 'isLink', 'newspack-plugin' ) }
								</Button>
							</Card>
						</Grid>
					</Card>
					<Card>
						<h2>{ __( 'ButtonCard', 'newspack-plugin' ) }</h2>
						<ButtonCard
							href="admin.php?page=newspack-site-design-wizard"
							title={ __( 'Site Design', 'newspack-plugin' ) }
							desc={ __( 'Customize the look and feel of your site', 'newspack-plugin' ) }
							icon={ typography }
							chevron
						/>
						<ButtonCard
							href="#"
							title={ __( 'Start a new site', 'newspack-plugin' ) }
							desc={ __( "You don't have content to import", 'newspack-plugin' ) }
							icon={ plus }
							className="br--top"
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Migrate an existing site', 'newspack-plugin' ) }
							desc={ __( 'You have content to import', 'newspack-plugin' ) }
							icon={ reusableBlock }
							className="br--bottom"
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Add a new Podcast', 'newspack-plugin' ) }
							desc={ ( 'Small', 'newspack-plugin' ) }
							icon={ audio }
							className="br--top"
							isSmall
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Add a new Font', 'newspack-plugin' ) }
							desc={ ( 'Small + chevron', 'newspack-plugin' ) }
							icon={ typography }
							className="br--bottom"
							chevron
							isSmall
							grouped
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin Settings Section', 'newspack-plugin' ) }</h2>
						<PluginSettings.Section
							sectionKey="example"
							title={ __( 'Example plugin settings', 'newspack-plugin' ) }
							description={ __( 'Example plugin settings description', 'newspack-plugin' ) }
							active={ true }
							fields={ [
								{
									key: 'example_field',
									type: 'string',
									description: __( 'Example Text Field', 'newspack-plugin' ),
									help: __( 'Example text field help text', 'newspack-plugin' ),
									value: __( 'Example Value', 'newspack-plugin' ),
								},
								{
									key: 'example_checkbox_field',
									type: 'boolean',
									description: __( 'Example checkbox Field', 'newspack-plugin' ),
									help: __( 'Example checkbox field help text', 'newspack-plugin' ),
									value: false,
								},
								{
									key: 'example_options_field',
									type: 'string',
									description: __( 'Example options field', 'newspack-plugin' ),
									help: __( 'Example options field help text', 'newspack-plugin' ),
									options: [
										{
											value: 'example_value_1',
											name: __( 'Example Value 1', 'newspack-plugin' ),
										},
										{
											value: 'example_value_2',
											name: __( 'Example Value 2', 'newspack-plugin' ),
										},
									],
								},
								{
									key: 'example_multi_options_field',
									type: 'string',
									description: __( 'Example multiple options field', 'newspack-plugin' ),
									help: __( 'Example multiple options field help text', 'newspack-plugin' ),
									multiple: true,
									options: [
										{
											value: 'example_value_1',
											name: __( 'Example Value 1', 'newspack-plugin' ),
										},
										{
											value: 'example_value_2',
											name: __( 'Example Value 2', 'newspack-plugin' ),
										},
									],
								},
							] }
							onUpdate={ data => {
								console.log( 'Plugin Settings Section Updated', data );
							} }
							onChange={ ( key, val ) => {
								console.log( 'Plugin Settings Section Changed', { key, val } );
							} }
						/>
					</Card>
				</div>
				<Footer />
			</Fragment>
		);
	}
}

render( <ComponentsDemo />, document.getElementById( 'newspack-components-demo' ) );
